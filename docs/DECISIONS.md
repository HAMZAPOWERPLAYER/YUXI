# Architecture Decisions

This file records the decisions that shape Yuxi. It is the reference future
milestones (and future maintainers) should read before changing architecture.
Each entry lists the context, the decision, and the consequences we accept.

**Last updated:** 2026-10-27 (Part 2, milestone P2-M0)

## ADR-001: Expo with Continuous Native Generation

**Context.** The app targets Android and iOS from one TypeScript codebase. The
build environment has no Xcode and no committed native projects.

**Decision.** Use Expo SDK 58 and Expo Router. Keep `android/` and `ios/`
generated through `npx expo prebuild`/`npx expo run:*`; never edit generated
native folders by hand. Native configuration belongs in `app.json` and config
plugins.

**Consequences.** Native changes must be expressible as config plugins. A device
or emulator is still required to verify native behaviour. The repository stays
free of generated native noise.

## ADR-002: Offline-only, no account, no telemetry

**Context.** The product promise is a private learning app for Urdu speakers.

**Decision.** Ship no backend, login, analytics, ads, remote assets or network
calls. All content, fonts and images are bundled. Export/import is user
initiated. `npm run check:network` is a release gate.

**Consequences.** Sync, cloud backup and server-side content updates are out of
scope. Any future feature that needs the network requires an explicit product
decision and a privacy-policy change first.

## ADR-003: Urdu-first bilingual UI

**Context.** Urdu is the primary audience language, but technical terms and
some learners are more comfortable in English.

**Decision.** Use a typed i18n resource with identical `ur` and `en` key sets.
Urdu is the default. Layout direction is read from the selected language; the
app does not call `I18nManager.forceRTL`. Japanese text is always rendered LTR
inside RTL layouts.

**Consequences.** Every new string needs both languages. Tests enforce key
parity. Layout must use logical `Row`/`Stack` primitives rather than
left/right styles.

## ADR-004: SQLite with versioned, transactional migrations

**Context.** Learning progress must survive app updates and device restarts.

**Decision.** Use Expo SQLite with an explicit migration list tracked by
`PRAGMA user_version`. Each migration runs in a transaction. Repositories talk
to a narrow `DatabaseConnection` interface so tests can run the same SQL against
`sql.js`.

**Consequences.** Schema changes require a new migration and a v1 fixture test.
Rollback-only columns may be kept for one release. Destructive reset requires
double confirmation.

## ADR-005: SM-2 inspired scheduling, one engine for every item type

**Context.** Part 1 schedules kana. Part 2 adds vocabulary and sentences, and
future parts add kanji.

**Decision.** Keep one scheduling rule set (quality, ease floor 1.3, ten-minute
lapse, 180-day cap). Generalize the stored item identity to
`(item_id, item_type)` in schema v2 instead of duplicating the algorithm.

**Consequences.** Existing kana rows are migrated into the generalized table.
All item types share review semantics and tests. Item ids must be globally
unique across content types.

## ADR-006: Backup format is versioned and validated with Zod

**Context.** Users can move progress between devices through a JSON file.

**Decision.** Backups carry `format` and `version`. Version 1 is immutable;
version 2 adds SRS items, lesson progress and bookmarks while still accepting
v1 imports. Import is transactional. Unknown versions are rejected. The file
size is capped before parsing.

**Consequences.** Every format change needs a migration path and round-trip
tests. The device-local notification identifier is never exported.

## ADR-007: Content is authored JSON validated by Zod

**Context.** Course content must be reviewable, diffable and impossible to ship
with missing translations or broken references.

**Decision.** Author one JSON file per unit plus a `course.json` index. Zod
schemas in `src/features/content/schema.ts` are the single source of truth; the
TypeScript types are inferred from them. A generated JSON Schema is committed
for editor/tooling support. Authored files carry `needsHumanReview: true`.

**Consequences.** Content edits are ordinary code review. Schema changes need
regenerated JSON Schema files (`npm run content:schema`). The app parses content
at the boundary instead of trusting TypeScript casts.

## ADR-008: Explicit lazy unit registry

**Context.** Loading all units at startup would slow cold start as the course
grows, but Metro cannot resolve a computed `require()` path at bundle time.

**Decision.** `contentRegistry.ts` contains an explicit map of unit id to a
literal `require()` loader. Units are parsed and cached on first access.
`loadAllUnits()` sorts by `unit.order`. The content validator fails if a JSON
file and the registry disagree (`registry-missing` / `registry-orphan`).

**Consequences.** Adding a unit requires two touches: the JSON file and one
registry line. Forgetting the registry line fails CI. If the explicit map
becomes unwieldy at hundreds of units, generate it from a script rather than
introducing a runtime dynamic require.

## ADR-009: Two validation layers plus a dev-only script

**Context.** Zod catches shape errors, but not duplicate ids, broken
cross-references, lesson size or unsafe vocabulary.

**Decision.**

1. **Schema (Zod):** field shape, allowed enums, script/character rules,
   required review flags.
2. **Bundle validator (`validateContent`):** duplicate ids, course/unit/lesson
   links, item membership, token/segment concatenation, references, unit and
   lesson sizes, unlock order, forbidden terms and review flags.
3. **CLI (`npm run validate:content`):** reads the real data directory, parses
   every file, checks registry drift and prints a per-unit table. The CLI is
   TypeScript run through `tsx` (rather than a standalone `.mjs` file) so it
   imports the exact same schemas and types as the app; the npm script name is
   the stable interface.

`npm run check` runs the CLI; Jest covers both layers with the fixture bundle.
Warnings (for example an explicitly allowed halal request) do not fail the
build. Errors do.

**Consequences.** The app does not run the full bundle validator at runtime;
it only parses each unit when loaded. Release checks must run the CLI on the
whole course.

## ADR-010: Content safety is a configurable guard rail

**Context.** The app is family-friendly and halal-friendly. A small number of
practical phrases must mention pork or alcohol to ask whether food contains
them.

**Decision.** `forbiddenTerms.ts` defines groups for pork, alcohol, dating/
romance, gambling and music. Matches are errors unless the group explicitly
allows the item tag `halal-request` or `dietary-request`. Only pork and alcohol
groups carry that exception. The validator emits a warning for an allowed
mention so reviewers can see it.

**Consequences.** The list is conservative and must grow with the content. The
exception is for polite questions/statements, never for promotion. Adding a new
exception requires updating both the config and the review checklist.

## ADR-011: Furigana is data, not runtime parsing

**Context.** Ruby text must render correctly without a morphological parser or
network service.

**Decision.** Items may carry `segments: { text, reading? }[]`, and sentence
tokens carry optional readings. Segments must concatenate exactly to the base
Japanese text. The renderer will stack `Text` elements rather than parse kanji.

**Consequences.** Authors must supply segmentation for kanji items. The
validator catches drift between `ja` and its segments. A runtime parser is not
needed and remains out of scope.

## ADR-012: Hepburn romaji with explicit teaching choices

**Context.** Learners need one consistent romanization, but a few kana have
multiple defensible conventions.

**Decision.** Use lowercase Hepburn (`shi`, `chi`, `tsu`, `fu`, `ji`) and allow
macrons or `ou`/`oo` spellings in authored text. Reject uppercase and common
non-Hepburn syllables. Keep `wo` for `を` and `dji`/`dzu` for `ぢ`/`づ` until a
human reviewer decides otherwise (see UNCLEAR items).

**Consequences.** The validator rejects `si`, `tu`, `hu`, `sya` and similar
spellings. The review document records the teaching choices that are not purely
mechanical.

## ADR-013: IDs are stable user data

**Context.** Progress, SRS state and bookmarks reference content ids.

**Decision.** IDs match `^[a-z0-9][a-z0-9-]*$` and are globally unique across
vocabulary and sentences. Before the first public release, corrections are
allowed. After release, a rename needs a data migration and a backup-format
change, not a silent edit.

**Consequences.** Content authors must not derive ids from mutable display
text. The validator checks duplicates within and across units.

## ADR-014: Test strategy and fixture bundle

**Context.** Content rules must be testable without shipping test content.

**Decision.** Keep a complete 21-item fixture bundle under
`__tests__/fixtures/content.ts`. Validator tests clone it and mutate one rule at
a time. JSON Schema freshness is enforced by `npm run content:schema:check`,
not by byte comparison in Jest, because Babel normalizes Unicode regexes during
test transforms.

**Consequences.** New validator rules need a fixture mutation test. The fixture
is not bundled into the app. The schema check remains deterministic in Node.

## ADR-015: Time and randomness are injectable

**Context.** Streaks, due dates, challenges and tests need reproducible time.

**Decision.** Access time through `src/services/clock.ts` and randomness through
`src/utils/random.ts`. Pure functions accept timestamps/seed values instead of
reading the clock directly.

**Consequences.** Tests use fake clocks. Future challenge generation can be
seeded by the local date.

## ADR-016: Notifications are local-only and at most daily

**Context.** Reminders should help without becoming pressure.

**Decision.** Use Expo Notifications locally, one daily reminder maximum,
disabled by default until the user opts in. No push server. Delivery may be
inexact on Android.

**Consequences.** No remote notification token is collected. Part 3 engagement
features must keep the same limit.

## Open questions

These are intentionally not guessed. Each one needs a human decision.

- `UNCLEAR:` whether `ぢ`/`づ` should render `dji`/`dzu` or standard `ji`/`zu`.
- `UNCLEAR:` whether `を` should be taught as `wo` or particle `o`.
- `UNCLEAR:` final Japanese and Urdu review sign-off for Part 1 kana and all
  Part 2 content; every file remains `needsHumanReview: true` until then.
- `UNCLEAR:` final copyright holder and license owner (currently MIT,
  "Copyright (c) 2026 Yuxi contributors").
- `UNCLEAR:` final Android application id and support email (currently
  `com.hamzapowerplayer.yuxi` and `hamzapowerplayer.global@gmail.com`).
- `UNCLEAR:` whether Android `INTERNET` can be removed from production builds
  without breaking development tooling.
- `UNCLEAR:` whether the existing light theme tokens should become a user
  setting.
- `UNCLEAR:` EAS/store ownership, signing credentials and release process
  (Part 4 scope).
- `UNCLEAR:` when the `needsHumanReview` literal should become a boolean and
  be flipped to `false` after real review; Part 4 expects a release gate on the
  remaining `true` values.
