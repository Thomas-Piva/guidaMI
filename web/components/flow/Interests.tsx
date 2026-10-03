"use client";
import type { Profile } from "@/lib/types";

export type Props = {
  profile: Profile; // chips light up from profile.interests / profile.worries (voice tool or touch)
  onProfile: (patch: Partial<Profile>) => void;
};

type Option = { key: string; label: string; match: RegExp };

// Touch stores `key`. Voice values ("design, papers, a room") light a chip when `match` hits.
export const INTERESTS: Option[] = [
  { key: "Design", label: "Design", match: /design/ },
  { key: "Music", label: "Music", match: /music|concert/ },
  { key: "Basketball", label: "Basketball", match: /basket/ },
  { key: "Food", label: "Food", match: /food|cook|eat/ },
  { key: "Art", label: "Art", match: /\bart|museum/ },
  { key: "Libraries", label: "Libraries", match: /librar|book|reading/ },
  { key: "Nightlife", label: "Nightlife", match: /night|club|party/ },
];
export const WORRIES: Option[] = [
  { key: "Paperwork", label: "Paperwork · Carte", match: /paper|document|bureaucra|carte|permit/ },
  { key: "Finding a room", label: "Finding a room · Casa", match: /room|house|housing|flat|home|casa|rent/ },
  { key: "Money", label: "Money", match: /money|cost|expens|soldi/ },
  { key: "Language", label: "Language · Lingua", match: /language|italian|lingua/ },
  { key: "Making friends", label: "Making friends", match: /friend|lonel|alone|amici/ },
];

const hits = (o: Option, v: string) => o.match.test(v.toLowerCase());

function Chips({ options, selected, onChange }: { options: Option[]; selected: string[]; onChange: (next: string[]) => void }) {
  // values the guide heard that match no chip still show up, lit
  const extra = selected.filter((v) => !options.some((o) => hits(o, v)));
  const all = [...options, ...extra.map((v) => ({ key: v, label: v, match: new RegExp(`^${v.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }))];
  return (
    <div className="chips">
      {all.map((o) => {
        const on = selected.some((v) => hits(o, v));
        return (
          <button
            key={o.key}
            type="button"
            className={`chip${on ? " on" : ""}`}
            aria-pressed={on}
            onClick={() => onChange(on ? selected.filter((v) => !hits(o, v)) : [...selected, o.key])}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Mockup s1c.
export default function Interests({ profile, onProfile }: Props) {
  return (
    <>
      <h1 className="t1" style={{ fontSize: 18 }}>
        What do you enjoy?<span className="it">Cosa ti piace?</span>
      </h1>
      <Chips options={INTERESTS} selected={profile.interests} onChange={(interests) => onProfile({ interests })} />
      <h2 className="t1" style={{ fontSize: 18 }}>
        What worries you?<span className="it">Cosa ti preoccupa?</span>
      </h2>
      <Chips options={WORRIES} selected={profile.worries} onChange={(worries) => onProfile({ worries })} />
    </>
  );
}
