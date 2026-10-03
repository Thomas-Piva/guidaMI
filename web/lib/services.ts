import type { ServiceId } from "./types";

// Official apps and pages. Every URL returned HTTP 200 with curl on 3/10/2026.
// CIE: curl needs -k (the server sends an incomplete cert chain); browsers open it fine.
export const SERVICES: Record<ServiceId, { name: string; url: string }> = {
  atm: { name: "ATM Milano", url: "https://www.atm.it/en/Pages/default.aspx" },
  cie: { name: "Agenda CIE", url: "https://www.prenotazionicie.interno.gov.it" },
  fascicolo: { name: "Fascicolo del Cittadino", url: "https://www.comune.milano.it/servizi/fascicolo-del-cittadino" },
  "020202": {
    name: "020202 Comune di Milano",
    url: "https://www.comune.milano.it/amministrazione/amministrazione-trasparente/organizzazione/telefono-e-posta-elettronica/il-comune-e...-pronto",
  },
  biblioteche: { name: "Biblioteche di Milano", url: "https://milano.biblioteche.it/" },
  student_desk: { name: "YesMilano International Student Desk", url: "https://studyandwork.yesmilano.it/en/international-student-desk" },
  agenzia_entrate: {
    name: "Agenzia delle Entrate",
    url: "https://www.agenziaentrate.gov.it/portale/web/english/nse/individuals/tax-identification-number-for-foreign-citizens",
  },
  questura: { name: "Questura di Milano", url: "https://questure.poliziadistato.it/it/Milano" },
};

export const service = (id?: ServiceId) => (id ? SERVICES[id] : undefined);
