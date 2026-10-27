import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

import {
  CONTENT_SCHEMA_DIR,
  buildContentJsonSchemas,
  serializeJsonSchema,
} from '../src/features/content/jsonSchema';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDir = path.join(root, CONTENT_SCHEMA_DIR);
const checkOnly = process.argv.includes('--check');

/** Generated JSON must also satisfy `prettier --check`. */
async function formatSchema(schema: unknown, filePath: string): Promise<string> {
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  return prettier.format(serializeJsonSchema(schema), { ...config, parser: 'json' });
}

async function main(): Promise<number> {
  mkdirSync(outputDir, { recursive: true });
  let stale = 0;

  for (const [fileName, schema] of Object.entries(buildContentJsonSchemas())) {
    const filePath = path.join(outputDir, fileName);
    const next = await formatSchema(schema, filePath);

    if (checkOnly) {
      let current = '';
      try {
        current = readFileSync(filePath, 'utf8');
      } catch {
        current = '';
      }
      if (current !== next) {
        stale += 1;
        console.error(`Stale JSON schema: ${CONTENT_SCHEMA_DIR}/${fileName}`);
      }
      continue;
    }

    writeFileSync(filePath, next, 'utf8');
    console.log(`Wrote ${CONTENT_SCHEMA_DIR}/${fileName}`);
  }

  if (!checkOnly) return 0;

  if (stale > 0) {
    console.error('Run "npm run content:schema" and commit the regenerated files.');
    return 1;
  }

  console.log('JSON schemas are up to date.');
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
