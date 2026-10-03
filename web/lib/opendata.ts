// City of Milan open data (dati.comune.milano.it, CKAN) + official procedure facts, served as Claude tools.
// KB is a dated local snapshot (data/opendata-kb.json, fetched 2026-10-03): no network at request time.
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import kb from "../data/opendata-kb.json";
import comune from "../data/comune-procedures.json";

export type Place = {
  kind: string;
  name: string | null;
  address: string | null;
  municipio: number | null;
  lat: number | null;
  lon: number | null;
  source_dataset: string;
  source_url: string;
  [extra: string]: string | number | null;
};
export type Procedure = {
  topic: string;
  title: string;
  keywords: string[];
  facts: string[];
  source_url: string;
  also?: string;
};

// Compact records scraped from every comune.milano.it/servizi page (data/comune-procedures.json).
export type ComuneProcedure = {
  topic: string;
  title: string;
  category: string;
  summary: string;
  who?: string[];
  how: { channels: string[]; spid_cie: boolean; notes?: string[]; links?: { label: string; url: string }[] };
  documents?: string[];
  deadline?: string[];
  cost?: string[];
  source_url: string;
  updated?: string;
  fetched_at: string;
};

const PLACES = kb.places as Place[];
const PROCEDURES = kb.procedures as Procedure[];
const COMUNE = (comune as unknown as { procedures: ComuneProcedure[] }).procedures;
export const PLACE_KINDS = [
  "anagrafe",
  "municipio",
  "ateneo",
  "biblioteca",
  "servizio_sociale",
  "patronato",
  "scuola_italiano",
  "metro",
] as const;

const FindPlaces = z.object({
  kind: z.enum(PLACE_KINDS),
  near: z.string().trim().min(1).max(200).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});
const CityProcedure = z.object({ topic: z.string().trim().min(2).max(200) });
const ListSources = z.object({}).optional();

export const OPENDATA_TOOLS: Anthropic.Tool[] = [
  {
    name: "find_places",
    description:
      "Find official City of Milan places from open data (registry offices, municipio seats, university sites, libraries, social services, patronati, Italian schools for foreigners, metro stops). Returns real records with address, municipio, coordinates, hours/phone when known, distance_km when 'near' resolves, and source_dataset/source_url. Never invent places: if nothing matches, say so.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...PLACE_KINDS], description: "Type of place." },
        near: {
          type: "string",
          description:
            "Optional anchor: a municipio ('Municipio 3' or '3'), a university or campus ('Politecnico', 'Bocconi', 'Statale', 'Bicocca'), a neighbourhood or street name. Results are sorted by same municipio, then distance.",
        },
        limit: { type: "integer", minimum: 1, maximum: 20, description: "Max results (default 5)." },
      },
      required: ["kind"],
    },
  },
  {
    name: "city_procedure",
    description:
      "Look up short official facts about a City/YesMilano procedure (residence from abroad, change of residence, TARI waste tax declaration and payment, ID card, certificates, Fascicolo del Cittadino, rent support, residence permit, tax code, transport pass, Italian courses) plus every comune.milano.it service page (~590: registry, TARI, housing, schools and nurseries, mobility, welfare, work...). Returns up to 5 matches with facts or who/how/documents/deadline/cost and the source_url to cite. Italian keywords match best.",
    input_schema: {
      type: "object",
      properties: { topic: { type: "string", description: "Topic in any words, e.g. 'TARI', 'residence', 'ID card'." } },
      required: ["topic"],
    },
  },
  {
    name: "list_sources",
    description: "List the open datasets and official pages behind find_places and city_procedure, with record counts and periods.",
    input_schema: { type: "object", properties: {} },
  },
];

export const OPENDATA_SYSTEM_HINT = `Official City data tools (Comune di Milano open data + City/YesMilano pages, snapshot ${kb.fetched_at}):
- Use find_places to say WHERE to go and city_procedure to say WHAT applies; call them before writing a step's "where" or "deadline".
- Always cite the source_url returned by the tool. Never invent an address, office, hours or deadline: if a tool returns nothing, say the user must check with the City (infoline 020202).
- For registry (anagrafe) steps, prefer the office in the user's municipio (find_places kind=anagrafe near=<her municipio, university or street>); offices work by online appointment only.
- Some facts are flagged as "confirm on the page" and some datasets are old (libraries: 2007): say so instead of stating them as certain.`;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim();
const STOP = new Set(["di", "de", "del", "della", "the", "of", "via", "viale", "piazza", "milano", "milan", "in", "a", "e", "and", "i", "to", "my", "near"]);
const tokens = (s: string) => norm(s).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
const ALIASES: Record<string, string> = {
  statale: "universita degli studi di milano",
  unimi: "universita degli studi di milano",
  polimi: "politecnico",
  unimib: "bicocca",
  cattolica: "cattolica sacro cuore",
};

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

type Anchor = { label: string; municipio: number | null; lat: number | null; lon: number | null };

export function resolveNear(near: string): Anchor | null {
  const m = norm(near).match(/^(?:municipio|zona)?\s*([1-9])$/);
  if (m) {
    const seat = PLACES.find((p) => p.kind === "municipio" && p.municipio === Number(m[1]));
    return { label: `Municipio ${m[1]}`, municipio: Number(m[1]), lat: seat?.lat ?? null, lon: seat?.lon ?? null };
  }
  const q = tokens(Object.entries(ALIASES).reduce((s, [k, v]) => s.replace(new RegExp(`\\b${k}\\b`), v), norm(near)));
  if (!q.length) return null;
  // ponytail: token-overlap match over names/addresses, no geocoder; add one when free-text addresses matter.
  let best: Place | null = null;
  let bestScore = 0;
  for (const p of PLACES) {
    if (p.kind === "metro" && !q.some((t) => norm(p.name ?? "").includes(t))) continue;
    const hay = new Set(tokens(`${p.name ?? ""} ${p.address ?? ""} ${p.neighbourhood ?? ""}`));
    const score = q.filter((t) => hay.has(t)).length / q.length + (p.kind === "ateneo" ? 0.01 : 0);
    if (score > bestScore) [best, bestScore] = [p, score];
  }
  if (!best || bestScore < 0.5) return null;
  return { label: `${best.name} (${best.address ?? best.kind})`, municipio: best.municipio, lat: best.lat, lon: best.lon };
}

function findPlaces(input: z.infer<typeof FindPlaces>) {
  const limit = input.limit ?? 5;
  const pool = PLACES.filter((p) => p.kind === input.kind);
  const anchor = input.near ? resolveNear(input.near) : null;
  const ranked = pool.map((p) => ({
    ...p,
    distance_km:
      anchor?.lat != null && anchor.lon != null && p.lat != null && p.lon != null
        ? Math.round(km({ lat: anchor.lat, lon: anchor.lon }, { lat: p.lat, lon: p.lon }) * 10) / 10
        : null,
  }));
  if (anchor) {
    const same = (p: Place) => (anchor.municipio != null && p.municipio === anchor.municipio ? 0 : 1);
    ranked.sort((a, b) => same(a) - same(b) || (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
  }
  return {
    kind: input.kind,
    near: input.near ?? null,
    anchor,
    note: input.near && !anchor ? "Could not locate 'near'; results are unsorted. Ask for her municipio or university." : undefined,
    total: pool.length,
    results: ranked.slice(0, limit),
    fetched_at: kb.fetched_at,
  };
}

// English words the model may pass -> Italian words used on comune.milano.it pages.
const EN_IT: Record<string, string> = {
  residence: "residenza", id: "identita", identity: "identita", card: "carta", certificate: "certificato", certificates: "certificati",
  citizenship: "cittadinanza", marriage: "matrimonio", birth: "nascita", waste: "tari rifiuti", tax: "tributi", school: "scuola",
  nursery: "nido", kindergarten: "infanzia", rent: "affitto", housing: "casa abitare", house: "casa", parking: "sosta", pass: "abbonamento",
  transport: "trasporto", appointment: "appuntamento", disability: "disabilita", job: "lavoro", work: "lavoro", foreigners: "stranieri",
  foreigner: "stranieri", family: "famiglia", child: "figli", children: "figli", fine: "multe", fines: "multe", bike: "bici", car: "auto",
};
// ponytail: crude stem (drop final vowels), no real Italian stemmer; enough for iscrizione/iscrizioni, nido/nidi.
const stem = (t: string) => (t.length > 3 ? t.replace(/[aeiou]+$/, "") : t);
const COMUNE_IDX = COMUNE.map((c) => ({
  c,
  head: new Set(tokens(`${c.title} ${c.topic.replace(/-/g, " ")}`).map(stem)),
  cat: new Set(tokens(c.category).map(stem)),
  body: new Set(tokens(c.summary).map(stem)),
  title: norm(c.title),
}));

function searchComune(topic: string, exclude: Set<string>, limit: number) {
  const qs = norm(topic);
  const q = [...new Set(tokens(qs).flatMap((t) => (EN_IT[t] ? tokens(EN_IT[t]) : [t])).map(stem))];
  if (!q.length) return [];
  return COMUNE_IDX.map((x) => {
      const hits = q.filter((t) => x.head.has(t)).length;
      const score =
        hits * 3 +
        q.filter((t) => x.cat.has(t)).length +
        q.filter((t) => x.body.has(t)).length +
        (hits === q.length ? 4 : 0) +
        (x.title.includes(qs) ? 4 : 0);
      return { c: x.c, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .filter((x, _, all) => x.score * 2 >= all[0].score) // drop weak tails ("carta dei servizi" for "carta d'identità")
    .filter((x) => !exclude.has(x.c.source_url))
    .slice(0, limit)
    .map(({ c }) => c);
}

function cityProcedure(input: z.infer<typeof CityProcedure>) {
  const q = tokens(input.topic);
  const qs = norm(input.topic);
  const scored = PROCEDURES.map((p) => {
    const kw = p.keywords.map(norm);
    const score =
      kw.filter((k) => qs.includes(k)).length * 2 +
      q.filter((t) => kw.some((k) => k.split(" ").includes(t)) || tokens(p.title).includes(t)).length +
      (norm(p.topic.replace(/_/g, " ")) === qs ? 5 : 0);
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  // Curated facts first (max 2), then comune.milano.it service pages, 5 results total, no duplicate source_url.
  const curated = scored.map(({ p }) => ({ topic: p.topic, title: p.title, facts: p.facts, source_url: p.source_url, also: p.also }));
  const pages = searchComune(input.topic, new Set(curated.map((m) => m.source_url)), 5 - curated.length);
  const matches = [...curated, ...pages];
  return {
    topic: input.topic,
    matches,
    available_topics: matches.length ? undefined : PROCEDURES.map((p) => p.topic),
    note: matches.length ? undefined : "No City page matched: try Italian keywords (e.g. 'residenza', 'carta d'identità', 'TARI', 'nido') or the infoline 020202.",
    fetched_at: kb.fetched_at,
  };
}

function listSources() {
  return {
    fetched_at: kb.fetched_at,
    portal: kb.portal,
    licence: kb.licence,
    datasets: kb.datasets,
    pages: PROCEDURES.flatMap((p) => [p.source_url, ...(p.also ? [p.also] : [])]).filter((u, i, a) => a.indexOf(u) === i),
    comune_pages: {
      source: "https://www.comune.milano.it/servizi",
      fetched_at: comune.fetched_at,
      count: COMUNE.length,
      by_category: COMUNE.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.category]: (acc[c.category] ?? 0) + 1 }), {}),
    },
  };
}

export async function runOpendataTool(name: string, input: unknown): Promise<unknown> {
  const parse = <T>(schema: z.ZodType<T>) => {
    const r = schema.safeParse(input ?? {});
    if (!r.success) throw new Error(`invalid_input for ${name}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    return r.data;
  };
  switch (name) {
    case "find_places":
      return findPlaces(parse(FindPlaces));
    case "city_procedure":
      return cityProcedure(parse(CityProcedure));
    case "list_sources":
      parse(ListSources);
      return listSources();
    default:
      throw new Error(`unknown_tool: ${name}`);
  }
}

export const isOpendataTool = (name: string) => OPENDATA_TOOLS.some((t) => t.name === name);
