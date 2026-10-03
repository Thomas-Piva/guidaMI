"""Milano Evolution E2E: the touch/text demo flow, with /api/plan and /api/passport mocked from lib/demo.ts.

Run (dev server on :3005):
  cd web && uv run --with playwright --with pypdf python e2e/flow.py
  # first time only: uv run --with playwright python -m playwright install chromium
Env: BASE_URL (default http://localhost:3005), HEADED=1 to watch it.
Artifacts (screenshots, the downloaded PDF) go to e2e/artifacts/. Exit code 1 if any step fails.
"""

import io
import json
import logging
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright
from pypdf import PdfReader

BASE = os.environ.get("BASE_URL", "http://localhost:3005").rstrip("/")
WEB = Path(__file__).resolve().parent.parent
ART = WEB / "e2e" / "artifacts"
KEY = "milano-evolution:v1"
expect.set_options(timeout=10_000)
logging.getLogger("pypdf").setLevel(logging.ERROR)  # font-encoding chatter from the official PDFs


def sample_data() -> dict:
    """SAMPLE_PLAN and SAMPLE_PASSPORT straight from lib/demo.ts, so the mocks never drift from the demo."""
    js = "import('./lib/demo.ts').then(m=>process.stdout.write(JSON.stringify({plan:m.SAMPLE_PLAN,passport:m.SAMPLE_PASSPORT})))"
    out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "-e", js], cwd=WEB, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def plan_ndjson(plan: dict) -> str:
    """Same event shape as the real /api/plan: one reading/read pair per guide, then the plan."""
    slugs = list(dict.fromkeys(re.sub(r"^.*/en/", "", x["source_url"]) for x in plan["steps"] + plan["services"]))
    ev = []
    for s in slugs:
        title = s.split("/")[-1].replace("-", " ").capitalize()
        ev += [{"type": "reading", "slug": s, "title": title}, {"type": "read", "slug": s, "title": title}]
    ev.append({"type": "plan", "plan": plan})
    return "".join(json.dumps(e) + "\n" for e in ev)


def pdf_text(data: bytes) -> str:
    """The route flattens the AcroForm, so filled values are page text, not fields."""
    return " ".join((pg.extract_text() or "") for pg in PdfReader(io.BytesIO(data)).pages)


results: list[tuple[str, str, str]] = []  # (name, PASS/FAIL/SKIP, detail)


def run(name: str, fn, page: Page | None = None, skip: bool = False) -> bool:
    if skip:
        results.append((name, "SKIP", "previous flow step failed"))
        return False
    t = time.monotonic()
    try:
        note = fn() or ""
        results.append((name, "PASS", f"{time.monotonic() - t:.1f}s {note}".strip()))
        return True
    except Exception as e:  # noqa: BLE001 - report every failure, keep going
        msg = str(e).strip().splitlines()
        detail = " | ".join(msg[:6])
        if page:
            shot = ART / f"FAIL-{len(results):02d}.png"
            try:
                page.screenshot(path=str(shot))
                detail += f" [screenshot {shot.name}]"
            except Exception:  # noqa: BLE001
                pass
        results.append((name, "FAIL", detail))
        return False


def main() -> int:
    ART.mkdir(parents=True, exist_ok=True)
    for old in ART.glob("*"):
        old.unlink()
    data = sample_data()
    plan, passport = data["plan"], data["passport"]
    console_errors: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not os.environ.get("HEADED"))
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, accept_downloads=True, locale="en-US")
        page = ctx.new_page()
        page.set_default_timeout(10_000)
        page.on("console", lambda m: m.type == "error" and console_errors.append(m.text))
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        guide_calls: list[str] = []  # every /api/signed-url call = one guide (re)connect attempt
        page.on("request", lambda r: "/api/signed-url" in r.url and guide_calls.append(results[-1][0] if results else "start"))

        def on_plan(route):
            route.fulfill(status=200, headers={"content-type": "application/x-ndjson"}, body=plan_ndjson(plan))

        def on_passport(route):
            route.fulfill(status=200, json={"fields": passport})

        page.route("**/api/plan", on_plan)
        page.route("**/api/passport", on_passport)

        btn = lambda name: page.get_by_role("button", name=name, exact=isinstance(name, str) or None)  # noqa: E731
        ok = True

        # ---------------- main flow (stops at the first failure) ----------------
        def s_welcome():
            page.goto(BASE)
            expect(page.get_by_role("heading", name=re.compile("Benvenuta a Milano"))).to_be_visible()
            with page.expect_response("**/api/signed-url") as r:
                btn("Start").click()
            expect(page.get_by_role("heading", name=re.compile("Where are you now"))).to_be_visible()
            return f"signed-url answered {r.value.status}"

        def s_close_voice():
            # Keys are missing, so the guide falls back to text: the dock becomes an input and the X is not rendered.
            dock_input = page.get_by_role("textbox", name="Message to your guide")
            x = page.get_by_role("button", name=re.compile("Turn voice off"))
            expect(dock_input.or_(x).first).to_be_visible()
            if x.count() and x.first.is_visible():
                x.first.click()
                expect(dock_input).to_be_visible()
                return "X clicked, dock switched to text"
            expect(page.locator(".dock")).to_contain_text("missing API keys")
            expect(page.get_by_role("button", name=re.compile("Voice off"))).to_be_visible()
            return "X not rendered: guide already fell back to text (503 missing_keys); dock shows input + 'Voice off' pill"

        def s_about():
            for n in ("Just arrived", "Non-EU"):
                b = btn(re.compile(n))
                b.click()
                expect(b).to_have_attribute("aria-pressed", "true")
            btn("Next").click()
            expect(page.get_by_role("heading", name=re.compile("What do you enjoy"))).to_be_visible()

        def s_interests():
            for n in ("Design", "Libraries", "Paperwork · Carte", "Finding a room · Casa"):
                b = btn(n)
                b.click()
                expect(b).to_have_attribute("aria-pressed", "true")
            btn("Next").click()
            expect(page.get_by_role("heading", name=re.compile("Your Italian"))).to_be_visible()

        def s_italian():
            sl = page.get_by_role("slider")
            box = sl.bounding_box()
            x, y = box["x"] + box["width"] * 0.6, box["y"] + box["height"] / 2
            page.mouse.move(x, y)
            page.mouse.down()
            page.mouse.move(x + 2, y)
            page.mouse.up()
            expect(page.locator(".big span")).to_have_text("6")
            expect(page.locator(".verdict")).to_contain_text("declared 6")
            expect(sl).to_have_attribute("aria-valuenow", "6")
            btn("Next").click()
            expect(page.get_by_role("heading", name=re.compile("What do you need"))).to_be_visible()

        def s_room():
            make = btn("Yes, make my plan")
            expect(make).to_be_disabled()
            room = btn(re.compile("A room"))
            room.click()
            expect(room).to_have_attribute("aria-pressed", "true")
            expect(make).to_be_enabled()

        def s_make_plan():
            with page.expect_request("**/api/plan") as rq:
                btn("Yes, make my plan").click()
            b = rq.value.post_data_json or {}
            p = b.get("profile", {})
            assert b.get("goal") == "Rent a room", f"plan goal sent: {b.get('goal')!r}"
            assert p.get("situation") == "just_arrived" and p.get("eu") is False, f"profile sent: {p}"
            assert p.get("italianDeclared") == 6, f"italianDeclared sent: {p.get('italianDeclared')}"
            assert {"Design", "Libraries"} <= set(p.get("interests", [])), f"interests sent: {p.get('interests')}"
            return f"POST body ok: goal + profile {sorted(k for k in p if p[k] not in (None, [], ''))}"

        def s_guides_tick():
            expect(page.get_by_text("Reading the official guides")).to_be_visible()
            expect(page.locator(".rd.on").first).to_be_visible()
            return f"{page.locator('.rd.on').count()} guides ticked"

        def s_plan():
            steps = page.locator(".steps .step")
            expect(steps).to_have_count(5)
            expect(page.locator(".goalhead")).to_contain_text("Rent a room")
            expect(page.locator(".goalhead")).to_contain_text("0 of 5 done")
            locked = [steps.nth(i).get_attribute("aria-disabled") for i in range(5)]
            assert locked == ["false", "false", "true", "true", "true"], f"aria-disabled per step: {locked}"
            page.screenshot(path=str(ART / "plan.png"))
            return "5 steps, 3-5 locked"

        def s_open_step1():
            page.get_by_role("button", name=re.compile(r"^Step 1:")).click()
            expect(page.get_by_role("dialog", name=re.compile("Get your codice fiscale"))).to_be_visible()
            btn("Fill it for me").click()
            expect(page.get_by_text("Add a photo of your passport")).to_be_visible()

        def s_specimen():
            with page.expect_request("**/api/passport") as rq:
                btn(re.compile("Use the SPECIMEN passport")).click()
            img = (rq.value.post_data_json or {}).get("image", "")
            assert img.startswith("data:image/jpeg;base64,"), f"image sent: {img[:40]!r}"
            return f"JPEG data URL sent ({len(img) // 1024} KB)"

        def s_fields():
            expect(page.locator(".fields .fld.on")).to_have_count(10, timeout=15_000)
            sur = page.locator("label.fld", has_text="Surname · Cognome").locator("input")
            expect(sur).to_have_value("SAMPLE")
            expect(page.locator("label.fld", has_text="Passport no.").locator("input")).to_have_value("X0000000")
            page.screenshot(path=str(ART / "passport-fields.png"))

        def s_edit():
            sur = page.locator("label.fld", has_text="Surname · Cognome").locator("input")
            sur.fill("SAMPLETEST")
            expect(sur).to_have_value("SAMPLETEST")
            btn("Looks good").click()
            expect(page.get_by_text("Your forms")).to_be_visible()
            expect(page.locator(".paper")).to_contain_text("SAMPLETEST")
            return "edited surname reached the AA4/8 preview"

        def s_pdf():
            dl_btn = page.locator(".frm", has_text="AA4/8").get_by_role("button", name="⤓ PDF")
            with page.expect_response("**/api/forms/pdf") as r, page.expect_download() as d:
                dl_btn.click()
            res = r.value
            body = Path(d.value.path()).read_bytes()  # the file Nour gets (res.body() is empty once the page took it as a blob)
            assert res.status == 200, f"status {res.status}"
            assert "application/pdf" in (res.headers.get("content-type") or ""), f"content-type {res.headers.get('content-type')}"
            assert body[:4] == b"%PDF", f"body starts {body[:8]!r}"
            req = res.request.post_data_json
            assert req["form"] == "aa48" and req["fields"]["surname"] == "SAMPLETEST", f"request {req['form']} {req['fields'].get('surname')}"
            d.value.save_as(str(ART / d.value.suggested_filename))
            assert "SAMPLETEST" in pdf_text(body), "edited surname SAMPLETEST not in the PDF text"
            expect(page.locator(".frm", has_text="AA4/8").get_by_role("button", name="⤓ PDF ✓")).to_be_visible()
            return f"{len(body) // 1024} KB PDF with SAMPLETEST, saved {d.value.suggested_filename}"

        def s_done():
            btn("‹ Plan").click()
            page.get_by_role("button", name=re.compile(r"^Step 1:")).click()
            page.get_by_role("checkbox", name=re.compile("Mark as done")).click()
            expect(page.get_by_role("dialog")).to_have_count(0)
            expect(page.get_by_role("button", name=re.compile(r"^Step 1: .*, done$"))).to_be_visible()
            expect(page.locator(".goalhead")).to_contain_text("1 of 5 done")
            st3 = page.get_by_role("button", name=re.compile(r"^Step 3:"))
            expect(st3).to_have_attribute("aria-disabled", "false")
            return "step 1 done, step 3 unlocked"

        def s_home():
            btn("‹ Home").click()
            card = page.locator(".gcard", has_text="Rent a room")
            expect(card).to_contain_text("1 of 5 done · next: search safely")
            expect(card.get_by_role("progressbar")).to_have_attribute("aria-valuenow", "20")
            tile = page.locator(".tile", has_text="Your forms")
            expect(tile).to_contain_text("1 PDF ready")
            page.screenshot(path=str(ART / "home.png"))
            return f"forms tile: {tile.locator('small').inner_text()!r}"

        flow = [
            ("01 welcome -> Start (signed-url called)", s_welcome),
            ("02 close voice (X)", s_close_voice),
            ("03 wizard: about you (Just arrived, Non-EU)", s_about),
            ("04 wizard: interests + worries", s_interests),
            ("05 Italian slider -> 6", s_italian),
            ("06 need: «A room»", s_room),
            ("07 Yes, make my plan (POST /api/plan body)", s_make_plan),
            ("08 guides tick on Reading", s_guides_tick),
            ("09 plan with 5 steps", s_plan),
            ("10 open step 1 -> Fill it for me", s_open_step1),
            ("11 use SPECIMEN passport (POST /api/passport)", s_specimen),
            ("12 passport fields appear", s_fields),
            ("13 edit a field -> forms", s_edit),
            ("14 download AA4/8 PDF", s_pdf),
            ("15 mark step 1 done", s_done),
            ("16 home shows progress", s_home),
        ]
        for name, fn in flow:
            ok = run(name, fn, page, skip=not ok) and ok

        # ---------------- persistence ----------------
        def s_reload():
            page.reload()
            saved = json.loads(page.evaluate(f"localStorage.getItem('{KEY}')") or "null")
            assert saved, "localStorage key missing after reload"
            p = saved["profile"]
            assert p.get("situation") == "just_arrived" and p.get("eu") is False and p.get("italianDeclared") == 6, f"profile {p}"
            g = saved["goals"][0]
            assert g["label"] == "Rent a room" and g["done"] == ["codice-fiscale"], f"goal {g['label']} done={g['done']}"
            expect(page.locator(".gcard", has_text="Rent a room")).to_contain_text("1 of 5 done")
            btn("Profile").click()
            kv = page.locator(".kv")
            expect(kv).to_contain_text("Just arrived · Appena arrivata")
            expect(kv).to_contain_text("Non-EU · Extra-UE")
            expect(page.locator(".chip.on", has_text="Design")).to_be_visible()
            expect(page.locator(".big")).to_contain_text("6")
            has_pass = page.get_by_text("Passport · Passaporto").count()
            return f"profile+goal kept; passport section after reload: {'shown' if has_pass else 'gone (in-memory by design)'}"

        def s_delete():
            d = btn(re.compile("Delete everything"))
            d.click()
            btn(re.compile("Tap again to delete")).click()
            expect(page.get_by_role("heading", name=re.compile("Benvenuta a Milano"))).to_be_visible()
            assert page.evaluate(f"localStorage.getItem('{KEY}')") is None, "localStorage key still there after delete"
            page.reload()
            expect(page.get_by_role("heading", name=re.compile("Benvenuta a Milano"))).to_be_visible()
            saved = json.loads(page.evaluate(f"localStorage.getItem('{KEY}')") or "null")
            assert not saved or not saved.get("goals"), f"state came back after reload: {saved}"
            return "welcome shown, storage empty, still empty after reload"

        run("17 reload keeps profile (localStorage)", s_reload, page)
        run("18 Delete everything clears it", s_delete, page)

        # ---------------- API ----------------
        api = ctx.request

        def s_signed():
            r = api.get(f"{BASE}/api/signed-url")
            assert r.status == 503 and r.json() == {"error": "missing_keys"}, f"{r.status} {r.text()[:120]}"
            return "503 missing_keys"

        run("19 GET /api/signed-url -> 503 missing_keys", s_signed)

        def pdf_check(form: str):
            def fn():
                r = api.post(f"{BASE}/api/forms/pdf", data={"form": form, "fields": passport, "extra": {"address": "Via Roma 12", "cap": "20121", "start_date": "05/10/2026", "m2": "18"}})
                body = r.body()
                assert r.status == 200, f"{r.status} {body[:160]!r}"
                assert "application/pdf" in r.headers.get("content-type", ""), r.headers.get("content-type")
                assert body[:4] == b"%PDF", f"starts {body[:8]!r}"
                pages = len(PdfReader(io.BytesIO(body)).pages)
                assert "SAMPLE" in pdf_text(body), "surname SAMPLE not in the PDF text"
                return f"{len(body) // 1024} KB, {pages} pages, surname printed"
            return fn

        for f in ("aa48", "residenza", "tari"):
            run(f"20 POST /api/forms/pdf {f} -> PDF", pdf_check(f))

        browser.close()

    print_guide = f"guide connect attempts (/api/signed-url from the page): {len(guide_calls)}, after steps: {guide_calls}"
    noise = [e for e in console_errors if "503" not in e]  # the 503 from /api/signed-url is expected with no keys
    print(f"\nMilano Evolution E2E  {BASE}  (390x844, chromium)\n")
    for name, status, detail in results:
        print(f"{status:4}  {name}  {detail}")
    print(f"\n{print_guide}")
    print(f"\nconsole errors (excluding expected 503): {len(noise)}")
    for e in noise[:10]:
        print("   ", e[:200])
    fails = sum(1 for _, s, _ in results if s != "PASS")
    print(f"\n{len(results) - fails}/{len(results)} passed. Artifacts: {ART}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
