# components/app: goal-flow screens (S2-S8)

Presentational client components. Each one renders `.bar` + `.body` (+ `.foot`) as a fragment, to go
straight inside the layout's `.scr` (flex column). Classes come from `app/mockup.css`; small extras
(button/input resets, `.mescroll`, warnings) are in `shared.tsx` (`<UiStyle/>`, deduped by React 19).
To show the voice dock (s2 has it), render `<VoiceDock/>` right after the screen component: `.body` is `flex:1`, so the dock sits at the bottom.

| Component | Mockup | Props (required in bold) |
|---|---|---|
| `Reading` | s2 | **`events: PlanEvent[]`** (stream so far), `voiceOn`, `onToggleVoice`, `onExit`, `onRetry` (shown on `error` event). `slug` is shown as `yesmilano.it · {slug}`, so send e.g. `how-to/rents`. |
| `PlanView` | s3 | **`plan`**, **`done: string[]`**, **`onOpenStep(step)`**, `goalIt`, `lang` (default `en`), `onHome`, `onListen` (default speaks headline + steps), `onOpenPreviews` («Next stops» row). Journey cards: each step shows `/icons3d/<icon>.webp` in `.art` (`step.icon`, else `stepIcon()` guesses from `fill_form`/title: taxcode for codice fiscale/permit, room for housing/residenza/TARI) and, when `step.place` exists, the `.place` block (name, address, metro, «Source: dati.comune.milano.it», «Map ↗» to Google Maps `<address>, Milano`). Locking: steps up to (first not done + 1) are open, the rest are `.lock` and not tappable. Phrase play = `speechSynthesis` it-IT. |
| `StepSheet` | s4 | **`step`**, **`done`**, **`onClose`**, **`onAsk(step)`**, **`onToggleDone(next)`**, `onFill(formId)` (shown when `step.fill_form`), `lang`. Render it in the same `.scr` after `PlanView`: veil + scrim + sheet overlay it. «Open {service} ↗» comes from `lib/services.ts` via `step.service_id`; `step.place` shows the same place block as the card. Esc closes. |
| `PassportScan` | s5 | **`onBack`**, **`onConfirm(fields)`**, `onHelp`, `initial` (opens on the list), `read(image)` (default `readPassport`: POST /api/passport), `specimenSrc` (default `/specimen-passport.png`). Photo is resized to JPEG max 1600 px before upload. |
| `FormsView` | s6 | **`cards`** (= `buildForms(fields, extra)`), **`fields`**, **`extra`**, **`onExtraChange(key, v)`** (non-passport keys: address, m2...), **`onPassportChange(key, v)`** (missing passport keys, e.g. `place_of_birth`), **`onBack`**, `onHelp`, `download` (default `downloadPdf`: POST /api/forms/pdf, saves `milano-evolution-{form}.pdf`). Rebuild `cards` on every change. |
| `Home` | s8 | **`goals`**, **`onProfile`**, **`onOpenGoal(id)`**, **`onNewGoal`**, **`onPreviews`**, `name`, `italianVerified`, `forms: {ready, toFinish}`, `voiceOn`, `onToggleVoice`, `onForms`, `onItalian` (tiles without a handler render disabled). Goal cards use the 3D icon picked from the goal label (`goalArt`). |
| `Previews` | s7 | **`onHome`**. Static, labelled «soon». |
| `ProfileView` | none (no mockup frame) | **`profile`**, **`onBack`**, **`onDeleteAll`** (two taps, no `confirm()`), `passport`. |

Exported helpers: `readPassport`, `PassportReadError`, `toJpegDataUrl`, `EMPTY_PASSPORT` (PassportScan),
`downloadPdf`, `PdfForm` (FormsView), `guidesFrom` (Reading), `isLocked` (PlanView), `speak`, `goalArt`, `stepIcon`,
`icon3d`, `mapsUrl`, `PlaceBlock`, `useReducedMotion` (shared). `lib/services.ts`: `SERVICES`, `service(id)`.

## Palette
No hardcoded colours: everything uses the Study & Work tokens appended to `app/mockup.css`. Extra classes in
`shared.tsx`: `.pv.me-warn` (orange warnings), `.me-danger` (delete, orange), `.me-link` (cyan source links),
`.tag.dl.me-ok` (green, PDF downloaded). The 3D icons are RGB on white, shown with `mix-blend-mode:multiply`.

## Honest states
- Passport: scanning (photo + scan line, labels faded) → fields appear one by one (280 ms) as editable inputs, empty ones yellow.
  422 → «Retake the photo with more light»; 429 → «The reader is busy»; 413/415 or undecodable file → «This photo can't be opened»;
  503 `missing_keys` / 5xx / network → «The passport reader is not connected», empty editable fields so the flow goes on by hand.
- Forms: PDF error keeps the card open with all data visible (selectable) and «Retry PDF».
- Plan reading: `error` event → «I can't read the guides right now» + Retry; `fallback` guides say «saved copy».
- `prefers-reduced-motion`: fields and typing appear at once, no scan delay on reveal.
