"use client";

import type { CSSProperties, ReactNode } from "react";
import { PlusIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import type { Goal } from "@/lib/types";
import { UiStyle, goalArt, icon3d, illuSrc } from "./shared";

export type HomeProps = {
  name?: string;
  goals: Goal[];
  italianVerified?: number;
  forms?: { ready: number; toFinish: number }; // PDFs ready / forms with fields left
  voiceOn?: boolean;
  onProfile: () => void;
  onToggleVoice?: () => void;
  onOpenGoal: (id: string) => void;
  onNewGoal: () => void; // «+ New goal» → S1b
  onForms?: () => void;
  onItalian?: () => void;
  onPreviews: () => void; // «new» tiles → S7
};

const tileBtn: CSSProperties = { textAlign: "left" };

function Art({ n }: { n: string }) {
  return (
    <div className="illu" style={{ minWidth: 0, background: "var(--soft)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/icons3d/${n}.webp`} alt="" width={46} height={46} style={{ width: 46, height: 46, objectFit: "contain", mixBlendMode: "multiply" }} />
    </div>
  );
}

function Illu({ name, icon, style }: { name?: string; icon: ReactNode; style?: CSSProperties }) {
  return (
    <div className="illu" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {name ? <img src={illuSrc(name)} alt="" /> : <i style={{ display: "grid" }}>{icon}</i>}
    </div>
  );
}

export default function Home({ name, goals, italianVerified, forms, voiceOn = false, onProfile, onToggleVoice, onOpenGoal, onNewGoal, onForms, onItalian, onPreviews }: HomeProps) {
  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onProfile}>
          Profile
        </button>
        <button type="button" className={`pill meb${voiceOn ? " audio" : ""}`} onClick={onToggleVoice} aria-pressed={voiceOn}>
          <SpeakerHighIcon /> {voiceOn ? "Voice on ✕" : "Voice off"}
        </button>
      </div>
      <div className="body mescroll">
        <div className="t1">
          {name ? `Hi ${name}` : "Hi"}
          <span className="it">{name ? `Ciao ${name}` : "Ciao"} · your goals · i tuoi obiettivi</span>
        </div>

        {goals.map((g) => {
          const art = goalArt(g.label);
          const steps = g.plan?.steps ?? [];
          const done = steps.filter((s) => g.done.includes(s.id)).length;
          const next = steps.find((s) => !g.done.includes(s.id));
          const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
          return (
            <button key={g.id} type="button" className="gcard meb" style={tileBtn} onClick={() => onOpenGoal(g.id)}>
              <div className="img">
                {/* absolute fill: in the mockup the img overflows .img and hides the progress line */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="art3d" src={icon3d(art.icon)} alt="" style={{ position: "absolute", inset: 0 }} />
                {next && (
                  <span className="act">
                    <i />
                    Action required
                  </span>
                )}
              </div>
              <div className="meta">
                <b>{g.label}</b>
                {!g.plan
                  ? "No plan yet · tap to make it"
                  : next
                    ? `${done} of ${steps.length} done · next: ${next.title_en.toLowerCase()}`
                    : `All ${steps.length} done · fatto`}
                <div className="pbar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <b style={{ width: `${pct}%` }} />
                </div>
              </div>
            </button>
          );
        })}

        <div className="tiles">
          <button type="button" className="tile meb" style={tileBtn} onClick={onForms} disabled={!onForms}>
            <Art n="form" />
            <b>Your forms</b>
            <small>{forms ? `${forms.ready} PDF ready · ${forms.toFinish} to finish` : "From your plan · dal tuo piano"}</small>
          </button>
          <button type="button" className="tile meb" style={tileBtn} onClick={onItalian} disabled={!onItalian}>
            <Art n="italian" />
            <b>Your Italian</b>
            <small>{italianVerified !== undefined ? `verified ${italianVerified} · next test in 7 days` : "Not checked yet · da verificare"}</small>
          </button>
          <button type="button" className="tile meb" style={tileBtn} onClick={() => (location.href = "/concept?s=parlami")}>
            <span className="new">new</span>
            <Art n="coffee" />
            <b>Parlami in italiano</b>
            <small>A coffee with a Milanese · Un caffè con un milanese</small>
          </button>
          <button type="button" className="tile meb" style={tileBtn} onClick={() => (location.href = "/concept?s=fascicolo")}>
            <span className="new">new</span>
            <Art n="spid" />
            <b>Fascicolo + SPID</b>
            <small>Save your profile once</small>
          </button>
          <button type="button" className="tile wide meb" style={tileBtn} onClick={onNewGoal}>
            <Illu icon={<PlusIcon size={26} />} />
            <div>
              <b>New goal</b>
              <br />
              <small>A doctor, a tram pass, a course…</small>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
