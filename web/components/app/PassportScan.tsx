"use client";

import { useEffect, useState, type ChangeEvent, type CSSProperties } from "react";
import { CameraIcon, IdentificationCardIcon, UploadSimpleIcon, WarningIcon } from "@phosphor-icons/react";
import type { PassportFields } from "@/lib/types";
import { UiStyle, useReducedMotion } from "./shared";

export type PassportScanProps = {
  initial?: PassportFields | null; // already confirmed fields: opens straight on the list
  onBack: () => void;
  onConfirm: (fields: PassportFields) => void; // «Looks good»
  onHelp?: () => void; // «Help» pill, hidden when missing
  read?: (image: string) => Promise<PassportFields>; // default: POST /api/passport
  specimenSrc?: string; // default "/specimen-passport.png"
};

export const EMPTY_PASSPORT: PassportFields = {
  surname: "", given_names: "", sex: "", date_of_birth: "", place_of_birth: "",
  nationality: "", passport_number: "", issue_date: "", expiry_date: "", issuing_country: "",
};

// First five in the mockup's order, then the rest the forms need.
const FIELDS: { key: keyof PassportFields; label: string; ph?: string }[] = [
  { key: "surname", label: "Surname · Cognome" },
  { key: "given_names", label: "Given names · Nome" },
  { key: "date_of_birth", label: "Date of birth · Data di nascita", ph: "DD/MM/YYYY" },
  { key: "nationality", label: "Nationality · Cittadinanza" },
  { key: "passport_number", label: "Passport no. · N. passaporto" },
  { key: "sex", label: "Sex · Sesso" },
  { key: "place_of_birth", label: "Place of birth · Luogo di nascita" },
  { key: "issue_date", label: "Issue date · Data di rilascio", ph: "DD/MM/YYYY" },
  { key: "expiry_date", label: "Expiry date · Scadenza", ph: "DD/MM/YYYY" },
  { key: "issuing_country", label: "Issuing country · Stato di rilascio" },
];

export class PassportReadError extends Error {
  constructor(public reason: "unreadable" | "offline" | "busy" | "format") {
    super(reason);
  }
}

export async function readPassport(image: string): Promise<PassportFields> {
  let r: Response;
  try {
    r = await fetch("/api/passport", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
  } catch {
    throw new PassportReadError("offline");
  }
  const j = (await r.json().catch(() => null)) as { fields?: PassportFields; error?: string } | null;
  if (r.status >= 500 || j?.error === "missing_keys") throw new PassportReadError("offline"); // 503 no keys, 502 vision down
  if (r.status === 429) throw new PassportReadError("busy");
  if (r.status === 413 || r.status === 415) throw new PassportReadError("format");
  if (!r.ok || !j?.fields) throw new PassportReadError("unreadable"); // 422 unreadable / not_a_passport
  return j.fields;
}

/** Any photo → JPEG data URL, long edge max 1600 px (well under the 5 MB API cap). */
export async function toJpegDataUrl(blob: Blob, max = 1600): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.85);
}

type Problem = "unreadable" | "specimen" | "format" | "busy";
type State =
  | { kind: "idle"; problem?: Problem }
  | { kind: "scanning"; img: string }
  | { kind: "fields"; img?: string; fields: PassportFields; offline?: boolean };

const PROBLEMS: Record<Problem, [string, string]> = {
  unreadable: ["Retake the photo with more light", "Rifai la foto con più luce, senza riflessi, con tutta la pagina dentro."],
  specimen: ["The SPECIMEN passport is not available", "Il passaporto di prova non è disponibile: usa una foto."],
  format: ["This photo can't be opened", "Questa foto non si apre: prova con un JPG o PNG."],
  busy: ["The reader is busy", "Il lettore è occupato: riprova tra un minuto."],
};

export default function PassportScan({ initial, onBack, onConfirm, onHelp, read = readPassport, specimenSrc = "/specimen-passport.png" }: PassportScanProps) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>(initial ? { kind: "fields", fields: initial } : { kind: "idle" });
  const [revealed, setRevealed] = useState(initial ? FIELDS.length : 0);

  // Fields appear one by one once the reader answers.
  useEffect(() => {
    if (state.kind !== "fields" || reduce) return;
    // Stop on the count, not on a clock: a timed stop under CPU load left fields hidden and read-only.
    const id = setInterval(() => {
      setRevealed((n) => {
        if (n + 1 >= FIELDS.length) clearInterval(id);
        return Math.min(n + 1, FIELDS.length);
      });
    }, 280);
    return () => clearInterval(id);
  }, [state.kind, reduce]);

  async function scan(blob: Blob) {
    let img: string;
    try {
      img = await toJpegDataUrl(blob);
    } catch {
      return setState({ kind: "idle", problem: "format" });
    }
    setRevealed(0);
    setState({ kind: "scanning", img });
    try {
      const f = await read(img);
      if (!f.surname.trim() && !f.passport_number.trim()) return setState({ kind: "idle", problem: "unreadable" });
      setState({ kind: "fields", img, fields: { ...EMPTY_PASSPORT, ...f } });
    } catch (e) {
      const reason = e instanceof PassportReadError ? e.reason : "unreadable";
      if (reason === "offline") setState({ kind: "fields", img, fields: EMPTY_PASSPORT, offline: true });
      else setState({ kind: "idle", problem: reason });
    }
  }

  async function pickSpecimen() {
    try {
      const r = await fetch(specimenSrc);
      if (!r.ok) throw new Error(String(r.status));
      await scan(await r.blob());
    } catch {
      setState({ kind: "idle", problem: "specimen" });
    }
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // same file can be picked again after a retake
    if (f) scan(f);
  };

  const set = (key: keyof PassportFields, v: string) =>
    setState((s) => (s.kind === "fields" ? { ...s, fields: { ...s.fields, [key]: v } as PassportFields } : s));

  const img = state.kind === "idle" ? undefined : state.img;
  const shown = reduce ? FIELDS.length : revealed;

  return (
    <>
      <UiStyle />
      <div className="bar">
        <button type="button" className="pill meb" onClick={onBack}>
          ‹ Back
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
          Add a photo of your passport
          <span className="it">We read it for you. Nothing is stored. · Non salviamo nulla.</span>
        </div>

        <div className="pass" aria-label={img ? "Your passport photo" : "Sample passport"}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              <b>PASSPORT</b>
              <span className="ph" />
              <span className="spec">SPECIMEN</span>
              <span className="mrz">
                P&lt;XXXNOUR&lt;&lt;SAMPLE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                <br />
                X0000000&lt;0XXX0001019F3001017&lt;&lt;&lt;
              </span>
            </>
          )}
          {state.kind === "scanning" && <span className="scan" />}
        </div>

        {state.kind === "idle" && (
          <>
            {state.problem && (
              <div className="pv me-warn" role="alert">
                <b style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <WarningIcon /> {PROBLEMS[state.problem][0]}
                </b>
                <span className="sub">{PROBLEMS[state.problem][1]}</span>
              </div>
            )}
            <div className="upl">
              <label className="row meb">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <CameraIcon />
                  <span>
                    Take a photo<span className="it">Scatta una foto</span>
                  </span>
                </span>
                <span aria-hidden="true">›</span>
                <input type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
              </label>
              <label className="row meb">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <UploadSimpleIcon />
                  <span>
                    Upload a photo<span className="it">Carica una foto</span>
                  </span>
                </span>
                <span aria-hidden="true">›</span>
                <input type="file" accept="image/*" hidden onChange={onFile} />
              </label>
              <button type="button" className="row meb" onClick={pickSpecimen}>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <IdentificationCardIcon />
                  <span>
                    Use the SPECIMEN passport<span className="it">Usa il passaporto di prova</span>
                  </span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </>
        )}

        {state.kind === "scanning" && (
          <p className="sub" role="status" aria-live="polite">
            Reading your passport… · Sto leggendo il passaporto
          </p>
        )}

        {state.kind === "fields" && state.offline && (
          <div className="pv me-warn" role="alert">
            <b style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <WarningIcon /> The passport reader is not connected
            </b>
            <span className="sub">Il lettore non è collegato: scrivi i tuoi dati qui sotto.</span>
          </div>
        )}

        {state.kind !== "idle" && (
          <div className="fields" aria-live="polite">
            {FIELDS.map(({ key, label, ph }, i) => {
              const on = state.kind === "fields" && i < shown;
              const v = state.kind === "fields" ? state.fields[key] : "";
              return (
                <label key={key} className={`fld${on ? " on" : ""}${on && !v.trim() ? " miss" : ""}`}>
                  <small>{label}</small>
                  {key === "sex" ? (
                    <select className="v mei" value={v} disabled={!on} onChange={(e) => set(key, e.target.value)}>
                      <option value="">Choose · Scegli</option>
                      <option value="F">F</option>
                      <option value="M">M</option>
                      <option value="X">X</option>
                    </select>
                  ) : (
                    <input
                      className="v mei"
                      value={state.kind === "fields" ? v : "…"}
                      placeholder={on ? ph ?? "Type it · Scrivilo" : undefined}
                      readOnly={!on}
                      inputMode={ph ? "numeric" : undefined}
                      autoCapitalize={ph ? "off" : "characters"}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {state.kind === "fields" && (
          <button
            type="button"
            className="meb"
            style={{ alignSelf: "flex-start", textDecoration: "underline", fontWeight: 500, fontSize: 13 }}
            onClick={() => setState({ kind: "idle" })}
          >
            Retake the photo · Rifai la foto
          </button>
        )}
      </div>

      {state.kind === "fields" && (
        <div className="foot">
          <div className="prog">
            <i>
              <b style={{ "--p": "100%" } as CSSProperties} />
            </i>
            <i>
              <b style={{ "--p": "100%" } as CSSProperties} />
            </i>
            <i>
              <b style={{ "--p": "100%" } as CSSProperties} />
            </i>
          </div>
          <div className="nav">
            <button type="button" className="meb" style={{ textDecoration: "underline", fontWeight: 500 }} onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              className="next meb"
              onClick={() => {
                const f = state.fields;
                onConfirm(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])) as PassportFields);
              }}
            >
              Looks good
            </button>
          </div>
          <div className="home-ind" />
        </div>
      )}
    </>
  );
}
