// Builds pitch/<app>-pitch.pptx (5 slides, 16:9 10x5.625 in).
// Pitch.com-style: full-bleed colour slides, oversized statements, big numbers, phones cropped by the slide edge.
// Study & Work YesMilano palette, Open Sans (build/fonts, installed per user on Windows before the PDF export).
const APP = "GuidaMI"; // rename the app here only

const pptxgen = require("pptxgenjs");
const ROOT = "/home/thomas/milano-evolution/";
const A = ROOT + "pitch/assets/";
const ICON = ROOT + "design/logo/azzurro/icon-A.png";
const I3D = ROOT + "web/public/icons3d/";
const OUT = process.argv[2] || ROOT + "pitch/milano-evolution-pitch.pptx";

const YEL = "FFC000", INK = "212121", BLUE = "3AC6F4", ORANGE = "ED703D", CREAM = "FCFCF7", WHITE = "FFFFFF";
const GREY = "6B6B6B", HAIR = "E6E6E0", DARKRULE = "4A4A4A", LIGHTTXT = "C9C9C9";
const F = "Open Sans", FS = "Open Sans SemiBold", FX = "Open Sans ExtraBold";
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.18, blur: 18, offset: 4, angle: 90 });

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = APP;
const RR = pres.shapes.ROUNDED_RECTANGLE, RECT = pres.shapes.RECTANGLE, LINE = pres.shapes.LINE;

// Top row like Pitch templates: small tracked kicker left, app name + icon right.
function base(bg, kicker, { kickerColor = INK, nameColor = INK } = {}) {
  const s = pres.addSlide();
  s.background = { color: bg };
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.3, w: 5, h: 0.26, margin: 0, fontFace: FS, fontSize: 9, charSpacing: 2, color: kickerColor, valign: "middle" });
  s.addText(APP, { x: 6.5, y: 0.28, w: 2.55, h: 0.3, margin: 0, fontFace: F, bold: true, fontSize: 11.5, color: nameColor, align: "right", valign: "middle" });
  s.addImage({ path: ICON, x: 9.12, y: 0.27, w: 0.32, h: 0.32 });
  return s;
}
const statement = (s, text, o = {}) =>
  s.addText(text, { x: 0.6, y: 0.8, w: 6, h: 1.5, margin: 0, fontFace: FX, fontSize: 34, color: INK, valign: "top", lineSpacingMultiple: 0.95, ...o });
const pill = (s, text, x, y, w, o = {}) =>
  s.addText(text, { x, y, w, h: 0.36, margin: 0, fontFace: FS, fontSize: 10, color: INK, align: "center", valign: "middle",
    shape: RR, rectRadius: 0.18, fill: { color: WHITE }, line: { color: WHITE, width: 0 }, ...o });

// 1 · Il problema: full-bleed yellow, statement + big numbers ------------------
{
  const s = base(YEL, "01  Il problema");
  statement(s, [
    { text: "Decine di pagine", options: { breakLine: true } },
    { text: "su 5 siti, metà", options: { breakLine: true } },
    { text: "in italiano." },
  ], { fontSize: 38, w: 5.6, h: 2.3, fontFace: F, bold: true }); // ExtraBold drops to Regular on this run in PowerPoint (accented à), Bold holds
  // real site screenshots, stacked and cropped by the right edge
  s.addImage({ path: A + "site-yesmilano-rents-r.png", x: 6.35, y: 0.82, w: 3.4, h: 2.125, shadow: shadow() });
  s.addImage({ path: A + "site-comune-page-r.png", x: 7.0, y: 1.5, w: 3.4, h: 2.125, shadow: shadow() });
  pill(s, "yesmilano.it", 6.15, 2.72, 1.1, { h: 0.26, fontSize: 8, color: WHITE, fill: { color: INK }, line: { color: INK, width: 0 } });
  pill(s, "comune.milano.it", 6.8, 3.45, 1.35, { h: 0.26, fontSize: 8, color: WHITE, fill: { color: INK }, line: { color: INK, width: 0 } });
  [["16%", "degli studenti in mobilità si sente integrato", "ESNsurvey 2021"],
   ["39%", "dei laureati internazionali Polimi lascia l'Italia entro un anno", "Politecnico di Milano 2025"],
   ["45,6%", "dei profili cercati dalle imprese è difficile da trovare", "Assolombarda 2025"]].forEach(([n, l, src], i) => {
    const x = 0.6 + i * 3.0;
    s.addShape(LINE, { x, y: 3.9, w: 2.75, h: 0, line: { color: INK, width: 1.25 } });
    s.addText(n, { x, y: 3.98, w: 2.75, h: 0.72, margin: 0, fontFace: FX, fontSize: 44, color: INK, valign: "top" });
    s.addText(l, { x, y: 4.72, w: 2.65, h: 0.42, margin: 0, fontFace: F, fontSize: 10, color: INK, valign: "top" });
    s.addText(src, { x, y: 5.14, w: 2.65, h: 0.2, margin: 0, fontFace: FS, fontSize: 7.5, color: "5A4300", valign: "top" });
  });
  s.addNotes(
`[20 secondi]
Nour è appena arrivata a Milano per studiare. Per sapere cosa fare deve leggere decine di pagine su cinque siti, metà in italiano. Solo il 16% degli studenti in mobilità si sente pienamente integrato. Il 39% dei laureati internazionali del Politecnico lascia l'Italia entro un anno. Intanto le imprese milanesi faticano a trovare quasi un profilo su due.

Fonti (segnate ok in fonti-e-dati.md): ESNsurvey 2021 (16% completamente integrati, 55% in nessun gruppo); Politecnico di Milano, indagine occupazionale 2025 (61% dei laureati internazionali in Italia a un anno, quindi 39% fuori); Assolombarda, rapporto 2025 (45,6% dei profili difficili da reperire, STEM 67,5%).
Schermate reali di yesmilano.it/en/study/how-to/rents e comune.milano.it/argomenti/anagrafe catturate il 3/10/2026.`);
}

// 2 · La demo: statement + 4 phones on a blue floor, cropped by the bottom edge --
{
  const s = base(CREAM, "02  La demo");
  statement(s, "Nour non apre mai un portale.", { fontSize: 28, w: 7.4, h: 0.6, y: 0.8 });
  s.addShape(RECT, { x: 0, y: 3.55, w: 10, h: 2.075, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  const ph = 4.0, pw = ph / 2.0906, gap = 0.3, x0 = (10 - (4 * pw + 3 * gap)) / 2;
  [["mock-01.png", "Parla nella sua lingua"], ["mock-06.png", "Il piano, con le fonti"],
   ["mock-08.png", "Legge il passaporto"], ["mock-09.png", "Moduli in PDF"]].forEach(([f, c], i) => {
    const x = x0 + i * (pw + gap);
    s.addText([
      { text: String(i + 1) + "  ", options: { color: ORANGE, fontFace: FX } },
      { text: c },
    ], { x, y: 1.88, w: pw, h: 0.3, margin: 0, fontFace: FS, fontSize: 11, color: INK, valign: "middle" });
    s.addImage({ path: A + f, x, y: 2.3, w: pw, h: ph });
  });
  // QR placeholder, clearly labelled
  s.addShape(RR, { x: 8.4, y: 0.68, w: 1.0, h: 1.0, rectRadius: 0.1, fill: { color: WHITE }, line: { color: INK, width: 1.25, dashType: "dash" } });
  s.addText("QR app", { x: 8.4, y: 0.68, w: 1.0, h: 1.0, margin: 0, fontFace: FX, fontSize: 12, color: INK, align: "center", valign: "middle" });
  s.addText("Provala dal telefono", { x: 6.4, y: 1.38, w: 1.9, h: 0.26, margin: 0, fontFace: F, fontSize: 9, color: GREY, align: "right", valign: "middle" });
  s.addNotes(
`[60 secondi, sopra il video o la demo dal vivo]
Con ${APP} Nour non apre mai un portale. Tocca Inizia e la guida la saluta in italiano. Lei risponde in inglese e la guida passa all'inglese. Mentre parla, la scheda si riempie da sola: appena arrivata, extra UE, cosa le piace, cosa la preoccupa. Poi una prova d'italiano: lei dice 4, la guida verifica 2.
Nour dice: devo affittare una stanza. Claude legge dal vivo le guide ufficiali di YesMilano e le spunta una per una. Il piano arriva in ordine: codice fiscale, cercare casa senza truffe, contratto registrato, residenza entro 20 giorni, TARI entro 90. Ogni passo ha la sua fonte.
Sul codice fiscale tocca «Compilalo per me». Fotografa il passaporto, controlla i campi e scarica il modulo AA4/8 già compilato. Lo firma lei.
Inquadrate il QR e provatela.

Il riquadro «QR app» è un segnaposto: va sostituito con il QR del link dell'app dal vivo. Schermate dai mockup approvati (design/mockups/index.html); passaporto SPECIMEN con dati finti.`);
}

// 3 · Dove lavora Claude: dark full-bleed, 4 columns, the last one a yellow block --
{
  const s = base(INK, "03  Dove lavora Claude", { kickerColor: WHITE, nameColor: WHITE });
  statement(s, [
    { text: "Claude fa il lavoro.", options: { color: WHITE, breakLine: true } },
    { text: "La persona decide.", options: { color: YEL } },
  ], { w: 6.6, h: 1.4 });
  s.addText([
    { text: "claude-haiku-4-5 nella voce", options: { breakLine: true } },
    { text: "claude-sonnet-5-5 per piano e passaporto" },
  ], { x: 6.6, y: 1.72, w: 2.8, h: 0.4, margin: 0, fontFace: F, fontSize: 8, color: "9A9A9A", align: "right", valign: "bottom" });
  const y0 = 2.5, h = 2.7, cw = 2.05, step = 2.25;
  const head = (i, label, color) => {
    const x = 0.6 + i * step;
    s.addText(`0${i + 1}  ${label.toUpperCase()}`, { x: x + (i === 3 ? 0.18 : 0), y: y0 + 0.16, w: cw, h: 0.24, margin: 0, fontFace: FS, fontSize: 9, charSpacing: 1.5, color, valign: "middle" });
    return x;
  };
  [0, 1, 2].forEach(i => s.addShape(LINE, { x: 0.6 + i * step, y: y0, w: cw, h: 0, line: { color: DARKRULE, width: 1 } }));
  // 01 capisce
  let x = head(0, "Capisce", YEL);
  s.addText("Cosa le serve, nella sua lingua. Compila la scheda mentre lei parla.", { x, y: y0 + 0.55, w: cw - 0.1, h: 1.2, margin: 0, fontFace: F, fontSize: 12, color: WHITE, valign: "top" });
  // 02 legge, big numbers
  x = head(1, "Legge", YEL);
  [["66", "guide YesMilano"], ["585", "procedure del Comune"], ["8", "dataset open data"]].forEach(([n, l], i) => {
    const y = y0 + 0.5 + i * 0.7;
    s.addText(n, { x, y, w: 0.85, h: 0.55, margin: 0, fontFace: FX, fontSize: 28, color: YEL, valign: "middle" });
    s.addText(l, { x: x + 0.9, y, w: 1.15, h: 0.55, margin: 0, fontFace: F, fontSize: 10.5, color: WHITE, valign: "middle" });
  });
  // 03 compila
  x = head(2, "Compila", YEL);
  s.addText("I moduli ufficiali, con i dati letti dal passaporto. Il PDF esce già pronto.", { x, y: y0 + 0.55, w: cw - 0.1, h: 1.2, margin: 0, fontFace: F, fontSize: 12, color: WHITE, valign: "top" });
  // 04 la persona decide, yellow block
  x = 0.6 + 3 * step;
  s.addShape(RECT, { x, y: y0, w: cw, h, fill: { color: YEL }, line: { color: YEL, width: 0 } });
  head(3, "La persona", INK);
  s.addText("Decide", { x: x + 0.18, y: y0 + 0.5, w: cw - 0.3, h: 0.5, margin: 0, fontFace: FX, fontSize: 22, color: INK, valign: "middle" });
  s.addText([
    { text: "Conferma i dati", options: { breakLine: true } },
    { text: "Firma i moduli", options: { breakLine: true } },
    { text: "Spegne la voce quando vuole" },
  ], { x: x + 0.18, y: y0 + 1.15, w: cw - 0.3, h: 1.3, margin: 0, fontFace: FS, fontSize: 11.5, color: INK, valign: "top", paraSpaceAfter: 6 });
  s.addNotes(
`[20 secondi]
Claude lavora a ogni uso. Nella voce c'è Claude Haiku: capisce cosa serve a Nour e compila la scheda mentre lei parla. Claude Sonnet legge 66 guide di YesMilano, 585 procedure del Comune e 8 dataset open data, costruisce il piano con le fonti e legge il passaporto per compilare i moduli. Le decisioni restano a Nour: conferma i dati, firma i moduli e può spegnere la voce quando vuole.`);
}

// 4 · Il primo giorno per il Comune: split screen, blue half + white half -------
{
  const s = base(WHITE, "04  Il primo giorno per il Comune");
  s.addShape(RECT, { x: 0, y: 0, w: 5.3, h: 5.625, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  // kicker again on top of the blue panel (base() drew it underneath)
  s.addText("04  IL PRIMO GIORNO PER IL COMUNE", { x: 0.6, y: 0.3, w: 4.5, h: 0.26, margin: 0, fontFace: FS, fontSize: 9, charSpacing: 2, color: INK, valign: "middle" });
  statement(s, [
    { text: "Per partire", options: { breakLine: true } },
    { text: "basta un link." },
  ], { w: 4.5, h: 1.4, fontSize: 36 });
  s.addText("Il Comune non rifà nulla: YesMilano resta la fonte.", { x: 0.6, y: 2.4, w: 4.2, h: 0.6, margin: 0, fontFace: F, fontSize: 13, color: INK, valign: "top" });
  s.addText("IL LINK STA", { x: 0.6, y: 3.75, w: 3, h: 0.24, margin: 0, fontFace: FS, fontSize: 8.5, charSpacing: 2, color: INK, valign: "middle" });
  pill(s, "nell'email di benvenuto", 0.6, 4.08, 2.15);
  pill(s, "su YesMilano", 2.9, 4.08, 1.35);
  s.addText("DATI CHE SERVIREBBERO", { x: 5.85, y: 0.95, w: 3.6, h: 0.26, margin: 0, fontFace: FS, fontSize: 9, charSpacing: 2, color: GREY, valign: "middle" });
  [["SPID o CIE, e ANPR via PDND", "Once-only: la PA non chiede di nuovo quello che sa"],
   ["Un feed unico degli eventi", "Oggi negli open data del Comune non c'è"],
   ["Il consenso della persona", "Per farsi trovare dalle aziende, se lo vuole lei"]].forEach(([h, d], i) => {
    const y = 1.5 + i * 1.25;
    if (i) s.addShape(LINE, { x: 5.85, y: y - 0.2, w: 3.6, h: 0, line: { color: HAIR, width: 0.75 } });
    s.addText(String(i + 1), { x: 5.85, y: y - 0.06, w: 0.55, h: 0.6, margin: 0, fontFace: FX, fontSize: 30, color: ORANGE, valign: "top" });
    s.addText(h, { x: 6.45, y, w: 3.0, h: 0.32, margin: 0, fontFace: FS, fontSize: 13.5, color: INK, valign: "top" });
    s.addText(d, { x: 6.45, y: y + 0.36, w: 3.0, h: 0.45, margin: 0, fontFace: F, fontSize: 10.5, color: GREY, valign: "top" });
  });
  s.addNotes(
`[20 secondi]
Per accenderla il Comune non deve rifare nulla. Basta un link nell'email di benvenuto e sulle pagine di YesMilano, che restano la fonte. Per fare di più servirebbero tre cose: l'accesso con SPID o CIE e i dati ANPR via PDND, così la PA non chiede due volte quello che sa già; un feed unico degli eventi; il consenso della persona per farsi trovare dalle aziende.

Riferimenti: PDND e-service ANPR C020, C021, C030 (circolare DAIT 73/2023); once-only art. 50 CAD e Reg. UE 2018/1724. Nessun feed ufficiale degli eventi negli open data CKAN del Comune (fonti-e-dati.md, sezione 7).`);
}

// 5 · Dove va (riserva): three feature cards with the app's 3D icons -----------
{
  const s = base(CREAM, "Riserva  Dove va");
  statement(s, "Poi Nour resta a Milano.", { fontSize: 30, w: 7.5, h: 0.65 });
  [["taxcode.png", "Fascicolo con SPID", [{ text: "Con lo SPID il profilo passa al Fascicolo, una volta sola." }], YEL],
   ["italian.png", "Parlami in italiano", [{ text: "Caffè con milanesi volontari. In Catalogna " }, { text: "oltre 170.000 coppie", options: { fontFace: FS, color: INK } }, { text: "." }], BLUE],
   ["study.png", "Talent card", [{ text: "Con il suo consenso le aziende la trovano prima della laurea." }], ORANGE]].forEach(([ic, h, body, col], i) => {
    const x = 0.6 + i * 3.0, y = 1.75, w = 2.8;
    s.addShape(RECT, { x, y, w, h: 3.15, fill: { color: WHITE }, line: { color: HAIR, width: 0.75 } });
    s.addShape(RECT, { x, y, w, h: 0.09, fill: { color: col }, line: { color: col, width: 0 } });
    s.addImage({ path: I3D + ic, x: x + 0.62, y: y + 0.22, w: 1.56, h: 1.56 });
    pill(s, "ANTEPRIMA", x + 0.15, y + 0.24, 0.95, { h: 0.24, fontSize: 7, charSpacing: 1, fill: { color: col }, line: { color: col, width: 0 } });
    s.addText(h, { x: x + 0.22, y: y + 1.95, w: w - 0.4, h: 0.34, margin: 0, fontFace: FX, fontSize: 15, color: INK, valign: "top" });
    s.addText(body, { x: x + 0.22, y: y + 2.35, w: w - 0.4, h: 0.9, margin: 0, fontFace: F, fontSize: 10.5, color: GREY, valign: "top" });
  });
  s.addNotes(
`[riserva, solo se c'è tempo o per le domande]
Ecco dove va ${APP}. Fascicolo con SPID: quando Nour ha lo SPID, il profilo passa al Fascicolo del Cittadino una volta sola. Parlami in italiano: un caffè di conversazione con milanesi volontari, sul modello catalano Voluntariat per la Llengua, oltre 170.000 coppie dal 2003. Talent card: con il suo consenso le aziende milanesi la trovano prima della laurea, contro la fuga dei talenti.

Da verificare: «oltre 170.000 coppie» (govern.cat 2014-2015, cpnl.cat 2024) non è nella tabella dei numeri segnati ok. Le tre anteprime nell'app sono schermate cablate con dati finti.`);
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
