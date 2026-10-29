# Design QA checklist

**Scope:** Neon Night + Companion-first redesign, milestones D-M0–D-M10.
**Status:** D-M2 component baseline. Screen-level visual QA starts at D-M3.
**Verification boundary:** no Android emulator, iOS simulator or physical device
was available in the implementation environment. Do not mark a visual item done
until it has been checked on a release or development build on a real device.

## Automated gate (run per milestone)

```bash
npx prettier --write <changed files>
npm run check
npm run format:check
```

`npm run check` runs typecheck, lint, content validation, schema check, Jest and
the offline network gate. A milestone is not complete while any command fails.

## Every screen (D-M3 onward)

### Visual

- [ ] Tokens only: no hard-coded colours, radii, spacing, font sizes or shadows.
- [ ] Glow appears on at most three elements and never replaces contrast.
- [ ] Cards use the intended variant; no accidental nested-card walls.
- [ ] No blur, Android elevation shadow, remote asset or second icon family.
- [ ] Companion sits beside the state it describes and never covers text,
      progress values or tap targets.
- [ ] Seigaiha/asanoha texture is static, at 4–6% opacity and behind short hero
      content only.

### Layout and text

- [ ] 360dp and 412dp widths, with 100%, 150% and 200% OS font scale.
- [ ] No clipped Urdu ascenders/descenders; line height and top padding come
      from `AppText`.
- [ ] Japanese stays LTR inside the Urdu UI (`lang="ja"`).
- [ ] Controls grow with text; no fixed-height rows that assume one line.
- [ ] Long labels wrap or ellipsize deliberately; no mid-word truncation.

### RTL

- [ ] Back/chevron icons mirror; tab order and logical `Row`/`Stack` order
      follow the reading direction.
- [ ] Progress bar/ring travels right-to-left in Urdu.
- [ ] Speech-bubble tails mirror; message text does not.
- [ ] Sheet handle and dialog actions keep a sensible order.

### Accessibility

- [ ] TalkBack/VoiceOver order matches the visual reading order.
- [ ] Every control has a label, role and state; icon-only controls are
      labelled and at least 48dp.
- [ ] Correct/wrong/selected/disabled states are announced, not colour-only.
- [ ] Progress exposes 0–100 `accessibilityValue`.
- [ ] Toasts use a polite live region; dialogs contain focus.
- [ ] Reduce Motion removes press scale, fades and fills; static skeletons stay
      visible.
- [ ] Text contrast is AA (4.5:1) and non-text indicators are 3:1 on the
      composited surface.

## Component gallery

Open `/dev/ui-gallery` in a development build. In production the route redirects
to `/` and is not linked.

- [ ] Toggle English/Urdu and re-check every section.
- [ ] Check all OptionButton states, including disabled and wrong.
- [ ] Check toast overlay, sheet, non-destructive dialog and destructive dialog.
- [ ] Check speech-bubble start/end tails in both directions.
- [ ] Check the ring at 0%, 68% and 100%, and the bar at 0% and 100%.
- [ ] Check the static skeleton and wave pattern.
- [ ] Check 200% OS text size; the sheet content must scroll.
- [ ] Enable Reduce Motion in OS settings and repeat the motion checks.

## Release-build checks (unavailable here)

- [ ] Install a signed release build (not Expo Go), because custom native splash
      and `expo-notifications` topic subscription need native code.
- [ ] Measure cold start, screen transition and scroll smoothness on a
      mid-range Android device.
- [ ] Verify no network requests at runtime.
- [ ] Verify the gallery cannot be opened in production.
- [ ] Verify splash, status bar, navigation bar and safe-area insets.
- [ ] Verify 48dp targets with the accessibility scanner.
- [ ] Verify the final asset budget: new assets under 400 KB.

## Known open items

- Human Japanese/Urdu/halal review remains pending; all content stays
  `needsHumanReview: true`.
- `npx expo-doctor` reports SDK 58 patch drift for 11 Expo packages; run
  `npx expo install --fix` when network/cache access is available.
- Double-tap navigation protection and web share-sheet behaviour need device
  verification.
- Remaining `UNCLEAR:` items are listed in `docs/DECISIONS.md`.
