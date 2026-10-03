"use client";
// Concept screens for flows not built yet (pitch and video). Same mockup classes as the app, fake data, labelled «concept».
import { useEffect, useState } from "react";

const Ico = ({ n, s = 44 }: { n: string; s?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/icons3d/${n}.webp`} alt="" width={s} height={s} style={{ objectFit: "contain", mixBlendMode: "multiply", flex: "none" }} />
);

const Bar = ({ left, right = "Preview · Anteprima" }: { left: string; right?: string }) => (
  <div className="bar">
    <a className="pill" href="/?demo=1&screen=home">{left}</a>
    <span className="pill">{right}</span>
  </div>
);

const Row = ({ icon, title, sub, tag }: { icon: string; title: string; sub: string; tag?: string }) => (
  <div className="row" style={{ justifyContent: "flex-start", gap: 12, padding: "12px 14px" }}>
    <Ico n={icon} />
    <div style={{ flex: 1 }}>
      <b style={{ display: "block", fontSize: 14 }}>{title}</b>
      <span className="sub" style={{ fontSize: 12 }}>{sub}</span>
      {tag && <div><span className="tag dl">{tag}</span></div>}
    </div>
  </div>
);

const Foot = ({ cta }: { cta: string }) => (
  <div className="foot">
    <div className="nav">
      <span />
      <span className="cta" style={{ padding: "12px 22px" }}>{cta}</span>
    </div>
    <div className="home-ind" />
  </div>
);

const SCREENS: Record<string, () => React.ReactNode> = {
  parlami: () => (
    <>
      <Bar left="‹ Home" />
      <div className="body" style={{ gap: 14 }}>
        <div className="t1">Parlami in italiano<span className="it">Coffee in Italian with a Milanese</span></div>
        <div className="row on" style={{ justifyContent: "flex-start", gap: 12, padding: 14 }}>
          <Ico n="coffee" s={56} />
          <div>
            <b style={{ display: "block", fontSize: 15 }}>Giuseppe, 68</b>
            <span className="sub">Retired teacher · loves design and football</span>
            <div><span className="tag src">Biblioteca Sormani</span><span className="tag dl">Thu 17:00</span></div>
          </div>
        </div>
        <div className="kv">
          <div><b>Your level</b><br />Italian 2/10</div>
          <div><b>Talk about</b><br />Design, Milan, food</div>
        </div>
        <div className="row" style={{ display: "block", padding: 14 }}>
          <b style={{ fontSize: 13 }}>3 phrases for Thursday</b>
          <p className="sub" style={{ margin: "6px 0 0", lineHeight: 1.6 }}>«Piacere, sono Nour.»<br />«Studio design al Politecnico.»<br />«Può parlare piano, per favore?»</p>
        </div>
      </div>
      <Foot cta="Accept · Accetta" />
    </>
  ),
  eventi: () => (
    <>
      <Bar left="‹ Home" />
      <div className="body" style={{ gap: 12 }}>
        <div className="t1">This week in Milan<span className="it">Questa settimana</span></div>
        <Row icon="calendar" title="Welcome Day · YesMilano" sub="Sat 10:00 · Palazzo Reale · Mei and 2 others from your course go" tag="Go with Mei" />
        <Row icon="coffee" title="Caffè in italiano" sub="Wed 18:00 · Biblioteca Venezia · level A1-A2" />
        <Row icon="briefcase" title="Career day · Politecnico" sub="Fri 14:00 · Bovisa · 40 Milan companies" />
        <Row icon="pin" title="ESN Erasmus night" sub="Thu 21:00 · Navigli" />
      </div>
      <Foot cta="Add to my plan" />
    </>
  ),
  fascicolo: () => (
    <>
      <Bar left="‹ Profile" />
      <div className="body" style={{ gap: 14 }}>
        <div className="t1">Save it once<span className="it">Lo dici una volta, vale per sempre</span></div>
        <Row icon="spid" title="Fascicolo del Cittadino" sub="Log in with SPID or CIE: your profile moves into the City's own record." />
        <div className="kv">
          <div><b>Name</b><br />Nour Sample</div>
          <div><b>Codice fiscale</b><br />SMPNRO…</div>
          <div><b>Residenza</b><br />Municipio 3</div>
          <div><b>Italian</b><br />verified 2/10</div>
        </div>
        <p className="sub">Next forms fill themselves from your Fascicolo (once-only). You decide what to share.</p>
      </div>
      <Foot cta="Entra con SPID" />
    </>
  ),
  "talent-search": () => (
    <>
      <Bar left="Company · Azienda" />
      <div className="body" style={{ gap: 12 }}>
        <div className="t1">Find talent<span className="it">Cerca talenti a Milano</span></div>
        <div className="row on" style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 14 }}>Junior designer, Italian B1, from March</span>
        </div>
        <Row icon="badge" title="Nour · Politecnico, Design" sub="Italian B1 verified · welcomed 12 students · in Milan since Oct 2026" tag="Consent given" />
        <Row icon="badge" title="Mei · Politecnico, Interior" sub="Italian B2 verified · Welcome Day volunteer" tag="Consent given" />
        <Row icon="badge" title="Diego · IED, Product design" sub="Italian B1 verified · part-time in Milan" tag="Consent given" />
        <p className="sub">Claude explains each match. Contact goes through YesMilano, never direct.</p>
      </div>
      <Foot cta="Contact via YesMilano" />
    </>
  ),
  "talent-card": () => (
    <>
      <Bar left="‹ Profile" />
      <div className="body" style={{ gap: 14 }}>
        <div className="t1">Your Talent card<span className="it">La tua Talent card</span></div>
        <div className="row on" style={{ justifyContent: "flex-start", gap: 12, padding: 14 }}>
          <Ico n="badge" s={60} />
          <div>
            <b style={{ display: "block", fontSize: 16 }}>Nour</b>
            <span className="sub">Design · Politecnico di Milano</span>
          </div>
        </div>
        <div className="kv">
          <div><b>Italian</b><br />B1, verified by talking</div>
          <div><b>Community</b><br />12 students welcomed</div>
          <div><b>Skills</b><br />UX, 3D, Figma</div>
          <div><b>In Milan</b><br />since Oct 2026</div>
        </div>
        <div className="chips">
          <span className="chip on">Visible to companies</span>
          <span className="chip">Only via YesMilano</span>
        </div>
      </div>
      <Foot cta="Share with consent" />
    </>
  ),
  permesso: () => (
    <>
      <Bar left="‹ Plan" />
      <div className="body" style={{ gap: 12 }}>
        <div className="t1">You graduated. Stay.<span className="it">Da studio a lavoro</span></div>
        <Row icon="form" title="Permesso: study → work" sub="Conversion forms pre-filled from your profile" tag="Ready to sign" />
        <Row icon="calendar" title="Or: job search permit" sub="Up to 12 months to find work in Italy" />
        <Row icon="briefcase" title="Welcome kit for your employer" sub="Documents, permit, housing, doctor: what HR needs" />
      </div>
      <Foot cta="Check and sign" />
    </>
  ),
  comune: () => (
    <>
      <Bar left="Comune · City" right="Anonymous · Anonimo" />
      <div className="body" style={{ gap: 12 }}>
        <div className="t1">What newcomers need<span className="it">Cosa serve a chi arriva</span></div>
        <div className="kv">
          <div><b style={{ fontSize: 20 }}>128</b><br />permits due this month</div>
          <div><b style={{ fontSize: 20 }}>64</b><br />TARI declarations due</div>
        </div>
        <b style={{ fontSize: 13 }}>Unanswered questions this week</b>
        <Row icon="pin" title="«Which office for residenza in Municipio 8?»" sub="41 times · page missing on comune.milano.it" />
        <Row icon="transit" title="«ATM under 27 without residenza?»" sub="33 times · rule unclear" />
        <Row icon="helpline" title="«Can I book the CIE in English?»" sub="27 times" />
      </div>
      <Foot cta="Send to the web team" />
    </>
  ),
};


export default function Concept() {
  const [s, setS] = useState<string | null>(null);
  useEffect(() => setS(new URLSearchParams(location.search).get("s") ?? "parlami"), []);
  if (!s) return null;
  const Screen = SCREENS[s] ?? SCREENS.parlami;
  return <Screen />;
}
