// App state: one tiny external store, persisted in localStorage, read with useAppState().
// No personal data leaves the browser; clearAll() wipes it.
import { useSyncExternalStore } from "react";
import type { Goal, Plan, Profile, Screen } from "./types";

export type AppState = {
  profile: Profile;
  goals: Goal[];
  activeGoalId?: string;
  screen: Screen;
  voice: boolean;
  // Local addition (not in types.ts): results of the 3 Italian checks, index 0-2.
  italianChecks: (boolean | null)[];
};

const KEY = "milano-evolution:v1";

export const initialState: AppState = {
  profile: { interests: [], worries: [] },
  goals: [],
  screen: "welcome",
  voice: true,
  italianChecks: [null, null, null],
};

let state = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!saved || typeof saved !== "object") return;
    state = {
      ...initialState,
      ...saved,
      profile: { ...initialState.profile, ...saved.profile },
      goals: Array.isArray(saved.goals) ? saved.goals : [],
      italianChecks: Array.isArray(saved.italianChecks) ? saved.italianChecks : initialState.italianChecks,
    };
    if (!Array.isArray(state.profile.interests)) state.profile.interests = [];
    if (!Array.isArray(state.profile.worries)) state.profile.worries = [];
  } catch {
    // corrupted or blocked storage: start fresh, the app works without persistence
  }
}

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private mode or quota: keep in memory only
  }
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  load();
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  load();
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** React hook: the whole app state. Server render and first hydration see initialState. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, () => initialState);
}

// ---- actions (GuideHandlers map 1:1 onto these) ----

/** update_profile: shallow merge; arrays (interests, worries) are replaced. */
export const updateProfile = (patch: Partial<Profile>) =>
  setState((s) => ({ profile: { ...s.profile, ...patch } }));

/** set_italian_level from the voice tool. */
export const setItalian = (declared?: number, verified?: number, check?: { index: number; ok: boolean }) =>
  setState((s) => {
    const italianChecks = [...s.italianChecks];
    if (check && check.index >= 0 && check.index < 3) italianChecks[check.index] = check.ok;
    return {
      italianChecks,
      profile: {
        ...s.profile,
        ...(declared !== undefined && { italianDeclared: declared }),
        ...(verified !== undefined && { italianVerified: verified }),
      },
    };
  });

/** Touch on the slider: a new declared level restarts the check. */
export const declareItalian = (n: number) =>
  setState((s) => ({
    italianChecks: [null, null, null],
    profile: { ...s.profile, italianDeclared: n, italianVerified: undefined },
  }));

export const setScreen = (screen: Screen) => setState({ screen });
export const setVoice = (voice: boolean) => setState({ voice });

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "goal";

/** set_goal / need card: creates the goal if new and makes it active. Returns its id. */
export function setGoal(label: string): string {
  const id = slug(label);
  setState((s) => ({
    activeGoalId: id,
    goals: s.goals.some((g) => g.id === id) ? s.goals : [...s.goals, { id, label, done: [] }],
  }));
  return id;
}

export const setActiveGoal = (activeGoalId: string) => setState({ activeGoalId });

export const setPlan = (goalId: string, plan: Plan) =>
  setState((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? { ...g, plan } : g)) }));

export const toggleDone = (goalId: string, stepId: string) =>
  setState((s) => ({
    goals: s.goals.map((g) =>
      g.id !== goalId ? g : { ...g, done: g.done.includes(stepId) ? g.done.filter((d) => d !== stepId) : [...g.done, stepId] },
    ),
  }));

/** «Delete everything»: wipes storage and resets to the welcome screen. */
export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  state = initialState;
  listeners.forEach((l) => l());
}

export const activeGoal = (s: AppState) => s.goals.find((g) => g.id === s.activeGoalId);
