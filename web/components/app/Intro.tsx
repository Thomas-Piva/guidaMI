"use client";
// Introduction carousel shown once before the voice welcome. Mockup language: .body/.t1/.it/.foot/.prog/.nav.
import { useState } from "react";

export type IntroProps = { onDone: () => void };

const SLIDES = [
  {
    img: "/illustrations/step1-arrival.webp",
    title: "Welcome to Milan",
    it: "Benvenuta a Milano",
    text: "A guide that speaks your language and knows how the City works.",
  },
  {
    icons: ["room", "taxcode", "doctor", "tram", "study", "italian"],
    title: "Tell us what you need",
    it: "Dicci di cosa hai bisogno",
    text: "A room, a tax code, a doctor. We read the City's official guides and open data for you.",
  },
  {
    img: "/illustrations/step3-papers.webp",
    title: "Get it done",
    it: "Fallo, passo dopo passo",
    text: "Steps in order, the right office near you, forms filled in. You check and sign.",
  },
] as const;

export default function Intro({ onDone }: IntroProps) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <>
      <div className="bar">
        <span />
        <button type="button" className="pill" onClick={onDone}>Skip</button>
      </div>
      <div className="body intro" key={i}>
        <div className="intro-art">
          {"img" in s ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.img} alt="" />
          ) : (
            <div className="intro-icons">
              {s.icons.map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} src={`/icons3d/${n}.webp`} alt="" />
              ))}
            </div>
          )}
        </div>
        <div className="t1">
          {s.title}
          <span className="it">{s.it}</span>
        </div>
        <p className="sub intro-text">{s.text}</p>
      </div>
      <div className="foot">
        <div className="prog">
          {SLIDES.map((_, j) => (
            <i key={j}>
              <b style={{ ["--p" as string]: j <= i ? "100%" : "0%" }} />
            </i>
          ))}
        </div>
        <div className="nav">
          {i > 0 ? (
            <button type="button" className="linkish" onClick={() => setI(i - 1)}>
              <u>Back</u>
            </button>
          ) : (
            <span />
          )}
          <button type="button" className={last ? "cta" : "next"} onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? "Start · Inizia" : "Next"}
          </button>
        </div>
        <div className="home-ind" />
      </div>
      <style>{`
        .intro{justify-content:center;gap:18px}
        .intro-art{border-radius:20px;background:var(--page);aspect-ratio:4/3;display:grid;place-items:center;overflow:hidden}
        .intro-art>img{width:100%;height:100%;object-fit:cover}
        .intro-icons{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px}
        .intro-icons img{width:100%;aspect-ratio:1;object-fit:contain;mix-blend-mode:multiply}
        .intro-text{font-size:15px;line-height:1.5;color:var(--body)}
        .linkish{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer}
        @media (prefers-reduced-motion: no-preference){.intro{animation:introIn .35s cubic-bezier(.16,1,.3,1)}}
        @keyframes introIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>
    </>
  );
}
