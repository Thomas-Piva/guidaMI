import { afterEach, describe, expect, it, vi } from "vitest";
import snapshot from "../data/news-snapshot.json";
import { _resetNewsCache, fetchAllowed, filterByTopic, getNews, type NewsItem } from "./news";

const items = snapshot.items as NewsItem[];

afterEach(() => { vi.restoreAllMocks(); _resetNewsCache(); });

describe("topic filter on the snapshot", () => {
  it("keeps only matching items, in English and Italian", () => {
    const en = filterByTopic(items, "transport");
    const it_ = filterByTopic(items, "mobilità");
    expect(en.length).toBeGreaterThan(0);
    expect(en.map((i) => i.url)).toEqual(it_.map((i) => i.url));
    expect(en.some((i) => /isola pedonale/i.test(i.title))).toBe(true);
    expect(filterByTopic(items, "events").length).toBeLessThan(items.length);
    expect(filterByTopic(items, "zzqx-nothing")).toEqual([]);
    expect(filterByTopic(items, undefined)).toHaveLength(items.length);
  });

  it("getNews falls back to the snapshot offline and applies topic + limit", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const news = await getNews({ topic: "housing", limit: 3 });
    expect(news.fallback).toBe(true);
    expect(news.fetched_at).toBe("2026-10-03");
    expect(news.items.length).toBeGreaterThan(0);
    expect(news.items.length).toBeLessThanOrEqual(3);
    for (const i of news.items) expect(i.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("allowlist", () => {
  it("never fetches a non-allowlisted URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("x"));
    for (const u of [
      "https://evil.example/news",
      "https://www.comune.milano.it.evil.example/",
      "http://www.comune.milano.it/notizie",
      "https://user@www.yesmilano.it/",
      "http://169.254.169.254/latest/meta-data",
      "file:///etc/passwd",
      "not a url",
    ]) expect(await fetchAllowed(u)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    expect(await fetchAllowed("https://www.comune.milano.it/notizie")).toBe("x");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
