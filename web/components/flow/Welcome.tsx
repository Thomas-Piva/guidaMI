"use client";

export type Props = {
  onStart: () => void; // "Start": first tap, unlocks audio and starts the voice welcome
  onSkipVoice: () => void; // ✕: start without voice (touch and text)
};

const STEPS = [
  { title: "Tell us about you", sub: "Who you are, once.", img: "step1-arrival" },
  { title: "Tell us what you need", sub: "A room, a doctor, a tram pass.", img: "step2-room" },
  { title: "Get it done", sub: "Steps in order, forms filled in.", img: "step3-papers" },
];

// Mockup s0.
export default function Welcome({ onStart, onSkipVoice }: Props) {
  return (
    <>
      <div className="bar">
        <span />
        <button type="button" className="xbtn" onClick={onSkipVoice} aria-label="Start without voice">✕</button>
      </div>
      <div className="body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/logo.png" alt="GuidaMI" width={52} height={52} style={{ borderRadius: 14 }} />
        <h1 className="t1">
          Benvenuta a Milano<span className="it">Welcome to Milan. It&apos;s easy to get started.</span>
        </h1>
        <p className="sub" style={{ fontSize: 12, lineHeight: 1.5, margin: "-4px 0 0" }}>
          You are talking with an AI assistant. It shows its sources, you decide. Want a person? Call 020202.
          <span className="it" style={{ display: "block" }}>Stai parlando con un assistente IA. Vuoi una persona? Chiama lo 020202.</span>
        </p>
        <div className="intro-list">
          {STEPS.map((s, i) => (
            <div className="il" key={s.img}>
              <span className="num">{i + 1}</span>
              <div>
                <b>{s.title}</b>
                <small>{s.sub}</small>
              </div>
              <div className="illu">
                {/* eslint-disable-next-line @next/next/no-img-element -- 800px webp, already optimised */}
                <img src={`/illustrations/${s.img}.webp`} alt="" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="foot">
        <button type="button" className="cta" onClick={onStart}>Start</button>
        <div className="home-ind" />
      </div>
    </>
  );
}
