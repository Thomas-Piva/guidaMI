import asyncio
from playwright.async_api import async_playwright
OUT="/home/thomas/milano-evolution/pitch/assets"
async def dismiss(p):
    for sel in ["button:has-text('Reject')","button:has-text('Rifiuta')","button[aria-label*='hiudi']","button:has-text('Accetta tutti i cookie')"]:
        try:
            el=p.locator(sel).first
            if await el.is_visible(timeout=700): await el.click(timeout=1500); await p.wait_for_timeout(700); return
        except Exception: pass
async def ym(b, name, url, y):
    p=await b.new_page(viewport={"width":1280,"height":800},device_scale_factor=1.5)
    await p.goto(url,wait_until="domcontentloaded",timeout=45000); await p.wait_for_timeout(3500); await dismiss(p)
    await p.mouse.wheel(0,y); await p.wait_for_timeout(1500)
    await p.screenshot(path=f"{OUT}/{name}.png"); print("ok",name)
async def comune(b):
    p=await b.new_page(viewport={"width":1280,"height":800},device_scale_factor=1.5,locale="it-IT")
    await p.goto("https://www.comune.milano.it/",wait_until="domcontentloaded",timeout=45000); await p.wait_for_timeout(3500); await dismiss(p)
    links=await p.eval_on_selector_all("a","els=>els.map(e=>[(e.innerText||e.textContent||'').trim(),(typeof e.href==='string'?e.href:'')])")
    cand=[l for l in links if any(k in (l[0]+l[1]).lower() for k in ["anagrafe","residenza","tari"])]
    print(cand[:12])
    for t,h in cand:
        if "comune.milano.it" not in h: continue
        r=await p.goto(h,wait_until="domcontentloaded",timeout=45000); await p.wait_for_timeout(3000); await dismiss(p)
        title=await p.title()
        if r and r.status==200 and "non trovata" not in (await p.content()).lower():
            await p.mouse.wheel(0,330); await p.wait_for_timeout(1200)
            await p.screenshot(path=f"{OUT}/site-comune-page.png"); print("ok comune",h,title); return
asyncio.run(None) if False else None
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        await asyncio.gather(
          ym(b,"site-yesmilano-rents","https://www.yesmilano.it/en/study/how-to/rents",1000),
          ym(b,"site-yesmilano-taxcode","https://www.yesmilano.it/en/study/how-to/get-italian-tax-code-codice-fiscale",1000),
          comune(b))
        await b.close()
if __name__=="__main__": asyncio.run(main())
