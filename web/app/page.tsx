"use client";
// Screen state machine (S0-S8). State lives in lib/store.ts (localStorage); the voice guide drives it
// through GuideHandlers, touch drives it through the same store actions.
// ?demo=1 loads lib/demo.ts and replaces /api/plan and /api/passport with sample data; ?screen=<Screen> jumps there.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";
import Welcome from "@/components/flow/Welcome";
import WizardFrame, { PROGRESS } from "@/components/flow/WizardFrame";
import AboutYou from "@/components/flow/AboutYou";
import Interests from "@/components/flow/Interests";
import ItalianTest from "@/components/flow/ItalianTest";
import NeedGoal, { needFromGoal } from "@/components/flow/NeedGoal";
import VoiceDock from "@/components/flow/VoiceDock";
import Reading from "@/components/app/Reading";
import PlanView from "@/components/app/PlanView";
import StepSheet from "@/components/app/StepSheet";
import PassportScan, { EMPTY_PASSPORT } from "@/components/app/PassportScan";
import FormsView from "@/components/app/FormsView";
import Home from "@/components/app/Home";
import Previews from "@/components/app/Previews";
import ProfileView from "@/components/app/ProfileView";
import { useGuide } from "@/lib/voice";
import { buildForms } from "@/lib/forms";
import { SERVICES } from "@/lib/services";
import { SAMPLE_GOAL, SAMPLE_ITALIAN_CHECKS, SAMPLE_PASSPORT, SAMPLE_PLAN, SAMPLE_PROFILE } from "@/lib/demo";
import {
  activeGoal, clearAll, declareItalian, getState, setActiveGoal, setGoal, setItalian, setPlan, setScreen, setState,
  setVoice, toggleDone, updateProfile, useAppState,
} from "@/lib/store";
import type { GuideHandlers, GuideLine, PassportFields, Plan, PlanEvent, Screen, ServiceId, Step } from "@/lib/types";

const SCREENS: readonly Screen[] = ["welcome", "about", "interests", "italian", "need", "reading", "plan", "step", "passport", "forms", "home", "previews", "profile"];
const DOCK_SCREENS: readonly Screen[] = ["about", "interests", "italian", "need", "reading", "plan"];
const PASSPORT_PRESET: readonly string[] = ["forms", "home", "profile"]; // demo: these screens start with the SPECIMEN read

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const noop = () => {};
const never = () => noop;

class PlanHttpError extends Error {}

const PLAN_ERRORS: Record<string, string> = {
  missing_keys: "The plan service is not connected yet (missing API keys).",
  rate_limited: "Too many plans in a minute. Try again shortly.",
  too_big: "The profile is too big to send.",
};

/** POST /api/plan, NDJSON stream of PlanEvent. */
async function* apiStream(body: unknown, signal: AbortSignal): AsyncGenerator<PlanEvent> {
  const res = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new PlanHttpError(j.error ?? `http_${res.status}`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += value;
    const lines = buf.split("\n");
    buf = done ? "" : (lines.pop() ?? "");
    for (const l of lines) if (l.trim()) yield JSON.parse(l) as PlanEvent;
    if (done) return;
  }
}

/** Demo: the sample plan, streamed like the real route (one reading/read pair per guide). */
async function* demoStream(): AsyncGenerator<PlanEvent> {
  const slugs = [...new Set([...SAMPLE_PLAN.steps, ...SAMPLE_PLAN.services].map((x) => new URL(x.source_url).pathname.replace(/^\/en\//, "")))];
  for (const slug of slugs) {
    const name = slug.split("/").pop()!.replace(/-/g, " ");
    const title = name[0].toUpperCase() + name.slice(1);
    yield { type: "reading", slug, title };
    await sleep(420);
    yield { type: "read", slug, title };
    await sleep(180);
  }
  yield { type: "plan", plan: SAMPLE_PLAN };
}

const demoRead = async (): Promise<PassportFields> => (await sleep(1400), SAMPLE_PASSPORT);

const summary = (p: Plan) =>
  `${p.headline} Steps: ${p.steps.map((s, i) => `${i + 1}. ${s.title_en}`).join("; ")}. Tap the first step to start.`;

type Notice = { text: string; it?: string; action?: { label: string; url?: string } }; // no url = run the sample plan

const noteStyle: CSSProperties = {
  position: "absolute", left: 12, right: 12, top: "calc(max(10px, env(safe-area-inset-top, 0px)) + 46px)", zIndex: 40,
  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
  background: "#222", color: "#fff", fontSize: 12.5, lineHeight: 1.35, boxShadow: "0 6px 20px rgba(0,0,0,.18)",
};
const demoStyle: CSSProperties = {
  position: "absolute", top: "max(2px, env(safe-area-inset-top, 0px))", left: "50%", translate: "-50% 0", zIndex: 41,
  fontSize: 10, letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999, background: "rgba(34,34,34,.06)", color: "#6a6a6a",
  pointerEvents: "none", whiteSpace: "nowrap",
};

export default function Page() {
  const s = useAppState();
  const search = useSyncExternalStore(never, () => window.location.search, () => "");
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const [forcedDemo, setForcedDemo] = useState(false);
  const demo = query.get("demo") === "1" || forcedDemo;

  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [stepId, setStepId] = useState<string>();
  // ponytail: passport and extra stay in memory only (never in localStorage); a reload asks for the scan again.
  const [passportState, setPassport] = useState<PassportFields | null>(null);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [localLines, setLocalLines] = useState<GuideLine[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissedError, setDismissedError] = useState<string>();
  const [sampleOffer, setSampleOffer] = useState<string>(); // goal label, after /api/plan said missing_keys
  const runId = useRef(0);
  const abort = useRef<AbortController | null>(null);

  const passport = passportState ?? (demo && PASSPORT_PRESET.includes(query.get("screen") ?? "") ? SAMPLE_PASSPORT : null);
  const goal = activeGoal(s);
  const plan = goal?.plan;
  const cards = useMemo(() => buildForms(passport ?? EMPTY_PASSPORT, extra), [passport, extra]);

  /** Builds the plan for a goal: Reading screen with live guide checks, then PlanView. */
  const runPlan = useCallback(async (label: string, sample: boolean): Promise<Plan> => {
    const my = ++runId.current;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    const goalId = setGoal(label);
    setEvents([]);
    setScreen("reading");
    const live = () => runId.current === my;
    let errorShown = false;
    try {
      const stream = sample ? demoStream() : apiStream({ profile: getState().profile, goal: label }, ctrl.signal);
      for await (const e of stream) {
        if (!live()) throw new Error("superseded");
        setEvents((xs) => [...xs, e]);
        if (e.type === "error") {
          errorShown = true;
          throw new Error(e.message);
        }
        if (e.type === "plan") {
          setPlan(goalId, e.plan);
          await sleep(700); // let the last guide tick in yellow
          if (live() && getState().screen === "reading") setScreen("plan");
          return e.plan;
        }
      }
      throw new Error("The plan stream ended early.");
    } catch (err) {
      const code = err instanceof PlanHttpError ? err.message : undefined;
      const message = (code && PLAN_ERRORS[code]) || (err instanceof Error ? err.message : String(err));
      if (live() && !errorShown) setEvents((xs) => [...xs, { type: "error", message }]);
      if (live() && code === "missing_keys") setSampleOffer(label);
      throw new Error(message);
    }
  }, []);

  const openService = (id: ServiceId) => {
    const sv = SERVICES[id];
    if (window.open(sv.url, "_blank", "noopener,noreferrer")) return;
    // Popup blocked (tool call is not a user gesture): one tap opens it.
    setNotice({ text: `Open ${sv.name}`, it: "Apri il servizio ufficiale", action: { label: "Open ↗", url: sv.url } });
  };

  const handlers: GuideHandlers = {
    onProfile: updateProfile,
    onItalian: setItalian,
    onGoal: (g) => void setGoal(g),
    onBuildPlan: (g) => runPlan(g, demo).then(summary),
    onScreen: setScreen,
    onPassport: () => setScreen("passport"),
    onOpenService: openService,
  };
  const guide = useGuide(handlers);
  const live = guide.status === "connected" || guide.status === "connecting";
  const voiceOn = s.voice && guide.voice && live;

  const toggleVoice = (on: boolean) => {
    setVoice(on);
    if (!on) return guide.setVoice(false);
    if (live) guide.setVoice(true);
    else void guide.start({ voice: true, profile: getState().profile });
  };

  const startGuide = (voice: boolean) => {
    setVoice(voice);
    setScreen("about");
    void guide.start({ voice, profile: getState().profile });
  };

  /** Touch path for «Yes, make my plan» / goal card without a plan. */
  const makePlan = (label: string) => {
    guide.sendContext(`Nour asked for a plan to: ${label}. It is being built on screen.`);
    runPlan(label, demo)
      .then((p) => guide.sendContext(`The plan is on screen now. ${summary(p)}`))
      .catch(noop); // the error is on the Reading screen
  };

  /** Text typed in the dock: to the guide when connected, otherwise a local match on the six needs. */
  const send = (text: string) => {
    if (guide.status === "connected") return guide.sendText(text);
    const need = needFromGoal(text);
    if (need) {
      setGoal(need.goal);
      if (["about", "interests", "italian"].includes(getState().screen)) setScreen("need");
    }
    const reply = need
      ? `Got it: ${need.goal}. Tap «Yes, make my plan». · Ho capito.`
      : "The guide is offline, so I can only match needs like «a room» or «a doctor». Tap the cards to go on. · Usa le card.";
    setLocalLines((ls) => [...ls, { who: "you", text }, { who: "guide", text: reply }]);
  };

  /** «Ask the guide» on a step: context + question; the answer shows in the plan's dock. */
  const ask = async (step: Step) => {
    if (!plan) return;
    const i = plan.steps.findIndex((x) => x.id === step.id) + 1;
    setScreen("plan");
    if (guide.status !== "connected") await guide.start({ voice: s.voice, profile: getState().profile });
    guide.sendContext(
      `Nour opened step ${i}: ${step.title_en} (${step.title_it}). Where: ${step.where}. Bring: ${step.bring.join(", ")}. ` +
        `How long: ${step.how_long}. Deadline: ${step.deadline}. Source: ${step.source_url}`,
    );
    guide.sendText(`Explain step ${i} to me: ${step.title_en}`);
  };

  // Mount: demo data, ?screen=, resume an interrupted plan, service worker.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const isDemo = q.get("demo") === "1";
    const sc = SCREENS.find((x) => x === q.get("screen"));
    if (isDemo) {
      setState({ profile: SAMPLE_PROFILE, goals: [SAMPLE_GOAL], activeGoalId: SAMPLE_GOAL.id, italianChecks: [...SAMPLE_ITALIAN_CHECKS], voice: false });
      setScreen(sc ?? "welcome");
    } else if (sc) setScreen(sc);
    const now = getState();
    let resume: ReturnType<typeof setTimeout> | undefined;
    if (now.screen === "reading") {
      const g = activeGoal(now);
      if (!g) setScreen("need");
      else resume = setTimeout(() => runPlan(g.label, isDemo).catch(noop), 0); // after mount, not inside the effect
    }
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.error("[sw] registration failed", e));
    }
    return () => clearTimeout(resume);
  }, [runPlan]);

  // ---- render ----
  const screen = s.screen;
  const guideError = guide.status === "error" ? guide.error : undefined;
  const [errEn, errIt] = (guideError ?? "").split(" · ");
  // The plan (mockup s3) shows the dock only while a conversation with the guide is going on.
  const hasDock = DOCK_SCREENS.includes(screen) && (screen !== "plan" || live || guide.lines.length > 0 || localLines.length > 0);
  const offer: Notice | null = sampleOffer
    ? {
        text: "The plan service is not connected yet (missing API keys).",
        it: "Il servizio del piano non è ancora collegato.",
        action: { label: "Sample plan" },
      }
    : null;
  const shownNotice: Notice | null =
    notice ?? offer ?? (guideError && !hasDock && dismissedError !== guideError ? { text: errEn, it: errIt } : null);
  const closeNotice = () => (notice ? setNotice(null) : offer ? setSampleOffer(undefined) : setDismissedError(guideError));
  const noticeAction = (a: NonNullable<Notice["action"]>) => {
    if (a.url) window.open(a.url, "_blank", "noopener,noreferrer");
    else if (sampleOffer) {
      setForcedDemo(true);
      runPlan(sampleOffer, true).catch(noop);
    }
    closeNotice();
  };

  const dock = (
    <VoiceDock
      lines={[...guide.lines, ...(guideError ? [{ who: "guide" as const, text: errEn }] : []), ...localLines]}
      voice={voiceOn}
      speaking={guide.speaking}
      status={guideError ? "idle" : guide.status}
      onClose={() => toggleVoice(false)}
      onSend={send}
      onVoiceOn={() => toggleVoice(true)}
    />
  );

  type Wz = { progress: number; onNext: () => void; onBack: () => void; body: ReactNode; nextLabel?: string; nextDisabled?: boolean };
  const wizards: Partial<Record<Screen, Wz>> = {
    about: { progress: PROGRESS.about, onNext: () => setScreen("interests"), onBack: () => setScreen("welcome"),
      body: <AboutYou profile={s.profile} onProfile={updateProfile} /> },
    interests: { progress: PROGRESS.interests, onNext: () => setScreen("italian"), onBack: () => setScreen("about"),
      body: <Interests profile={s.profile} onProfile={updateProfile} /> },
    italian: { progress: PROGRESS.italian, onNext: () => setScreen("need"), onBack: () => setScreen("interests"),
      body: <ItalianTest profile={s.profile} checks={s.italianChecks} onDeclare={declareItalian} /> },
    need: { progress: PROGRESS.need, onNext: () => goal && makePlan(goal.label), onBack: () => setScreen("italian"),
      body: <NeedGoal goal={goal?.label} onSelect={(g) => void setGoal(g)} />, nextLabel: "Yes, make my plan", nextDisabled: !goal },
  };

  const toPlanOr = (fallback: Screen) => setScreen(plan ? "plan" : fallback);
  const formsCount = passport
    ? { ready: cards.filter((c) => c.pdf && c.fields.every((f) => !f.missing)).length, toFinish: cards.filter((c) => c.fields.some((f) => f.missing)).length }
    : undefined;

  const home = (
    <Home
      name={s.profile.name}
      goals={s.goals}
      italianVerified={s.profile.italianVerified}
      forms={formsCount}
      voiceOn={voiceOn}
      onToggleVoice={() => toggleVoice(!voiceOn)}
      onProfile={() => setScreen("profile")}
      onOpenGoal={(id) => {
        setActiveGoal(id);
        const g = getState().goals.find((x) => x.id === id);
        if (g?.plan) setScreen("plan");
        else if (g) makePlan(g.label);
      }}
      onNewGoal={() => setState({ activeGoalId: undefined, screen: "need" })}
      onForms={() => setScreen(passport ? "forms" : "passport")}
      onItalian={() => setScreen("italian")}
      onPreviews={() => setScreen("previews")}
    />
  );

  let view: ReactNode;
  switch (screen) {
    case "welcome":
      view = <Welcome onStart={() => startGuide(true)} onSkipVoice={() => startGuide(false)} />;
      break;
    case "about":
    case "interests":
    case "italian":
    case "need": {
      const { body, ...wz } = wizards[screen]!;
      view = (
        <WizardFrame {...wz} onExit={() => setScreen("home")} voice={voiceOn} onVoice={toggleVoice} dock={dock}>
          {body}
        </WizardFrame>
      );
      break;
    }
    case "reading":
      view = (
        <>
          <Reading
            events={events}
            voiceOn={voiceOn}
            onToggleVoice={() => toggleVoice(!voiceOn)}
            onExit={() => { runId.current++; abort.current?.abort(); toPlanOr("need"); }}
            onRetry={goal ? () => makePlan(goal.label) : undefined}
          />
          {dock}
        </>
      );
      break;
    case "plan":
    case "step": {
      if (!goal || !plan) {
        view = home;
        break;
      }
      const step = plan.steps.find((x) => x.id === stepId) ?? plan.steps.find((x) => !goal.done.includes(x.id)) ?? plan.steps[0];
      view = (
        <>
          <PlanView
            plan={plan}
            done={goal.done}
            lang={s.profile.lang}
            onHome={() => setScreen("home")}
            onOpenStep={(st) => {
              setStepId(st.id);
              setScreen("step");
              guide.sendContext(`Nour opened step: ${st.title_en}.`);
            }}
            onOpenPreviews={() => setScreen("previews")}
          />
          {screen === "plan" && hasDock && dock}
          {screen === "step" && (
            <StepSheet
              key={step.id}
              step={step}
              done={goal.done.includes(step.id)}
              lang={s.profile.lang}
              onClose={() => setScreen("plan")}
              onAsk={(st) => void ask(st)}
              onFill={() => {
                guide.sendContext("Nour is scanning her passport to fill in the forms.");
                setScreen("passport");
              }}
              onToggleDone={(next) => {
                if (goal.done.includes(step.id) !== next) toggleDone(goal.id, step.id);
                if (next) {
                  guide.sendContext(`Nour marked step done: ${step.title_en}.`);
                  setScreen("plan");
                }
              }}
            />
          )}
        </>
      );
      break;
    }
    case "passport":
      view = (
        <PassportScan
          initial={passport}
          read={demo ? demoRead : undefined}
          onBack={() => toPlanOr("home")}
          onConfirm={(f) => {
            setPassport(f);
            setScreen("forms");
          }}
        />
      );
      break;
    case "forms":
      view = (
        <FormsView
          cards={cards}
          fields={passport ?? EMPTY_PASSPORT}
          extra={extra}
          onExtraChange={(k, v) => setExtra((e) => ({ ...e, [k]: v }))}
          onPassportChange={(k, v) => setPassport({ ...(passport ?? EMPTY_PASSPORT), [k]: v })}
          onBack={() => toPlanOr("home")}
        />
      );
      break;
    case "previews":
      view = <Previews onHome={() => setScreen("home")} />;
      break;
    case "profile":
      view = (
        <ProfileView
          profile={s.profile}
          passport={passport}
          onBack={() => setScreen("home")}
          onDeleteAll={() => {
            runId.current++;
            abort.current?.abort();
            void guide.stop();
            clearAll();
            setPassport(null);
            setExtra({});
            setLocalLines([]);
            setNotice(null);
          }}
        />
      );
      break;
    default:
      view = home;
  }

  return (
    <>
      {view}
      {demo && <span style={demoStyle}>Demo · sample data</span>}
      {shownNotice && (
        <div role="status" style={noteStyle}>
          <span style={{ flex: 1 }}>
            {shownNotice.text}
            {shownNotice.it && <span style={{ display: "block", color: "#bdbdbd", fontSize: 11.5 }}>{shownNotice.it}</span>}
          </span>
          {shownNotice.action && (
            <button
              type="button"
              onClick={() => noticeAction(shownNotice.action!)}
              style={{ background: "var(--yellow, #FFC800)", color: "#222", borderRadius: 8, padding: "6px 10px", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {shownNotice.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Close notice · Chiudi"
            onClick={closeNotice}
            style={{ padding: "4px 6px", color: "#bdbdbd" }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
