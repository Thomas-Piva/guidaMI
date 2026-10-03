import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { POST } from "../app/api/forms/pdf/route";
import { addDays, buildForms, leftHere, shortLabel } from "./forms";
import type { PassportFields } from "./types";

const nour: PassportFields = {
  surname: "SAMPLE",
  given_names: "NOUR",
  sex: "F",
  date_of_birth: "01/01/2000",
  place_of_birth: "SAMPLE CITY",
  nationality: "NON-EU (SAMPLE)",
  passport_number: "X0000000",
  issue_date: "01/01/2024",
  expiry_date: "01/01/2034",
  issuing_country: "UTOPIA",
};
const extra = { address: "Via Roma 12", cap: "20121", housing_title: "rent", start_date: "05/10/2026", m2: "18" };

const addressOf = (cards: ReturnType<typeof buildForms>, id: string) =>
  cards.find((c) => c.id === id)!.fields.find((f) => f.key === "address")!;

describe("buildForms", () => {
  it("returns the 4 mockup cards in order, PDFs only for aa48, residenza, tari", () => {
    const cards = buildForms(nour, {});
    expect(cards.map((c) => c.id)).toEqual(["aa48", "residenza", "tari", "modulo1"]);
    expect(cards.filter((c) => c.pdf).map((c) => c.id)).toEqual(["aa48", "residenza", "tari"]);
    expect(cards[0].fields.every((f) => !f.missing)).toBe(true); // AA4/8 is ready from the passport alone
  });

  it("marks the address missing without extra and filled with it", () => {
    expect(addressOf(buildForms(nour, {}), "residenza")).toMatchObject({ missing: true });
    expect(addressOf(buildForms(nour, extra), "residenza")).toMatchObject({ missing: false, value: "Via Roma 12" });
  });

  it("counts deadlines from the move-in date", () => {
    expect(addDays("05/10/2026", 90)).toBe("03/01/2027");
    const tari = (x: Record<string, string>) => buildForms(nour, x).find((c) => c.id === "tari")!;
    expect(tari(extra).deadline).toBe("Within 90 days of moving in · by 03/01/2027");
    expect(tari({}).deadline).toBe("Within 90 days of moving in");
  });

  it("lists what is left like the mockup: residenza address, housing; TARI m², start date", () => {
    const cards = buildForms(nour, {});
    const left = (id: string) => leftHere(cards, cards.findIndex((c) => c.id === id)).map(shortLabel);
    expect(left("aa48")).toEqual([]);
    expect(left("residenza")).toEqual(["address", "housing"]);
    expect(left("tari")).toEqual(["m²", "start date"]);
    // once m² and the date are typed, TARI still shows the shared fields it waits for
    const later = buildForms(nour, { m2: "18", start_date: "05/10/2026" });
    expect(leftHere(later, 2).map(shortLabel)).toEqual(["address", "housing"]);
  });
});

const call = (form: string, fields: unknown = nour) =>
  POST(new Request("http://x/api/forms/pdf", { method: "POST", body: JSON.stringify({ form, fields, extra }) }));

describe("POST /api/forms/pdf", () => {
  it("fills the AA4/8 AcroForm with the surname", async () => {
    const res = await call("aa48");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const bytes = new Uint8Array(await res.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getForm().getFields()).toHaveLength(0); // flattened: values now live in the field appearance streams
    const streams = doc.context
      .enumerateIndirectObjects()
      .flatMap(([, o]) => {
        if (!(o instanceof PDFRawStream)) return [];
        try {
          return [Buffer.from(decodePDFRawStream(o).decode()).toString("latin1")];
        } catch {
          return []; // images (DCT) are not text
        }
      });
    const hex = Buffer.from("SAMPLE").toString("hex").toUpperCase();
    expect(streams.some((s) => s.includes(`<${hex}>`) || s.includes("(SAMPLE)"))).toBe(true);
    if (process.env.PDF_CHECK_DIR) {
      mkdirSync(process.env.PDF_CHECK_DIR, { recursive: true });
      writeFileSync(`${process.env.PDF_CHECK_DIR}/aa48.pdf`, bytes);
    }
  });

  it.each(["residenza", "tari"])("returns a %s PDF", async (form) => {
    const res = await call(form);
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
    if (process.env.PDF_CHECK_DIR) writeFileSync(`${process.env.PDF_CHECK_DIR}/${form}.pdf`, bytes);
  });

  it("takes a hand-typed sex instead of answering 400", async () => {
    expect((await call("aa48", { ...nour, sex: "female" })).status).toBe(200);
    expect((await call("residenza", { ...nour, sex: "Donna" })).status).toBe(200);
  });

  it("rejects an unknown form", async () => {
    expect((await call("atm")).status).toBe(400);
  });
});
