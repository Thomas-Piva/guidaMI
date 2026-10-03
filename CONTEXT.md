# CONTEXT · Milano Evolution

Claude Impact Lab Milano, 3 October 2026, Track 01 «Welcome journey». Deadline 16:00.
Spec: [docs/PLAN.md](docs/PLAN.md) · Design system: [DESIGN.md](DESIGN.md) (Airbnb language, Milano colours) · User stories: [docs/USER_STORIES.md](docs/USER_STORIES.md)

## One line
Nour never opens a portal: a guide that understands what a newcomer needs, reads the City's official guides for her, tells her what to do in order and fills in the forms.

## Glossary
| Term | Meaning |
|---|---|
| Nour | the only persona: non-EU student just arrived in Milan, speaks English, Italian 2/10 |
| Guide | the ElevenLabs voice agent (Claude `claude-haiku-4-5` inside), no avatar, shown as a voice orb |
| Profile | what Nour said once (situation, EU/non-EU, interests, Italian declared/verified, worries); lives on the phone (`localStorage`) |
| Goal | what Nour wants to do, e.g. «rent a room»; each goal becomes a card on the home |
| Plan | ordered steps for one goal, built by Claude from the YesMilano guides, each with a source |
| Step | one action: what to bring, where, how long, deadline, source; «Do it with me» and, where needed, «Fill it for me» |
| Forms | AA4/8 tax code (AcroForm), residence declaration and TARI (overlay on official PDF); Modulo 1 and ATM as on-screen cards |
| Preview | wired screens for future flows: Fascicolo with SPID, «Parlami in italiano», Talent card |

## Decisions (short)
- Stack: Next.js 16, TypeScript, Tailwind, shadcn, ElevenLabs UI, `@elevenlabs/react`, `@anthropic-ai/sdk`; Vercel; PWA mobile-first.
- Onboarding: voice welcome by default after a «Start» tap, an X closes audio; voice, text and touch all work at any time.
- Demo goal: «I need to rent a room» → tax code → safe room search → registered contract → residence (20 days) → TARI (90 days).
- Palette: Airbnb structure; buttons and orb red Comune `#A50D26`; highlights yellow YesMilano `#FFC800`; wizard «Next» black as in the reference.
- Video = product demo (Higgsfield drone scene + real screens); slides = pitch story (PowerPoint, 5).
- No avatar. Logo: abstract icon from Higgsfield (yellow + red on white).

## Status log
| Time | Status |
|---|---|
| 12:36 | repo created, docs and user stories pushed |
| 13:50 | plan approved; PLAN.md, DESIGN.md (getdesign airbnb) saved |
| 14:00 | studying the 70 Airbnb reference screens; logo generation running; mockups in progress, waiting for Thomas's approval before any code |

## Open
- `.env` with `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` (missing)
- Vercel CLI login, `belt login` for AI shots
- Guide name
