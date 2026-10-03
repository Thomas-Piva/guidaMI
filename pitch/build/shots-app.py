# Screenshots the running app (localhost:3005, demo mode) at 390x844 @2x and frames each screen as a phone.
import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
OUT = "/home/thomas/milano-evolution/pitch/assets"
SCREENS = [(n, f"/?demo=1&screen={n}") for n in "welcome about interests italian need reading plan step passport forms home previews profile".split()] + \
  [(f"concept-{n}", f"/concept?s={n}") for n in "parlami eventi fascicolo talent-card talent-search permesso comune".split()]
import sys
if len(sys.argv) > 1: SCREENS = [x for x in SCREENS if x[0].startswith(sys.argv[1])]
HIDE = """
nextjs-portal{display:none!important}
"""
JS_HIDE = """() => { for (const el of document.querySelectorAll('body *')) {
  const t = (el.textContent || '').trim();
  if (/^(Demo\\s*·\\s*sample data|Preview\\s*·\\s*Anteprima)$/i.test(t) && el.children.length <= 2) el.style.setProperty('display','none','important'); } }"""
def frame(src, dst):
    im = Image.open(src).convert("RGBA"); w, h = im.size; b = 18; r = 96
    out = Image.new("RGBA", (w + 2*b, h + 2*b), (0, 0, 0, 0))
    m = Image.new("L", out.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, out.width-1, out.height-1], r + b, fill=255)
    out.paste(Image.new("RGBA", out.size, (33, 33, 33, 255)), (0, 0), m)
    sm = Image.new("L", im.size, 0); ImageDraw.Draw(sm).rounded_rectangle([0, 0, w-1, h-1], r, fill=255)
    out.paste(im, (b, b), sm); out.save(dst)
async def shot(b, item):
    s, path = item
    p = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    await p.goto(f"http://localhost:3005{path}", wait_until="load", timeout=45000)
    await p.add_style_tag(content=HIDE + ("a{color:inherit!important;text-decoration:none!important}" if path.startswith("/concept") else "")); await p.wait_for_timeout(2500); await p.evaluate(JS_HIDE); await p.wait_for_timeout(300)
    raw = f"{OUT}/app-{s}-raw.png"; await p.screenshot(path=raw)
    frame(raw, f"{OUT}/app-{s}.png"); print("ok", s)
    await p.close()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        for it in SCREENS: await shot(b, it)
        await b.close()
asyncio.run(main())
