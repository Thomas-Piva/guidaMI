# Milano Evolution · web app

Next.js 16 (App Router, TypeScript, plain CSS). One page (`app/page.tsx`) is the screen state machine; API routes live in `app/api/`.

## Run

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # type check + production build
npx vitest run         # unit tests (SDK and network mocked)
```

Keys go in `web/.env.local` (never committed):

```
ANTHROPIC_API_KEY=...        # /api/plan, /api/passport
ELEVENLABS_API_KEY=...       # /api/signed-url
ELEVENLABS_AGENT_ID=...      # written by: node scripts/create-agent.mjs
```

Without keys the routes answer `503 {"error":"missing_keys"}` and the app keeps working by touch: the dock and a small notice say the guide is offline, the plan screen offers a labelled sample plan, the passport reader leaves the fields to type by hand. PDFs (`/api/forms/pdf`) need no key.

## Demo mode

`?demo=1` loads the sample profile, the «Rent a room» plan and the SPECIMEN passport from `lib/demo.ts`, streams the sample plan instead of calling `/api/plan` and returns the sample passport instead of `/api/passport`. A small «Demo · sample data» tag stays on screen. Voice still uses the real ElevenLabs agent when keys exist.

`?screen=<name>` opens a screen directly:

| Screen | URL |
|---|---|
| S0 welcome | `/?demo=1` |
| S1 about you | `/?demo=1&screen=about` |
| S1c interests | `/?demo=1&screen=interests` |
| S1t Italian test | `/?demo=1&screen=italian` |
| S1b what do you need | `/?demo=1&screen=need` |
| S2 reading the guides (streams the sample plan) | `/?demo=1&screen=reading` |
| S3 plan | `/?demo=1&screen=plan` |
| S4 do it with me | `/?demo=1&screen=step` |
| S5 passport | `/?demo=1&screen=passport` |
| S6 forms (SPECIMEN already read) | `/?demo=1&screen=forms` |
| S8 home | `/?demo=1&screen=home` |
| S7 previews | `/?demo=1&screen=previews` |
| profile | `/?demo=1&screen=profile` |

## How the pieces connect

- `lib/store.ts`: app state in `localStorage` (profile, goals, plans, done steps). Passport fields and typed form values stay in memory only.
- `lib/voice.ts` `useGuide(handlers)`: the ElevenLabs agent calls client tools; `page.tsx` maps them to store actions (`update_profile` lights the wizard cards, `set_italian_level` moves the slider, `set_goal` picks the card, `build_plan` streams `/api/plan` into S2 and returns a 2-3 line summary).
- Touch and voice use the same actions, so either works at any step. «Start» starts the guide with voice, the ✕ switches to text.
- PWA: `app/manifest.ts`, icons in `public/icon-*.png`, `public/sw.js` caches only the app shell (registered in production builds only).
