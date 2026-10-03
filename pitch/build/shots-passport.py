# Captures the splash screen and the passport flow (SPECIMEN scan state, then filled fields), framed like shots-app.py.
import asyncio, importlib.util
from playwright.async_api import async_playwright
spec = importlib.util.spec_from_file_location("sa", "/home/thomas/milano-evolution/pitch/build/shots-app.py")
OUT = "/home/thomas/milano-evolution/pitch/assets"
src = open("/home/thomas/milano-evolution/pitch/build/shots-app.py").read().split("async def shot")[0]
exec(src)  # HIDE, JS_HIDE, frame()
async def page(b, url):
    p = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    await p.goto("http://localhost:3005" + url, wait_until="load", timeout=45000)
    await p.add_style_tag(content=HIDE); await p.wait_for_timeout(2500); await p.evaluate(JS_HIDE)
    return p
async def snap(p, name):
    await p.evaluate(JS_HIDE); raw = f"{OUT}/app-{name}-raw.png"; await p.screenshot(path=raw); frame(raw, f"{OUT}/app-{name}.png"); print("ok", name)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        p = await page(b, "/splash"); await snap(p, "splash")
        p = await page(b, "/?demo=1&screen=passport")
        await p.get_by_text("Use the SPECIMEN passport").first.click()
        for t, n in [(400, "scan1"), (1200, "scan2"), (2500, "scan3"), (7000, "fields")]:
            await p.wait_for_timeout(t - (0 if n == "scan1" else 0)); await snap(p, "passport-" + n)
        await b.close()
asyncio.run(main())
