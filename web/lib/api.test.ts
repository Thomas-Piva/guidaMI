import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Plan, PlanEvent } from "./types";

// Fake Claude: keeps the real SDK (error classes, helpers) and swaps messages.create.
const create = vi.fn();
vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class FakeAnthropic extends mod.default {
    constructor(opts: ConstructorParameters<typeof mod.default>[0]) {
      super(opts);
      (this as unknown as { messages: unknown }).messages = { create };
    }
  }
  return { ...mod, default: FakeAnthropic };
});

import { PlanSchema, parseImageDataUrl, rateLimited } from "./claude";
import { readGuide, GUIDES, guidesForPrompt } from "./guides";
import snapshotFile from "../data/guides-snapshot.json";
import { POST as planPOST } from "../app/api/plan/route";
import { POST as passportPOST } from "../app/api/passport/route";

const CF = "https://www.yesmilano.it/en/study/how-to/get-italian-tax-code-codice-fiscale";
const RENTS = "https://www.yesmilano.it/en/study/how-to/rents";

const step = (id: string, source_url = CF) => ({
  id,
  title_en: "Get your tax code",
  title_it: "Codice fiscale",
  why_for_you: "You need it to sign a contract.",
  bring: ["Passport"],
  where: "Agenzia delle Entrate",
  how_long: "15 minutes",
  deadline: "Before signing the contract",
  source_url,
});
const validPlan = (): Plan => ({
  goal: "Rent a room",
  headline: "Three steps to a safe room",
  steps: [{ ...step("cf"), fill_form: "aa48" }, step("rent", RENTS), step("contract", RENTS)],
  services: [],
  phrase: { phrase: "Vorrei il codice fiscale", meaning: "I would like a tax code", when: "At the counter" },
  verify: "Office hours",
});

const tinyPng = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString("base64");
const post = (body: unknown, ip: string) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  create.mockReset();
  // No real network in tests: every live guide fetch fails, so the snapshot is used.
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
});
afterEach(() => vi.unstubAllGlobals());

describe("show_plan schema", () => {
  it("accepts a valid plan", () => {
    expect(PlanSchema.safeParse(validPlan()).success).toBe(true);
  });
  it("rejects a step without source_url", () => {
    const plan = validPlan() as unknown as { steps: Record<string, unknown>[] };
    delete plan.steps[1].source_url;
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });
  it("rejects a source that is not a YesMilano guide, and fewer than 3 steps", () => {
    expect(PlanSchema.safeParse({ ...validPlan(), steps: [step("a", "https://evil.example/x"), step("b"), step("c")] }).success).toBe(false);
    expect(PlanSchema.safeParse({ ...validPlan(), steps: [step("a"), step("b")] }).success).toBe(false);
  });
});

describe("readGuide", () => {
  it("rejects a slug outside the allowlist without fetching", async () => {
    await expect(readGuide("../../etc/passwd")).rejects.toThrow("unknown_guide");
    await expect(readGuide("https://evil.example")).rejects.toThrow("unknown_guide");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("falls back to the dated snapshot when the live site is down", async () => {
    const g = await readGuide("rents");
    expect(g.fallback).toBe(true);
    expect(g.fetched_at).toBe("2026-10-03");
    expect(g.text.length).toBeGreaterThan(300);
  });
  it("has a snapshot for every allowlisted guide, all citable as source_url", () => {
    const snap = snapshotFile.guides as Record<string, string>;
    expect(GUIDES.length).toBeGreaterThan(40);
    for (const g of GUIDES) {
      expect(snap[g.slug]?.length, g.slug).toBeGreaterThan(300);
      expect(PlanSchema.shape.steps.element.shape.source_url.safeParse(g.url).success, g.url).toBe(true);
    }
    expect(guidesForPrompt()).toMatch(/^## study\n- first-steps: /);
  });
});

describe("POST /api/passport", () => {
  it("rejects a wrong image type", async () => {
    const res = await passportPOST(post({ image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" }, "1.1.1.1"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "unsupported_type" });
  });
  it("rejects a PNG label on non-PNG bytes", () => {
    expect(parseImageDataUrl("data:image/png;base64," + Buffer.from("GIF89a-not-a-png").toString("base64"))).toMatchObject({ ok: false, status: 400 });
  });
  it("rejects an image over 5 MB", async () => {
    const big = "data:image/jpeg;base64," + Buffer.alloc(5 * 1024 * 1024 + 10, 0xff).toString("base64");
    const res = await passportPOST(post({ image: big }, "1.1.1.2"));
    expect(res.status).toBe(413);
  });
  it("answers 503 missing_keys for a valid image without ANTHROPIC_API_KEY", async () => {
    const res = await passportPOST(post({ image: tinyPng }, "1.1.1.3"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "missing_keys" });
  });
});

describe("POST /api/plan", () => {
  const body = { profile: { eu: false, interests: [], worries: ["scams"] }, goal: "I need to rent a room" };

  it("validates the body and fails honestly without a key", async () => {
    expect((await planPOST(post({ goal: "" }, "2.2.2.1"))).status).toBe(400);
    expect((await planPOST(post("x".repeat(20_000), "2.2.2.1"))).status).toBe(413);
    const res = await planPOST(post(body, "2.2.2.1"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "missing_keys" });
  });

  it("streams reading/read/plan events from the tool loop, rejecting unread sources", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const toolUse = (id: string, name: string, input: unknown) => ({ type: "tool_use", id, name, input });
    create
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [toolUse("t1", "read_guide", { slug: "get-italian-tax-code-codice-fiscale" }), toolUse("t2", "read_guide", { slug: "rents" })] })
      // first plan cites a guide that was never read -> is_error, Claude retries
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [toolUse("t3", "show_plan", { ...validPlan(), steps: [step("a", "https://www.yesmilano.it/en/study/how-to/work-students"), step("b"), step("c")] })] })
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [toolUse("t4", "show_plan", validPlan())] });

    const res = await planPOST(post(body, "2.2.2.2"));
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l) as PlanEvent);

    expect(events.filter((e) => e.type === "reading").map((e) => (e as { slug: string }).slug)).toEqual(["get-italian-tax-code-codice-fiscale", "rents"]);
    expect(events.filter((e) => e.type === "read").every((e) => (e as { fallback?: boolean }).fallback === true)).toBe(true);
    expect(events.at(-1)).toEqual({ type: "plan", plan: validPlan() });

    // messages is one growing array; the tool_result for t3 sits just before the final assistant turn
    const retry = create.mock.calls[2][0].messages.at(-2).content[0];
    expect(retry).toMatchObject({ tool_use_id: "t3", is_error: true });
    expect(create.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
  });

  it("retries once with structured output when Claude answers in text", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    create
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "read_guide", input: { slug: "rents" } }, { type: "tool_use", id: "t2", name: "read_guide", input: { slug: "get-italian-tax-code-codice-fiscale" } }] })
      .mockResolvedValueOnce({ stop_reason: "end_turn", content: [{ type: "text", text: "Here is your plan..." }] })
      .mockResolvedValueOnce({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(validPlan()) }] });

    const events = (await (await planPOST(post(body, "2.2.2.3"))).text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(events.at(-1).type).toBe("plan");
    expect(create.mock.calls[2][0].output_config.format.type).toBe("json_schema");
    expect(create.mock.calls[2][0].tool_choice).toEqual({ type: "none" });
  });

  it("rate limits per IP", () => {
    for (let i = 0; i < 10; i++) expect(rateLimited("t:ip", 10, 60_000, 1_000)).toBe(false);
    expect(rateLimited("t:ip", 10, 60_000, 1_000)).toBe(true);
    expect(rateLimited("t:ip", 10, 60_000, 70_000)).toBe(false);
  });
});
