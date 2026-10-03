// GET /api/news?topic=&limit= -> {items:[{title,date,summary,url,source}], fetched_at, fallback?} | 429/400 {error}
import { getNews } from "../../../lib/news";
import { jsonError, overLimit } from "../../../lib/claude";

export async function GET(req: Request) {
  if (overLimit(req, "news", 30, 5_000)) return jsonError("rate_limited", 429);
  const q = new URL(req.url).searchParams;
  const topic = q.get("topic")?.trim() || undefined;
  const limit = Number(q.get("limit") ?? 5);
  if ((topic && topic.length > 100) || !Number.isInteger(limit) || limit < 1 || limit > 20) return jsonError("bad_request", 400);
  return Response.json(await getNews({ topic, limit }), { headers: { "Cache-Control": "no-store" } });
}
