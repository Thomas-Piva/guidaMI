"use client";

import { useEffect, useState } from "react";
import { WarningIcon } from "@phosphor-icons/react";
import type { FormCard, PassportFields } from "@/lib/types";
import { UiStyle, useReducedMotion } from "./shared";

export type PdfForm = "aa48" | "residenza" | "tari";

export type FormsViewProps = {
  cards: FormCard[]; // buildForms(fields, extra) from lib/forms.ts, already ordered
  fields: PassportFields; // confirmed passport fields (typed into the AA4/8 paper)
  extra: Record<string, string>; // values typed for missing fields, keyed by FormCard field.key
  onExtraChange: (key: string, value: string) => void; // missing non-passport field (address, m2...): store in extra, rebuild cards
  onPassportChange: (key: keyof PassportFields, value: string) => void; // missing passport field (e.g. place_of_birth): update fields, rebuild cards
  onBack: () => void; // «‹ Plan»
  onHelp?: () => void; // «Help» pill, hidden when missing
  download?: (form: PdfForm, fields: PassportFields, extra: Record<string, string>) => Promise<void>; // default: POST /api/forms/pdf + save file
};

export async function downloadPdf(form: PdfForm, fields: PassportFields, extra: Record<string, string>) {
  const r = await fetch("/api/forms/pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ form, fields, extra }),
  });
  if (!r.ok || !r.headers.get("content-type")?.includes("pdf")) throw new Error(`pdf ${r.status}`);
  const url = URL.createObjectURL(await r.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: `milano-evolution-${form}.pdf` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const isPdf = (id: string): id is PdfForm => id === "aa48" || id === "residenza" || id === "tari";

/** Typewriter: same 28 ms per character as the mockup. */
function Typed({ text, delay }: { text: string; delay: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return;
    // Stop on the character count, not on a clock: under CPU load ticks slip and a timed stop cuts text short.
    let iv: ReturnType<typeof setInterval> | undefined;
    let i = 0;
    const t = setTimeout(() => {
      iv = setInterval(() => {
        setN(++i);
        if (i >= text.length) clearInterval(iv);
      }, 28);
    }, delay);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [text, delay, reduce]);
  const shown = reduce ? text.length : Math.min(n, text.length);
  return <i className={shown < text.length && shown > 0 ? "typing" : undefined}>{text.slice(0, shown)}</i>;
}

type Dl = "loading" | "error" | "done";

export default function FormsView({ cards, fields, extra, onExtraChange, onPassportChange, onBack, onHelp, download = downloadPdf }: FormsViewProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dl, setDl] = useState<Record<string, Dl | undefined>>({});
  const [stamped, setStamped] = useState(false);
  // keys typed here stay inputs even after the rebuilt card no longer marks them missing (keeps focus)
  const [touched, setTouched] = useState<Record<string, true>>({});
  const value = (key: string) => (key in fields ? fields[key as keyof PassportFields] : extra[key]) ?? "";
  const change = (key: string, v: string) => {
    setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
    if (key in fields) onPassportChange(key as keyof PassportFields, v);
    else onExtraChange(key, v);
  };
  const aa48 = cards.find((c) => c.id === "aa48");
  const aa48Ready = !!aa48 && aa48.fields.every((f) => !f.missing);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setStamped(true), 3200);
    return () => clearTimeout(t);
  }, [reduce]);

  async function get(form: PdfForm) {
    setDl((d) => ({ ...d, [form]: "loading" }));
    try {
      await download(form, fields, extra);
      setDl((d) => ({ ...d, [form]: "done" }));
    } catch {
      setDl((d) => ({ ...d, [form]: "error" }));
      setOpen((o) => ({ ...o, [form]: true })); // keep the data visible to copy
    }
  }

  const paper: [string, string][] = [
    ["Cognome", fields.surname],
    ["Nome", fields.given_names],
    ["Data nascita", fields.date_of_birth],
    ["Stato estero", fields.nationality],
  ];

  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onBack}>
          ‹ Plan
        </button>
        {onHelp ? (
          <button type="button" className="pill meb" onClick={onHelp}>
            Help
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="body mescroll">
        <div className="t1" style={{ fontSize: 19 }}>
          Your forms<span className="it">I tuoi moduli · check and sign · controlla e firma</span>
        </div>

        <div className="paper" aria-label="Modello AA4/8 preview">
          <div className="h">
            <span>Modello AA4/8 · Codice fiscale</span>
            <span>Agenzia Entrate</span>
          </div>
          {paper.map(([label, value], i) => (
            <div className="pl" key={label}>
              <span>{label}</span>
              <Typed text={value} delay={300 + i * 600} />
            </div>
          ))}
          <span className={`stamp${(stamped || reduce) && aa48Ready ? " on" : ""}`}>READY</span>
        </div>

        <div className="forms">
          {cards.map((c) => {
            const missing = c.fields.filter((f) => f.missing);
            const state = dl[c.id];
            const expanded = !!open[c.id];
            const sub = missing.length
              ? `${missing.length} field${missing.length > 1 ? "s" : ""} left: ${missing.map((f) => f.label.split(" · ")[0].toLowerCase()).join(", ")}`
              : c.pdf
                ? c.office
                : `${c.office} · on screen`;
            return (
              <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="frm">
                  <button
                    type="button"
                    className="meb"
                    style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
                    aria-expanded={expanded}
                    onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
                  >
                    <b>{c.title}</b>
                    <small>{sub}</small>
                  </button>
                  {c.pdf && isPdf(c.id) && !missing.length ? (
                    <button
                      type="button"
                      className={`tag dl meb${state === "done" ? " me-ok" : ""}`}
                      style={{ margin: 0 }}
                      disabled={state === "loading"}
                      onClick={() => get(c.id as PdfForm)}
                    >
                      {state === "loading" ? "Preparing…" : state === "error" ? "Retry PDF" : state === "done" ? "⤓ PDF ✓" : "⤓ PDF"}
                    </button>
                  ) : missing.length ? (
                    <button type="button" className="st mi meb" onClick={() => setOpen((o) => ({ ...o, [c.id]: true }))}>
                      {missing.length} left
                    </button>
                  ) : (
                    <span className="st sc">card</span>
                  )}
                </div>

                {expanded && (
                  <>
                    {state === "error" && (
                      <div className="pv me-warn" role="alert">
                        <b style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <WarningIcon /> The PDF did not come out
                        </b>
                        <span className="sub">Il PDF non è uscito: i tuoi dati sono qui sotto, copiali o riprova.</span>
                      </div>
                    )}
                    <div className="fields">
                      {c.fields.map((f) =>
                        f.missing || touched[f.key] ? (
                          <label key={f.key} className={`fld on${value(f.key).trim() ? "" : " miss"}`}>
                            <small>{f.label}</small>
                            <input
                              className="v mei"
                              value={value(f.key)}
                              placeholder="Type it · Scrivilo"
                              autoComplete="off"
                              onChange={(e) => change(f.key, e.target.value)}
                            />
                          </label>
                        ) : (
                          <div key={f.key} className="fld on">
                            <small>{f.label}</small>
                            <span className="v" style={{ userSelect: "all" }}>
                              {f.value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                    {c.deadline && <span className="sub">Deadline · Scadenza: {c.deadline}</span>}
                    {c.pdf && isPdf(c.id) && (
                      <button type="button" className="cta meb" disabled={state === "loading"} onClick={() => get(c.id as PdfForm)}>
                        {state === "loading" ? "Preparing the PDF… · Preparo il PDF" : missing.length ? "Download PDF, empty fields stay blank" : "Download PDF · Scarica PDF"}
                      </button>
                    )}
                    <a className="sub me-link" href={c.source_url} target="_blank" rel="noreferrer">
                      Official source · Fonte ufficiale ↗
                    </a>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
