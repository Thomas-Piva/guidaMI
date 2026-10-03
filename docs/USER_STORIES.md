# User stories

Track 01 brief (slides): an agent that speaks the newcomer's language, reasons over the City's rules and builds a personal plan, built on top of YesMilano's international student path and the City's welcome emails. Without identity data it becomes "a smarter FAQ", so we show which data a version 2 needs.

Pitch focus (2 minutes, one thing): **a voice onboarding in your language that fills your profile while you talk and gives you your first plan, with official sources.**

## Personas

| | Who | Moment |
|---|---|---|
| **Sam** | 24, international student, speaks English, choosing between Milano, another European university and one in Sardinia | before arriving |
| **Nour** | 31, foreigner who just moved to Milano, speaks English, knows nothing about how the city works | first week |
| **City** | YesMilano International Student Desk / Comune di Milano | day one and after |

## MVP (demo at 16:00)

| # | As… | I want… | So that… | Done when |
|---|---|---|---|---|
| US1 | Sam or Nour | to talk to the guide by voice in English (or my language) | I don't have to read pages in Italian | the guide listens continuously and answers aloud in my language; typing works as a fallback |
| US2 | Sam or Nour | the guide to understand whether I'm still deciding or already in Milano | the advice fits my moment | the first exchange sets "Coming to study" or "Just arrived" on my profile |
| US3 | Sam or Nour | to see my profile fill in while I talk | I trust what the guide understood | name, from, study or reason, arrival, interests, Italian 0-10, worries update live; I can correct by speaking or dragging the Italian slider |
| US4 | a learner | the guide to estimate my Italian and slip in one easy Italian word per answer | I start learning from minute one | the slider moves to Claude's estimate; each answer contains one Italian word in context |
| US5 | Sam | a plan of what to do before I leave and in the first days | I arrive prepared | 3-5 ordered steps (visa, tax code, residence permit, transport…), each with when, why for me and a YesMilano source link |
| US6 | Nour | a plan of what to do this week | I stop feeling lost | 3-5 ordered steps for someone already here, each with a source; different from Sam's plan |
| US7 | Sam or Nour | to know which services are for me | I use what the City already offers | 2-3 matches (student transport pass, health service, library card and Italian courses, patronato, Student Desk), each with why me and a source |
| US8 | Sam or Nour | my first Italian sentence for my first real situation | I can try it at the counter | one phrase with meaning and a play button |
| US9 | Sam or Nour | to know what to double-check and with whom | I don't rely blindly on the AI | the plan ends with what to verify with the City and how |
| US10 | Sam or Nour | to give only my first name and keep my profile on my device | my data stays mine | no passport, address or birth date asked; profile saved on the device; one tap deletes it |

## Day one (the City)

| # | As… | I want… | So that… |
|---|---|---|---|
| US11 | YesMilano / Comune | to add the guide link to the existing welcome email and to the YesMilano student page | newcomers find it the day they arrive |
| US12 | the Chief Data Officer | an anonymous list of questions the sources could not answer | we know which pages and datasets to add |

## Version 2 (pitch slide only)

| # | Story |
|---|---|
| V1 | As Nour, I photograph my passport and the guide pre-fills the forms (tax code, residence permit, residence, TARI, ATM); I check and sign. |
| V2 | As Sam, my profile lives in the Fascicolo del Cittadino and is filled once from SPID/CIE and ANPR via PDND (once-only). |
| V3 | As Nour, I meet Milanesi who chose to speak Italian with me ("Parlami in italiano", modelled on Catalonia's Voluntariat per la Llengua). |
| V4 | As a company, I find international graduates who opted in, before they leave Milano. |
