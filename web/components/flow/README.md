# components/flow: onboarding wizard (mockup s0, s1, s1c, s1t, s1b)

Presentational client components. State lives in `lib/store.ts` (`useAppState()` + actions), sample data in `lib/demo.ts`.
Markup and class names are the mockup's (`app/mockup.css`); do not restyle, only `app/globals.css` adds shell and states.

## Shell rule

`app/layout.tsx` renders `.phone > .scr` (+ the decorative status bar, hidden on phones). `.scr` is a flex column:
**screens must render their parts directly inside it**, so return the component (a fragment) without a wrapper `<div>`.
If you need a wrapper, give it `style={{display:"contents"}}`.

## Composition

```tsx
const s = useAppState();
const dock = <VoiceDock lines={guide.lines} voice={s.voice} speaking={guide.speaking} status={guide.status}
  onClose={() => { setVoice(false); guide.setVoice(false); }} onSend={guide.sendText}
  onVoiceOn={() => { setVoice(true); guide.setVoice(true); }} />;

<WizardFrame progress={PROGRESS.about} onNext={...} onBack={...} onExit={...}
  voice={s.voice} onVoice={...same as dock...} dock={dock}>
  <AboutYou profile={s.profile} onProfile={updateProfile} />
</WizardFrame>
```

## Props

| Component | Props |
|---|---|
| `Welcome` (s0) | `onStart()` Start button, first tap (unlocks audio); `onSkipVoice()` the ✕, start without voice |
| `WizardFrame` | `progress` 0-100 (use `PROGRESS.about/interests/italian/need` = 18/42/62/85); `onNext()`; `nextLabel?` (default "Next", s1b uses "Yes, make my plan"); `nextDisabled?`; `onBack?` (omit = no Back); `onExit()`; `voice`; `onVoice(on)` top pill; `dock?` ReactNode; `children` body content |
| `AboutYou` (s1) | `profile`, `onProfile(patch)`. Cards from `situation` / `eu`; the "Italiano → English" chip fades in when `profile.lang` is set and not `it` |
| `Interests` (s1c) | `profile`, `onProfile(patch)`. Chips from `interests` / `worries`. Exports `INTERESTS`, `WORRIES` (`key` is stored on touch; voice values like "papers", "a room" light the right chip by regex; unknown values appear as extra lit chips) |
| `ItalianTest` (s1t) | `profile` (`italianDeclared`, `italianVerified`), `checks` (`store.italianChecks`, true/false/null), `tests?` (3 prompts, default `DEFAULT_TESTS` from the mockup), `onDeclare(n)` slider release or arrow keys (use `declareItalian`, it clears verified and checks) |
| `NeedGoal` (s1b) | `goal?` active goal label, `onSelect(goalLabel)` (use `setGoal`). Exports `NEEDS`, `needFromGoal(text)`; a goal that matches no card shows as a lit row |
| `VoiceDock` | `lines` GuideLine[] (last 2 shown, newest guide line types in), `voice`, `speaking?` (wave moves only while speaking), `status?` (connecting / error show an honest line; error switches to text input), `onClose()` X, `onSend(text)` text mode, `onVoiceOn?()` tap the orb in text mode |

## Store (`lib/store.ts`)

`useAppState()` → `{profile, goals, activeGoalId, screen, voice, italianChecks}` (persisted in localStorage, key `milano-evolution:v1`).
Actions: `updateProfile`, `setItalian(declared, verified, check)`, `declareItalian`, `setScreen`, `setVoice`, `setGoal(label) → id`,
`setActiveGoal`, `setPlan(goalId, plan)`, `toggleDone(goalId, stepId)`, `clearAll()`, selector `activeGoal(state)`.
GuideHandlers map 1:1: `onProfile → updateProfile`, `onItalian → setItalian`, `onGoal → setGoal`, `onScreen → setScreen`.
