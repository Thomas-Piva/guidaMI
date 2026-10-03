"use client";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { Profile } from "@/lib/types";

export type Props = {
  profile: Profile; // italianDeclared (what Nour said) and italianVerified (after Claude's 3 checks)
  checks: (boolean | null | undefined)[]; // results of the 3 checks: true ✓, false ✕, null pending
  tests?: string[]; // the 3 prompts; default = mockup band 3-5
  onDeclare: (n: number) => void; // touch: slider released or arrow keys; 0-10
};

export const DEFAULT_TESTS = ["«Come ti chiami?»", "Say «Dov'è la stazione?»", "What does «affitto» mean?"];

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));
const still: CSSProperties = { transition: "none" };

// Mockup s1t. Shows declared vs verified; the knob follows verified once Claude has judged.
export default function ItalianTest({ profile, checks, tests = DEFAULT_TESTS, onDeclare }: Props) {
  const { italianDeclared: declared, italianVerified: verified } = profile;
  const [drag, setDrag] = useState<number | null>(null);
  const dragging = useRef(false);
  const shown = drag ?? verified ?? declared;
  const at = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp(((e.clientX - r.left) / r.width) * 10);
  };
  const key = (e: KeyboardEvent) => {
    const base = declared ?? 0;
    const next = { ArrowLeft: base - 1, ArrowDown: base - 1, ArrowRight: base + 1, ArrowUp: base + 1, Home: 0, End: 10 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onDeclare(clamp(next));
  };

  return (
    <>
      <h1 className="t1" style={{ fontSize: 18 }}>
        Your Italian
        <span className="it">{declared !== undefined ? `You said ${declared}. Let's check together.` : "Drag the bar or say a number from 0 to 10."}</span>
      </h1>
      <div className="big" aria-live="polite">
        <span>{shown ?? "?"}</span>
        <small>/10</small>
      </div>
      <div
        className="slider"
        role="slider"
        tabIndex={0}
        aria-label="Your Italian level, from 0 to 10"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={drag ?? declared ?? 0}
        style={{ "--v": String(shown ?? 0) } as CSSProperties}
        onPointerDown={(e) => {
          if (dragging.current) return; // ignore a second finger
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setDrag(at(e));
        }}
        onPointerMove={(e) => dragging.current && setDrag(at(e))}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          onDeclare(at(e));
          setDrag(null);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDrag(null);
        }}
        onKeyDown={key}
      >
        <span className="tr" />
        <span className="fill" style={drag !== null ? still : undefined} />
        {declared !== undefined && <span className="decl" title="declared" style={{ left: `calc(${declared * 10}% - 1px)` }} />}
        <span className="knob" style={drag !== null ? still : undefined} />
      </div>
      <div className="scale">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
      <div className="verdict">
        <span>declared {declared ?? "?"}</span>
        <span className={verified !== undefined ? "on" : undefined}>
          {verified !== undefined ? `verified ${verified} · verificato` : "not checked yet · da verificare"}
        </span>
      </div>
      <div className="tests">
        {tests.slice(0, 3).map((t, i) => {
          const c = checks[i];
          return (
            <div className="tst" key={i}>
              <span>
                {i + 1} · {t}
              </span>
              <span
                className={c === true ? "mk ok on" : c === false ? "mk no on" : "mk"}
                aria-label={c === true ? "correct" : c === false ? "not yet" : "waiting"}
              >
                {c === true ? "✓" : c === false ? "✕" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
