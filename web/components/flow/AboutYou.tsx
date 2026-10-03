"use client";
import type { ReactNode } from "react";
import { AirplaneLandingIcon, GlobeHemisphereWestIcon, IdentificationCardIcon, SuitcaseRollingIcon } from "@phosphor-icons/react";
import type { Profile } from "@/lib/types";

export type Props = {
  profile: Profile; // cards light up from profile.situation / profile.eu (voice tool or touch)
  onProfile: (patch: Partial<Profile>) => void;
};

const LANG_NAMES: Record<string, string> = { en: "English", zh: "中文", es: "Español", ar: "العربية" };

type CardDef = { icon: ReactNode; en: string; it: string; on: (p: Profile) => boolean; patch: Partial<Profile> };
const CARDS: CardDef[] = [
  { icon: <AirplaneLandingIcon />, en: "Just arrived", it: "Appena arrivata", on: (p) => p.situation === "just_arrived", patch: { situation: "just_arrived" } },
  { icon: <SuitcaseRollingIcon />, en: "Coming soon", it: "Sto per arrivare", on: (p) => p.situation === "coming_soon", patch: { situation: "coming_soon" } },
  { icon: <GlobeHemisphereWestIcon />, en: "EU citizen", it: "Cittadina UE", on: (p) => p.eu === true, patch: { eu: true } },
  { icon: <IdentificationCardIcon />, en: "Non-EU", it: "Extra-UE", on: (p) => p.eu === false, patch: { eu: false } },
];

// Mockup s1. The language chip fades in once the guide has switched language.
export default function AboutYou({ profile, onProfile }: Props) {
  const switched = !!profile.lang && profile.lang !== "it";
  return (
    <>
      <span className={`lang${switched ? " on" : ""}`} data-t="" aria-hidden={!switched}>
        Italiano → {LANG_NAMES[profile.lang ?? "en"] ?? profile.lang}
      </span>
      <h1 className="t1">
        Where are you now?<span className="it">A che punto sei?</span>
      </h1>
      <div className="grid2">
        {CARDS.map((c) => {
          const on = c.on(profile);
          return (
            <button key={c.en} type="button" className={`card${on ? " on" : ""}`} aria-pressed={on} onClick={() => onProfile(c.patch)}>
              {c.icon}
              {c.en}
              <span className="it" style={{ margin: 0 }}>{c.it}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
