// Shared contracts between UI, voice and API. Change only with all owners in mind.

export type Profile = {
  name?: string;
  situation?: "just_arrived" | "coming_soon";
  eu?: boolean;
  from?: string;
  study?: string;
  interests: string[];
  worries: string[];
  italianDeclared?: number; // 0-10, what Nour said
  italianVerified?: number; // 0-10, after the 3 checks judged by Claude
  lang?: string; // detected language, e.g. "en"
};

export type FormId = "aa48" | "modulo1" | "residenza" | "tari" | "atm";

export type Step = {
  id: string;
  title_en: string;
  title_it: string;
  why_for_you: string;
  bring: string[];
  where: string;
  how_long: string;
  deadline: string;
  source_url: string; // must be a yesmilano.it page that was read
  service_id?: ServiceId;
  fill_form?: FormId; // shows «Fill it for me»
  icon?: StepIcon; // 3D image on the journey card (/icons3d/<icon>.webp)
  place?: StepPlace; // where to go, from City open data (find_places)
};

export type StepIcon = "room" | "taxcode" | "doctor" | "tram" | "study" | "italian";
export type StepPlace = { name: string; address: string; metro?: string; source_url: string };

export type Plan = {
  goal: string; // e.g. "Rent a room"
  headline: string;
  steps: Step[]; // 3-5, ordered by dependency
  services: { name: string; why_you: string; source_url: string; service_id?: ServiceId }[];
  phrase: { phrase: string; meaning: string; when: string };
  verify: string; // what to double-check with the City
};

export type Goal = { id: string; label: string; plan?: Plan; done: string[] }; // done = step ids

// POST /api/plan  body {profile: Profile, goal: string}  -> NDJSON stream of PlanEvent
export type PlanEvent =
  | { type: "reading"; slug: string; title: string }
  | { type: "read"; slug: string; title: string; fallback?: boolean } // fallback = dated snapshot used
  | { type: "plan"; plan: Plan }
  | { type: "error"; message: string };

// POST /api/passport  body {image: string /* data URL, jpeg/png, max 5 MB */} -> {fields: PassportFields} | {error}
export type PassportFields = {
  surname: string;
  given_names: string;
  sex: "F" | "M" | "X" | "";
  date_of_birth: string; // DD/MM/YYYY
  place_of_birth: string;
  nationality: string;
  passport_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_country: string;
};

// lib/forms.ts (pure, client-side): buildForms(fields, extra) -> FormCard[]
export type FormCard = {
  id: FormId;
  title: string;
  office: string;
  deadline?: string;
  source_url: string;
  pdf: boolean; // aa48, residenza, tari
  fields: { key: string; label: string; value?: string; missing: boolean }[];
};

// POST /api/forms/pdf  body {form: "aa48"|"residenza"|"tari", fields: PassportFields, extra: Record<string,string>} -> application/pdf

// GET /api/signed-url -> {signedUrl: string} | 503 {error: "missing_keys"}

export type ServiceId = "atm" | "cie" | "fascicolo" | "020202" | "biblioteche" | "student_desk" | "agenzia_entrate" | "questura";

export type Screen =
  | "welcome" | "about" | "interests" | "italian" | "need" // onboarding wizard
  | "reading" | "plan" | "step" | "passport" | "forms" // goal flow
  | "home" | "previews" | "profile";

// Voice guide (lib/voice.ts). UI consumes this, voice owner implements it.
export type GuideLine = { who: "guide" | "you"; text: string };
export type GuideHandlers = {
  onProfile: (patch: Partial<Profile>) => void; // client tool update_profile
  onItalian: (declared: number | undefined, verified: number | undefined, check?: { index: number; ok: boolean }) => void; // client tool set_italian_level
  onGoal: (goal: string) => void; // client tool set_goal
  onBuildPlan: (goal: string) => Promise<string>; // client tool build_plan, returns 2-3 line summary to speak
  onScreen: (screen: Screen) => void; // client tool show_screen
  onPassport: () => void; // client tool request_passport
  onOpenService: (id: ServiceId) => void; // client tool open_service
};
export type GuideApi = {
  status: "idle" | "connecting" | "connected" | "error";
  error?: string;
  voice: boolean; // false = text-only (X pressed or mic denied)
  speaking: boolean;
  lines: GuideLine[]; // live captions, newest last
  start: (opts: { voice: boolean; profile: Profile }) => Promise<void>;
  stop: () => Promise<void>;
  setVoice: (on: boolean) => void; // X button: closes audio, keeps the text session
  sendText: (text: string) => void;
  sendContext: (text: string) => void; // e.g. «Nour opened step 1: Get your codice fiscale»
};
