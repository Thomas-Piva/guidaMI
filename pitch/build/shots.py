import asyncio, sys
from playwright.async_api import async_playwright
OUT = "/home/thomas/milano-evolution/pitch/assets"
MOCK = "file:///home/thomas/milano-evolution/design/mockups/index.html"
SITES = {
  "site-yesmilano-rents": "https://www.yesmilano.it/en/study/how-to/rents",
  "site-yesmilano-taxcode": "https://www.yesmilano.it/en/study/how-to/get-italian-tax-code-codice-fiscale",
  "site-comune": "https://www.comune.milano.it/",
  "site-comune-residenza": "https://www.comune.milano.it/servizi/residenza-iscrizione-anagrafica-cittadini-stranieri",
}
async def mock(b):
    p = await b.new_page(viewport={"width":1400,"height":900}, device_scale_factor=2)
    await p.goto(MOCK, wait_until="networkidle")
    await p.wait_for_timeout(1500)
    phones = await p.query_selector_all(".cell .phone")
    for i, ph in enumerate(phones):
        await ph.scroll_into_view_if_needed(); await p.wait_for_timeout(200)
        await ph.screenshot(path=f"{OUT}/mock-{i:02d}.png", omit_background=True)
    print("mock", len(phones))
async def site(b, name, url):
    p = await b.new_page(viewport={"width":1280,"height":800}, device_scale_factor=1.5, locale="it-IT")
    try:
        await p.goto(url, wait_until="domcontentloaded", timeout=45000)
        await p.wait_for_timeout(4000)
        for sel in ["text=Accept all","text=Accetta tutti","text=Accetta","text=Accept","#onetrust-accept-btn-handler","button:has-text('Accett')","button:has-text('Accept')"]:
            try:
                el = p.locator(sel).first
                if await el.is_visible(timeout=500): await el.click(timeout=1500); await p.wait_for_timeout(800); break
            except Exception: pass
        await p.screenshot(path=f"{OUT}/{name}.png")
        print("ok", name, p.url)
    except Exception as e:
        print("FAIL", name, e)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        await asyncio.gather(mock(b), *[site(b,n,u) for n,u in SITES.items()])
        await b.close()
asyncio.run(main())
