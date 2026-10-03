# Screenshots every mockup phone (.cell .phone) at 2x into pitch/assets/mock-XX.png
import asyncio
from playwright.async_api import async_playwright
OUT = "/home/thomas/milano-evolution/pitch/assets"
MOCK = "file:///home/thomas/milano-evolution/design/mockups/index.html"
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        p = await b.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
        await p.goto(MOCK, wait_until="networkidle"); await p.wait_for_timeout(1500)
        cells = await p.query_selector_all(".cell")
        for i, c in enumerate(cells):
            ph = await c.query_selector(".phone")
            if not ph: continue
            await ph.scroll_into_view_if_needed(); await p.wait_for_timeout(200)
            await ph.screenshot(path=f"{OUT}/mock-{i:02d}.png", omit_background=True)
            label = (await c.inner_text())[:0]
            cap = await c.evaluate("e => (e.querySelector('h2,h3,figcaption,.label,.cap')||{}).textContent||''")
            print(i, cap.strip()[:60])
        await b.close()
asyncio.run(main())
