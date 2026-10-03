"use client";

import type { KeyboardEvent } from "react";
import {
  ChatsCircleIcon, CheckIcon, FileTextIcon, FirstAidKitIcon, GraduationCapIcon, HouseLineIcon, PlayIcon, SpeakerHighIcon, TramIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Plan, Step, StepIcon } from "@/lib/types";
import { service } from "@/lib/services";
import { PlaceBlock, UiStyle, goalArt, speak } from "./shared";

export type PlanViewProps = {
  plan: Plan;
  done: string[]; // step ids marked done
  goalIt?: string; // Italian goal line, e.g. "Affittare una stanza"; guessed from plan.goal when missing
  lang?: string; // user language for «Listen», default "en"
  onHome?: () => void;
  onListen?: () => void; // overrides the default (speechSynthesis reads the headline)
  onOpenStep: (step: Step) => void;
  onOpenPreviews?: () => void; // «Next stops» row (S7)
};

/** A step is open when it is done, or within one of the first step not done yet (mockup: 0 done → steps 1-2 open). */
export function isLocked(steps: Step[], done: string[], index: number) {
  const first = steps.findIndex((s) => !done.includes(s.id));
  return first !== -1 && index > first + 1 && !done.includes(steps[index].id);
}

// Same Phosphor icons as the mockup need cards (ph-house-line for a room, ...).
const GOAL_ICON: Record<StepIcon, Icon> = {
  room: HouseLineIcon, taxcode: FileTextIcon, doctor: FirstAidKitIcon, tram: TramIcon, study: GraduationCapIcon, italian: ChatsCircleIcon,
};

const meta = (s: Step) => [s.bring.join(" + "), s.where, s.how_long, s.deadline].filter(Boolean).join(" · ") || s.why_for_you;

export default function PlanView({ plan, done, goalIt, lang = "en", onHome, onListen, onOpenStep, onOpenPreviews }: PlanViewProps) {
  const art = goalArt(plan.goal);
  const GoalIcon = GOAL_ICON[art.icon];
  const count = plan.steps.filter((s) => done.includes(s.id)).length;
  const itLine = [goalIt ?? art.it, `${count} of ${plan.steps.length} done`].filter(Boolean).join(" · ");
  const listen = onListen ?? (() => speak(`${plan.headline}. ${plan.steps.map((s, i) => `${i + 1}. ${s.title_en}`).join(". ")}`, lang));
  const key = (e: KeyboardEvent, s: Step) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenStep(s);
    }
  };

  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onHome}>
          ‹ Home
        </button>
        <button type="button" className="pill meb" onClick={listen}>
          <SpeakerHighIcon /> Listen
        </button>
      </div>
      <div className="body mescroll">
        <div className="goalhead">
          <div className="gicon">
            <GoalIcon size={22} />
          </div>
          <div>
            <div className="t1" style={{ fontSize: 18 }}>
              {plan.goal}
              <span className="it">{itLine}</span>
            </div>
          </div>
        </div>

        <div className="steps">
          {plan.steps.map((s, i) => {
            const isDone = done.includes(s.id);
            const locked = isLocked(plan.steps, done, i);
            return (
              <div
                key={s.id}
                className={`step meb${isDone ? " done" : ""}${locked ? " lock" : ""}`}
                role="button"
                tabIndex={locked ? -1 : 0}
                aria-disabled={locked}
                aria-label={`Step ${i + 1}: ${s.title_en}${isDone ? ", done" : locked ? ", locked" : ""}`}
                onClick={() => !locked && onOpenStep(s)}
                onKeyDown={(e) => !locked && key(e, s)}
              >
                <span className="n">{isDone ? <CheckIcon size={13} weight="bold" /> : i + 1}</span>
                <div>
                  <b>{s.title_en}</b>
                  <span className="meta">{meta(s)}</span>
                  {(s.fill_form || (!locked && s.source_url)) && <br />}
                  {s.fill_form && <span className="tag fill">Fill it for me</span>}
                  {!locked && s.source_url && (
                    <a className="tag src" style={{ textDecoration: "none" }} href={s.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      yesmilano.it ↗
                    </a>
                  )}
                </div>
                {s.place && <PlaceBlock place={s.place} />}
              </div>
            );
          })}
        </div>

        <div className="phrase">
          <div>
            <b>«{plan.phrase.phrase}»</b>
            <small>
              {plan.phrase.meaning} · {plan.phrase.when}
            </small>
          </div>
          <button type="button" className="play meb" aria-label={`Play «${plan.phrase.phrase}» in Italian`} onClick={() => speak(plan.phrase.phrase, "it")}>
            <PlayIcon size={14} weight="fill" />
          </button>
        </div>

        {plan.services.length > 0 && (
          <>
            <span className="label" style={{ marginTop: 4 }}>
              For you · Per te
            </span>
            {plan.services.map((sv) => {
              const official = service(sv.service_id);
              return (
                <a key={sv.name} className="row meb" href={official?.url ?? sv.source_url} target="_blank" rel="noreferrer">
                  <span>
                    <b style={{ display: "block" }}>{sv.name}</b>
                    <span className="sub" style={{ fontSize: 12 }}>
                      {sv.why_you}
                    </span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              );
            })}
          </>
        )}

        {plan.verify && (
          <p className="sub">
            <b style={{ color: "var(--ink)" }}>Double-check with the City · Da verificare con il Comune.</b> {plan.verify}
          </p>
        )}

        {onOpenPreviews && (
          <button type="button" className="row meb" onClick={onOpenPreviews}>
            <span>
              <b style={{ display: "block" }}>Next stops</b>
              <span className="sub" style={{ fontSize: 12 }}>
                Prossime fermate · Fascicolo, Italian, Talent card
              </span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
    </>
  );
}
