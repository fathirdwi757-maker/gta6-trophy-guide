# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/fathirdwi757-maker/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/fathirdwi757-maker/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline trophy guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden). Every trophy shows its official name, description and grade exactly as PlayStation publishes them, plus a guide written for this entry in its own words that cites its sources (the official list via Exophase and PSNProfiles, and the published PowerPyx, GTABase, KeenGamer and FullSweep guides — cited, never copied).

What it does:

- **Tracker** — a checklist over all 55 trophies, saved in your browser (localStorage), with export to a JSON file and import back, a text search, filters by grade and by kind (story, missable, collectibles, activities, side strands, crime & robberies, free-roam & one-offs, completion — and an Online filter that honestly returns none, because the official list has no online trophies), and a **spoiler shield** that hides the names and descriptions of story trophies until you earn them.
- **Platinum roadmap** — seven stages from the opening mission to 100% completion, built from the official descriptions and their counts (250 stunts, 42 Shooting Range challenges, 14 drone-race locations, 18 meditation spots, 52 areas, 9 gangs, 8 garages), with time and difficulty figures clearly labelled as published estimates (PowerPyx: about 4/10 and ~200 hours; Push Square: up to 300+ hours).
- **Missables, honestly flagged** — one trophy, Positive Mental Attitude, is flagged as *possibly* missable by PowerPyx and GTABase (unconfirmed; the first meditation spot appears in Chapter 1), and the guide says exactly that, with the safe play. Nothing else is flagged by any source checked, and the guide explains the difference between "not flagged" and "guaranteed safe".
- **Cited guidance** — each trophy's detail panel shows its guide and the sources it is built from; the deliberately vague hidden trophies (Challenging Tank, Personal Best, Bad Luck I Guess, The Truth Is Out There) are labelled as unconfirmed rather than filled with invented steps.
- **Fully offline** — plain static files under `app/`, no build step, no network requests at run time, no Rockstar logo or official artwork.

**Keyboard shortcuts** — in the tracker, press `/` to jump straight to the search box from anywhere in the app, and `Esc` to clear the search text and every active filter (grade, kind and hide-earned) in one keystroke. The spoiler shield is a reading preference rather than a filter, so `Esc` deliberately leaves it as you set it.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or serve app/ with any static file server

# to build the make.fun hand-in (app/ + screenshots/ + dossier.json):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory (`$MAKEFUN_OUTPUT_DIR`, else `/output`) and writes `dossier.json` with the vendored make.fun library in `vendor/makefun-frontend.ts`, which is the kit's copy, unchanged.

Licensed under the MIT License (see `LICENSE`). Trophy names and descriptions are reproduced as published by PlayStation. This is a fan-made guide, not affiliated with Rockstar Games or Take-Two Interactive.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7k4mkbbj&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
