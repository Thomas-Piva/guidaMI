"use client";
import type { CSSProperties, ReactNode } from "react";
import { SpeakerHighIcon } from "@phosphor-icons/react";

/** Progress values used by the mockup for each wizard screen. */
export const PROGRESS = { about: 18, interests: 42, italian: 62, need: 85 } as const;

export type Props = {
  progress: number; // 0-100, see PROGRESS
  onNext: () => void;
  nextLabel?: string; // default "Next"
  nextDisabled?: boolean;
  onBack?: () => void; // omit to hide Back
  onExit: () => void;
  voice: boolean;
  onVoice: (on: boolean) => void; // top pill: "Voice on ✕" turns it off, "Voice off" turns it on
  dock?: ReactNode; // <VoiceDock />, rendered between body and footer
  children: ReactNode; // screen body content
};

const seg = (p: number) => ({ "--p": `${Math.max(0, Math.min(100, p))}%` }) as CSSProperties;

// Mockup: top bar + .body + dock + .foot (segmented yellow progress, Back / Next).
export default function WizardFrame({ progress: p, onNext, nextLabel = "Next", nextDisabled, onBack, onExit, voice, onVoice, dock, children }: Props) {
  return (
    <>
      <div className="bar">
        <button type="button" className="pill" onClick={onExit}>Exit</button>
        {voice ? (
          <button type="button" className="pill audio" onClick={() => onVoice(false)} aria-label="Voice on. Turn voice off">
            <SpeakerHighIcon /> Voice on <span aria-hidden="true">✕</span>
          </button>
        ) : (
          <button type="button" className="pill" onClick={() => onVoice(true)} aria-label="Voice off. Turn voice on">
            <SpeakerHighIcon /> Voice off
          </button>
        )}
      </div>
      <div className="body">{children}</div>
      {dock}
      <div className="foot">
        <div className="prog" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}>
          <i><b style={seg(p * 3)} /></i>
          <i><b style={seg((p - 33.4) * 3)} /></i>
          <i><b style={seg((p - 66.7) * 3)} /></i>
        </div>
        <div className="nav">
          {onBack ? (
            <button type="button" onClick={onBack}><u>Back</u></button>
          ) : (
            <span />
          )}
          <button type="button" className="next" onClick={onNext} disabled={nextDisabled}>{nextLabel}</button>
        </div>
        <div className="home-ind" />
      </div>
    </>
  );
}
