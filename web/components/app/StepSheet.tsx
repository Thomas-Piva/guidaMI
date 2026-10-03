"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import type { FormId, Step } from "@/lib/types";
import { service } from "@/lib/services";
import { PlaceBlock, UiStyle, speak } from "./shared";

export type StepSheetProps = {
  step: Step;
  done: boolean;
  lang?: string; // language for «Listen», default "en"
  onClose: () => void;
  onAsk: (step: Step) => void; // «Ask the guide»: integrator sends context to the voice guide
  onFill?: (form: FormId) => void; // «Fill it for me» (only shown when step.fill_form)
  onToggleDone: (done: boolean) => void;
};

/** «Do it with me» bottom sheet. Render it inside the same .scr as PlanView: it overlays with scrim. */
export default function StepSheet({ step, done, lang = "en", onClose, onAsk, onFill, onToggleDone }: StepSheetProps) {
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const official = service(step.service_id);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    sheetRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <>
      <UiStyle />
      {/* canvas veil + .scrim = the mockup's dimmed plan (opacity .35) under the dark scrim */}
      <div className="me-veil" aria-hidden="true" style={{ opacity: shown ? 0.65 : 0 }} />
      <div className="scrim me-fade" aria-hidden="true" onClick={onClose} style={{ opacity: shown ? 1 : 0 }} />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Do it with me: ${step.title_en}`}
        style={{ transform: shown ? undefined : "translateY(100%)", maxHeight: "92%", overflowY: "auto", outline: "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="label">Do it with me</span>
          <button type="button" className="xbtn meb" aria-label="Close · Chiudi" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="t1" style={{ fontSize: 19 }}>
          {step.title_en}
          <span className="it">{step.title_it}</span>
        </div>
        <p className="sub" style={{ color: "var(--body)" }}>
          {step.why_for_you}
        </p>
        <div className="kv">
          <div>
            <small>Bring · Porta</small>
            {step.bring.join(" + ") || "Nothing"}
          </div>
          <div>
            <small>Where · Dove</small>
            {step.where}
          </div>
          <div>
            <small>How long</small>
            {step.how_long}
          </div>
          <div>
            <small>Deadline</small>
            {step.deadline}
          </div>
        </div>
        {step.place && <PlaceBlock place={step.place} />}
        <div className="acts">
          <button type="button" className="o meb" onClick={() => speak(`${step.title_en}. ${step.why_for_you}`, lang)}>
            <SpeakerHighIcon /> Listen
          </button>
          <button type="button" className="o meb" onClick={() => onAsk(step)}>
            Ask the guide
          </button>
          {official && (
            <a className="o meb" style={{ gridColumn: "1 / -1" }} href={official.url} target="_blank" rel="noreferrer">
              Open {official.name} ↗
            </a>
          )}
        </div>
        {step.fill_form && onFill && (
          <button type="button" className="cta meb" onClick={() => onFill(step.fill_form!)}>
            Fill it for me
          </button>
        )}
        <button type="button" className="check meb" role="checkbox" aria-checked={done} onClick={() => onToggleDone(!done)}>
          <span className={`box${done ? " on" : ""}`}>
            {done && (
              <i style={{ display: "grid" }}>
                <CheckIcon size={12} weight="bold" />
              </i>
            )}
          </span>{" "}
          Mark as done
        </button>
      </div>
    </>
  );
}
