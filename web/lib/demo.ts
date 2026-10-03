// SAMPLE DATA, invented for the demo. Not a real person, not a real passport.
// Copy matches the approved mockup (design/mockups/index.html, screens s1-s6).
import type { Goal, PassportFields, Plan, Profile } from "./types";

const YM = "https://www.yesmilano.it/en/how-to/";

export const SAMPLE_PROFILE: Profile = {
  name: "Nour",
  situation: "just_arrived",
  eu: false,
  from: "Non-EU (sample)",
  interests: ["Design", "Basketball", "Libraries"],
  worries: ["Paperwork", "Finding a room", "Language"],
  italianDeclared: 4,
  italianVerified: 2,
  lang: "en",
};

// s1t: results of the 3 checks (✓ ✕ ✕).
export const SAMPLE_ITALIAN_CHECKS = [true, false, false];

// s3 meta lines in the mockup, for reference:
// 1 "Passport · Agenzia delle Entrate · 1 day · before signing"
// 2 "Never pay before seeing the contract"
// 3 "Landlord registers it · Agenzia Entrate"
// 4 "Within 20 days · Comune di Milano"
// 5 "Within 90 days · Comune di Milano"
export const SAMPLE_PLAN: Plan = {
  goal: "Rent a room",
  headline: "Five steps, in order. Start with your codice fiscale.",
  steps: [
    {
      id: "codice-fiscale",
      title_en: "Get your codice fiscale",
      title_it: "Il codice fiscale ti serve per firmare il contratto",
      why_for_you: "It's your Italian tax number. You need it to sign a rental contract. It takes one visit and it's free.",
      bring: ["Passport + visa"],
      where: "Agenzia delle Entrate",
      how_long: "About 1 day",
      deadline: "Before signing",
      source_url: YM + "get-italian-tax-code",
      service_id: "agenzia_entrate",
      fill_form: "aa48",
    },
    {
      id: "search-safely",
      title_en: "Search safely",
      title_it: "Cerca casa senza truffe",
      why_for_you: "Never pay before seeing the contract. Visit the room and meet the landlord first.",
      bring: ["Codice fiscale", "Passport"],
      where: "Online and in person",
      how_long: "1 to 3 weeks",
      deadline: "Before moving in",
      source_url: YM + "rents",
    },
    {
      id: "registered-contract",
      title_en: "Registered contract",
      title_it: "Contratto registrato",
      why_for_you: "Landlord registers it at the Agenzia Entrate. Ask for the registration receipt: you need it for the residenza.",
      bring: ["Codice fiscale", "Passport"],
      where: "Agenzia Entrate",
      how_long: "Within 30 days of signing",
      deadline: "Within 30 days",
      source_url: YM + "rents",
      service_id: "agenzia_entrate",
    },
    {
      id: "residenza",
      title_en: "Residenza",
      title_it: "Dichiarazione di residenza",
      why_for_you: "Register your address with the City within 20 days of moving in.",
      bring: ["Passport", "Residence permit receipt", "Registered contract"],
      where: "Comune di Milano",
      how_long: "About 45 days to confirm",
      deadline: "Within 20 days",
      source_url: YM + "take-residence-milano-students",
      fill_form: "residenza",
    },
    {
      id: "tari",
      title_en: "TARI",
      title_it: "Tassa rifiuti, nuova occupazione",
      why_for_you: "The waste tax. Declare your new home to the City within 90 days.",
      bring: ["Codice fiscale", "Contract", "Size of the flat in m²"],
      where: "Comune di Milano",
      how_long: "One online form",
      deadline: "Within 90 days",
      source_url: YM + "first-steps",
      fill_form: "tari",
    },
  ],
  services: [
    { name: "Agenzia delle Entrate", why_you: "Codice fiscale and contract registration.", source_url: YM + "get-italian-tax-code", service_id: "agenzia_entrate" },
    { name: "Student desk", why_you: "Help with residence permit and housing for students.", source_url: YM + "residence-permit-students", service_id: "student_desk" },
  ],
  phrase: { phrase: "Vorrei il codice fiscale", meaning: "I'd like a tax code", when: "say it at the counter" },
  verify: "Check the TARI deadline and the residenza documents with the Comune di Milano.",
};

export const SAMPLE_GOAL: Goal = { id: "rent-a-room", label: "Rent a room", plan: SAMPLE_PLAN, done: [] };

// SPECIMEN passport of NOUR SAMPLE (matches the MRZ in the mockup s5).
export const SAMPLE_PASSPORT: PassportFields = {
  surname: "SAMPLE",
  given_names: "NOUR",
  sex: "F",
  date_of_birth: "01/01/2000",
  place_of_birth: "SAMPLE CITY",
  nationality: "Non-EU (sample)",
  passport_number: "X0000000",
  issue_date: "01/01/2020",
  expiry_date: "01/01/2030",
  issuing_country: "XXX (sample)",
};
