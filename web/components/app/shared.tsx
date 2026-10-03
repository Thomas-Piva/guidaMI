"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import type { Step, StepIcon, StepPlace } from "@/lib/types";

// Small additions on top of app/mockup.css + globals.css (press scale lives in globals). :where() keeps
// specificity at 0, so every mockup class (.pill, .next, .cta, .tile...) still wins over these resets.
// Inputs go to 16px on touch screens only: iOS zooms the page on focus below 16px.
// The 3D icons are RGB on white: multiply drops the white square on tinted boxes.
const CSS = `
:where(.meb){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
:where(.meb):disabled,:where(.meb)[aria-disabled="true"]{cursor:default}
@media (pointer:coarse){:where(.mei){font-size:16px}}
:where(.mei){font:inherit;color:inherit;background:transparent;border:0;padding:0;margin:0;width:100%;outline:none;display:block}
.fld:focus-within{box-shadow:inset 0 0 0 2px var(--ink)}
.mescroll{overflow-y:auto!important;scrollbar-width:none;padding-bottom:16px}
.mescroll::-webkit-scrollbar{display:none}
.mescroll > *{flex-shrink:0}
.step.has-art{grid-template-columns:24px minmax(0,1fr) 56px}
.gicon img{width:34px;height:34px;object-fit:contain}
.gcard .img img.art3d{object-fit:contain;padding:8px}
.art img,.gicon img,.gcard .img img.art3d{mix-blend-mode:multiply}
.step > .place{grid-column:1 / -1;margin-top:0}
.place a{color:var(--cyan-ink);text-decoration:underline}
.place .maprow{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px}
.pv.me-warn{background:var(--canvas);border:1px solid var(--orange)}
.pv.me-warn svg{color:var(--orange);flex:none}
.me-link{color:var(--cyan-ink);text-decoration:underline}
.tag.dl.me-ok{background:var(--green);color:var(--canvas)}
.me-danger{border:1px solid var(--orange);color:var(--orange);background:var(--canvas);border-radius:8px;padding:12px 16px;font-weight:600;display:flex;gap:8px;justify-content:center;align-items:center;margin-top:8px}
.me-danger.armed{background:var(--orange);color:var(--canvas)}
.me-veil{position:absolute;inset:0;background:var(--canvas);transition:opacity 200ms ease-out}
.scrim.me-fade{transition:opacity 200ms ease-out}
`;

/** Render once per screen; React 19 hoists and dedupes it by href. */
export function UiStyle() {
  return (
    <style href="me-app-ui" precedence="default">
      {CSS}
    </style>
  );
}

const rmQuery = "(prefers-reduced-motion: reduce)";
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(rmQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(rmQuery).matches,
    () => false,
  );
}

/** Browser TTS. Returns false when the device has no speech synthesis. */
export function speak(text: string, lang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "it" ? "it-IT" : lang;
  const base = u.lang.slice(0, 2).toLowerCase();
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(base));
  if (voice) u.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

// ponytail: keyword match; the plan API can set Step.icon / a goal kind to skip the guessing.
const ICON_RULES: [RegExp, StepIcon][] = [
  [/codice|fiscal|tax code|aa4|permit|permesso|questura|modulo/, "taxcode"],
  [/doctor|health|medic|sanitari/, "doctor"],
  [/tram|metro|bus|atm|transport|getting around|pass\b/, "tram"],
  [/stud|course|universit|librar|bibliotec/, "study"],
  [/italian|italiano|language|lingua/, "italian"],
  [/room|rent|house|home|flat|casa|stanza|affitt|contract|contratto|residen|tari|search/, "room"],
];
const pick = (text: string, fallback: StepIcon): StepIcon => ICON_RULES.find(([re]) => re.test(text.toLowerCase()))?.[1] ?? fallback;

export const icon3d = (icon: StepIcon) => `/icons3d/${icon}.webp`;

export function stepIcon(s: Step): StepIcon {
  if (s.icon) return s.icon;
  if (s.fill_form === "aa48" || s.fill_form === "modulo1") return "taxcode";
  if (s.fill_form === "residenza" || s.fill_form === "tari") return "room";
  if (s.fill_form === "atm") return "tram";
  return pick(`${s.title_en} ${s.title_it}`, "taxcode");
}

const GOAL_IT: Record<StepIcon, string> = {
  room: "Affittare una stanza", taxcode: "Codice fiscale", doctor: "Medico", tram: "Trasporti", study: "Studio", italian: "Italiano",
};
export function goalArt(label: string): { icon: StepIcon; it: string } {
  const icon = pick(label, "taxcode");
  return { icon, it: GOAL_IT[icon] };
}

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Milano`)}`;

/** Where to go, from City open data. Links stop propagation so a clickable card around it does not open. */
export function PlaceBlock({ place }: { place: StepPlace }) {
  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <div className="place">
      <b>{place.name}</b>
      <span>{place.address}</span>
      {place.metro && <span>Metro {place.metro}</span>}
      <div className="maprow">
        <small>
          Source:{" "}
          <a href={place.source_url} target="_blank" rel="noreferrer" onClick={stop}>
            dati.comune.milano.it
          </a>
        </small>
        <a className="tag src" style={{ margin: 0, textDecoration: "none" }} href={mapsUrl(place.address)} target="_blank" rel="noreferrer" onClick={stop}>
          Map ↗
        </a>
      </div>
    </div>
  );
}

export const illuSrc = (name: string) => `/illustrations/${name}.webp`;
