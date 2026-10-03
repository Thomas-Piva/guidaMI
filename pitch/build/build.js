// Builds pitch/milano-evolution-pitch.pptx (8 slides, 16:9 10x5.625 in), structured on the jury scorecard.
// Pitch.com-style: full-bleed colour slides, oversized statements, big numbers, real app screens in phones.
// Copy and speaker notes follow pitch/SPEECH.md, with the assistant named Guido. Open Sans (build/fonts).
const APP = "GuidaMI"; // rename the app here only
const BOT = "Guido";   // the assistant's name

const fs = require("fs");
const pptxgen = require("pptxgenjs");
const ROOT = "/home/thomas/milano-evolution/";
const A = ROOT + "pitch/assets/";
const ICON = ROOT + "design/logo/azzurro/icon-A.png";
const I3D = ROOT + "web/public/icons3d/";
const OUT = process.argv[2] || ROOT + "pitch/milano-evolution-pitch.pptx";
const DL = "/mnt/c/Users/yolob/Downloads/";
const VIDEO = fs.existsSync(DL + "guidami-demo.mp4") ? DL + "guidami-demo.mp4" : DL + "milano-evolution-demo.mp4";

const YEL = "FFC000", INK = "212121", BLUE = "3AC6F4", ORANGE = "ED703D", CREAM = "FCFCF7", WHITE = "FFFFFF";
const GREY = "6B6B6B", HAIR = "E6E6E0";
const F = "Open Sans", FS = "Open Sans SemiBold", FX = "Open Sans ExtraBold";
const PHONE = 816 / 1724; // framed app screenshot w/h (shots-app.py)
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.2, blur: 22, offset: 6, angle: 90 });

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = APP;
const RR = pres.shapes.ROUNDED_RECTANGLE, RECT = pres.shapes.RECTANGLE, LINE = pres.shapes.LINE;
const wordmark = (size) => [{ text: "Guida", options: { fontFace: F, fontSize: size } }, { text: "MI", options: { fontFace: FX, fontSize: size } }];

// Scorecard criterion tag (pill), top-left.
const tagPill = (s, tag, fill, color) => {
  const t = tag.toUpperCase();
  s.addText(t, { x: 0.6, y: 0.29, w: 0.34 + t.length * 0.092, h: 0.28, margin: 0, fontFace: FS, fontSize: 8.5, charSpacing: 1.5, color,
    align: "center", valign: "middle", shape: RR, rectRadius: 0.14, fill: { color: fill }, line: { color: fill, width: 0 } });
};
// Top row: tag left, wordmark + icon right. Split-panel slides draw the tag after their panel (lateTag).
function base(bg, tag, { tagFill = INK, tagColor = WHITE, nameColor = INK, lateTag = false } = {}) {
  const s = pres.addSlide();
  s.background = { color: bg };
  if (tag && !lateTag) tagPill(s, tag, tagFill, tagColor);
  s.addText(wordmark(11.5), { x: 6.5, y: 0.28, w: 2.55, h: 0.3, margin: 0, color: nameColor, align: "right", valign: "middle" });
  s.addImage({ path: ICON, x: 9.12, y: 0.27, w: 0.32, h: 0.32 });
  return s;
}
const statement = (s, text, o = {}) =>
  s.addText(text, { x: 0.6, y: 0.8, w: 6, h: 1.5, margin: 0, fontFace: FX, fontSize: 34, color: INK, valign: "top", lineSpacingMultiple: 0.95, ...o });
const pill = (s, text, x, y, w, o = {}) =>
  s.addText(text, { x, y, w, h: 0.36, margin: 0, fontFace: FS, fontSize: 10, color: INK, align: "center", valign: "middle",
    shape: RR, rectRadius: 0.18, fill: { color: WHITE }, line: { color: WHITE, width: 0 }, ...o });
const label = (s, text, x, y, w, color = GREY) =>
  s.addText(text.toUpperCase(), { x, y, w, h: 0.24, margin: 0, fontFace: FS, fontSize: 8.5, charSpacing: 2, color, valign: "middle" });
const phone = (s, f, x, y, h, o = {}) => s.addImage({ path: A + `app-${f}.png`, x, y, w: h * PHONE, h, ...o });

// 1 · Cos'è GuidaMI: cream left, yellow panel right with the splash screen ------
{
  const s = base(CREAM, "×1 · Pitch", { lateTag: true });
  s.addShape(RECT, { x: 6.3, y: 0, w: 3.7, h: 5.625, fill: { color: YEL }, line: { color: YEL, width: 0 } });
  tagPill(s, "×1 · Pitch", INK, WHITE);
  s.addText(wordmark(56), { x: 0.6, y: 0.85, w: 5.5, h: 1.0, margin: 0, color: INK, valign: "top" });
  s.addText("la guida per te.", { x: 0.6, y: 1.8, w: 5.5, h: 0.5, margin: 0, fontFace: FX, fontSize: 24, color: ORANGE, valign: "top" });
  s.addText([{ text: BOT, options: { fontFace: FX } }, { text: ", l'assistente del Comune di Milano, per tutti." }],
    { x: 0.6, y: 2.45, w: 5.4, h: 0.7, margin: 0, fontFace: F, fontSize: 15, color: INK, valign: "top" });
  label(s, "Per chi", 0.6, 3.45, 3, INK);
  s.addText("Chi arriva a Milano: visitatori, studenti, nuovi residenti. E le aziende che cercano talenti.",
    { x: 0.6, y: 3.75, w: 5.3, h: 0.6, margin: 0, fontFace: F, fontSize: 12, color: INK, valign: "top" });
  [["Visitatori", BLUE], ["Studenti", BLUE], ["Nuovi residenti", BLUE], ["Aziende", ORANGE]].forEach(([t, c], i) => {
    const w = [1.15, 1.05, 1.5, 1.0][i], x = 0.6 + [0, 1.27, 2.44, 4.06][i];
    pill(s, t, x, 4.6, w, { fill: { color: c }, line: { color: c, width: 0 } });
  });
  phone(s, "splash", 6.3 + (3.7 - 4.55 * PHONE) / 2, 0.8, 4.55, { shadow: shadow() });
  s.addNotes(
`${APP}, la guida per te. Dentro c'è ${BOT}, l'assistente del Comune di Milano, per tutti: chi arriva a Milano, visitatori, studenti, nuovi residenti, e le aziende che cercano talenti. ${BOT} capisce cosa ti serve, legge le fonti ufficiali al posto tuo, ti dice i passi nell'ordine giusto con l'ufficio vicino a te e ti compila i moduli.`);
}

// 2 · Il problema: full-bleed yellow, clear statement, the answer, big numbers ---
{
  const s = base(YEL, "×1 · Pitch · Il problema");
  statement(s, [
    { text: "Per sapere cosa fare", options: { breakLine: true } },
    { text: "deve cercare tra 5 siti", options: { breakLine: true } },
    { text: "diversi, metà in italiano." },
  ], { fontSize: 28, w: 5.7, h: 1.45, fontFace: F, bold: true }); // ExtraBold drops to Regular on runs with accents in PowerPoint, Bold holds
  s.addText("Chi arriva a Milano si sente estraneo.", { x: 0.6, y: 2.3, w: 5.5, h: 0.35, margin: 0, fontFace: FS, fontSize: 14, color: INK, valign: "top" });
  s.addText([{ text: APP + " ", options: { fontFace: FX } }, { text: "è un modo nuovo, più semplice e più giocoso, di usare YesMilano e i servizi del Comune." }],
    { x: 0.6, y: 2.8, w: 5.4, h: 0.72, margin: [4, 10, 4, 10], fontFace: F, fontSize: 11.5, color: WHITE, valign: "middle", fill: { color: INK } });
  s.addImage({ path: A + "site-yesmilano-rents-r.png", x: 6.35, y: 0.82, w: 3.4, h: 2.125, shadow: shadow() });
  s.addImage({ path: A + "site-comune-page-r.png", x: 7.0, y: 1.5, w: 3.4, h: 2.125, shadow: shadow() });
  pill(s, "yesmilano.it", 6.15, 2.72, 1.1, { h: 0.26, fontSize: 8, color: WHITE, fill: { color: INK }, line: { color: INK, width: 0 } });
  pill(s, "comune.milano.it", 6.8, 3.45, 1.35, { h: 0.26, fontSize: 8, color: WHITE, fill: { color: INK }, line: { color: INK, width: 0 } });
  [["16%", "degli studenti in mobilità si sente integrato", "ESNsurvey 2021"],
   ["39%", "dei laureati internazionali Polimi se ne va entro un anno", "Politecnico di Milano 2025"],
   ["45,6%", "dei profili cercati dalle imprese è difficile da trovare", "Assolombarda 2025"]].forEach(([n, l, src], i) => {
    const x = 0.6 + i * 3.0;
    s.addShape(LINE, { x, y: 3.9, w: 2.75, h: 0, line: { color: INK, width: 1.25 } });
    s.addText(n, { x, y: 3.98, w: 2.75, h: 0.72, margin: 0, fontFace: FX, fontSize: 44, color: INK, valign: "top" });
    s.addText(l, { x, y: 4.72, w: 2.65, h: 0.42, margin: 0, fontFace: F, fontSize: 10, color: INK, valign: "top" });
    s.addText(src, { x, y: 5.14, w: 2.65, h: 0.2, margin: 0, fontFace: FS, fontSize: 7.5, color: "5A4300", valign: "top" });
  });
  s.addNotes(
`Nour arriva a Milano per studiare. Per sapere cosa fare deve cercare tra cinque siti diversi, metà in italiano: YesMilano, il Comune, ATM, l'Agenzia delle Entrate, la Questura. Ognuno racconta un pezzo e nessuno le dice cosa fare lei, adesso. Sbaglia l'ordine: senza codice fiscale niente contratto, senza contratto niente residenza, senza residenza niente medico. Si sente un'estranea. Solo il 16% degli studenti in mobilità si sente davvero integrato, e quattro laureati internazionali del Politecnico su dieci lasciano l'Italia entro un anno.
${APP} è un modo nuovo, più semplice e più giocoso, di usare YesMilano e i servizi del Comune.

Fonti: ESNsurvey 2021; Politecnico di Milano, indagine occupazionale 2025; Assolombarda, rapporto 2025.`);
}

// 3 · Video: the silent demo, full slide ------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: INK };
  const cover = "data:image/jpeg;base64," + fs.readFileSync(A + "video-cover.jpg").toString("base64");
  s.addMedia({ type: "video", path: VIDEO, cover, x: 0, y: 0, w: 10, h: 5.625 });
  s.addNotes(`Video senza audio: parte con un clic. Lasciamo parlare l'app.
File: ${VIDEO.split("/").pop()}`);
}

// 4 · Visitatore: the journey in one slide, real screens ------------------------
{
  const s = base(WHITE, "×1 · Product and execution");
  statement(s, `Parla con ${BOT}, e le carte si sistemano.`, { fontSize: 26, w: 8.8, h: 0.55 });
  const shots = [["splash", "Arriva a Milano", "Apre il link nell'email di benvenuto"],
    ["plan", "Il suo piano", "Personalizzato su quello che chiede, con l'ufficio giusto"],
    ["passport-scan1", "Foto del passaporto", `${BOT} lo legge, niente viene salvato`],
    ["passport-fields", "I campi compilati", "Lei li controlla e li corregge"],
    ["forms", "Moduli pronti", "In PDF, da firmare"]];
  const h = 3.4, pw = h * PHONE, gap = (8.8 - 5 * pw) / 4;
  shots.forEach(([f, t, d], i) => {
    const x = 0.6 + i * (pw + gap);
    s.addText([{ text: String(i + 1) + "  ", options: { fontFace: FX, color: ORANGE } }, { text: t, options: { fontFace: FS, breakLine: true } },
      { text: d, options: { fontFace: F, fontSize: 8.5, color: GREY } }],
      { x, y: 1.45, w: pw + gap - 0.08, h: 0.68, margin: 0, fontSize: 10.5, color: INK, valign: "top" });
    phone(s, f, x, 2.15, h);
  });
  s.addNotes(
`Nour apre ${APP} dal link nell'email di benvenuto del Comune. ${BOT} la saluta in italiano e le dice subito che è un assistente IA. Lei risponde in inglese e ${BOT} passa all'inglese; la sua scheda si riempie mentre parla.
Il suo piano è personalizzato su quello che chiede, per sistemare le carte e integrarsi in città: codice fiscale, cercare casa senza truffe, contratto registrato, residenza entro 20 giorni, TARI. Ogni passo dice cosa portare, dove andare e la scadenza; l'ufficio arriva dagli open data del Comune.
Scatta il passaporto. I campi compaiono sullo schermo, lei li controlla e li corregge. Il modulo del codice fiscale, la dichiarazione di residenza e la TARI escono compilati in PDF. Lei li firma.`);
}

// 5 · Studente e azienda: Talent card, with consent ------------------------------
{
  const s = base(CREAM, "×2 · Day-one impact");
  statement(s, "Studente e azienda.", { fontSize: 28, w: 7, h: 0.6 });
  [["Lato studente", BLUE, "talent-card", "Nour carica la sua Talent card e la cura: competenze, italiano verificato, impegno nella community."],
   ["Lato azienda", ORANGE, "talent-search", "L'azienda vede la Talent card della persona, solo con il suo consenso, e la trova prima della laurea."]].forEach(([h, col, f, d], i) => {
    const x0 = 0.6 + i * 4.5, ph = 3.75;
    s.addShape(RECT, { x: x0, y: 1.55, w: 4.3, h: 0.07, fill: { color: col }, line: { color: col, width: 0 } });
    phone(s, "concept-" + f, x0, 1.8, ph);
    const tx = x0 + ph * PHONE + 0.25, tw = 4.3 - ph * PHONE - 0.25;
    label(s, h, tx, 1.85, tw, INK);
    s.addText(d, { x: tx, y: 2.2, w: tw, h: 1.6, margin: 0, fontFace: F, fontSize: 12, color: INK, valign: "top" });
  });
  s.addImage({ path: I3D + "badge.png", x: 3.45, y: 4.3, w: 0.85, h: 0.85 });
  s.addImage({ path: I3D + "briefcase.png", x: 7.95, y: 4.3, w: 0.85, h: 0.85 });
  s.addNotes(
`Con il suo consenso la Talent card di Nour mostra competenze, italiano verificato e impegno nella community, e lei la cura nel tempo. Un'azienda scrive «junior designer, italiano B1, da marzo» e trova Nour prima che parta. Alla laurea, il permesso da studio a lavoro è già precompilato. Così Nour resta a Milano.`);
}

// 6 · Fonti e dati del Comune ------------------------------------------------------
{
  const s = base(CREAM, "×1 · City data and sources");
  statement(s, "Fonti e dati del Comune.", { fontSize: 28, w: 6, h: 0.6 });
  [["66", "pagine YesMilano e Study & Work, per ogni piano"], ["585", "schede servizi di comune.milano.it, per regole e scadenze"], ["8", "dataset open data, per dire dove andare"]].forEach(([n, l], i) => {
    const x = 0.6 + i * 1.75;
    s.addShape(LINE, { x, y: 1.6, w: 1.55, h: 0, line: { color: INK, width: 1.25 } });
    s.addText(n, { x, y: 1.67, w: 1.55, h: 0.7, margin: 0, fontFace: FX, fontSize: 40, color: INK, valign: "top" });
    s.addText(l, { x, y: 2.4, w: 1.6, h: 0.6, margin: 0, fontFace: F, fontSize: 9.5, color: GREY, valign: "top" });
  });
  label(s, "Gli 8 dataset del Comune", 0.6, 3.15, 3, INK);
  [["ds549", "sedi dell'anagrafe"], ["ds1299", "municipi"], ["ds94", "sedi universitarie"], ["ds550", "patronati"],
   ["ds551", "scuole di italiano"], ["ds1303", "servizio sociale"], ["ds41", "biblioteche"], ["ds535", "fermate della metro"]].forEach(([id, n], i) => {
    const x = 0.6 + (i % 2) * 2.6, y = 3.47 + Math.floor(i / 2) * 0.38;
    s.addText([{ text: id + "  ", options: { fontFace: FS, color: ORANGE } }, { text: n }],
      { x, y, w: 2.45, h: 0.3, margin: [0, 0, 0, 8], fontFace: F, fontSize: 9.5, color: INK, valign: "middle", fill: { color: WHITE }, line: { color: HAIR, width: 0.75 } });
  });
  s.addText("Moduli ufficiali: Agenzia delle Entrate, Ministero dell'Interno, Comune di Milano. Notizie: comunicati del Comune ed eventi YesMilano.",
    { x: 0.6, y: 5.0, w: 5.1, h: 0.4, margin: 0, fontFace: F, fontSize: 9, color: GREY, valign: "top" });
  const cw = 3.6, chh = cw * 260 / 702;
  s.addShape(RECT, { x: 5.95, y: 1.6, w: 3.45, h: 3.6, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  s.addImage({ path: A + "app-plan-card.png", x: 5.8, y: 2.2, w: cw, h: chh, shadow: shadow() });
  s.addText("Dal piano di Nour: il passo, l'ufficio, la fonte.", { x: 6.15, y: 4.25, w: 3.05, h: 0.6, margin: 0, fontFace: FS, fontSize: 11, color: INK, valign: "top" });
  s.addNotes(
`${BOT} lavora solo su fonti ufficiali. Le 66 pagine YesMilano e Study & Work servono a costruire ogni piano e sono citate passo per passo. Le 585 schede servizi di comune.milano.it danno canali, documenti e scadenze come scritti sulla pagina. Gli open data del Comune, dalle sedi dell'anagrafe alle fermate della metro, dicono dove andare e vicino a cosa. I moduli sono quelli ufficiali di Agenzia delle Entrate, Ministero dell'Interno e Comune di Milano.`);
}

// 7 · Manifesto IA / compliance -----------------------------------------------------
{
  const s = base(CREAM, "×2 · AI at work");
  statement(s, [{ text: "Coerente con il Manifesto IA", options: { breakLine: true } }, { text: "del Comune di Milano." }], { fontSize: 24, w: 8, h: 0.95 });
  [["coffee.png", "Umanesimo digitale", `${BOT} porta Nour a un caffè con un milanese, con tre frasi pronte.`],
   ["helpline.png", "Trasparenza", `Nour sa che parla con ${BOT}, un assistente IA. Ogni passo cita la sua fonte.`],
   ["italian.png", "Inclusività", "Voce o tocco, la sua lingua, l'italiano un passo alla volta, contro l'«AI divide»."],
   ["key.png", "Protezione dei dati", "I dati restano sul telefono, il passaporto non viene salvato."],
   ["form.png", "La persona decide", `${BOT} prepara. Nour conferma il piano, corregge i dati e firma i moduli.`],
   ["badge.png", "AI Act: rischio limitato", "Informazione chiara. Per ogni dubbio, una persona: 020202."]].forEach(([ic, h, d], i) => {
    const x = 0.6 + (i % 3) * 3.0, y = 2.0 + Math.floor(i / 3) * 1.72, w = 2.8;
    s.addShape(RECT, { x, y, w, h: 1.55, fill: { color: WHITE }, line: { color: HAIR, width: 0.75 } });
    s.addImage({ path: I3D + ic, x: x + 0.12, y: y + 0.12, w: 0.72, h: 0.72 });
    s.addText(h, { x: x + 0.95, y: y + 0.14, w: w - 1.05, h: 0.68, margin: 0, fontFace: FX, fontSize: 12, color: INK, valign: "middle" });
    s.addText(d, { x: x + 0.16, y: y + 0.9, w: w - 0.3, h: 0.6, margin: 0, fontFace: F, fontSize: 9.5, color: GREY, valign: "top" });
  });
  s.addNotes(
`Ogni volta che Nour lo usa, ${BOT} conversa nella sua lingua, compila la scheda mentre lei parla, giudica le prove d'italiano, decide quali guide leggere e in che ordine mettere i passi, legge il passaporto e prepara i moduli. Le decisioni restano a lei: conferma il piano, corregge i dati, firma i moduli. Niente viene inviato al posto suo.
Tutto questo è coerente con il Manifesto IA del Comune di Milano: un caffè con un milanese, la fonte di ogni passo, voce o tocco nella sua lingua, i dati sul telefono, la firma di Nour. Per l'AI Act è assistenza ai cittadini a rischio limitato, e per ogni dubbio c'è una persona allo 020202.`);
}

// 8 · Domani basta un link (×2 Day-one impact) ----------------------------------------
{
  const s = base(WHITE, "×2 · Day-one impact", { lateTag: true });
  s.addShape(RECT, { x: 0, y: 0, w: 4.9, h: 5.625, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  tagPill(s, "×2 · Day-one impact", INK, WHITE);
  statement(s, [{ text: "Domani basta", options: { breakLine: true } }, { text: "un link." }], { w: 4.2, h: 1.4, fontSize: 36 });
  label(s, "Il link sta", 0.6, 2.3, 3, INK);
  pill(s, "nell'email di benvenuto", 0.6, 2.62, 2.15);
  pill(s, "sulle pagine studenti di YesMilano", 0.6, 3.06, 3.0);
  s.addShape(RR, { x: 0.6, y: 3.75, w: 1.2, h: 1.2, rectRadius: 0.1, fill: { color: WHITE }, line: { color: INK, width: 1.25, dashType: "dash" } });
  s.addText("QR app", { x: 0.6, y: 3.75, w: 1.2, h: 1.2, margin: 0, fontFace: FX, fontSize: 12, color: INK, align: "center", valign: "middle" });
  s.addText([{ text: "Provala ora", options: { fontFace: FX, breakLine: true } }, { text: "inquadra il QR col telefono" }],
    { x: 2.0, y: 4.05, w: 2.6, h: 0.6, margin: 0, fontFace: F, fontSize: 11, color: INK, valign: "top" });
  label(s, "Avvisi sulle scadenze", 5.4, 0.95, 4, GREY);
  [["Permesso di soggiorno", "entro 8 giorni"], ["Residenza", "entro 20 giorni"], ["TARI", "entro 90 giorni"]].forEach(([n, d], i) => {
    const y = 1.3 + i * 0.42;
    s.addShape(LINE, { x: 5.4, y, w: 4.0, h: 0, line: { color: HAIR, width: 0.75 } });
    s.addText(n, { x: 5.4, y: y + 0.04, w: 2.4, h: 0.34, margin: 0, fontFace: FS, fontSize: 12, color: INK, valign: "middle" });
    s.addText(d, { x: 7.6, y: y + 0.04, w: 1.8, h: 0.34, margin: 0, fontFace: FX, fontSize: 12, color: ORANGE, align: "right", valign: "middle" });
  });
  label(s, "Per fare di più servono", 5.4, 2.85, 4, GREY);
  [["SPID e dati anagrafici via PDND", "così i moduli si compilano senza foto"], ["Un calendario unico degli eventi", "di Comune, università e aziende"], ["Il consenso delle persone", "per farsi trovare dalle aziende"]].forEach(([n, d], i) => {
    const y = 3.2 + i * 0.68;
    s.addText(String(i + 1), { x: 5.4, y, w: 0.4, h: 0.5, margin: 0, fontFace: FX, fontSize: 22, color: ORANGE, valign: "top" });
    s.addText(n, { x: 5.85, y, w: 3.55, h: 0.28, margin: 0, fontFace: FS, fontSize: 12, color: INK, valign: "top" });
    s.addText(d, { x: 5.85, y: y + 0.28, w: 3.55, h: 0.26, margin: 0, fontFace: F, fontSize: 10, color: GREY, valign: "top" });
  });
  s.addNotes(
`Al Comune basta un link nell'email di benvenuto e sulle pagine studenti di YesMilano. Le guide e i dati restano del Comune: ${BOT} li legge e li porta alla persona giusta, nel momento in cui servono. Per fare di più servono tre cose: SPID e i dati anagrafici via PDND, così i moduli si compilano senza foto; un calendario unico degli eventi di Comune, università e aziende; il consenso delle persone per farsi trovare dalle aziende.
Nour arriva senza sapere da dove cominciare. Un anno dopo parla un po' di italiano, ha un contratto in regola e un lavoro a Milano. Resta.

Il riquadro «QR app» è un segnaposto per il QR del link dal vivo.`);
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
