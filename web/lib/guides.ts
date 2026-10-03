// YesMilano guides: allowlisted slugs only, live fetch (4 s, 1 h cache), dated snapshot fallback.
import guides from "../data/guides.json";
import snapshot from "../data/guides-snapshot.json";

export type GuideMeta = { slug: string; title: string; url: string; section: string };
export type Guide = GuideMeta & { text: string; fallback: boolean; fetched_at?: string };

// Allowlist = guides.json, and only on these hosts (a bad data edit cannot turn readGuide into an open fetcher).
export const GUIDE_HOSTS = ["www.yesmilano.it", "studyandwork.yesmilano.it", "www.comune.milano.it"];
export const GUIDES: GuideMeta[] = guides.filter((g) => GUIDE_HOSTS.includes(new URL(g.url).hostname));
export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
const BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));
const SNAPSHOT = snapshot.guides as Record<string, string>;

const TIMEOUT_MS = 4_000;
const TTL_MS = 60 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

// ponytail: per-instance memory cache, enough for a demo; move to KV if instances multiply.
const cache = new Map<string, { text: string; at: number }>();

export function guideMeta(slug: string): GuideMeta | undefined {
  return BY_SLUG.get(slug);
}

/** Planner prompt list, grouped by section: "## study\n- slug: title". */
export function guidesForPrompt(): string {
  const bySection = new Map<string, string[]>();
  for (const g of GUIDES) bySection.set(g.section, [...(bySection.get(g.section) ?? []), `- ${g.slug}: ${g.title}`]);
  return [...bySection].map(([section, lines]) => `## ${section}\n${lines.join("\n")}`).join("\n");
}

export async function readGuide(slug: string): Promise<Guide> {
  const meta = BY_SLUG.get(slug);
  if (!meta) throw new Error("unknown_guide");

  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return { ...meta, text: hit.text, fallback: false };

  try {
    // meta.url comes from the allowlist file, never from the caller.
    const res = await fetch(meta.url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`status_${res.status}`);
    const text = extractText(await res.text());
    if (text.length < 300) throw new Error("empty_page");
    cache.set(slug, { text, at: Date.now() });
    return { ...meta, text, fallback: false };
  } catch {
    return { ...meta, text: SNAPSHOT[slug] ?? "", fallback: true, fetched_at: snapshot.fetched_at };
  }
}

// extract:start (the snapshot generator reuses this block)
export function extractText(html: string, max = 6_000): string {
  const start = html.search(/<article\b/i);
  const end = html.lastIndexOf("</article>");
  const h1 = html.search(/<h1\b/i);
  const mainEnd = html.lastIndexOf("</main>");
  // YesMilano: the <article> body. comune.milano.it: no body <article>, so from the <h1> to </main>.
  let t =
    start >= 0 && end > start && end > h1
      ? html.slice(start, end)
      : h1 >= 0
        ? html.slice(h1, mainEnd > h1 ? mainEnd : undefined)
        : html;
  t = t
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|noscript|form|button|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|li|h[1-6]|\/p|\/div|\/li|\/h[1-6]|\/tr|\/ul|\/ol)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n[\s]*/g, "\n")
    .trim();
  return t.length > max ? t.slice(0, max) + " [...]" : t;
}
// extract:end
