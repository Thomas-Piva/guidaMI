"use client";

import { useState, type CSSProperties } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import type { PassportFields, Profile } from "@/lib/types";
import { UiStyle } from "./shared";

export type ProfileViewProps = {
  profile: Profile;
  passport?: PassportFields | null;
  onBack: () => void;
  onDeleteAll: () => void; // integrator wipes localStorage and goes back to S0
};

const SITUATION: Record<NonNullable<Profile["situation"]>, string> = {
  just_arrived: "Just arrived · Appena arrivata",
  coming_soon: "Coming soon · Sto per arrivare",
};

const PASSPORT_LABELS: [keyof PassportFields, string][] = [
  ["surname", "Surname · Cognome"],
  ["given_names", "Given names · Nome"],
  ["date_of_birth", "Date of birth · Data di nascita"],
  ["nationality", "Nationality · Cittadinanza"],
  ["passport_number", "Passport no. · N. passaporto"],
];

/** No mockup frame for S8 profile: built only from existing mockup classes. */
export default function ProfileView({ profile, passport, onBack, onDeleteAll }: ProfileViewProps) {
  const [armed, setArmed] = useState(false);
  const { italianDeclared: decl, italianVerified: ver } = profile;
  const kv: [string, string | undefined][] = [
    ["Name · Nome", profile.name],
    ["Now · Adesso", profile.situation && SITUATION[profile.situation]],
    ["Citizenship", profile.eu === undefined ? undefined : profile.eu ? "EU · UE" : "Non-EU · Extra-UE"],
    ["From · Da", profile.from],
    ["Study · Studio", profile.study],
    ["Language · Lingua", profile.lang],
  ];

  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onBack}>
          ‹ Back
        </button>
        <span className="pill">Profile · Profilo</span>
      </div>
      <div className="body mescroll">
        <div className="t1" style={{ fontSize: 19 }}>
          Your profile<span className="it">Il tuo profilo · only on this phone · solo su questo telefono</span>
        </div>

        <div className="kv">
          {kv.map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              {v || "Not set · non indicato"}
            </div>
          ))}
        </div>

        {(profile.interests.length > 0 || profile.worries.length > 0) && (
          <>
            <span className="label">You enjoy · Ti piace</span>
            <div className="chips">
              {profile.interests.map((x) => (
                <span key={x} className="chip on">
                  {x}
                </span>
              ))}
            </div>
            <span className="label">Worries · Preoccupazioni</span>
            <div className="chips">
              {profile.worries.map((x) => (
                <span key={x} className="chip on">
                  {x}
                </span>
              ))}
            </div>
          </>
        )}

        <span className="label">Your Italian · Il tuo italiano</span>
        {ver !== undefined || decl !== undefined ? (
          <>
            <div className="big">
              {ver ?? decl}
              <small>/10</small>
            </div>
            <div className="slider" style={{ "--v": ver ?? decl } as CSSProperties}>
              <span className="tr" />
              <span className="fill" />
              {decl !== undefined && <span className="decl" title="declared" style={{ left: `calc(${decl * 10}% - 1px)` }} />}
              <span className="knob" />
            </div>
            <div className="verdict">
              <span>declared {decl ?? "?"}</span>
              <span className={ver !== undefined ? "on" : undefined}>{ver !== undefined ? `verified ${ver} · verificato` : "not verified yet"}</span>
            </div>
          </>
        ) : (
          <p className="sub">Not set yet · non ancora indicato</p>
        )}

        {passport && (
          <>
            <span className="label">Passport · Passaporto</span>
            <div className="fields">
              {PASSPORT_LABELS.map(([k, label]) => (
                <div key={k} className="fld on">
                  <small>{label}</small>
                  <span className="v">{passport[k] || "·"}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          className={`me-danger meb${armed ? " armed" : ""}`}
          onClick={() => (armed ? onDeleteAll() : setArmed(true))}
          onBlur={() => setArmed(false)}
        >
          <TrashIcon />
          {armed ? "Tap again to delete · Tocca ancora" : "Delete everything · Cancella tutto"}
        </button>
      </div>
    </>
  );
}
