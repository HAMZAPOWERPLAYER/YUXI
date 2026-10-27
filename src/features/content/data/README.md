# Content authoring

Course content lives in this directory. It is data, not code: edit JSON, run the
validator, then update the registry entry once per unit.

## Layout

```text
src/features/content/data/
  course.json                 ordered unit index and course metadata
  units/
    <unit-id>.json            one complete unit: metadata, lessons, items
```

`course.json` and every unit file must carry `"needsHumanReview": true`.
The schema version is `1`. The JSON Schema artifacts are in
`docs/content-schema/`.

## Unit file shape

A unit file contains:

| Field              | Rule                                                   |
| ------------------ | ------------------------------------------------------ |
| `unit`             | metadata; must match `course.json` on order/title/icon |
| `lessons`          | 3–5 lessons, each with 6–10 items and a unique order   |
| `vocabulary`       | words and phrases used by the lessons                  |
| `sentences`        | example sentences, with tokens and vocabulary links    |
| `schemaVersion`    | must be `1`                                            |
| `needsHumanReview` | must be `true`                                         |

Every item also carries `unitId`, `lessonId` and `needsHumanReview: true`.
An item must appear in exactly one lesson and must not be duplicated in the
lesson item list.

## Authoring rules

- Standard polite Japanese (`です`/`ます`) only; no slang.
- Kana readings contain kana and the prolonged sound mark only. Sentence
  readings may also contain `、。！？` and single spaces.
- Romaji is lowercase Hepburn: `shi`, `chi`, `tsu`, `fu`, `ji`; no `si`, `tu`,
  `hu`, `sya`.
- Urdu must contain Urdu script; English must contain Latin text.
- `tokens[].surface` must concatenate exactly to `ja`.
- `segments[].text` must concatenate exactly to `ja`; segment readings are kana.
- Every `exampleIds` and `vocabIds` entry must exist in the same unit.
- Units need at least 20 items; lessons need 6–10 items.
- Content must be family-friendly and halal-friendly. Pork, alcohol, dating/
  romance, gambling and music are forbidden. The only exception is a polite
  halal/dietary request or statement tagged `halal-request` or
  `dietary-request`; only pork and alcohol are exempt, and the validator prints
  a warning so reviewers can see it.
- If a Japanese word, reading, particle or translation is uncertain, omit it
  and record `UNCLEAR:` in the review notes. Do not guess.

## Adding a unit

1. Copy the previous unit file or start from `docs/content-schema/unit.schema.json`.
2. Use the unit id as the filename: `unit-01-greetings.json`.
3. Add the unit to `src/features/content/data/course.json` with the same
   `order`, `titleUr`, `titleEn` and `icon`.
4. Add the literal loader to `src/features/content/contentRegistry.ts`:

   ```ts
   'unit-01-greetings': () => require('./data/units/unit-01-greetings.json'),
   ```

5. Run:

   ```bash
   npm run validate:content
   npm run content:schema:check
   npx tsc --noEmit
   npm run lint
   npm test
   ```

6. Update `docs/content-review.md` with the new file and send it for Japanese,
   Urdu and content-safety review.

## Adding an item

- Use a globally unique id (across all units, vocabulary and sentences).
- Put the item in one lesson and set `unitId`/`lessonId` correctly.
- For kanji items, supply `segments` with kana readings.
- Link example sentences with `exampleIds`; link a sentence back with
  `vocabIds`.
- Keep Urdu natural and idiomatic, not a word-for-word calque.

## Validator output

`npm run validate:content` prints every issue and a per-unit table
(lessons / words / sentences / items). It fails on schema errors, duplicate ids,
broken references, undersized units/lessons, token/segment mismatches, unsafe
terms, missing review flags and registry drift.
