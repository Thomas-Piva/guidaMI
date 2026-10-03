// Deterministic mapping passport fields + what Nour typed -> the 5 form cards (pure, client-safe).
import type { FormCard, PassportFields } from "./types";

/*
 * Keys read from `extra` (all optional strings):
 *   address        street and number in Milan, e.g. "Via Roma 12"
 *   cap            postcode, e.g. "20121"
 *   housing_title  e.g. "rent" / "Contratto di locazione"
 *   start_date     move-in date DD/MM/YYYY (residenza and TARI deadlines count from here)
 *   m2             walkable floor area, e.g. "18"
 *   schengen_entry date of entry into the Schengen area DD/MM/YYYY
 *   arrival_date   arrival in Italy DD/MM/YYYY (Modulo 1 deadline counts from here)
 *   codice_fiscale, email  used in the PDFs when present
 */

type Field = FormCard["fields"][number];

const f = (key: string, label: string, value?: string): Field => {
  const v = value?.trim();
  return v ? { key, label, value: v, missing: false } : { key, label, missing: true };
};

/** "05/10/2026" + 8 -> "13/10/2026"; undefined if the date is not DD/MM/YYYY. */
export function addDays(ddmmyyyy: string | undefined, days: number): string | undefined {
  const m = ddmmyyyy?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1] + days));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

const deadline = (text: string, from: string | undefined, days: number) => {
  const by = addDays(from, days);
  return by ? `${text} · by ${by}` : text;
};

export function buildForms(fields: PassportFields, extra: Record<string, string> = {}): FormCard[] {
  const who = [
    f("surname", "Surname · Cognome", fields.surname),
    f("given_names", "Given names · Nome", fields.given_names),
    f("sex", "Sex · Sesso", fields.sex),
    f("date_of_birth", "Date of birth · Data di nascita", fields.date_of_birth),
    f("place_of_birth", "Place of birth · Luogo di nascita", fields.place_of_birth),
    f("nationality", "Nationality · Cittadinanza", fields.nationality),
  ];
  const address = f("address", "Address in Milan · Indirizzo", extra.address);
  const housing = f("housing_title", "Housing title · Titolo della casa", extra.housing_title);

  return [
    {
      id: "aa48",
      title: "AA4/8 · Tax code",
      office: "Agenzia delle Entrate",
      deadline: "First step: you need it to sign a lease",
      source_url:
        "https://www.agenziaentrate.gov.it/portale/web/guest/schede/istanze/richiesta-ts_cf/come-si-chiede-il-codice-fiscale",
      pdf: true,
      fields: [...who, f("passport_number", "Passport no. · N. passaporto", fields.passport_number)],
    },
    {
      id: "modulo1",
      title: "Modulo 1 · Residence permit",
      office: "Questura, via the Poste Italiane postal kit",
      deadline: deadline("Within 8 days of arrival", extra.arrival_date, 8),
      source_url: "https://www.portaleimmigrazione.it/",
      pdf: false,
      fields: [
        ...who,
        f("passport_number", "Passport no. · N. passaporto", fields.passport_number),
        f("issue_date", "Issued on · Data di rilascio", fields.issue_date),
        f("expiry_date", "Expires on · Data di scadenza", fields.expiry_date),
        f("schengen_entry", "Schengen entry date · Data di ingresso", extra.schengen_entry),
        address,
      ],
    },
    {
      id: "residenza",
      title: "Residenza · Registered address",
      office: "Comune di Milano · Anagrafe",
      deadline: deadline("Within 20 days of moving in", extra.start_date, 20),
      source_url:
        "https://www.comune.milano.it/en/servizi/anagrafe/richiesta-di-residenza-per-persone-straniere-provenienti-dall-estero",
      pdf: true,
      fields: [...who, address, housing],
    },
    {
      id: "tari",
      title: "TARI · Waste tax",
      office: "Comune di Milano · TARI office",
      deadline: deadline("Within 90 days of moving in", extra.start_date, 90),
      source_url: "https://www.comune.milano.it/dichiaratariutenzedomestiche",
      pdf: true,
      fields: [
        who[0],
        who[1],
        who[2],
        who[3],
        who[4],
        address,
        housing,
        f("m2", "Floor area m² · Superficie mq", extra.m2),
        f("start_date", "Move-in date · Inizio occupazione", extra.start_date),
      ],
    },
    {
      id: "atm",
      title: "ATM · Under 27 pass",
      office: "ATM",
      source_url: "https://www.atm.it/en/ViaggiaConNoi/Abbonamenti/Pages/AbbonamentiUrbaniStudenti.aspx",
      pdf: false,
      fields: [who[0], who[1], who[3]],
    },
  ];
}
