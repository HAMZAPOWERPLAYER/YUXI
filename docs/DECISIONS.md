# Architecture Decisions

This file records the decisions that shape Yuxi. It is the reference future
milestones (and future maintainers) should read before changing architecture.
Each entry lists the context, the decision, and the consequences we accept.

**Last updated:** 2026-10-29 (UI redesign D-M2; Apache-2.0 licensing)

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
unique across content types. `review_log.kana_id` is retained as the generic
item id so the append-only history needs no rewrite. `kana_progress` is kept as
a mirrored table for one release so a user who rolls back to a v1 build still
sees their kana progress; new vocabulary and sentence rows exist only in
`srs_items`.

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

## ADR-017: Lesson progress and bookmarks live in dedicated tables

**Context.** Part 2 needs per-lesson completion for unlocking and resuming, plus
saved vocabulary and sentences for review.

**Decision.** Store lesson results in `lesson_progress` keyed by `lesson_id` and
bookmarks in `bookmarks` keyed by `(item_id, item_type)`. Both travel in backup
format v2. Lesson results are written only after a lesson finishes; bookmarks
can be toggled from search or a lesson.

**Consequences.** Unlock logic reads one table instead of inferring progress from
review logs. Bookmarks survive content updates by id and must be cleaned up or
migrated if an id ever changes.

## ADR-018: Exercise generation is pure and seeded

**Context.** Lessons need varied practice without a server, and tests must be
deterministic. Authored templates should stay readable in JSON.

**Decision.** `src/features/exercises/` exposes pure builders for meaning choice,
reverse choice, sentence builder and particle cloze. Each builder accepts a
seeded `Rng` and returns a complete, language-complete exercise object. Choice
answers are graded by stable item id, builders by tile-id order and cloze by the
exact particle. Explicit `lesson.exercises` replace the default set; otherwise
the generator creates both directions for each word, a builder for each
sentence and a cloze when a common particle exists. Unsupported template types
are skipped so the schema can grow without breaking older lessons.

**Consequences.** Option order is reproducible in tests but still varied on
device through the session seed. Invalid or cross-unit template references are
rejected by the content validator; unsupported types, wrong item kinds,
irrelevant fields and malformed alternate orders fail validation instead of
being silently skipped. Authored alternate sentence orders must be full token
permutations.

## ADR-019: Lesson availability is derived, and completion is idempotent

**Context.** Part 2 needs a browsable course, a player that survives restarts
and a rule set that cannot drift between the course list and the player.

**Decision.** `buildCourseOverview` is a pure read model over authored units and
`lesson_progress`. The first lesson of an open unit is available; each later
lesson requires the previous lesson to be complete. A unit is open when it has
no `requiresUnitId`, or when the required unit is fully complete and any
`minAccuracy` threshold is met. Completed lessons stay reviewable.

The player creates a seeded run from explicit templates or the default
generator. Each answer goes through `recordItemAnswer`, so SRS, review log, XP
and daily stats stay on the same path as kana practice. Finishing a lesson
writes `lesson_progress`; the first completion also marks a completed session
and awards the one-time session bonus. Replaying a completed lesson records new
answers but never awards the completion bonus again. Leaving part-way through
saves the answers, keeps the lesson incomplete and does not award the bonus.
`completedAt` keeps the first completion time across replays.

**Consequences.** Unlock state is never stored, so content edits can change what
is open without a migration; stable ids remain essential. Lesson accuracy in the
read model reflects the most recent run stored for that lesson. There is no
resume-interrupted-run state: an unfinished run records its answers and the
next visit starts a fresh seeded run. The UI must show a locked lesson as
unavailable rather than trusting a direct route.

## ADR-020: Glow is a static layer, never Android elevation or blur

**Context.** The redesign calls for crimson glow on the progress ring, the
current path node, the primary CTA and the correct-answer highlight. Android's
`elevation` renders a grey drop shadow and `BlurView` is expensive on mid-range
devices. Both would break the look and the performance budget.

**Decision.** Build glow from static layers: a low-opacity border/ring, an SVG
radial gradient (`GlowView` in D-M2) or a linear-gradient wash. Do not use
`elevation`, `shadowColor` or `BlurView` for glow. Cap glow elements at three
per screen.

**Consequences.** Glow is predictable across Android GPU tiers and adds no
continuous animation. It must be contrast-checked as part of the surface; a glow
layer may never be the only thing separating a control from its background.

## ADR-021: Nunito for Latin headings, system font for Latin body

**Context.** The redesign asks for a friendly rounded heading face while keeping
long-form reading comfortable and the asset budget small. The app already
bundles Noto Sans JP and Noto Nastaliq Urdu.

**Decision.** Bundle only Nunito SemiBold (600) and ExtraBold (800) through
`@expo-google-fonts/nunito`; both files total about 264 KB. `AppText` selects
Nunito for `display`, `title`, `heading`, `subtitle`, `label`, `button` and
`brand` in English, and keeps Latin body copy on the platform font. Japanese and
Urdu keep their existing bundled families. Display sizes get `maxScale` caps;
body text keeps full accessibility scaling.

**Consequences.** Two extra font files increase the bundle by under 400 KB. A
third Nunito weight requires a new decision and an asset-budget check. Font
selection must be tested because it is based on the resolved script language,
not on UI direction.

## ADR-022: One icon family (Ionicons)

**Context.** Mixed icon styles make the interface feel assembled from different
apps and increase the bundle.

**Decision.** Ionicons is the single icon family. Screens use the `Icon` wrapper
with size tokens. Outline variants are preferred where Ionicons provides one.
No emoji or second icon package is added for decoration.

**Consequences.** A missing glyph must be solved inside Ionicons or with a small
local SVG illustration, not by adding another icon library.

## ADR-023: Western digits for Urdu, and an accessible unseen-mastery grey

**Context.** The redesign specifies Western digits as the default for Urdu and a
new-mastery grey of `#5B5B6B`. The requested grey measures 2.73:1 on `surface`
and 2.95:1 on `background`, below the 3:1 requirement for a non-text indicator.

**Decision.** Keep Western digits in both locales and document the choice. Use
`#6B6B7C` for `masteryUnseen` (3.48:1 on `surface`) and pair every mastery tier
with a shape cue: none, dot, ring, check. The requested `#5B5B6B` is recorded as
a rejected value rather than shipped silently.

**Consequences.** The unseen state is slightly lighter than the visual brief.
Localisation must not convert counters to Arabic-Indic digits without a new
decision. Mastery remains understandable without colour.

## ADR-024: Core primitives move behind temporary re-export shims

**Context.** Moving every screen in one commit would mix visual changes with
routing, data and content risk. The redesign is staged in milestones.

**Decision.** New primitives live in `src/components/ui/`. Old import paths stay
as one-line re-export shims while screens migrate. D-M10 deletes the shims and
any superseded component. Tests that mocked a legacy implementation path are
updated to mock the new implementation module.

**Consequences.** There are temporarily two import paths for the same component;
they must not diverge. A shim is not a place for new styling. The final cleanup
milestone must prove no legacy path remains.

## ADR-025: Loading skeletons are static, not shimmer loops

**Context.** A shimmering skeleton is a common loading pattern, but the design
system forbids continuous decorative animation, especially on scrolling
screens. Reduce-motion users should still get the layout cue.

**Decision.** `Skeleton` renders a static `surface2` block at 72% opacity. It
does not loop, pulse or animate. Loading is announced by the enclosing state
(e.g. a polite status message) rather than by the placeholder itself.

**Consequences.** The loading state is calmer and cheaper on mid-range Android
devices. It relies on screen-level state messaging for accessibility; a skeleton
alone is not a progress signal. The current-path-node pulse remains the only
approved loop and must pause offscreen and under reduce motion.

## ADR-026: A development-only UI gallery route

**Context.** The redesign adds many component states (selection, correctness,
disabled, RTL tails, overlays) that are hard to inspect on real screens while
screens are still being migrated.

**Decision.** Add `src/app/dev/ui-gallery.tsx`. It renders every design-system
primitive with a language switch for RTL checks. In production the screen
returns `<Redirect href="/" />`; it is not linked from app navigation and is not
part of the release QA path. Gallery copy lives in `devGallery.*` keys in both
locales, like every other user-visible string.

**Consequences.** The route remains in the bundle because Expo Router uses
file-based routes, but it cannot be reached or rendered in production. It must
be checked during development-build QA, not Expo Go. D-M10 may remove it once
the component set stabilizes.

## ADR-027: Apache License 2.0 for the application

**Context.** Yuxi is publicly distributed on GitHub and needs a permissive license with
an explicit patent grant and a trademark clause. The previous permissive declaration no
longer matched the project's licensing intent.

**Decision.** License the application source under Apache-2.0. Keep the full text in
`LICENSE`, add `NOTICE` with the current attribution, declare `"license": "Apache-2.0"`
in `package.json`, and document bundled fonts and dependency licenses separately. The
copyright line remains `Copyright (c) 2026 Yuxi contributors` until a final legal holder
is designated.

**Consequences.** Redistributors must preserve the license, copyright, patent, trademark
and attribution notices and include the contents of `NOTICE` where the license requires
it. The project gains an express patent grant and a trademark clause. Dependencies and
bundled fonts keep their own licenses; Apache-2.0 does not relicense them. The final
copyright holder remains an open legal decision.

## Open questions

These are intentionally not guessed. Each one needs a human decision.

- `UNCLEAR:` whether `ぢ`/`づ` should render `dji`/`dzu` or standard `ji`/`zu`.
- `UNCLEAR:` whether `を` should be taught as `wo` or particle `o`.
- `UNCLEAR:` final Japanese and Urdu review sign-off for Part 1 kana and all
  Part 2 content; every file remains `needsHumanReview: true` until then.
- `UNCLEAR:` final copyright holder and legal owner named in `LICENSE` and `NOTICE`
  (currently "Yuxi contributors").
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
