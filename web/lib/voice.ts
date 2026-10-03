// Voice guide: ElevenLabs agent session + client tools, exposed as GuideApi (see types.ts).
// Uses the plain Conversation class from @elevenlabs/react (re-exported from @elevenlabs/client),
// so the UI does not need a <ConversationProvider>.
import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/react";
import type { GuideApi, GuideHandlers, GuideLine, Profile, Screen, ServiceId } from "./types";

type Params = Record<string, unknown>;

const SCREENS: readonly Screen[] = ["welcome", "about", "interests", "italian", "need", "reading", "plan", "step", "passport", "forms", "home", "previews", "profile"];
const SERVICES: readonly ServiceId[] = ["atm", "cie", "fascicolo", "020202", "biblioteche", "student_desk", "agenzia_entrate", "questura"];

const MSG_KEYS = "The voice guide is not set up yet (missing API keys). You can keep using the app by touch. · La guida vocale non è ancora attiva.";
const MSG_DOWN = "The voice guide is not reachable right now. You can keep using the app by touch. · La guida vocale non risponde.";
const MSG_OFFLINE = "The guide is not connected. · La guida non è collegata.";

// ---- parsing of tool parameters (the LLM may send numbers/booleans as strings, lists as "a, b") ----
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const flag = (v: unknown) => (v === true || v === "true" ? true : v === false || v === "false" ? false : undefined);
const list = (v: unknown) =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean)
  : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean)
  : undefined;
const level = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(10, Math.max(0, Math.round(n))) : undefined;
};

export function toProfilePatch(p: Params): Partial<Profile> {
  const situation = p.situation === "just_arrived" || p.situation === "coming_soon" ? p.situation : undefined;
  const patch: Partial<Profile> = {
    name: text(p.name), situation, eu: flag(p.eu), from: text(p.from), study: text(p.study),
    interests: list(p.interests), worries: list(p.worries), lang: text(p.lang)?.toLowerCase(),
  };
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<Profile>;
}

/** check_index is 1-3 for the agent, 0-2 for the app (store.italianChecks). */
export function toItalian(p: Params): Parameters<GuideHandlers["onItalian"]> {
  const idx = level(p.check_index);
  const ok = flag(p.check_ok);
  const check = idx !== undefined && idx >= 1 && idx <= 3 && ok !== undefined ? { index: idx - 1, ok } : undefined;
  return [level(p.declared), level(p.verified), check];
}

export function buildClientTools(h: () => GuideHandlers) {
  return {
    update_profile: (p: Params) => (h().onProfile(toProfilePatch(p)), "saved"),
    set_italian_level: (p: Params) => (h().onItalian(...toItalian(p)), "saved"),
    set_goal: (p: Params) => {
      const goal = text(p.goal);
      if (!goal) return "missing goal";
      h().onGoal(goal);
      return "saved";
    },
    build_plan: async (p: Params) => {
      const goal = text(p.goal);
      if (!goal) throw new Error("missing goal");
      return h().onBuildPlan(goal); // a rejection is sent back to the agent as is_error
    },
    show_screen: (p: Params) => {
      const s = SCREENS.find((x) => x === p.screen);
      if (!s) return `unknown screen, use one of: ${SCREENS.join(", ")}`;
      h().onScreen(s);
      return "shown";
    },
    request_passport: () => (h().onPassport(), "passport scan opened on screen"),
    open_service: (p: Params) => {
      const s = SERVICES.find((x) => x === p.service);
      if (!s) return `unknown service, use one of: ${SERVICES.join(", ")}`;
      h().onOpenService(s);
      return "opened";
    },
    get_news: async (p: Params) => {
      const items = await fetchNews(text(p.topic), 3);
      if (!items) return "City news are not reachable right now. Say so, do not invent news.";
      if (!items.length) return "No current City news on that topic in the official sources. Say so, do not invent news.";
      return `Latest from the official sources (read only these, cite the source):\n${items
        .map((i) => `- ${i.title} (${i.date})${i.summary ? `: ${i.summary}` : ""} Source: ${NEWS_SOURCE[i.source]}, ${i.url}`)
        .join("\n")}`;
    },
  };
}

// ---- City news (GET /api/news, lib/news.ts) ----
type NewsItem = { title: string; date: string; summary: string; url: string; source: "comune" | "yesmilano" };
const NEWS_SOURCE = { comune: "Comune di Milano", yesmilano: "YesMilano" } as const;

/** null = not reachable; never throws. */
async function fetchNews(topic: string | undefined, limit: number): Promise<NewsItem[] | null> {
  try {
    const q = new URLSearchParams({ limit: String(limit), ...(topic && { topic: topic.slice(0, 100) }) });
    const res = await fetch(`/api/news?${q}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: NewsItem[] };
    return Array.isArray(body.items) ? body.items : null;
  } catch {
    return null;
  }
}

function profileContext(p: Profile): string | undefined {
  const known = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length)));
  return Object.keys(known).length ? `Profile already known from the app, do not ask again: ${JSON.stringify(known)}` : undefined;
}

export function useGuide(handlers: GuideHandlers): GuideApi {
  const handlersRef = useRef(handlers);
  useEffect(() => { handlersRef.current = handlers; });

  const conv = useRef<Conversation | null>(null);
  const gen = useRef(0); // bumps on every start/stop: callbacks of an old session are ignored
  const profileRef = useRef<Profile>({ interests: [], worries: [] });
  const linesRef = useRef<GuideLine[]>([]);
  const lastTyped = useRef<string | null>(null);

  const [status, setStatus] = useState<GuideApi["status"]>("idle");
  const [error, setError] = useState<string>();
  const [voice, setVoiceFlag] = useState(true);
  const voiceRef = useRef(true); // same flag, readable from async code
  const setVoiceState = useCallback((on: boolean) => { voiceRef.current = on; setVoiceFlag(on); }, []);
  const [mode, setMode] = useState<"speaking" | "listening">("listening");
  const [lines, setLinesState] = useState<GuideLine[]>([]);

  const setLines = useCallback((next: GuideLine[]) => { linesRef.current = next; setLinesState(next); }, []);
  const push = useCallback((line: GuideLine) => setLines([...linesRef.current, line]), [setLines]);

  /** Opens a session. resume = keep the lines, no greeting, give the agent the transcript so far. */
  const open = useCallback(async (wantVoice: boolean, resume: boolean): Promise<void> => {
    const my = ++gen.current;
    const live = () => gen.current === my;
    const fail = (msg: string) => { if (!live()) return; setError(msg); setStatus("error"); };
    setStatus("connecting");
    setError(undefined);

    let session: Conversation | undefined;
    for (let v = wantVoice; !session; v = false) {
      let signedUrl: string;
      try {
        const res = await fetch("/api/signed-url", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as { signedUrl?: string; error?: string };
        if (!res.ok || !body.signedUrl) return fail(body.error === "missing_keys" ? MSG_KEYS : MSG_DOWN);
        signedUrl = body.signedUrl;
      } catch {
        return fail(MSG_DOWN);
      }
      if (!live()) return;

      const overrides = !v || resume
        ? { ...(!v && { conversation: { textOnly: true } }), ...(resume && { agent: { firstMessage: "" } }) }
        : undefined;
      try {
        session = await Conversation.startSession({
          signedUrl,
          textOnly: !v,
          overrides,
          clientTools: buildClientTools(() => handlersRef.current),
          onMessage: ({ role, message }) => {
            if (!live() || !message) return;
            if (role === "user" && message === lastTyped.current) { lastTyped.current = null; return; } // echo of sendText
            push({ who: role === "agent" ? "guide" : "you", text: message });
          },
          onModeChange: ({ mode }) => { if (live()) setMode(mode); },
          onStatusChange: ({ status }) => {
            if (!live()) return;
            if (status === "connecting") setStatus("connecting");
            else if (status === "connected") setStatus("connected");
            else if (status === "disconnected") setStatus((s) => (s === "error" ? s : "idle"));
          },
          onDisconnect: (d) => {
            if (!live()) return;
            conv.current = null;
            setMode("listening");
            if (d.reason === "error") fail(d.message || MSG_DOWN);
          },
          onError: (message, context) => console.error("[guide]", message, context ?? ""), // fatal ones arrive via onDisconnect
        });
      } catch (e) {
        if (!live()) return;
        if (!v) { console.error("[guide] session failed", e); return fail(MSG_DOWN); }
        // Mic denied or audio unavailable: keep going by text.
        console.warn("[guide] voice session failed, falling back to text", e);
        setVoiceState(false);
      }
    }
    if (!live()) { session.endSession().catch(() => {}); return; }
    conv.current = session;
    if (session.type === "voice" && !voiceRef.current) { session.setMicMuted(true); session.setVolume({ volume: 0 }); } // X pressed while connecting
    setStatus("connected");

    const ctx = profileContext(profileRef.current);
    if (ctx) session.sendContextualUpdate(ctx);
    if (resume && linesRef.current.length) {
      const transcript = linesRef.current.slice(-12).map((l) => `${l.who === "guide" ? "Guide" : "User"}: ${l.text}`).join("\n");
      session.sendContextualUpdate(`Same conversation, reconnected. Continue from here, do not greet again.\n${transcript}`);
    }
    void fetchNews(undefined, 5).then((items) => {
      if (!items?.length || !live() || conv.current !== session) return;
      session.sendContextualUpdate(
        `Today's City news (use only if relevant, cite the source):\n${items.map((i) => `- ${i.title} (${i.date}) ${i.url}`).join("\n")}`,
      );
    });
  }, [push, setVoiceState]);

  const close = useCallback(async () => {
    gen.current++;
    const c = conv.current;
    conv.current = null;
    setMode("listening");
    if (c) await c.endSession().catch((e) => console.error("[guide] endSession", e));
  }, []);

  const start = useCallback<GuideApi["start"]>(async ({ voice: wantVoice, profile }) => {
    await close();
    profileRef.current = profile;
    setLines([]);
    setVoiceState(wantVoice);
    await open(wantVoice, false);
  }, [close, open, setLines, setVoiceState]);

  const stop = useCallback<GuideApi["stop"]>(async () => {
    await close();
    setStatus("idle");
  }, [close]);

  const setVoice = useCallback<GuideApi["setVoice"]>((on) => {
    setVoiceState(on);
    const c = conv.current;
    if (!c) return;
    if (c.type === "voice") {
      // X button: same session, audio off both ways, text keeps working.
      c.setMicMuted(!on);
      c.setVolume({ volume: on ? 1 : 0 });
    } else if (on) {
      // A text-only session cannot get audio: reopen with voice, keeping the captions.
      void close().then(() => open(true, true));
    }
  }, [close, open, setVoiceState]);

  const sendText = useCallback<GuideApi["sendText"]>((t) => {
    const msg = t.trim();
    if (!msg) return;
    const c = conv.current;
    if (!c) { setError(MSG_OFFLINE); return; }
    lastTyped.current = msg;
    c.sendUserMessage(msg);
    push({ who: "you", text: msg });
  }, [push]);

  const sendContext = useCallback<GuideApi["sendContext"]>((t) => {
    if (t.trim()) conv.current?.sendContextualUpdate(t);
  }, []);

  useEffect(() => () => { void close(); }, [close]);

  return {
    status,
    error,
    voice,
    speaking: status === "connected" && voice && mode === "speaking",
    lines,
    start,
    stop,
    setVoice,
    sendText,
    sendContext,
  };
}
