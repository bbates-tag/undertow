# UNDERTOW 🌊

*A singleplayer deep-sea roguelite deckbuilder that runs entirely in your browser.*

Descend a branching trench across three acts. Fight turn-based battles by playing cards from a hand drawn from your deck. Ride the **Tide** — a four-phase cycle that supercharges your cards at High or Low water. Add, upgrade, and cut cards; collect relics; die; dive smarter.

**No servers. No accounts. No ads. No tracking.** Everything — including a run in progress mid-battle — is saved to `localStorage` and survives a page refresh. After the first load the game works fully offline (service worker, production build).

---

## Quick start

```bash
npm install
npm run dev        # dev server → http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` (static files) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Engine unit tests (vitest) — damage math, tide, statuses, map gen, save round-trip |
| `npm run sim` | Headless balance simulator — plays full runs with a greedy bot and prints winrates / death tables (`npm run sim -- 200` for more runs) |

**Deploy:** `npm run build`, then host the `dist/` folder on any static host (GitHub Pages, Netlify, itch.io, an S3 bucket, a USB stick). `base: './'` is set, so it works from any subpath.

Dev cheats: append `?debug=1` to the URL for a cheat panel (gold, heal, boss warp, unlock-all).

## Controls

- **Touch / mouse:** tap a card to select (shows a zoomed preview + its keywords), tap a target or **Play**. Tap intents, statuses, and relics for tooltips.
- **Keyboard:** `1–9` select card · `←/→` choose target · `Enter` play · `E` end turn · `Esc` cancel.

## The game in one paragraph

Each turn you draw 5 cards and spend 3 Energy. Enemies **telegraph** their next move — the number shown is exactly what you'll take. Block absorbs damage but washes away each turn. The **Tide** advances every turn (Low → Rising → High → Falling): *Flood* cards hit harder at High tide, *Ebb* cards defend better at Low, and *Shift* cards move the cycle on your schedule. Win fights → pick 1 of 3 cards (or skip), collect gold and relics, spend them at shops (including **card removal**), and choose heal-or-upgrade at rest vents. Lose all HP and the run ends — but every run banks **Fathoms** toward permanent unlocks: a second character (**The Voltaic**, who banks Charge and spends the whole storm at once), new cards and relics, Depth tiers (ascension), plus a seeded **Daily Dive**, achievements, and a run history.

## Tech

Vite · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand · Framer Motion · react-icons (game-icons.net) · lucide-react · ZzFX (vendored) · Web Audio API.

**Zero binary assets.** All art is inline SVG + CSS derived from a single design-token system ([src/index.css](src/index.css) `@theme` block — reskin the game by editing it). All audio is synthesized at runtime: SFX via ZzFX presets ([src/audio/sfx.ts](src/audio/sfx.ts)), ambient music generated live with Web Audio oscillators/noise ([src/audio/music.ts](src/audio/music.ts)). *(Design decision: the brief listed Howler.js; since every sound is synthesized rather than file-based, the Web Audio API is used directly — an option §7 of the brief explicitly allows.)*

## Project layout

```
src/
  engine/       pure game logic — no React, fully serializable state
    types.ts      every shared type (cards, ops DSL, battle/run/meta state)
    battle.ts     combat: ops interpreter, statuses, tide, relic/power hooks
    run.ts        map generation, rewards, shop, rest, events, scoring
    describe.ts   auto-generates card rules text from ops (live numbers in battle)
  content/      ALL game data as typed config — add a card in ~10 lines
    cards_*.ts    91 cards (Tidecaller 53, Voltaic 28, neutral 6, curses 4)
    enemies.ts    23 enemy types + AI patterns, 31 encounters, 3 acts
    relics.ts     29 relics    events.ts  10 events    meta.ts  unlocks/daily/achievements
  audio/        ZzFX synth + sound presets + generative music
  state/        Zustand store (orchestration) + localStorage persistence
  ui/           React components & screens (battle, map, shop, rest, events, meta)
  sim/          headless balance simulator
```

Adding content: append an object to the relevant file in `src/content/` — the effect DSL (`ops`), auto-generated rules text, reward pools, and the compendium pick it up automatically. See [docs/DESIGN.md](docs/DESIGN.md) for the design notes, archetypes, and balance philosophy.

## Credits & licenses

- **Icons:** [game-icons.net](https://game-icons.net) (CC BY 3.0 — Lorc, Delapouite, Skoll, and contributors) via `react-icons`; UI icons from [Lucide](https://lucide.dev) (ISC). Attribution also shipped in-game (menu → credits & licenses).
- **Audio:** [ZzFX](https://github.com/KilledByAPixel/ZzFX) by Frank Force (public domain), adapted in `src/audio/zzfx.ts`.
- Built with React, Vite, Tailwind, Zustand, Framer Motion (MIT).
