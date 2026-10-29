# Yuxi Design System

**Status:** D-M1 baseline (tokens, fonts and core primitives). Screens migrate in
D-M3 onward; this document grows with each milestone.
**Direction:** Neon Night + Companion-first, dark only for this pass.

## 1. Principles

1. **Neon Night.** Near-black surfaces, crimson accents and restrained glow.
   Glow marks progress, the current step and the primary action. It is never a
   background decoration and never replaces contrast.
2. **Companion-first.** Yuxi is part of the layout: a hero companion, a speaker
   in empty states and a reaction beside feedback. She never covers text,
   controls or progress values.
3. **A journey, not a list.** Units and kana become a path of milestones in
   D-M5. Core cards stay quiet so the path can carry the hierarchy.
4. **Calm, modest, offline.** No religious imagery, no suggestive imagery, no
   alcohol or pork imagery, no music-note decoration. All assets are bundled.

## 2. Tokens

Source: `src/theme/tokens.ts`.

### Colour

| Token           | Dark value             | Use                                           |
| --------------- | ---------------------- | --------------------------------------------- |
| `background`    | `#0B0B0F`              | App canvas                                    |
| `bgElevated`    | `#101016`              | Elevated sheet/dialog surface                 |
| `surface`       | `#15151C`              | Default card                                  |
| `surface2`      | `#1E1E28`              | Nested surface, input, icon button            |
| `surface3`      | `#272733`              | Pressed nested surface                        |
| `border`        | `#2A2A36`              | Default 1px border                            |
| `borderStrong`  | `#3A3A4A`              | Elevated/hero border                          |
| `text`          | `#F4F4F6`              | Primary copy                                  |
| `textMuted`     | `#A3A3B2`              | Secondary copy (AA on all surfaces)           |
| `textFaint`     | `#6E6E80`              | Decorative marks only; never essential text   |
| `primary`       | `#E11D2E`              | Brand fill                                    |
| `primaryBright` | `#FF3B4E`              | Decorative accent only                        |
| `primaryDeep`   | `#8F0F1B`              | Gradient start, accent border                 |
| `primaryText`   | `#FF5F6C`              | Accessible crimson text (AA on `primarySoft`) |
| `primarySoft`   | `rgba(225,29,46,0.14)` | Selected/active surface                       |
| `glow`          | `rgba(225,29,46,0.35)` | Static halo stroke                            |
| `textOnPrimary` | `#FFFFFF`              | Label on CTA gradient                         |
| `success`       | `#2FBF71`              | Correct/mastered                              |
| `warning`       | `#F5A524`              | Warning/learning                              |
| `info`          | `#4F8CFF`              | Informational/familiar                        |
| `danger`        | `#FF4D5E`              | Destructive/wrong                             |
| `overlay`       | `rgba(0,0,0,0.62)`     | Sheet/dialog scrim                            |

Each semantic colour has a matching `*Soft` surface. Text on a soft surface must
use the matching semantic text colour, not white.

### Mastery

| Tier       | Token             | Value     | Non-colour cue |
| ---------- | ----------------- | --------- | -------------- |
| New/unseen | `masteryUnseen`   | `#6B6B7C` | no mark        |
| Learning   | `masteryLearning` | `#F5A524` | dot            |
| Familiar   | `masteryFamiliar` | `#4F8CFF` | ring           |
| Mastered   | `masteryMastered` | `#2FBF71` | check          |

`#5B5B6B` was requested for new items but measures 2.73:1 on `surface`, below
the 3:1 non-text target. The system keeps `#6B6B7C` (3.48:1) and records the
deviation in `docs/DECISIONS.md`.

### Spacing, radii, sizes

- Spacing: `xxs 4`, `xs 8`, `sm 12`, `md 16`, `mdPlus 20`, `lg 24`, `xl 32`,
  `xxl 48`.
- Radii: `xs 4`, `sm 10`, `md 16`, `lg 24`, `xl 32`, `pill 999`.
- Touch target: 48dp. Button heights: 44/52/56 for sm/md/lg, with hit slop.
- Icons: 16/20/24/32.

### Gradients

Do not use Android elevation to fake glow: it produces a grey shadow, not a
neon halo. Use `GlowView` (D-M2), a low-opacity border, or a static SVG radial
gradient. Blur is forbidden.

| Token           | Stops               | Use                                         |
| --------------- | ------------------- | ------------------------------------------- |
| `hero`          | `#101016 → #2D0D12` | Home/Practice hero wash                     |
| `button`        | `#8F0F1B → #E11D2E` | Primary CTA (white label passes AA)         |
| `buttonPressed` | `#6F0A14 → #B8111F` | Pressed CTA                                 |
| `primary`       | `#E11D2E → #FF3B4E` | Decorative fills only, no normal white text |
| `card`          | `#15151C → #1E1E28` | Subtle card wash                            |

### Motion

`press 120ms`, `enter 200ms`, `fill 320ms`; press scale `0.98`; entrance offset
`8dp`. All motion is skipped or shortened when `theme.reduceMotion` is true. The
only permitted loop is the current-path-node pulse, and it must pause offscreen
and when reduce motion is on.

## 3. Typography

Source: `src/theme/typography.ts` and `src/theme/fonts.ts`.

| Variant      | Size/line  | Family                   |
| ------------ | ---------- | ------------------------ |
| `display`    | 32/40, 800 | Nunito ExtraBold (Latin) |
| `title`      | 24/32, 800 | Nunito ExtraBold         |
| `heading`    | 20/28, 600 | Nunito SemiBold          |
| `subtitle`   | 18/26, 600 | Nunito SemiBold          |
| `body`       | 16/24, 400 | System                   |
| `bodyStrong` | 16/24, 600 | System                   |
| `label`      | 14/20, 600 | Nunito SemiBold          |
| `caption`    | 13/18, 500 | System                   |
| `button`     | 16/22, 600 | Nunito SemiBold          |
| `brand`      | 20/28, 800 | Nunito ExtraBold         |
| `kana`       | 28/36      | Noto Sans JP             |
| `kanaLarge`  | 56/68      | Noto Sans JP             |
| `kanaHero`   | 96/112     | Noto Sans JP             |

`AppText` chooses the family from the resolved language, not from the UI
direction. Japanese stays LTR inside Urdu. Urdu uses Noto Nastaliq Urdu with a
1.9× line-height and 12% top padding so glyphs never clip.

Display, title, heading, kana and button variants have a `maxScale`. Body text
has no practical cap and reaches 200% OS scaling (combined with the in-app text
size). `AppText` disables React Native's automatic scaling and applies both
scales once so font size and line height stay in step.

Only two Nunito weights are bundled (600 and 800, 264 KB total). Latin body copy
intentionally stays on the system font.

## 4. Components

Source: `src/components/ui/`.

### `AppText`

- Always use instead of raw `<Text>`.
- `variant` sets size/line/family; `lang` overrides script detection;
  `color` must be a colour token.
- `align="start"` follows the resolved language direction.
- Do not hard-code `fontFamily`, `fontSize` or `lineHeight` in screens.

### `Screen`

- Owns safe areas and the scroll container.
- Tab screens pass `TAB_SCREEN_EDGES`; the floating tab bar owns the bottom
  inset (D-M3).
- System bars are styled once in the navigation root, not per screen.

### `Card`

Variants: `default`, `elevated`, `hero`, `glowAccent`.

- `default`: surface + border.
- `elevated`: `bgElevated` + `borderStrong`.
- `hero`: static `hero` gradient + strong border; children get inner padding.
- `glowAccent`: surface + crimson ring. The ring is a border, not elevation.

Legacy `tone` remains for semantic soft cards until screens migrate.

### `Button`

Variants: `primary`, `secondary`, `ghost`, `danger` (alias `destructive`).

- Primary uses the accessible `button` gradient and white label.
- Pressed state scales to 0.98 and darkens; reduce motion removes the scale.
- `loading` sets `busy`, blocks presses and keeps the label visible.
- Minimum height is 44/52/56; primary CTAs must be at least 48dp.

### `Chip`

- Selectable filter/segment chip.
- Selected uses `primarySoft`, a crimson border **and** a check icon; colour is
  never the only signal.
- Minimum visual height 44dp plus 4dp hit slop.

### `Badge`

- Non-interactive status label.
- Variants: neutral, primary, success, warning, danger, info.
- Optional icon supplies a non-colour cue.

### `IconButton`

- 48×48dp target, pill shape, 48dp minimum.
- Always requires `accessibilityLabel`.
- `filled={false}` for a quiet header action.

### `ListRow`

- Grouped settings/list line with optional icon, description, right slot and
  RTL-aware chevron.
- 56dp minimum height.
- Destructive rows use the danger token and must still be confirmed by the
  caller.

### Compatibility shims

Old paths (`src/components/AppText.tsx`, `Button.tsx`, `Card.tsx`, `Icon.tsx`,
`IconButton.tsx`, `Badge.tsx`, `Row.tsx`, `Screen.tsx`, `Stack.tsx`) re-export the
new implementation during migration. D-M10 removes the shims once every screen
imports `@/components/ui/*`.

## 5. Iconography

One family only: **Ionicons** (outline-first where a matching outline exists).
Use the `Icon` wrapper with size tokens (`sm`, `md`, `lg`, `xl`). Do not mix
Feather, Material or emoji icons into controls. Decorative icons are hidden from
TalkBack by the parent's accessible label; meaningful icons need a label on the
control.

## 6. Motif rules

Allowed: a static, stroke-only seigaiha wave pattern or asanoha geometric lines
at 4–6% opacity, rendered once behind hero content. It must never sit behind
long text, never animate, and must not reduce text contrast.

Forbidden: torii, shrines, temples, pagodas, Buddha/deity imagery, omamori,
prayer beads, Shinto/Buddhist motifs, music notes, alcohol, pork, suggestive
imagery, religious symbols of any kind.

## 7. Mascot placement map

| Context             | Expression            | Placement                                  |
| ------------------- | --------------------- | ------------------------------------------ |
| Home hero           | time/streak dependent | upper body, bleeding off card bottom/right |
| Home empty/new user | calm                  | beside first action                        |
| Practice hub        | thinking              | beside “What shall we practise?”           |
| Review due empty    | sleepy                | inside calm empty card                     |
| Quiz question       | thinking              | small dock beside prompt or feedback       |
| Correct answer      | happy                 | feedback banner                            |
| Wrong answer        | encourage             | feedback banner                            |
| Session summary     | cheer/happy/encourage | result card                                |
| Onboarding          | calm/cheer            | large wave hero                            |
| Error/loading       | thinking              | centred state                              |

Yuxi must not cover text or tap targets, and the same expression should not be
used for opposite feedback states.

## 8. RTL and localisation

- Direction comes from `useDirection()` and the logical `Row`/`Stack`; never
  call `I18nManager.forceRTL`.
- Mirror back/chevron icons, progress direction, speech-bubble tail, path
  alternation, sheet drag handle and tab order.
- Japanese text is forced LTR inside Urdu layouts with `lang="ja"`.
- Urdu uses the Nastaliq line-height contract; never set a fixed card height that
  assumes one line.
- Western digits are the documented default for Urdu. Do not convert numbers to
  Arabic-Indic glyphs.
- Every new string goes into both `src/i18n/en.json` and `src/i18n/ur.json` with
  identical keys.

## 9. Accessibility contract

- Text contrast: WCAG AA (4.5:1), including composited `primarySoft` surfaces.
- Non-text indicators: 3:1.
- Touch targets: 48dp.
- Every icon-only control has a label; every control exposes role and state.
- Feedback uses icon + text + colour, never colour alone.
- Respect reduce motion; no infinite loops on scrolling screens.
- Test at 100%, 150% and 200% OS font scale on 360dp and 412dp widths.

## 10. Do / don't

**Do**

- Use tokens and `AppText`.
- Keep one primary CTA per screen.
- Use glow on at most three elements per screen.
- Put companion reactions beside the state they describe.
- Prefer static texture over animation.

**Don't**

- Don't use `BlurView`, elevation shadows or remote assets.
- Don't put white normal text on `primaryBright`.
- Don't use `textFaint` for essential copy.
- Don't use colour as the only mastery/selection/feedback signal.
- Don't animate long lists or loop background patterns.
- Don't add a second icon family or a third Nunito weight.
