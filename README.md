# Yuxi: Learn Japanese

Yuxi is a private, offline-first mobile app that teaches Japanese **Hiragana** and
**Katakana** to Urdu speakers. It is built with Expo and React Native and keeps every
piece of learning data on the device: no account, no backend, no ads, no analytics and
no network requests.

The interface is fully bilingual (Urdu and English), with Urdu as the default. The app
uses a calm dark theme, a crimson accent (`#E11D2E`), bundled Noto fonts and a single
centralized mascot asset map.

## Feature overview

| Area             | What is included                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Learning content | 208 kana records across Hiragana and Katakana, in basic, dakuten/handakuten and yōon groups              |
| Charts           | Grouped kana charts with romaji toggle, mastery colors and per-kana detail                               |
| Audio            | Japanese pronunciation through the device text-to-speech engine, including a missing-voice recovery flow |
| Practice         | Kana → Romaji, Romaji → Kana, Listening, plus Mixed mode                                                 |
| Question engine  | Adaptive selection weighted by overdue cards, weak cards and new cards; four unique options per question |
| Scheduling       | SM-2 inspired spaced repetition with lapses, ease adjustment and a 180-day interval cap                  |
| Motivation       | XP, levels, daily goal, current/best streak and a session-complete bonus                                 |
| Statistics       | 7/30-day accuracy, 14-day activity chart, kana mastery heatmap and lifetime totals                       |
| Data             | SQLite persistence with versioned migrations, JSON backup export/import and double-confirmed reset       |
| Reminders        | One local daily reminder with three rotating messages; no push server                                    |
| Settings         | Language, text size, daily goal, haptics, reminder, backup and reset                                     |
| Information      | About, privacy policy, generated open-source license list and a not-found screen                         |
| Accessibility    | Screen-reader labels, 48 pt targets, reduced-motion hook, large-text support and explicit RTL layout     |

## Technology

- Expo SDK **58.0.19**, React Native **0.88.0**, React **19.3.0**
- Expo Router **58.0.26** with typed routes disabled
- TypeScript **6.0.3** in strict mode with `noUncheckedIndexedAccess`
- Expo SQLite **58.0.14**, Expo Notifications **58.1.6**, Expo Speech **58.0.3**
- Zod **4.6.7** for backup validation
- Jest **30.5.2**, jest-expo **58.0.12**, Testing Library **14.1.0**, sql.js **1.15.2**
- ESLint 9 with `eslint-config-expo` and Prettier 3

The full dependency list is in `package.json`; generated license metadata is in
`src/generated/licenses.json`.

## Getting started

Requirements: Node.js 20 or newer, npm, and an Android or iOS device/emulator for the
best experience.

```bash
npm install
npx expo start
```

Useful commands:

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm run format:check     # prettier --check .
npm test                 # 301 Jest tests
npm run test:coverage    # coverage report with thresholds
npm run check:network    # fails if network primitives appear in src/
npm run check            # typecheck + lint + tests + privacy gate
npx expo-doctor          # dependency and config diagnosis
npm run licenses         # regenerate src/generated/licenses.json
```

`npx expo-doctor` performs one remote React Native Directory check. If the directory
service is unavailable, the command reports that single check as failed even when the
local project checks pass.

### Native builds

This project relies on Continuous Native Generation. Do not create or edit `android/` or
`ios/` by hand. Install dependencies with `npx expo install`, then build locally with:

```bash
npx expo run:android
# or, on macOS
npx expo run:ios
```

For cloud builds, install and authenticate `eas-cli`, add an `eas.json` for the target
profile, and run `eas build`. EAS is not configured in this repository yet, and no
remote has been added.

Local notifications remain available in Expo Go on SDK 58, but the notification icon,
channel and splash configuration are applied by a native build. Use a development or
production build to verify those assets on a device.

### Platform notes

- **Android:** notification permission is requested only when the daily reminder is
  turned on. The app creates a `yuxi-daily-reminder` channel and schedules at most one
  daily notification. Android may deliver inexact alarms slightly after the chosen time.
  The manifest declares `INTERNET` and `RECEIVE_BOOT_COMPLETED` because Expo modules add
  them; the app opens no connections, and `npm run check:network` enforces that. Broad
  storage permissions added by `expo-file-system` are explicitly blocked, because export
  and import use the system share sheet and document picker.
- **iOS:** local notifications do not require a push entitlement; the config plugin is
  set with `enableRemoteNotifications: false`.
- **Web:** the app can render in a browser for development, but local reminders are
  reported as unsupported and Japanese TTS depends on browser voices.

## Project structure

```text
src/
  app/                  Expo Router routes (screens and layouts)
  components/           Shared UI primitives (Button, Card, Row, Stack, …)
  config/               App version and contact constants
  db/                   SQLite client, migrations and repositories
  features/
    backup/             Backup schema, build/apply service and file helpers
    kana/               Kana data, selectors and mastery model
    practice/           Practice setup components
    progress/           XP, levels, goals and streaks
    quiz/               Question selection, session engine and quiz UI
    reminders/          Reminder copy and scheduling rules
    settings/           Settings model, time picker and data actions
    srs/                SM-2 inspired scheduler
    stats/              Statistics aggregation
    study/              Transactional answer/session persistence
  generated/            Generated license metadata
  hooks/                Shared hooks (reduced motion)
  i18n/                 Urdu/English resources, provider and helpers
  navigation/           Root stack, tab bar and app bootstrap
  providers/            Settings and progress read models
  services/             Clock, notifications, TTS, haptics, backup files
  theme/                Tokens, typography, fonts, theme provider and mascot map
  types/                Shared domain types
  utils/                Date, seeded random and local logging helpers
__tests__/              Unit and integration tests
assets/                 Icons, splash art, placeholder mascot PNGs
docs/                   Privacy, license and content-review documentation
scripts/                License generation and offline privacy gate
```

The Expo template for SDK 58 places routes in `src/app/`; the project keeps that layout
and keeps non-route code outside `src/app/`.

## Data and storage

The database is `yuxi.db`, opened lazily through `src/db/client.ts`. Schema version 1
contains:

| Table           | Purpose                                                               |
| --------------- | --------------------------------------------------------------------- |
| `kv_settings`   | Key/value application settings                                        |
| `kana_progress` | Per-kana SM-2 state and answer counters                               |
| `review_log`    | Append-only answer history                                            |
| `daily_stats`   | XP, active seconds, question counts and goal completion per local day |
| `meta`          | Session-complete markers and device-local reminder identifier         |

Migrations run inside transactions and are tracked with `PRAGMA user_version`. Profile
import replaces all user-owned rows atomically, so a failed import cannot leave a
half-restored profile.

### Backup format

Backups are JSON with `format: "yuxi-backup"` and `version: 1`. The file is capped at
10 MB, validated with Zod, and excludes the device-local notification identifier. Both
Urdu and English settings travel with the backup. Import requires an explicit
confirmation because it replaces current progress.

## Learning logic

- **SM-2:** a correct answer under 2.5 s scores quality 5, a normal correct answer
  scores 4, a correct answer over 8 s scores 3, a wrong answer scores 1, and a wrong
  answer over 12 s scores 0. Lapses return after 10 minutes. Ease never drops below 1.3
  and intervals never exceed 180 days.
- **Selection:** due cards first, weighted by how overdue they are; then weak cards
  (below 70% accuracy with at least 3 attempts); then new cards, at most 5 per session.
  Spare slots go to studied cards, and the last three kana are avoided when choosing
  the opening question.
- **XP:** 10 XP for a correct answer, 2 XP for a wrong answer, and 20 XP for finishing
  a session. A level requires 200 XP.
- **Time:** active seconds are capped at 120 seconds per answer tick and stored per
  local day. A day counts toward the streak when the daily goal is met or a session is
  completed.

All randomness flows through `src/utils/random.ts`; all time access flows through
`src/services/clock.ts`. This keeps tests deterministic.

## Privacy and offline guarantees

- No `fetch`, XHR, WebSocket, analytics, ads, login or backend code is present in
  `src/`; `npm run check:network` enforces the main network primitives.
- The Android manifest still declares `INTERNET` because Expo's file-system module adds
  it, but no app code opens a connection. Storage permissions are blocked in `app.json`
  and file access goes through the system picker and share sheet.
- Fonts and images are bundled. The app does not request remote assets.
- Export writes a file to the app cache and opens the system share sheet only when the
  user chooses to share it. Import uses the system document picker.
- The privacy policy shown in the app lives in `src/app/privacy.tsx` and is documented
  in `docs/privacy.md`.

## Accessibility and RTL

Surfaces use logical `Row`/`Stack` primitives rather than hand-written left/right
styles. The app reads the language direction explicitly and does **not** call
`I18nManager.forceRTL`, so switching language does not require a restart. Directional
icons (such as the back chevron) are chosen from the current direction.

Text sizes are driven by a single scale in the theme provider, and interactive controls
use accessible labels and state. The reduced-motion hook is available for screens that
add animation in Part 2.

## Testing

The test suite covers the domain logic, SQLite migrations and repositories, backup
round-trips, study persistence, notifications, TTS voice selection, date/random helpers,
i18n key parity and theme contrast.

Latest local run:

- **301 tests passing** across 22 suites
- Statements **98.64%**, branches **93.11%**, functions **99.57%**, lines **99.61%**
- Coverage thresholds: statements 85%, branches 80%, functions 90%, lines 85%

UI screens are exercised by TypeScript and lint but do not yet have component-level
render tests. The app was not launched on a physical device or emulator in the build
environment used for this milestone; see `docs/content-review.md` and the final
milestone report for the exact verification boundary.

## Content review

Every kana table and Urdu pronunciation hint is marked `needsHumanReview: true`. The
content is structurally complete and tested, but a Japanese teacher and a native Urdu
speaker must review the readings, hints and confusable pairs before release. The review
checklist is in `docs/content-review.md`.

## Known limitations

- Mascot PNGs are placeholders. Replace the five files in `assets/mascot/` without
  changing names or sizes; `src/theme/mascot.ts` is the single source of truth.
- Stroke-order diagrams are not implemented; the kana detail screen says they are
  planned for a future update.
- Audio uses device TTS and has no bundled recordings. Devices without a Japanese voice
  show a recovery flow instead of failing silently.
- The theme is dark by default. Light tokens exist in the theme layer, but Part 1 does
  not expose a theme switch in Settings.
- Reminders are local-only and may be delivered approximately by the OS.
- No EAS project, remote, signing credentials or store listing is configured.

## License

The application source is released under the MIT License; see `LICENSE`. Bundled Noto
fonts are licensed under the SIL Open Font License 1.1. Dependency license metadata and
the full font license text are documented in `docs/licenses.md`.
