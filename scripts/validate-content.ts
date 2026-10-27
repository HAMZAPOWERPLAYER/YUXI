import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';

import { contentRegistry } from '../src/features/content/contentRegistry';
import { courseFileSchema, unitFileSchema } from '../src/features/content/schema';
import type { ContentBundle, UnitFile, ValidationIssue } from '../src/features/content/types';
import { validateContent } from '../src/features/content/validation';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataDir = path.join(root, 'src/features/content/data');
const unitsDir = path.join(dataDir, 'units');
const coursePath = path.join(dataDir, 'course.json');

function relative(filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function schemaIssues(filePath: string, error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    severity: 'error' as const,
    code: 'schema',
    path: `${relative(filePath)}:${issue.path.map(String).join('.') || '<root>'}`,
    message: issue.message,
  }));
}

function printIssues(title: string, issues: readonly ValidationIssue[]): void {
  if (issues.length === 0) return;
  console.log(`\n${title} (${issues.length})`);
  for (const issue of issues) {
    console.log(`  [${issue.code}] ${issue.path} — ${issue.message}`);
  }
}

function listUnitFiles(): string[] {
  if (!existsSync(unitsDir)) return [];
  return readdirSync(unitsDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(unitsDir, name));
}

function main(): number {
  if (!existsSync(coursePath)) {
    console.error(`Missing course file: ${relative(coursePath)}`);
    return 1;
  }

  const issues: ValidationIssue[] = [];
  const courseResult = courseFileSchema.safeParse(readJson(coursePath));
  if (!courseResult.success) {
    printIssues('Schema errors', schemaIssues(coursePath, courseResult.error));
    return 1;
  }

  const unitFiles: UnitFile[] = [];
  for (const filePath of listUnitFiles()) {
    const result = unitFileSchema.safeParse(readJson(filePath));
    if (!result.success) {
      issues.push(...schemaIssues(filePath, result.error));
      continue;
    }

    const expectedName = `${result.data.unit.id}.json`;
    if (path.basename(filePath) !== expectedName) {
      issues.push({
        severity: 'error',
        code: 'unit-filename',
        path: relative(filePath),
        message: `Rename this file to "${expectedName}" so the unit id and filename agree`,
      });
    }
    unitFiles.push(result.data);
  }

  if (issues.length > 0) {
    printIssues('Schema errors', issues);
    return 1;
  }

  unitFiles.sort((a, b) => a.unit.order - b.unit.order);
  const bundle: ContentBundle = { course: courseResult.data, units: unitFiles };
  const result = validateContent(bundle);
  issues.push(...result.issues);

  const registered = new Set(contentRegistry.unitIds());
  const onDisk = new Set(unitFiles.map((file) => file.unit.id));
  for (const file of unitFiles) {
    if (!registered.has(file.unit.id)) {
      issues.push({
        severity: 'error',
        code: 'registry-missing',
        path: `src/features/content/data/units/${file.unit.id}.json`,
        message: 'Add this unit to the explicit loader map in contentRegistry.ts',
      });
    }
  }
  for (const unitId of registered) {
    if (!onDisk.has(unitId)) {
      issues.push({
        severity: 'error',
        code: 'registry-orphan',
        path: 'src/features/content/contentRegistry.ts',
        message: `Registered unit "${unitId}" has no matching JSON file`,
      });
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  console.log('Yuxi content validation');
  console.log(
    `Course: ${result.stats.units === 0 ? 'no units authored yet' : `${result.stats.units} unit(s)`}`,
  );

  if (result.stats.byUnit.length > 0) {
    const orderById = new Map(unitFiles.map((file) => [file.unit.id, file.unit.order]));
    const rows = [...result.stats.byUnit].sort(
      (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0),
    );
    console.log('');
    console.log('Unit                         Lessons  Words  Sentences  Items');
    for (const row of rows) {
      console.log(
        `${row.id.padEnd(28)} ${String(row.lessons).padStart(7)} ${String(row.vocabulary).padStart(6)} ${String(row.sentences).padStart(10)} ${String(row.items).padStart(6)}`,
      );
    }
    console.log(
      `${'TOTAL'.padEnd(28)} ${String(result.stats.lessons).padStart(7)} ${String(result.stats.vocabulary).padStart(6)} ${String(result.stats.sentences).padStart(10)} ${String(result.stats.items).padStart(6)}`,
    );
  } else {
    console.log('No unit files under src/features/content/data/units yet.');
  }

  printIssues('Warnings', warnings);
  printIssues('Errors', errors);

  if (errors.length === 0) {
    console.log(`\nContent validation passed (${warnings.length} warning(s)).`);
    return 0;
  }
  console.error(`\nContent validation failed with ${errors.length} error(s).`);
  return 1;
}

try {
  process.exitCode = main();
} catch (error: unknown) {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
}
