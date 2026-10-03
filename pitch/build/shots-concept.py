# Screenshots the concept phones (pitch/build/concept/index.html) at 2x into pitch/assets/concept-N.png
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); p = await b.new_page(viewport={"width": 2600, "height": 760}, device_scale_factor=2)
        await p.goto("file:///home/thomas/milano-evolution/pitch/build/concept/index.html"); await p.wait_for_timeout(800)
        for i, ph in enumerate(await p.query_selector_all(".phone")):
            await ph.screenshot(path=f"/home/thomas/milano-evolution/pitch/assets/concept-{i+1}.png", omit_background=True)
        await b.close()
asyncio.run(main())
