"use client";
import { useEffect, useState } from "react";
import { PaperPlaneRightIcon, XIcon } from "@phosphor-icons/react";
import type { GuideApi, GuideLine } from "@/lib/types";

export type Props = {
  lines: GuideLine[]; // live captions, newest last (GuideApi.lines); the last 2 are shown
  voice: boolean; // false = text mode: input instead of the X
  speaking?: boolean; // wave moves only while the guide speaks
  status?: GuideApi["status"];
  onClose: () => void; // X: close audio, keep the text session (GuideApi.setVoice(false))
  onSend: (text: string) => void; // text mode submit (GuideApi.sendText)
  onVoiceOn?: () => void; // text mode: tap the orb to turn voice back on
};

const MAX = 160;
const tail = (t: string) => (t.length > MAX ? "…" + t.slice(-MAX) : t);

/** Types the newest guide line like the mockup; continues when the text grows (streaming). */
function useTyped(text: string) {
  const [s, setS] = useState({ text, n: text.length }); // first render: no typing (e.g. after reload)
  let n = s.n;
  if (s.text !== text) {
    n = text.startsWith(s.text) ? n : 0; // same line growing keeps going, a new line restarts
    setS({ text, n });
  }
  useEffect(() => {
    if (n >= text.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setS((p) => ({ ...p, n: reduce ? text.length : p.n + 1 })), reduce ? 0 : 28);
    return () => clearTimeout(id);
  }, [n, text]);
  return { typed: text.slice(0, n), typing: n < text.length };
}

function Orb({ className, onClick }: { className: string; onClick?: () => void }) {
  const wave = (
    <div className="wave">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
  return onClick ? (
    <button type="button" className={className} onClick={onClick} aria-label="Turn voice on">
      {wave}
    </button>
  ) : (
    <div className={className} aria-hidden="true">
      {wave}
    </div>
  );
}

// Mockup dock: dark bar at the bottom with the orb, live captions and the X.
export default function VoiceDock({ lines, voice, speaking = false, status = "idle", onClose, onSend, onVoiceOn }: Props) {
  const [draft, setDraft] = useState("");
  const textMode = !voice || status === "error";
  const shown = lines.slice(-2);
  const first = lines.length - shown.length;
  const last = lines.at(-1);
  const { typed, typing } = useTyped(last?.who === "guide" ? last.text : "");

  const hint =
    status === "error"
      ? "Voice is not available right now. You can type instead."
      : status === "connecting"
        ? "Connecting to your guide…"
        : textMode
          ? "Write to your guide."
          : "Your guide is listening.";

  const captions = (
    <>
      {shown.length === 0 || status === "error" || status === "connecting" ? <span className="ln on hint">{hint}</span> : null}
      {status !== "error" &&
        shown.map((l, i) => {
          const isLast = i === shown.length - 1 && l.who === "guide";
          return (
            <span className="ln on" key={first + i}>
              <b className={l.who === "you" ? "w you" : "w"}>{l.who === "you" ? "You" : "Guide"}</b>
              <span className={isLast && typing ? "typing" : undefined}>{tail(isLast ? typed : l.text)}</span>
            </span>
          );
        })}
    </>
  );

  if (!textMode) {
    return (
      <div className="dock">
        <Orb className={`orb sm${speaking ? "" : " idle"}`} />
        <div className="dcap" aria-live="polite">
          {captions}
        </div>
        <button type="button" className="dx" onClick={onClose} aria-label="Turn voice off">
          <XIcon weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="dock"
      onSubmit={(e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;
        onSend(text);
        setDraft("");
      }}
    >
      <Orb className="orb sm off" onClick={status === "error" ? undefined : onVoiceOn} />
      <div className="dcap">
        <div aria-live="polite" style={{ display: "contents" }}>
          {captions}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type here · Scrivi qui"
          aria-label="Message to your guide"
          autoComplete="off"
          enterKeyHint="send"
        />
      </div>
      <button type="submit" className="dx" aria-label="Send" disabled={!draft.trim()}>
        <PaperPlaneRightIcon weight="bold" />
      </button>
    </form>
  );
}
