// City news for the voice guide: Comune di Milano press releases + YesMilano events.
// Allowlisted listing URLs only, sequential live fetch under one 4 s budget, 30 min memory cache,
// per-source fallback to the dated snapshot (data/news-snapshot.json).
import snapshot from "../data/news-snapshot.json";

export type NewsSource = "comune" | "yesmilano";
export type NewsItem = { title: string; date: string; summary: string; url: string; source: NewsSource };
export type News = { items: NewsItem[]; fetched_at: string; fallback?: boolean };

export const NEWS_HOSTS = ["www.comune.milano.it", "www.yesmilano.it", "studyandwork.yesmilano.it"];
const LISTINGS: { source: NewsSource; url: string; parse: (html: string, base: string) => NewsItem[] }[] = [
  { source: "comune", url: "https://www.comune.milano.it/notizie/comunicati-stampa?sort=displayDate-&delta=30", parse: (h) => parseComune(h) },
  { source: "yesmilano", url: "https://studyandwork.yesmilano.it/en/whats-on/all-events", parse: (h, b) => parseYesMilano(h, b) },
  { source: "yesmilano", url: "https://www.yesmilano.it/en/whats-on/all-events", parse: (h, b) => parseYesMilano(h, b) },
];

const TIMEOUT_MS = 4_000;
const TTL_MS = 30 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const SNAPSHOT = snapshot as News;
const SNAP_SUMMARY = new Map(SNAPSHOT.items.map((i) => [i.url, i.summary]));

// Topic groups, English + Italian, matched on accent-free lowercase words.
export const TOPICS: Record<string, string[]> = {
  documents: ["residenza", "residence", "anagrafe", "registry", "cie", "carta d'identita", "identity", "id card", "codice fiscale", "tax code", "permesso", "permit", "questura", "documents", "documenti"],
  tax: ["tari", "rifiuti", "waste", "tributi", "tax", "taxes", "tasse", "imu"],
  transport: ["atm", "metro", "tram", "bus", "mobilita", "mobility", "trasporti", "transport", "bike", "bici", "cycling", "ciclismo", "sharing", "pedonale", "traffic", "traffico", "sciopero", "strike", "m4", "m5"],
  study: ["student", "studenti", "studenteschi", "universita", "university", "scholarship", "borsa di studio", "borse", "welcome day", "welcome", "scuola", "school", "campus", "talent"],
  italian: ["italian course", "corso di italiano", "corsi di italiano", "italiano", "language", "lingua"],
  housing: ["casa", "housing", "alloggi", "affitto", "rent", "room", "edilizia residenziale"],
  events: ["event", "events", "eventi", "festival", "concert", "concerti", "mostra", "mostre", "exhibition", "museum", "musei", "weekend", "sport", "marathon", "maratona", "week"],
  culture: ["cultura", "culture", "biblioteca", "biblioteche", "library", "libraries", "teatro", "theatre"],
};
const NEWCOMER = [...TOPICS.documents, ...TOPICS.tax, ...TOPICS.transport, ...TOPICS.study, ...TOPICS.italian, ...TOPICS.housing];

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’`]/g, "'").toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Short keywords match whole words (cie ≠ scienza), longer ones match word starts (student → students). */
const hits = (text: string, kws: string[]) =>
  kws.some((k) => new RegExp(`(^|[^a-z0-9])${esc(k)}${k.length <= 4 ? "($|[^a-z0-9])" : ""}`).test(text));

/** Keywords for a free-text topic: whole groups when a word hits a group, else the raw words. */
export function topicKeywords(topic: string): string[] {
  const t = norm(topic);
  const groups = Object.entries(TOPICS).filter(([name, kws]) => hits(t, [name, ...kws])).flatMap(([, kws]) => kws);
  return groups.length ? groups : t.split(/[^a-z0-9']+/).filter((w) => w.length >= 3);
}

export function filterByTopic(items: NewsItem[], topic?: string): NewsItem[] {
  const kws = topic?.trim() ? topicKeywords(topic) : [];
  return kws.length ? items.filter((i) => hits(norm(`${i.title} ${i.summary}`), kws)) : items;
}

/** Newcomer-relevant first, then newest first. */
export function rank(items: NewsItem[]): NewsItem[] {
  const score = (i: NewsItem) => (hits(norm(`${i.title} ${i.summary}`), NEWCOMER) ? 1 : 0);
  return [...items].sort((a, b) => score(b) - score(a) || b.date.localeCompare(a.date));
}

/** The only network door: https + allowlisted host, else null without fetching. */
export async function fetchAllowed(url: string, signal?: AbortSignal): Promise<string | null> {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:" || !NEWS_HOSTS.includes(u.hostname) || u.username || u.port) return null;
  const res = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en,it" }, signal, cache: "no-store" });
  if (!res.ok) throw new Error(`status_${res.status}`);
  return res.text();
}

// ---- parsing ----
const decode = (s: string) =>
  s.replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();

/** Item links must stay on the allowlisted hosts (no link-out from scraped HTML). */
function safeUrl(href: string, base: string): string | null {
  try {
    const u = new URL(decode(href), base);
    return u.protocol === "https:" && NEWS_HOSTS.includes(u.hostname) ? u.href : null;
  } catch { return null; }
}

/** comune.milano.it press-release cards: <span class="data">DD/MM/YYYY</span> ... <a href title>. */
export function parseComune(html: string): NewsItem[] {
  const out: NewsItem[] = [];
  const re = /<span class="data">(\d{2})\/(\d{2})\/(\d{4})<\/span>\s*<\/div>\s*<h3 class="card-title">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const url = safeUrl(m[4], "https://www.comune.milano.it/");
    const title = decode(m[5]);
    if (url && title) out.push({ title, date: `${m[3]}-${m[2]}-${m[1]}`, summary: SNAP_SUMMARY.get(url) ?? "", url, source: "comune" });
  }
  return out;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** yesmilano.it event cards: day + month (no year), h4 title, subtitle used as summary. */
export function parseYesMilano(html: string, base: string, year = new Date().getFullYear()): NewsItem[] {
  const out: NewsItem[] = [];
  const re = /<a href="([^"]*\/whats-on\/all-events\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const url = safeUrl(m[1], base);
    const title = decode(m[2].match(/<h4>([\s\S]*?)<\/h4>/)?.[1] ?? "");
    const when = decode(m[2].match(/data--from">([\s\S]*?)<\/div>/)?.[1] ?? "").toLowerCase().match(/(\d{1,2})\s+([a-z]+)/);
    const month = when ? MONTHS.indexOf(when[2]) + 1 : 0;
    if (!url || !title || !month) continue;
    // ponytail: cards carry no year; take it from the title ("... 2027") else the current year.
    const y = title.match(/\b(20\d\d)\b/)?.[1] ?? String(year);
    const summary = decode(m[2].match(/class="sottotitolo">([\s\S]*?)<\/p>/)?.[1] ?? "");
    out.push({ title, date: `${y}-${String(month).padStart(2, "0")}-${when![1].padStart(2, "0")}`, summary, url, source: "yesmilano" });
  }
  return out;
}

// ---- live fetch + cache ----
// ponytail: per-instance memory cache, enough for a demo; move to KV if instances multiply.
let cache: { news: News; at: number } | null = null;

async function fetchAll(): Promise<News> {
  const signal = AbortSignal.timeout(TIMEOUT_MS); // one budget for all listings, fetched one after the other
  const items: NewsItem[] = [];
  let fallback = false;
  for (const l of LISTINGS) {
    try {
      const html = await fetchAllowed(l.url, signal);
      const got = html ? l.parse(html, l.url) : [];
      if (!got.length) throw new Error("empty_listing");
      items.push(...got);
    } catch {
      fallback = true;
      items.push(...SNAPSHOT.items.filter((i) => i.source === l.source && new URL(i.url).hostname === new URL(l.url).hostname));
    }
  }
  const unique = [...new Map(items.map((i) => [i.url, i])).values()];
  return { items: unique, fetched_at: fallback ? SNAPSHOT.fetched_at : new Date().toISOString().slice(0, 10), ...(fallback && { fallback }) };
}

export async function getNews({ topic, limit = 5 }: { topic?: string; limit?: number } = {}): Promise<News> {
  if (!cache || Date.now() - cache.at > TTL_MS) cache = { news: await fetchAll(), at: Date.now() };
  const n = Math.min(20, Math.max(1, Math.round(limit) || 5));
  return { ...cache.news, items: rank(filterByTopic(cache.news.items, topic)).slice(0, n) };
}

/** Test hook: forget the cache. */
export const _resetNewsCache = () => { cache = null; };
