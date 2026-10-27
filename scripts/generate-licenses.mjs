#!/usr/bin/env node
/**
 * Generates src/generated/licenses.json from installed production dependencies.
 * Run: npm run licenses
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const dependencyNames = Object.keys(packageJson.dependencies ?? {}).sort();

const FONT_LICENSES = [
  {
    name: 'Noto Sans JP',
    version: 'bundled',
    license: 'OFL-1.1',
    repository: 'https://github.com/notofonts/noto-cjk',
    note: 'Japanese kana and UI glyphs.',
  },
  {
    name: 'Noto Nastaliq Urdu',
    version: 'bundled',
    license: 'OFL-1.1',
    repository: 'https://github.com/notofonts/nastaliq',
    note: 'Urdu script rendering.',
  },
];

function normalizeLicense(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.type === 'string') return value.type;
  return 'SEE LICENSE IN PACKAGE';
}

function normalizeRepository(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.url === 'string') return value.url;
  return '';
}

const entries = [];
for (const name of dependencyNames) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', name, 'package.json'), 'utf8'));
  } catch {
    console.warn(`Skipping ${name}: package metadata not found.`);
    continue;
  }
  entries.push({
    name,
    version: pkg.version ?? 'unknown',
    license: normalizeLicense(pkg.license),
    repository: normalizeRepository(pkg.repository),
  });
}

for (const font of FONT_LICENSES) {
  if (!entries.some((entry) => entry.name === font.name)) {
    entries.push(font);
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const output = {
  generatedBy: 'scripts/generate-licenses.mjs',
  app: 'yuxi',
  licenseCount: entries.length,
  licenses: entries,
};

const target = join(ROOT, 'src', 'generated', 'licenses.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${target} (${entries.length} licenses).`);
