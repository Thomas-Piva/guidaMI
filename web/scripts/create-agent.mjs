#!/usr/bin/env node
// Create or update the Milano Evolution voice guide on ElevenLabs (idempotent).
// Usage: ELEVENLABS_API_KEY=... node web/scripts/create-agent.mjs
// The key can also live in ../.env or .env.local. Writes ELEVENLABS_AGENT_ID into both files.
// Client tools are workspace tools matched by name (inline prompt.tools is deprecated in favour of tool_ids).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILES = [join(WEB, "..", ".env"), join(WEB, ".env.local")];
const API = "https://api.elevenlabs.io/v1/convai";
const AGENT_NAME = "Milano Evolution Guide";
const FIRST_MESSAGE = "Ciao! Benvenuta a Milano. Sei appena arrivata?";
const PRESETS = {
  en: "Hi! Welcome to Milan. Did you just arrive?",
  zh: "你好！欢迎来到米兰。你刚到吗？",
  es: "¡Hola! Bienvenida a Milán. ¿Acabas de llegar?",
  ar: "مرحبا! أهلا بك في ميلانو. هل وصلت للتو؟",
};
const SCREENS = ["welcome", "about", "interests", "italian", "need", "reading", "plan", "step", "passport", "forms", "home", "previews", "profile"];
const SERVICES = ["atm", "cie", "fascicolo", "020202", "biblioteche", "student_desk", "agenzia_entrate", "questura"];

function readEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const fileEnv = Object.assign({}, ...ENV_FILES.map(readEnv).reverse()); // ../.env wins over .env.local
const env = (k) => process.env[k] || fileEnv[k];

const KEY = env("ELEVENLABS_API_KEY");
if (!KEY) {
  console.error("ELEVENLABS_API_KEY missing (env, ../.env or .env.local). Nothing done.");
  process.exit(1);
}
const VOICE_ID = env("ELEVENLABS_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL"; // premade voice, multilingual with flash v2.5

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 800)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

const str = (description, extra = {}) => ({ type: "string", description, ...extra });
const int = (description) => ({ type: "integer", description });
const bool = (description) => ({ type: "boolean", description });
const params = (properties, required = []) => ({ type: "object", properties, required });

// Arrays are sent as comma separated strings: simplest for the LLM, parsed back in lib/voice.ts.
const TOOLS = [
  {
    name: "update_profile",
    description: "Save facts about the person as soon as you learn them. Send only the fields you just learned.",
    parameters: params({
      name: str("First name, e.g. Nour"),
      situation: str("just_arrived or coming_soon", { enum: ["just_arrived", "coming_soon"] }),
      eu: bool("true if EU citizen, false otherwise"),
      from: str("Country of origin in English, e.g. Lebanon"),
      study: str("What they study, e.g. Design"),
      interests: str("Comma separated interests, e.g. design, basketball, libraries"),
      worries: str("Comma separated worries, e.g. papers, finding a room"),
      lang: str("Two letter code of the language you are speaking with them, e.g. en"),
    }),
  },
  {
    name: "set_italian_level",
    description: "Italian check: send declared first, then one call per check, then verified.",
    parameters: params({
      declared: int("Level the person declared, 0 to 10"),
      verified: int("Level you judged after the 3 checks, 0 to 10"),
      check_index: int("Which check was just answered: 1, 2 or 3"),
      check_ok: bool("true if that check was answered well enough"),
    }),
  },
  {
    name: "set_goal",
    description: "Save what the person needs, as a short English label.",
    parameters: params({ goal: str("Short English label, e.g. Rent a room") }, ["goal"]),
  },
  {
    name: "build_plan",
    description: "Build the personal plan from the official yesmilano.it guides. Call only after an explicit yes. Returns a 2-3 line summary to read aloud.",
    expects_response: true,
    response_timeout_secs: 120,
    parameters: params({ goal: str("Same short English label used in set_goal, e.g. Rent a room") }, ["goal"]),
  },
  {
    name: "show_screen",
    description: "Move the app to a screen.",
    parameters: params({ screen: str(`One of: ${SCREENS.join(", ")}`, { enum: SCREENS }) }, ["screen"]),
  },
  {
    name: "request_passport",
    description: "Open the passport scan on screen, to fill the forms. Never ask passport data by voice.",
  },
  {
    name: "open_service",
    description: "Open a city service card on screen.",
    parameters: params({ service: str(`One of: ${SERVICES.join(", ")}`, { enum: SERVICES }) }, ["service"]),
  },
  {
    name: "get_news",
    description: "Current City of Milan news and events from the official sources (Comune di Milano, YesMilano). Returns up to 3 items with date and source to read out.",
    expects_response: true,
    response_timeout_secs: 15,
    parameters: params({ topic: str("What the person asks about, e.g. events, transport, residenza, scholarships. Empty for the top headlines.") }),
  },
].map((t) => ({ type: "client", expects_response: false, pre_tool_speech: "auto", ...t }));

async function upsertTools() {
  const { tools = [] } = await api("GET", "/tools");
  const ids = [];
  for (const tool_config of TOOLS) {
    const found = tools.find((t) => t.tool_config?.name === tool_config.name && t.tool_config?.type === "client");
    const res = found
      ? await api("PATCH", `/tools/${found.id}`, { tool_config })
      : await api("POST", "/tools", { tool_config });
    console.log(`${found ? "updated" : "created"} tool ${tool_config.name}`);
    ids.push(res.id ?? found.id);
  }
  return ids;
}

function agentBody(tool_ids) {
  const prompt = readFileSync(join(WEB, "lib", "agent-prompt.md"), "utf8");
  return {
    name: AGENT_NAME,
    conversation_config: {
      agent: {
        first_message: FIRST_MESSAGE,
        language: "it",
        prompt: {
          prompt,
          llm: "claude-haiku-4-5",
          temperature: 0.4,
          tool_ids,
          built_in_tools: {
            language_detection: { type: "system", name: "language_detection", description: "", params: { system_tool_type: "language_detection" } },
          },
        },
      },
      tts: { model_id: "eleven_flash_v2_5", voice_id: VOICE_ID },
      conversation: { max_duration_seconds: 600 }, // spending cap per session (10 min)
      language_presets: Object.fromEntries(
        Object.entries(PRESETS).map(([lang, first_message]) => [lang, { overrides: { agent: { first_message, language: lang } } }]),
      ),
    },
    // lib/voice.ts uses textOnly (voice off) and an empty first message when it restarts a session.
    // Private agent: a session needs the signed URL from /api/signed-url (rate limited), the agent_id alone is not enough.
    platform_settings: {
      auth: { enable_auth: true },
      overrides: { conversation_config_override: { conversation: { text_only: true }, agent: { first_message: true } } },
    },
  };
}

async function findAgentId() {
  const known = env("ELEVENLABS_AGENT_ID");
  if (known) {
    try {
      await api("GET", `/agents/${known}`);
      return known;
    } catch (e) {
      if (e.status !== 404) throw e;
      console.log(`agent ${known} not found, looking up by name`);
    }
  }
  const { agents = [] } = await api("GET", `/agents?search=${encodeURIComponent(AGENT_NAME)}&page_size=100`);
  return agents.find((a) => a.name === AGENT_NAME)?.agent_id;
}

function writeAgentId(id) {
  for (const file of ENV_FILES) {
    const old = existsSync(file) ? readFileSync(file, "utf8") : "";
    const line = `ELEVENLABS_AGENT_ID=${id}`;
    const next = /^ELEVENLABS_AGENT_ID=.*$/m.test(old)
      ? old.replace(/^ELEVENLABS_AGENT_ID=.*$/m, line)
      : old + (old && !old.endsWith("\n") ? "\n" : "") + line + "\n";
    writeFileSync(file, next);
    console.log(`wrote ELEVENLABS_AGENT_ID to ${file}`);
  }
}

try {
  const toolIds = await upsertTools();
  const body = agentBody(toolIds);
  let id = await findAgentId();
  if (id) {
    await api("PATCH", `/agents/${id}`, body);
    console.log(`updated agent ${id}`);
  } else {
    id = (await api("POST", "/agents/create", body)).agent_id;
    console.log(`created agent ${id}`);
  }
  writeAgentId(id);
} catch (e) {
  console.error(String(e.message ?? e));
  process.exit(1);
}
