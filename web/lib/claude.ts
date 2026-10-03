// Server-only helpers shared by /api/plan and /api/passport: client, schemas, limits.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { PassportFields, Plan, Profile } from "./types";

export const PLAN_MODEL = "claude-sonnet-5-5";
export const VISION_MODEL = "claude-sonnet-5-5";

/** null when ANTHROPIC_API_KEY is missing: callers answer 503 {"error":"missing_keys"}. */
export function getClaude(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey, maxRetries: 1 }) : null;
}

export const jsonError = (error: string, status: number) => Response.json({ error }, { status });
export const missingKeys = () => jsonError("missing_keys", 503);

// ---- Rate limit -------------------------------------------------------------
// ponytail: in-memory sliding window per server instance; swap for KV/Upstash if the demo goes public.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  if (hits.size > 5_000) hits.clear();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  const limited = recent.length >= max;
  if (!limited) recent.push(now);
  hits.set(key, recent);
  return limited;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

/** Per-IP limit plus a daily global ceiling, so a missing auth layer cannot burn the API budget. */
export function overLimit(req: Request, route: string, perMinute: number, perDay: number): boolean {
  return rateLimited(`${route}:${clientIp(req)}`, perMinute, 60_000) || rateLimited(`${route}:all`, perDay, 86_400_000);
}

/** Reads a JSON body with a hard size cap; null when too big or not JSON. */
export async function readJson(req: Request, maxBytes: number): Promise<{ ok: true; body: unknown } | { ok: false; status: number; error: string }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { ok: false, status: 413, error: "too_big" };
  const text = await req.text();
  if (text.length > maxBytes) return { ok: false, status: 413, error: "too_big" };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
}

// ---- Schemas (mirror lib/types.ts; compile-time checks below) ----------------
const short = z.string().max(200);
const text = z.string().min(1).max(1_000);

export const ProfileSchema = z.object({
  name: short.optional(),
  situation: z.enum(["just_arrived", "coming_soon"]).optional(),
  eu: z.boolean().optional(),
  from: short.optional(),
  study: short.optional(),
  interests: z.array(short).max(20),
  worries: z.array(short).max(20),
  italianDeclared: z.number().min(0).max(10).optional(),
  italianVerified: z.number().min(0).max(10).optional(),
  lang: z.string().max(20).optional(),
});

export const PlanRequestSchema = z.object({ profile: ProfileSchema, goal: z.string().trim().min(1).max(200) });

const ServiceIdSchema = z.enum(["atm", "cie", "fascicolo", "020202", "biblioteche", "student_desk", "agenzia_entrate", "questura"]);
const FormIdSchema = z.enum(["aa48", "modulo1", "residenza", "tari", "atm"]);
const SourceUrl = z.string().regex(/^https:\/\/(www\.yesmilano\.it|studyandwork\.yesmilano\.it|www\.comune\.milano\.it)\/[A-Za-z0-9/%_-]+$/, "must be an allowlisted guide URL (YesMilano or Comune di Milano)");

export const StepSchema = z.object({
  id: z.string().min(1).max(40),
  title_en: text,
  title_it: text,
  why_for_you: text,
  bring: z.array(text).max(10),
  where: text,
  how_long: text,
  deadline: text,
  source_url: SourceUrl,
  service_id: ServiceIdSchema.optional(),
  fill_form: FormIdSchema.optional(),
  icon: z.enum(["room", "taxcode", "doctor", "tram", "study", "italian"]).optional(),
  place: z.object({ name: text, address: text, metro: text.optional(), source_url: z.string().url().max(500) }).optional(),
});

/** The show_plan tool input. Strict tool schemas drop min/max, so this is re-checked in code. */
export const PlanSchema = z.object({
  goal: text,
  headline: text,
  steps: z.array(StepSchema).min(3).max(5),
  services: z.array(z.object({ name: text, why_you: text, source_url: SourceUrl, service_id: ServiceIdSchema.optional() })).max(3),
  phrase: z.object({ phrase: text, meaning: text, when: text }),
  verify: text,
});

export const PassportFieldsSchema = z.object({
  surname: z.string(),
  given_names: z.string(),
  sex: z.enum(["F", "M", "X", ""]),
  date_of_birth: z.string().describe("DD/MM/YYYY"),
  place_of_birth: z.string(),
  nationality: z.string(),
  passport_number: z.string(),
  issue_date: z.string().describe("DD/MM/YYYY"),
  expiry_date: z.string().describe("DD/MM/YYYY"),
  issuing_country: z.string(),
});

// Compile-time guard: schemas and shared contracts must stay identical.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const _contractChecks: [
  Same<z.infer<typeof PlanSchema>, Plan>,
  Same<z.infer<typeof PassportFieldsSchema>, PassportFields>,
  Same<z.infer<typeof ProfileSchema>, Profile>,
] = [true, true, true];

// ---- Passport image ----------------------------------------------------------
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
type ImageType = "image/jpeg" | "image/png";

export function parseImageDataUrl(
  dataUrl: string,
): { ok: true; mediaType: ImageType; data: string } | { ok: false; status: 400 | 413; error: "unsupported_type" | "too_big" } {
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!m) return { ok: false, status: 400, error: "unsupported_type" };
  const mediaType = m[1] as ImageType;
  const data = m[2];
  const bytes = Math.floor((data.length * 3) / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) return { ok: false, status: 413, error: "too_big" };
  // Magic bytes must match the declared type (a renamed GIF or PDF is rejected).
  const head = Buffer.from(data.slice(0, 12), "base64");
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if ((mediaType === "image/jpeg" && !isJpeg) || (mediaType === "image/png" && !isPng)) {
    return { ok: false, status: 400, error: "unsupported_type" };
  }
  return { ok: true, mediaType, data };
}
