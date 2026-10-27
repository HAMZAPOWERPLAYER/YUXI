#!/usr/bin/env node
/**
 * Privacy gate: the app is offline-first and must never initiate network traffic.
 * This script fails CI if common networking primitives appear in application code.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const BLOCKED_PATTERNS = [
  { label: 'fetch(', regex: /\bfetch\s*\(/ },
  { label: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { label: 'axios', regex: /\baxios\b/ },
  { label: 'WebSocket', regex: /\bWebSocket\b/ },
];

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walk(full));
    } else if (EXTENSIONS.has(name.slice(name.lastIndexOf('.')))) {
      entries.push(full);
    }
  }
  return entries;
}

const violations = [];
for (const target of TARGET_DIRS) {
  const absolute = join(ROOT, target);
  let files = [];
  try {
    files = walk(absolute);
  } catch {
    continue;
  }
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push(`${relative(ROOT, file)}:${index + 1} contains ${pattern.label}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('Network access detected in application code:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  console.error('Yuxi is offline-first. Remove the network call or move it out of src/.');
  process.exit(1);
}

console.log('No network primitives found in src/. Privacy gate passed.');
