# Leonida Ledger — the complete GTA VI trophy guide and tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/fathirdwi757-maker/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/fathirdwi757-maker/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides you to the Grand Theft Auto VI platinum: **all 55 official PlayStation 5 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden — each with its official name, description and grade, and a guide written for this app that **cites its sources** beside every trophy.

## What it does

- **Tracker** — tick trophies off as you earn them; progress (and the per-tier counters and progress bar) saves automatically in your browser's localStorage. Export your progress to a JSON file and import it back on any machine.
- **A guide for every trophy** — a plain-words explanation, a step-by-step route, tips, and the named sources each fact comes from (the official PlayStation trophy list as listed by Exophase and PSNProfiles, Rockstar's trailers and the official GTA VI site).
- **Platinum roadmap** — 7 stages in the order that wastes the least driving, with per-stage hour estimates, a 6/10 difficulty rating and a 70–90 hour total: story first, then strangers, exploration, collectibles, skill trials, crime and cash, and the partner trophies last.
- **Missables view** — the 6 missable-risk trophies (an unscheduled airport departure, a tank set-piece, a showroom escape, an early cocktail moment, and the two choice-driven trophies) flagged with exactly when each one can be lost and how to protect it, all before you start the story.
- **Filters and search** — by tier, by category (Story, Completion, Collectibles, Combat & Skills, World & Activities, Online & Social), by earned status, missable-only, plus full-text search across names, descriptions and guides.
- **Spoiler setting** — hides the names, descriptions and guides of story trophies until you have earned them.

## Run it

No build step, no dependencies, nothing to install beyond Node.js 22 or any static file server:

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Or serve the `app/` folder with any static host. The app works fully offline: it loads only its own files, and your progress never leaves the browser unless you export it yourself.

## Hand it in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier` library (`vendor/makefun-frontend.ts`, the kit's copy, unchanged).

## The data

`app/data/trophies.json` holds the whole guide: the official trophy list (names, descriptions and grades exactly as PlayStation publishes them — including "T**s Ass Drug Money", asterisks and all), plus for each trophy a category, a missable flag where the design warrants one, its roadmap stage, the guide text, steps, tips and sources, and the 7-stage roadmap itself.

## Screenshots

- `screenshots/1-tracker.jpg` — the tracker mid-run, with a trophy guide open beside the list
- `screenshots/2-guide.jpg` — a missable trophy's guide, warning and sources
- `screenshots/3-roadmap.jpg` — the 7-stage platinum roadmap
- `screenshots/4-missables.jpg` — the missables view

## License

MIT — see `LICENSE`. Leonida Ledger is an unofficial fan guide; it is not affiliated with Rockstar Games or Take-Two Interactive, and it uses no artwork from the game.

---

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC. Try make.fun: https://make.fun/?ref=7k4mkbbj&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01
