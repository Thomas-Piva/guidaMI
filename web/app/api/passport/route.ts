// POST /api/passport {image: data URL, jpeg/png, max 5 MB} -> {fields: PassportFields} | {error}
// The image is sent to Claude and dropped: never stored, never logged.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  MAX_IMAGE_BYTES,
  PassportFieldsSchema,
  VISION_MODEL,
  getClaude,
  jsonError,
  missingKeys,
  overLimit,
  parseImageDataUrl,
  readJson,
} from "../../../lib/claude";

export const maxDuration = 30;

const BodySchema = z.object({ image: z.string() });
const FORMAT = zodOutputFormat(PassportFieldsSchema);

const PROMPT = `This is a photo of the data page of a passport. The student uses it to pre-fill Italian forms (AA4/8 tax code form, residence declaration, TARI).
Read the printed fields and the MRZ (the two lines at the bottom) and use the MRZ to double-check spelling and dates.
- Dates as DD/MM/YYYY.
- sex: "F", "M", "X", or "" if unreadable.
- nationality and issuing_country as English country names (for example "Morocco").
- surname and given_names exactly as printed, in Latin letters.
- If a field is not visible or not readable, return "" for it. Never guess.
- If the image is not a passport or ID data page, return "" for every field.`;

export async function POST(req: Request) {
  if (overLimit(req, "passport", 5, 200)) return jsonError("rate_limited", 429);
  // base64 inflates by 4/3, plus the data URL prefix and JSON wrapper.
  const read = await readJson(req, Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1_000);
  if (!read.ok) return jsonError(read.error, read.status);
  const body = BodySchema.safeParse(read.body);
  if (!body.success) return jsonError("invalid_request", 400);
  const image = parseImageDataUrl(body.data.image);
  if (!image.ok) return jsonError(image.error, image.status);
  const claude = getClaude();
  if (!claude) return missingKeys();

  try {
    const msg = await claude.messages.parse(
      {
        model: VISION_MODEL,
        max_tokens: 4_000,
        output_config: { effort: "low", format: FORMAT },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      },
      { signal: req.signal },
    );
    const fields = msg.stop_reason === "refusal" ? null : msg.parsed_output;
    if (!fields) return jsonError("unreadable", 422);
    if (Object.values(fields).every((v) => v === "")) return jsonError("not_a_passport", 422);
    return Response.json({ fields }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("passport_failed", err instanceof Anthropic.APIError ? err.status : (err as Error).name);
    if (err instanceof Anthropic.RateLimitError) return jsonError("busy", 429);
    if (!(err instanceof Anthropic.APIError) && err instanceof Anthropic.AnthropicError) return jsonError("unreadable", 422); // output failed schema parse
    return jsonError("vision_failed", 502);
  }
}
