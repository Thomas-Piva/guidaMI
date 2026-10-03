"use client";

import { UiStyle } from "./shared";

export type PreviewsProps = {
  onHome: () => void;
};

/** S7: wired previews, fake data on purpose (labelled «soon»). */
export default function Previews({ onHome }: PreviewsProps) {
  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onHome}>
          ‹ Home
        </button>
        <span className="pill">Preview · Anteprima</span>
      </div>
      <div className="body mescroll">
        <div className="t1" style={{ fontSize: 19 }}>
          Next stops<span className="it">Prossime fermate</span>
        </div>
        <div className="prev">
          <div className="pv a">
            <span className="badge">soon</span>
            <b>Save to Fascicolo</b>
            <span className="sub">Say it once, with SPID: your profile moves into the City&apos;s Fascicolo del Cittadino.</span>
            <span className="spid" aria-disabled="true">
              Entra con SPID
            </span>
          </div>
          <div className="pv b">
            <span className="badge">soon</span>
            <b>Parlami in italiano</b>
            <span className="sub">Coffee in Italian with Giuseppe, a Milanese volunteer. Biblioteca Sormani, Thu 17:00.</span>
          </div>
          <div className="pv c">
            <span className="badge">soon</span>
            <b>Talent card</b>
            <span className="sub">With your consent, Milan companies find you before you graduate.</span>
          </div>
        </div>
      </div>
    </>
  );
}
