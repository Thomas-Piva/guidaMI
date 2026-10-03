// POST /api/forms/pdf {form, fields, extra} -> the official PDF, pre-filled. Nothing is stored.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";

const str = z.string().max(200).default("");
const Body = z.object({
  form: z.enum(["aa48", "residenza", "tari"]),
  fields: z.object({
    surname: str,
    given_names: str,
    sex: z.enum(["F", "M", "X", ""]).default(""),
    date_of_birth: str,
    place_of_birth: str,
    nationality: str,
    passport_number: str,
    issue_date: str,
    expiry_date: str,
    issuing_country: str,
  }),
  extra: z.record(z.string(), z.string().max(200)).default({}),
});
type Input = z.infer<typeof Body>;

// Literal paths so Next's file tracing ships the PDFs with the function.
const FILES = {
  aa48: () => readFile(path.join(process.cwd(), "data/forms/aa4_8.pdf")),
  residenza: () => readFile(path.join(process.cwd(), "data/forms/residenza.pdf")),
  tari: () => readFile(path.join(process.cwd(), "data/forms/tari_milano.pdf")),
};

const NAMES = { aa48: "AA4-8_codice_fiscale", residenza: "dichiarazione_residenza", tari: "TARI_nuova_occupazione" };

/** Block capitals, no accents, WinAnsi-safe (the forms ask for no special characters: Müller -> MULLER). */
const up = (s?: string) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .toUpperCase();

/** "Via Roma 12" -> {street: "VIA ROMA", number: "12"} */
function splitAddress(a?: string) {
  const s = up(a);
  const m = s.match(/^(.*?)[,\s]+(\d+[A-Z]?(?:\/\w+)?)$/);
  return m ? { street: m[1], number: m[2] } : { street: s, number: "" };
}

const digits = (date: string) => date.replace(/\D/g, ""); // 01/01/2000 -> 01012000

function fillAa48(doc: PDFDocument, { fields: p, extra }: Input) {
  const form = doc.getForm();
  const text = (name: string, v: string) => v && form.getTextField(name).setText(v);
  form.getCheckBox("richiesta diretta").check();
  form.getCheckBox("attribuzione codice fiscale").check();
  text("quadroB_cognome", up(p.surname));
  text("quadroB_nome", up(p.given_names));
  if (p.sex === "M" || p.sex === "F") form.getDropdown("quadroc_sesso").select(p.sex);
  text("quadroB_comune", up(extra.birth_country || p.place_of_birth)); // "Comune (o Stato estero) di nascita"
  text("quadroB_provincia", "EE"); // EE = born abroad
  text("data di nascita", digits(p.date_of_birth).slice(0, 8));
  // No citizenship box on AA4/8: residence abroad goes in Quadro D, citizenship with the passport in Allegati.
  text("quadroD_stato estero", up(p.issuing_country || p.nationality));
  const passport = [p.passport_number && `PASSAPORTO N. ${up(p.passport_number)}`, p.nationality && `CITTADINANZA ${up(p.nationality)}`];
  text("allegati 1", passport.filter(Boolean).join(" - "));
  if (extra.address) {
    const { street, number } = splitAddress(extra.address);
    const [first, ...rest] = street.split(" ");
    const kinds = ["VIA", "VIALE", "PIAZZA", "PIAZZALE", "CORSO", "LARGO", "VICOLO"];
    const kind = kinds.includes(first) && rest.length ? first : "";
    if (kind) form.getDropdown("TIPOLOGIA").select(kind[0] + kind.slice(1).toLowerCase());
    text("quadroC_comune", "MILANO");
    text("quadroC_provincia", "MI");
    text("quadroC_cap", digits(extra.cap ?? "").slice(0, 5));
    text("quadroC_indirizzo post", kind ? rest.join(" ") : street);
    text("quadroC_numero civico", number);
  }
  // Print/clear buttons would be baked into the page by flatten.
  form.removeField(form.getField("STAMPA"));
  form.flatten();
  // The print buttons are also listed in another page's /Annots: drop the now-dangling refs.
  for (const page of doc.getPages()) {
    const annots = page.node.Annots();
    for (let i = (annots?.size() ?? 0) - 1; i >= 0; i--) if (!doc.context.lookup(annots!.get(i))) annots!.remove(i);
  }
}

type Writer = (page: PDFPage, v: string | undefined, x: number, yTop: number, maxW?: number) => void;

/** Writes on a flat page; coordinates are measured from the top (as in the PNG renders), baseline y. */
const writer =
  (font: PDFFont): Writer =>
  (page, v, x, yTop, maxW = 200) => {
    const t = up(v);
    if (!t) return;
    let size = 9;
    while (size > 5 && font.widthOfTextAtSize(t, size) > maxW) size -= 0.5;
    page.drawText(t, { x, y: page.getHeight() - yTop, size, font, color: rgb(0.05, 0.1, 0.45) });
  };

const tick = (page: PDFPage, x: number, yTop: number, font: PDFFont) =>
  page.drawText("X", { x, y: page.getHeight() - yTop, size: 10, font, color: rgb(0.05, 0.1, 0.45) });

function note(page: PDFPage, font: PDFFont, x: number, yTop: number) {
  const lines = ["Pre-filled by Milano Evolution · check and sign", "Precompilato da Milano Evolution · controlla e firma"];
  const w = Math.max(...lines.map((l) => font.widthOfTextAtSize(l, 7))) + 10;
  const y = page.getHeight() - yTop;
  page.drawRectangle({ x, y: y - 20, width: w, height: 22, color: rgb(1, 0.784, 0) }); // #FFC800
  lines.forEach((l, i) => page.drawText(l, { x: x + 5, y: y - 8 - i * 9, size: 7, font, color: rgb(0.13, 0.13, 0.13) }));
}

// Coordinates calibrated on the official pages (pymupdf text layer), checked on PNG renders of the output.
function fillResidenza(doc: PDFDocument, { fields: p, extra }: Input, font: PDFFont, bold: PDFFont) {
  const [p1, p2, p3] = doc.getPages();
  const w = writer(font);
  note(p1, bold, 40, 12);
  tick(p1, 88, 148, bold); // "con provenienza dall'estero"
  w(p1, p.issuing_country || p.nationality, 175, 157, 330); // Stato estero di provenienza
  w(p1, p.surname, 134, 345, 400);
  w(p1, p.given_names, 100, 358, 260);
  w(p1, p.date_of_birth, 456, 360, 80);
  w(p1, p.place_of_birth, 151, 371, 54);
  w(p1, p.sex === "X" ? "" : p.sex, 262, 371, 15);
  w(p1, p.nationality, 133, 384, 180);
  w(p1, extra.codice_fiscale, 368, 385, 160);
  tick(p1, 53, 768, bold); // "Di aver trasferito la dimora abituale al seguente indirizzo"
  const { street, number } = splitAddress(extra.address);
  if (extra.address) {
    w(p2, "Milano", 112, 79, 185);
    w(p2, "MI", 364, 80, 160);
  }
  w(p2, street, 121, 92, 178);
  w(p2, number, 388, 93, 140);
  w(p3, p.passport_number && `- Copia passaporto n. ${p.passport_number}`, 66, 662, 460);
  w(p3, extra.housing_title && `- Titolo dell'abitazione: ${extra.housing_title} (copia del contratto)`, 66, 676, 460);
}

function fillTari(doc: PDFDocument, { fields: p, extra }: Input, font: PDFFont, bold: PDFFont) {
  const [p1, p2] = doc.getPages();
  const w = writer(font);
  note(p1, bold, 40, 12);
  const { street, number } = splitAddress(extra.address);
  w(p1, street.replace(/^VIA\s+/, ""), 300, 234, 200); // label already says "Via"
  w(p1, number, 521, 234, 40);
  w(p1, extra.m2, 174, 254, 30);
  if (extra.address) w(p1, "Abitazione", 330, 254, 220);
  w(p1, p.surname, 104, 488, 160);
  w(p1, p.given_names, 302, 488, 160);
  if (p.sex === "M" || p.sex === "F") {
    const cx = p.sex === "M" ? 507.9 : 535.3;
    p1.drawEllipse({ x: cx, y: p1.getHeight() - 490.2, xScale: 9, yScale: 9, borderColor: rgb(0.05, 0.1, 0.45), borderWidth: 1.4 });
  }
  w(p1, extra.codice_fiscale, 170, 525, 370);
  w(p1, p.place_of_birth, 84, 541, 215);
  w(p1, "EE", 358, 541, 20);
  w(p1, p.date_of_birth, 396, 541, 150);
  if (extra.address) w(p1, "Milano", 104, 557, 160);
  w(p1, street.replace(/^VIA\s+/, ""), 292, 557, 160);
  w(p1, number, 468, 557, 16);
  w(p1, extra.cap, 505, 557, 45);
  w(p1, extra.email, 125, 613, 420);
  w(p2, extra.start_date, 300, 76, 250);
  const title = extra.housing_title ?? "";
  if (/rent|lease|locaz|affitt/i.test(title)) p2.drawCircle({ x: 75.6, y: p2.getHeight() - 618.5, size: 3.2, color: rgb(0.05, 0.1, 0.45) });
  else if (title) {
    p2.drawCircle({ x: 344, y: p2.getHeight() - 618.5, size: 3.2, color: rgb(0.05, 0.1, 0.45) });
    w(p2, title, 385, 619, 165);
  }
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });
  const input = parsed.data;
  try {
    const doc = await PDFDocument.load(await FILES[input.form]());
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    if (input.form === "aa48") {
      fillAa48(doc, input);
      note(doc.getPage(1), bold, 215, 16);
    } else if (input.form === "residenza") fillResidenza(doc, input, font, bold);
    else fillTari(doc, input, font, bold);
    const bytes = await doc.save();
    const who = up(input.fields.surname).replace(/[^A-Z0-9]+/g, "_") || "form";
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${NAMES[input.form]}_${who}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("forms/pdf failed", input.form, e);
    return Response.json({ error: "pdf_failed" }, { status: 500 });
  }
}
