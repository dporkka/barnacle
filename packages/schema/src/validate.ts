/**
 * validate.ts — CLI entry-point for PageGraph JSON validation.
 *
 * Usage:
 *   ts-node src/validate.ts <path-to-pagegraph.json>
 *
 * Exit codes:
 *   0 — document is valid
 *   1 — document is invalid or an error occurred
 */

import * as fs from "fs";
import * as path from "path";
import { validatePageGraph } from "./index";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: validate <path-to-pagegraph.json>");
  process.exit(1);
}

const resolved = path.resolve(filePath);

let raw: string;
try {
  raw = fs.readFileSync(resolved, "utf-8");
} catch (err) {
  console.error(`Error reading file "${resolved}":`, (err as Error).message);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`Error parsing JSON in "${resolved}":`, (err as Error).message);
  process.exit(1);
}

const result = validatePageGraph(data);

if (result.valid) {
  console.log(`✓ valid  ${resolved}`);
  process.exit(0);
} else {
  console.error(`✗ invalid  ${resolved}`);
  for (const error of result.errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}
