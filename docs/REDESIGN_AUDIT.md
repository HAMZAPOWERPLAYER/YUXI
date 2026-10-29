# Yuxi Redesign Audit (D-M0)

**Baseline:** `029f7d1` on `part2`
**Scope of this document:** audit only. No runtime, content, database, scheduling or
feature behaviour is changed by D-M0.

## Verification boundary

- The repository has no Android emulator, iOS simulator or physical device attached in
  this environment.
- No release build could be installed or screenshotted for this audit.
- Visual findings below come from reading the rendered component tree and styles, not
  from a device capture.
- `UNCLEAR:` the final perceptual quality of the glow, the floating tab bar and Nastaliq
  line-height on a physical Android device until a development/release build is tested.
- `UNCLEAR:` whether every Expo Go visual difference (floating gear button, navigation
  bar, slower runtime) disappears on the eventual release build; this needs a release
  device pass.

## Screen inventory

| Screen             | Route                                                                 | Current visual character                                                         | Main problems                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home               | `src/app/(tabs)/home.tsx`                                             | Greeting, goal card, review/CTA card, three quick tiles, tip bubble              | No hero or companion-first composition; goal value is repeated three ways; quick tiles do not fit a 360dp screen evenly; no journey cue; no weekly summary          |
| Learn              | `src/app/(tabs)/learn.tsx`                                            | Course card plus two kana cards                                                  | No Path/Kana/Kanji/Grammar structure; samples use `wrap` and can leave an orphan tile; mastery is a bar only; no milestone path or floating current marker          |
| Practice hub       | `src/app/(tabs)/practice.tsx`                                         | Four full-width mode rows, script/length segments, summary card, bottom CTA      | No review-due hero; mode cards are a long list rather than a 2x2 grid; CTA scrolls away instead of sticking above the tab bar; title is generic                     |
| Stats              | `src/app/(tabs)/stats.tsx`                                            | Eight small stat tiles, activity bars, heatmap                                   | Subtitle reuses the Home subtitle; stat labels truncate on narrow screens; chart dates are raw `MM-DD` slices; heatmap cells are tiny (14dp)                        |
| Settings           | `src/app/(tabs)/settings.tsx`                                         | Long stack of cards and settings groups                                          | Repeated section/card rhythm; text-size default is not shown as 100%; no visual separation for destructive data actions beyond colour; no design-system icon rhythm |
| Kana chart         | `src/app/learn/[script].tsx`                                          | Group segment, row-based grid in one large card, legend, two buttons             | Tiles are small and border-colour driven; no sticky group headers; legend sits far below the grid; 5-column basic grid is not guaranteed on 360dp                   |
| Kana detail        | `src/app/kana/[id].tsx`                                               | Large glyph card, audio buttons, stat tiles, confusables                         | Flat stack of cards; confusable cards can wrap awkwardly; no companion response; audio hierarchy is weak                                                            |
| Course list        | `src/app/course/index.tsx`                                            | One card per unit with order badge and progress bar                              | Reads as a list, not a journey; locked and available units share the same silhouette; no path connectors or current marker                                          |
| Unit detail        | `src/app/course/[unitId].tsx`                                         | Header, summary card, lesson cards                                               | Lesson cards repeat the same card structure; no bottom Sheet for lesson details; no strong Start affordance                                                         |
| Lesson player      | `src/app/lesson/[lessonId].tsx` + `src/features/lessons/components/*` | Header, quit button, linear progress, prompt card, option buttons, feedback card | Feedback card is visually separate from the mascot; option grid does not switch between 2x2 and full-width by answer length; no combo/streak indicator              |
| Practice session   | `src/app/practice/session.tsx` + `src/features/quiz/components/*`     | Header, prompt card, wrapped options, feedback card                              | Same option/grid issues as lessons; no segmented progress; listening prompt is a plain circle; no companion dock                                                    |
| Practice summary   | `src/app/practice/summary.tsx`                                        | Accuracy ring, mascot, three stat tiles, two buttons                             | Static result; no one-time sparkle layer; no per-mistake review path                                                                                                |
| Onboarding         | `src/app/onboarding.tsx`                                              | Three steps with dots, mascot, language cards, goal cards                        | Does not use a large wave hero; language preview does not visibly demonstrate direction; cards are flat                                                             |
| About              | `src/app/about.tsx`                                                   | Mascot, wordmark, two cards, two buttons                                         | Plain stack; no hero treatment; links are buttons instead of list rows                                                                                              |
| Privacy            | `src/app/privacy.tsx`                                                 | Intro card and repeated information cards                                        | Long card stack with no visual grouping beyond section labels                                                                                                       |
| Licenses           | `src/app/licenses.tsx`                                                | Intro, font card, generated dependency list                                      | Long card; no expand/collapse; raw dependency names at full weight                                                                                                  |
| Not found          | `src/app/+not-found.tsx`                                              | Header + error state                                                             | Functional; no companion-first empty state system yet                                                                                                               |
| Root/loading/error | `src/navigation/AppRoot.tsx`, `src/components/*`                      | Full-screen spinner and basic state views                                        | Loading, empty and error states are not yet one coherent component family                                                                                           |

## Component inventory and proposed moves

New visual primitives belong in `src/components/ui/`. During D-M1–D-M9, the old paths
remain as re-export shims so screens can migrate without a flag day. D-M10 removes the
shims and any unused legacy component.

| Current file                      | Target                                     | Action                                                                     |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `src/components/AppText.tsx`      | `src/components/ui/AppText.tsx`            | Move; add Nunito selection and display cap                                 |
| `src/components/Screen.tsx`       | `src/components/ui/Screen.tsx`             | Move; keep safe-area contract                                              |
| `src/components/Row.tsx`          | `src/components/ui/Row.tsx`                | Move; preserve logical RTL behaviour                                       |
| `src/components/Stack.tsx`        | `src/components/ui/Stack.tsx`              | Move; preserve logical RTL behaviour                                       |
| `src/components/Card.tsx`         | `src/components/ui/Card.tsx`               | Move; add default/elevated/hero/glowAccent variants                        |
| `src/components/Button.tsx`       | `src/components/ui/Button.tsx`             | Move; add primary gradient, pressed spring, destructive alias              |
| `src/components/Badge.tsx`        | `src/components/ui/Badge.tsx`              | Move; keep variants, add size rhythm                                       |
| `src/components/Icon.tsx`         | `src/components/ui/Icon.tsx`               | Move; add size tokens; keep Ionicons as the one icon set                   |
| `src/components/IconButton.tsx`   | `src/components/ui/IconButton.tsx`         | Move; standardise 48dp target                                              |
| none                              | `src/components/ui/Chip.tsx`               | New selectable/filter chip                                                 |
| none                              | `src/components/ui/ListRow.tsx`            | New grouped settings/list primitive                                        |
| `src/components/ProgressBar.tsx`  | `src/components/ui/ProgressBar.tsx`        | Move; animate fill, keep RTL                                               |
| `src/components/ProgressRing.tsx` | `src/components/ui/ProgressRing.tsx`       | Move; animate fill and clamp bounds                                        |
| `src/components/Skeleton.tsx`     | `src/components/ui/Skeleton.tsx`           | Move; keep reduce-motion behaviour                                         |
| `src/components/StateViews.tsx`   | `src/components/ui/EmptyState.tsx`         | Extract the visual empty state; keep legacy wrappers until screens migrate |
| none                              | `src/components/ui/Toast.tsx`              | New                                                                        |
| none                              | `src/components/ui/Sheet.tsx`              | New bottom sheet, no blur                                                  |
| none                              | `src/components/ui/Dialog.tsx`             | New confirmation dialog, no blur                                           |
| none                              | `src/components/ui/GlowView.tsx`           | New SVG radial glow wrapper                                                |
| none                              | `src/components/ui/WavePattern.tsx`        | New static, memoised seigaiha line texture                                 |
| none                              | `src/components/ui/SpeechBubble.tsx`       | New RTL-aware bubble with tail                                             |
| none                              | `src/components/ui/MoodMascot.tsx`         | New expression crossfade wrapper                                           |
| `src/components/Mascot.tsx`       | `src/components/ui/MoodMascot.tsx` uses it | Keep `Mascot` as the asset renderer                                        |
| `src/components/MascotBubble.tsx` | Future migration                           | Superseded by `SpeechBubble` + `MoodMascot`; remove in D-M10               |
| `src/components/StatTile.tsx`     | Future migration                           | Keep for now; restyle in screen milestones                                 |
| `src/components/Segmented.tsx`    | Future migration                           | Replace with pill segmented control in D-M4/D-M5                           |
| `src/components/SettingsRow.tsx`  | `src/components/ui/ListRow.tsx`            | Migrate in D-M8, then remove                                               |
| `src/components/ScreenHeader.tsx` | Future navigation shell                    | Restyle in D-M3                                                            |

## Token audit

### Colors

The current palette has the right crimson and near-black base, but it is missing:

- `bgElevated`, `surface3`, `borderStrong`
- `textFaint` (decorative only)
- `primaryBright`, `primaryDeep`, `glow`
- `info`
- a formal mastery "new" token distinct from the old unseen grey

Existing `primaryText` (`#FF5A68`) is accessible but brighter than the specified
`primaryBright` (`#FF3B4E`). The redesign will make `primaryText` the accessible accent
text token and keep it at/above 4.5:1 on every surface it is used on.

`UNCLEAR:` the requested mastery-new grey `#5B5B6B` measures **2.73:1** against
`surface` and **2.95:1** against `background`, below the 3:1 non-text target. D-M1 keeps
the accessible unseen value `#6B6B7C` for the semantic mastery token and will document
the deviation rather than silently shipping a lower-contrast state.

### Spacing, radii, motion

- Current spacing skips 20dp.
- Current radii are smaller than the new system (md 12, lg 20, xl 28).
- No motion duration/easing tokens exist.
- No gradient tokens exist.
- Press feedback is opacity-only; the new system uses 0.98 scale with a 120ms token.

### Typography

- Current Latin headings use the system font; Nunito is not installed.
- Current display is 36/44 rather than 32/40.
- Kana hero is 104/120 rather than 96/112.
- There is no display-size cap for 200% font scale.
- `AppText` selects Japanese/Urdu families correctly but has no Latin-heading family
  selection.

## UX and accessibility risks found

1. Home duplicates the goal value and does not make the next action dominant.
2. Learn does not show a learning journey; unit/course status lives in a separate list.
3. Practice mode options are long full-width cards; the primary CTA is below the fold.
4. Quiz options always use `flexBasis: 47%`, even for long meanings. Long answers can
   become cramped; the new component must switch to full-width rows for long text.
5. Lesson and quiz progress headers are linear bars only; the spec calls for segmented
   progress.
6. The mascot appears as a static image or a separate bubble; expression changes are not
   consistently tied to feedback state.
7. Several lists are not virtualised. The course list is small today, but the path view
   and words list must be windowed from the start.
8. Kana heatmap cells are 14dp and not 48dp touch targets; they are currently visual-only,
   so that is acceptable, but the new legend must not imply they are tappable.
9. Nastaliq line-height is handled in `AppText`, but new fixed-height card layouts must
   not assume a single line.
10. Existing contrast tests cover text pairs and mastery-on-surface, but not the new
    gradient endpoints, glow overlays or chip/badge combinations.

## Implementation boundaries for this run

This run implements **D-M0, D-M1 and D-M2 only**:

- D-M0: this audit and move plan.
- D-M1: new tokens, Nunito, accessible font selection, icon size tokens, core primitives
  and unit tests. No screen redesign.
- D-M2: progress components, overlays, empty state, glow, wave motif, speech bubble,
  mood mascot and the dev-only UI gallery.

Screens are deliberately not restyled in this run. Home, Learn, Practice, players,
Stats, Settings and onboarding remain functionally unchanged until D-M4 onward.

## Non-goals and open items

- No content, database, scheduling or navigation-feature change.
- No remote fonts or images.
- No blur; glow is a static SVG radial gradient or layered border.
- `UNCLEAR:` whether the Android release build renders the SVG pattern cache as expected
  on low-end GPUs; this needs device profiling in D-M10.
- `UNCLEAR:` the exact active-tab pill width that fits the Urdu labels at 200% text scale;
  this will be measured on a release build in D-M3.
- `UNCLEAR:` final store screenshots and visual sign-off are human tasks.
