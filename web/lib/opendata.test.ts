import { describe, expect, test } from "vitest";
import { runOpendataTool } from "./opendata";

describe("opendata tools", () => {
  test("find_places returns only kind-matching records with a source", async () => {
    const out = await runOpendataTool("find_places", { kind: "anagrafe", near: "Municipio 3", limit: 3 });
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) {
      expect(r.kind).toBe("anagrafe");
      expect(r.source_dataset).toBe("ds549");
      expect(r.source_url).toMatch(/^https:\/\/dati\.comune\.milano\.it\/dataset\//);
    }
    expect(out.results[0].municipio).toBe(3);
  });

  test("near a university sorts by distance", async () => {
    const out = await runOpendataTool("find_places", { kind: "anagrafe", near: "Politecnico" });
    expect(out.anchor).not.toBeNull();
    expect(out.results.every((r) => r.kind === "anagrafe")).toBe(true);
    expect(out.results[0].distance_km).not.toBeNull();
  });

  test("invalid input is rejected", async () => {
    await expect(runOpendataTool("find_places", { kind: "pizzeria" })).rejects.toThrow(/invalid_input/);
    await expect(runOpendataTool("find_places", { kind: "anagrafe", limit: 99 })).rejects.toThrow(/invalid_input/);
    await expect(runOpendataTool("city_procedure", {})).rejects.toThrow(/invalid_input/);
    await expect(runOpendataTool("nope", {})).rejects.toThrow(/unknown_tool/);
  });

  test("city_procedure TARI returns a comune.milano.it source", async () => {
    const out = await runOpendataTool("city_procedure", { topic: "TARI" });
    expect(out.matches.length).toBeGreaterThan(0);
    expect(out.matches[0].source_url).toMatch(/^https:\/\/www\.comune\.milano\.it\//);
    expect(out.matches[0].topic).toMatch(/^tari/);
  });

  test.each(["carta d'identità", "cambio residenza"])("city_procedure %s returns comune.milano.it service pages", async (topic) => {
    const out = await runOpendataTool("city_procedure", { topic });
    expect(out.matches.length).toBeGreaterThan(0);
    expect(out.matches.length).toBeLessThanOrEqual(5);
    for (const m of out.matches) expect(m.source_url).toMatch(/^https:\/\/www\.comune\.milano\.it\//);
    expect(out.matches.some((m) => m.source_url.startsWith("https://www.comune.milano.it/servizi/anagrafe/"))).toBe(true);
  });

  test("city_procedure finds scraped pages beyond the curated topics", async () => {
    const out = await runOpendataTool("city_procedure", { topic: "iscrizione nido" });
    expect(out.matches.some((m) => /\/servizi\/scuola\//.test(m.source_url))).toBe(true);
  });

  test("list_sources lists datasets with counts", async () => {
    const out = await runOpendataTool("list_sources", {});
    expect(out.datasets.find((d) => d.id === "ds549").count).toBeGreaterThan(0);
    expect(out.comune_pages.count).toBeGreaterThan(500);
  });
});
