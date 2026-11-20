// Leonida Ledger - the make.fun hand-in program for gta6-trophy-guide-01.
//
// The guide itself is the static web app in app/ (open app/index.html in a
// browser; it works fully offline). This program's only job is to hand that
// app in the way the competition's scorer expects: copy app/ and
// screenshots/ into the output directory and write dossier.json there with
// buildDossier from the kit's vendored library. The library file
// (vendor/makefun-frontend.ts) is the kit's own copy and must stay untouched:
// the scorer rebuilds the dossier with its identical library and compares
// the two byte for byte.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier limits below are the scorer's own caps for this competition:
// the source text is capped at 160 KiB, at most 4 screenshots of at most
// 256 KiB each, and app/ holds at most 993 files and directories totalling
// at most 48 MiB. buildDossier refuses anything past them, exactly as the
// scorer would.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handIn() {
  mkdirSync(outputDir, { recursive: true });

  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

  const shotsOut = join(outputDir, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) {
    cpSync(shotsIn, shotsOut, { recursive: true });
  }

  const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
