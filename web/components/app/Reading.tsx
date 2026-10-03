"use client";

import { CheckIcon, SpeakerHighIcon, WarningIcon } from "@phosphor-icons/react";
import type { PlanEvent } from "@/lib/types";
import { UiStyle } from "./shared";

export type ReadingProps = {
  events: PlanEvent[]; // the NDJSON stream so far, in order
  voiceOn?: boolean;
  onToggleVoice?: () => void;
  onExit?: () => void;
  onRetry?: () => void;
};

type Guide = { slug: string; title: string; read: boolean; fallback?: boolean };

export function guidesFrom(events: PlanEvent[]): { guides: Guide[]; error?: string; done: boolean } {
  const map = new Map<string, Guide>();
  let error: string | undefined;
  let done = false;
  for (const e of events) {
    if (e.type === "reading") map.set(e.slug, { slug: e.slug, title: e.title, read: map.get(e.slug)?.read ?? false });
    else if (e.type === "read") map.set(e.slug, { slug: e.slug, title: e.title, read: true, fallback: e.fallback });
    else if (e.type === "error") error = e.message;
    else if (e.type === "plan") done = true;
  }
  return { guides: [...map.values()], error, done };
}

export default function Reading({ events, voiceOn = false, onToggleVoice, onExit, onRetry }: ReadingProps) {
  const { guides, error, done } = guidesFrom(events);
  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onExit}>
          Exit
        </button>
        <button type="button" className={`pill meb${voiceOn ? " audio" : ""}`} onClick={onToggleVoice} aria-pressed={voiceOn}>
          <SpeakerHighIcon /> {voiceOn ? "Voice on ✕" : "Voice off"}
        </button>
      </div>
      <div className="body mescroll">
        <div className="t1" style={{ fontSize: 19 }}>
          Reading the official guides<span className="it">Sto leggendo le guide ufficiali per te</span>
        </div>
        <div className="read" aria-live="polite">
          {guides.map((g) => (
            <div key={g.slug} className={`rd${g.read ? " on" : ""}`}>
              <span className="ic">
                <i style={{ display: "grid" }}>
                  <CheckIcon size={13} weight="bold" />
                </i>
              </span>
              <div>
                {g.title}
                <small>
                  yesmilano.it · {g.slug}
                  {g.fallback ? " · saved copy · copia salvata" : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
        {error ? (
          <div className="pv me-warn" role="alert">
            <b style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <WarningIcon /> I can&apos;t read the guides right now
            </b>
            <span className="sub">Non riesco a leggere le guide adesso.</span>
            {onRetry && (
              <button type="button" className="next meb" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={onRetry}>
                Try again · Riprova
              </button>
            )}
          </div>
        ) : (
          !done && <div className="shim" aria-hidden="true" />
        )}
      </div>
    </>
  );
}
