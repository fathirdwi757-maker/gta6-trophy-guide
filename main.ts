// Leonida Legend — entry program for make.fun bounty gta6-trophy-guide-01
// ("Build the best GTA 6 trophy guide"), Node 22, standard library only.
//
// What this program does, and nothing more:
//   1. copies this repository's app/ (the offline trophy guide: static files,
//      no build step) and screenshots/ (3–4 renders of the guide) into the
//      output directory — $MAKEFUN_OUTPUT_DIR when set, else /output;
//   2. writes dossier.json there with buildDossier from the vendored
//      make.fun library, which must stay byte-for-byte the kit's copy,
//      because the scorer rebuilds the dossier with its own copy and
//      compares the two byte for byte.
//
// The output is deterministic: copying the same repository twice produces
// the same bytes twice, which the grader's double run requires.
//
// Run it the way the README says:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A copy is only trusted once it is checked: walk both trees and require
// every copied file to carry the same byte size as its source. A mismatch
// means the hand-in on disk is not the guide in this repository, so fail
// loudly instead of writing a dossier over a corrupt copy. Checking sizes
// changes nothing that is written — the output bytes are the copy's own.
function verifyCopy(fromDir: string, toDir: string) {
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    const from = join(fromDir, entry.name);
    const to = join(toDir, entry.name);
    if (entry.isDirectory()) {
      verifyCopy(from, to);
    } else if (entry.isFile()) {
      const expected = statSync(from).size;
      const actual = existsSync(to) ? statSync(to).size : -1;
      if (actual !== expected) {
        throw new Error(
          `copy check failed for ${relative(repoRoot, from)}: source is ${expected} bytes, ` +
          (actual === -1 ? 'output file is missing' : `output is ${actual} bytes`),
        );
      }
    }
  }
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });

  // The guide itself.
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

  // The screenshots the judge sees first; the first by name is the cover.
  const shotsFrom = join(repoRoot, 'screenshots');
  const shotsTo = join(outputDir, 'screenshots');
  mkdirSync(shotsTo, { recursive: true });
  if (existsSync(shotsFrom)) {
    cpSync(shotsFrom, shotsTo, { recursive: true });
  }
  const shotCount = existsSync(shotsTo)
    ? readdirSync(shotsTo).filter((name) => !name.startsWith('.')).length
    : 0;

  // Verify both copies before the dossier describes them.
  verifyCopy(join(repoRoot, 'app'), join(outputDir, 'app'));
  if (existsSync(shotsFrom)) verifyCopy(shotsFrom, shotsTo);

  // The dossier: screenshots plus the judge's text view of the app.
  // The caps below are the scorer's own (see the kit's RULES.txt, The gate):
  // dossier text capped at 160 KiB, at most 4 screenshots of at most
  // 256 KiB each, app/ at most 993 entries and 48 MiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  console.log(`Leonida Legend handed in: app/ + ${shotCount} screenshot(s) + dossier.json -> ${outputDir}`);
}

handIn();
