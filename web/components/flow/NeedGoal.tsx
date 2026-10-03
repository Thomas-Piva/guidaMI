"use client";

export type Props = {
  goal?: string; // active goal label, e.g. "Rent a room" (from set_goal or touch)
  onSelect: (goal: string) => void; // called with the need's goal label
};

export const NEEDS: { goal: string; en: string; it: string; icon: string; match: RegExp }[] = [
  { goal: "Rent a room", en: "A room", it: "Casa", icon: "room", match: /room|rent|house|flat|apartment|casa|stanza|affitt/ },
  { goal: "Get a tax code", en: "Tax code", it: "Codice fiscale", icon: "taxcode", match: /tax|fiscal/ },
  { goal: "Find a doctor", en: "A doctor", it: "Medico", icon: "doctor", match: /doctor|medic|health|gp\b/ },
  { goal: "Get around", en: "Getting around", it: "Trasporti", icon: "tram", match: /tram|metro|bus|transport|atm|around|travel/ },
  { goal: "Studying", en: "Studying", it: "Studio", icon: "study", match: /stud|universit|course|school/ },
  { goal: "Learn Italian", en: "Italian", it: "Italiano", icon: "italian", match: /italian|language|lingua/ },
];

/** Maps a free goal string from the voice tool to one of the six cards (or undefined). */
export const needFromGoal = (goal?: string) => (goal ? NEEDS.find((n) => n.match.test(goal.toLowerCase())) : undefined);

// Mockup s1b.
export default function NeedGoal({ goal, onSelect }: Props) {
  const lit = needFromGoal(goal);
  return (
    <>
      <h1 className="t1">
        What do you need?<span className="it">Di cosa hai bisogno?</span>
      </h1>
      <div className="grid2">
        {NEEDS.map((n) => {
          const on = n === lit;
          return (
            <button key={n.goal} type="button" className={`card${on ? " on" : ""}`} aria-pressed={on} onClick={() => onSelect(n.goal)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons3d/${n.icon}.webp`} alt="" width={52} height={52} style={{ objectFit: "contain", mixBlendMode: "multiply" }} />
              {n.en}
              <span className="it" style={{ margin: 0 }}>{n.it}</span>
            </button>
          );
        })}
      </div>
      {/* a goal the guide heard that is not one of the six cards */}
      {goal && !lit && <div className="row on">{goal}</div>}
    </>
  );
}
