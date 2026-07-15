# Endless Mode Difficulty Ramp — Implementation Plan

**Status:** approved design, ready to build.
**Goal:** endless mode ("the Deep", loops past the Act 4 boss) should ramp up much harder and
faster. Today the ramp is HP-sponge-heavy and danger-light: a deck good enough to win Act 4
never feels re-threatened — fights get *longer* before they get *dangerous*, and runs end in
tedium rather than a crescendo.

This plan is self-contained. Line numbers are current as of writing; if they've drifted,
search for the quoted symbols/snippets instead. Work through the phases in order — each is
independently shippable and testable. Run `npm test` after each phase and the sim
(`npm run sim -- --endless`, see Phase 0) before and after tuning changes.

---

## 1. Background — how it works today

Endless is entered from the Victory screen ("Descend Deeper", `continueEndless` in
`src/state/store.ts`) or silently on repeat Act-4 boss kills (`leaveReward` in the same file).
`run.loop` is 0 for the authored four acts, 1+ in endless. Per loop `L`:

| Knob | Current value | Where |
|---|---|---|
| Enemy HP | `× 1.28^L` (compounding, uncapped) | `ascHpScale`, `src/engine/battle.ts:829` |
| Enemy damage | `+2 × L` flat per hit (linear) | `ascEnemyDmgBonus`, `src/engine/battle.ts:839` |
| Enemy Might at spawn | `+L` | `src/engine/battle.ts:815` |
| Normal-enemy affix chance | `min(0.9, 0.25 + 0.15L)` | `src/engine/endless.ts:55` |
| Elite/boss affix count | 2 at `L ≥ 3`, else 1 | `src/engine/endless.ts:95,106` |
| Encounter threat budget | `× min(2, 1 + 0.12L)` — **hard cap 2×** | `loopBudget`, `src/engine/endless.ts:39` |
| Cross-act enemy mixing | 30%, 50% at `L ≥ 2` | `src/engine/endless.ts:67` |
| Player gold | `+4 × L` per battle | `src/engine/run.ts:307` |
| Rest heal | `+4%/L`, capped at 50% max HP | `restHealAmount`, `src/engine/run.ts:572` |
| Score | `+100 × L` flat | `scoreRun`, `src/engine/run.ts:758` |

**The diagnosis:** player decks scale multiplicatively (block engines, damage combos, relic
stacking), so linear flat damage (+2/hit/loop) never re-threatens a winning deck, and the
2×-capped budget means fight complexity plateaus by ~loop 8. Only the HP multiplier truly
compounds, which produces sponges, not danger.

**Genre research this design is based on:**
- *Slay the Spire endless*: stat scaling alone famously fails against good decks; the real
  teeth are **Blights** — stacking player-side debuffs granted each loop (reduced draw, status
  injection, and Time Maze's 15-cards-per-turn cap that kills infinites).
- *Balatro*: post-win score requirements grow super-exponentially, guaranteeing every run
  ends; "how deep did you get" is the score. The wall must be geometric or faster.
- *Risk of Rain 2*: compounding coefficient (+15%/stage) — exponential pressure, not flat.
- *Nuclear Throne*: loops add only +5% HP; the ramp is mechanical — cross-zone enemy mixing,
  elite variants, density. Variety escalation feels like difficulty; raw HP feels like tedium.
- *Vampire Survivors*: pairs enemy scaling (+100% HP/+25% dmg/+50% spawns per cycle) with
  **erosion of player power** (damage cap shrinks each cycle).

**Design thesis (three layers):**
1. Make the *danger* curve compound (damage), not just the sponge curve (HP).
2. Add **Pressures** — stacking player-side debuffs, one per loop, chosen 1-of-2 (the
   Blight/Neow pattern, re-themed as the deep-sea toll of descending).
3. Escalate encounter *mechanics* with depth (budget, affixes, cross-act mixing).

Player-side economy stays additive (that asymmetry IS the wall — do not "compensate").

**Tuning target** (measure with the sim, Phase 0): a winning bot deck's median death at
loop 3–4, strong seeds reaching 5–6, tail around 8. Today the bot survives much deeper.

---

## 2. Phase 0 — Baseline measurement

Before changing anything, record the current distribution so tuning is honest:

```
npm run sim -- --endless
```

(`src/sim/simulate.ts` — the bot always descends; it reports deepest loop reached and
per-loop killers.) Save the summary output (median/max loop per character) into a comment at
the top of the tuning PR or in this doc's appendix. Re-run after each phase.

---

## 3. Phase 1 — Compounding damage curve

**File: `src/engine/battle.ts`.** Replace the flat loop bonus in `ascEnemyDmgBonus` with a
compounding curve. Current:

```ts
export function ascEnemyDmgBonus(run: RunState): number {
  let b = 0;
  if (run.ascension >= 2) b += 1;
  if (run.ascension >= 9) b += 1;
  b += 2 * run.loop; // endless
  return b;
}
```

Problem: both call sites do `calcAttack(mv.attack.amount + ascEnemyDmgBonus(run), …)`
(intent preview at `battle.ts:122`, resolution at `battle.ts:1121`), so the loop bonus is
flat per hit. Change the *shape*: replace the additive helper with a scaling helper applied
at both call sites:

```ts
/** ascension adds flat chip; endless compounds — the deep always wins eventually */
export function scaleEnemyAttack(run: RunState, base: number): number {
  let b = base;
  if (run.ascension >= 2) b += 1;
  if (run.ascension >= 9) b += 1;
  if (run.loop > 0) b = Math.round((b + run.loop) * Math.pow(1.15, run.loop));
  return b;
}
```

Both call sites become `calcAttack(scaleEnemyAttack(run, mv.attack.amount), e, bs.player)`.
Delete `ascEnemyDmgBonus` (grep for other consumers first — the UI intent preview must go
through the same helper so telegraphs stay honest).

Resulting curve for a 10-damage hit: L1 13, L2 16, L3 20, L5 30, L8 55 (vs. today's 12, 14,
16, 20, 26). Small chip attacks keep pace via the `+loop` term; big and multi-hit attacks
compound. **Leave HP at 1.28^L and Might at +L for now** — one knob at a time; revisit only
if Phase 0 vs. post-Phase-3 sim comparisons say the wall still lands too late.

**Tests:** `src/engine/engine.test.ts:178` asserts the old "+2 enemy damage" at loop 1 —
update to the new formula. Add cases at loop 3 and 5 so the curve shape is pinned.

---

## 4. Phase 2 — Pressures (the big one)

Stacking, player-side, per-loop debuffs. Thematically: each descent past the Kraken, the deep
exacts a toll. On starting each loop the player chooses **1 of 2** offered Pressures; the
choice is permanent for the run and they accumulate loop over loop.

### 4.1 Content — new file `src/content/pressures.ts`

Follow the exact shape/style of `src/content/affixes.ts` (id/name/icon/text, react-icons
`Gi*` names, header comment stating where effects live):

```ts
export const PRESSURES: Record<string, PressureDef> = {
  crushingDepth:  { …, name: 'Crushing Depth',    text: 'Lose 3 Max HP each time you descend to a new act.' },
  deepDemands:    { …, name: 'The Deep Demands',  text: 'You cannot play more than 12 cards in a turn.' },
  siltLungs:      { …, name: 'Silt in the Lungs', text: 'Battles begin with a Waterlogged shuffled into your draw pile.' },
  dimmingLight:   { …, name: 'Dimming Light',     text: 'Draw 1 fewer card on your first turn.' },
  numbingCold:    { …, name: 'Numbing Cold',      text: '1 less energy on your first turn of each battle.' },
  barnacledHulls: { …, name: 'Barnacled Hulls',   text: 'Enemies begin battle with Block equal to 4× the loop.' },
  hungeringDark:  { …, name: 'The Hungering Dark', text: 'Rest sites heal 10% less.' },
};
```

Notes on intent:
- `deepDemands` is the Time-Maze analog — it hard-stops infinite combos in endless, which is
  exactly the degenerate-loop-prevention rule this project already follows for cards/relics.
- Magnitudes are deliberately modest; they stack with each other AND the enemy curve.
- Pressures are per-run state, not meta content — do **not** add them to the compendium
  (affixes and boons aren't in it either).

### 4.2 State — `src/engine/types.ts`

On `RunState` (next to `loop`, ~line 354):

```ts
/** endless: accumulated per-loop debuffs (see content/pressures.ts) */
pressures: string[];
/** endless: the 1-of-2 choice pending for the loop just entered */
pressureOffer?: string[];
```

Initialize `pressures: []` in `newRun` (`src/engine/run.ts:147`, near `loop: 0`).

### 4.3 Offer/choice lifecycle — `src/engine/run.ts`

In `beginLoop` (line ~737), after the heal, roll the offer **on `runRng`** so it is
deterministic per seed (loop maps already are — `engine.test.ts:160,205`):

```ts
const remaining = Object.keys(PRESSURES).filter((p) => !run.pressures.includes(p));
if (remaining.length) run.pressureOffer = r.shuffle(remaining).slice(0, 2);
else { run.maxHp = Math.max(15, run.maxHp - 5); run.hp = Math.min(run.hp, run.maxHp); }
```

The `else` branch is the **Abyssal Toll**: once all seven Pressures are taken (loop 8+),
every further descent permanently costs 5 Max HP — the Balatro-style guarantee that the run
always ends. Surface it in the loop toast (see 4.5).

Add the apply function next to `applyBoon`:

```ts
export function choosePressure(run: RunState, id: string): boolean {
  if (!run.pressureOffer?.includes(id)) return false;
  run.pressures.push(id);
  run.pressureOffer = undefined;
  return true;
}
```

### 4.4 Effect hook sites (one per Pressure)

Keep each effect at the natural hook, matching how affixes are done (spawn effects in
`startBattle`, behavioral ones at their sites). Add a tiny helper in `battle.ts` or `run.ts`:
`const hasPressure = (run: RunState, id: string) => run.loop > 0 && run.pressures.includes(id);`

| Pressure | Hook | Change |
|---|---|---|
| `crushingDepth` | `descend()` (`run.ts:722`) and `beginLoop()` | before the 25% heal: `run.maxHp = Math.max(15, run.maxHp - 3); run.hp = Math.min(run.hp, run.maxHp)` |
| `deepDemands` | `canPlay()` (`battle.ts:933`) | `if (hasPressure(run, 'deepDemands') && bs.cardsPlayedThisTurn >= 12) return 'pressure'` — add `'pressure'` to the `PlayError` union (`battle.ts:925`) and handle it wherever the UI maps `PlayError` to feedback (grep existing handling of `'energy'`). Note: `canPlay` currently takes only `(bs, uid)` — it needs `run` (or the check goes in `playCard`, which already has `run`; preferring `playCard` keeps `canPlay`'s signature, but then the UI can't grey the hand out — check how the UI consumes `canPlay` and pick accordingly). |
| `siltLungs` | `startBattle` (`battle.ts:746`), right after `bs.drawPile` is shuffled | splice a `{ uid: run.nextUid++, defId: 'waterlogged', upgraded: false }` into a random position via the battle rng. This touches only the battle's copied deck, not `run.deck` — no permanent compounding. |
| `dimmingLight` | `drawCountFor` (`battle.ts:736`) | `if (bs.turn === 1 && hasPressure(run, 'dimmingLight')) n -= 1` (turn is already incremented when draw happens — same check `glassFloat` uses at `battle.ts:641`) |
| `numbingCold` | `startPlayerTurn` where energy is set | on turn 1 only: `bs.energy -= 1` (floor 0) |
| `barnacledHulls` | `startBattle`, next to the loop-Might grant (`battle.ts:815`) | `for (const e of living(bs)) e.block += 4 * run.loop` |
| `hungeringDark` | `restHealAmount` (`run.ts:572`) | subtract 0.10 from `frac` before the floor/rounding (don't let frac go below 0.05) |

### 4.5 Store + UI flow

- **`src/state/store.ts`:** add `'pressureChoice'` to the `Screen` union (line ~31). In
  `continueEndless` (line ~587) and the re-loop branch of `leaveReward` (line ~607), after
  `beginLoop`: if `run.pressureOffer` exists, `set({ screen: 'pressureChoice' })` instead of
  `'map'`; when the offer is empty (Abyssal Toll fired), keep going to `'map'` but make the
  toast say so (e.g. "Loop N — the deep takes its toll: −5 Max HP").
  Add a `choosePressure(id)` action that wraps the engine function, commits, toasts the
  chosen Pressure's text, and routes to `'map'`.
- **New screen component** (e.g. `src/ui/screens/PressureChoiceScreen.tsx`), registered
  wherever screens are switched (grep for `'victory'` in the screen router). Present the two
  Pressures as cards in the style of the boss-relic/boon pick on the reward screen; flavor
  header like "The deep demands its due — choose your burden." **Project convention:**
  decision screens must give access to deck and relics — mirror whatever header/links the
  reward or shop screens use. There must be no way to skip: the only exits are the two picks.
- **Run HUD:** render active Pressures where relics render in the run header, visually
  distinct (danger-tinted), with name+text on tap/hover like relics. On `GameOverScreen`
  (`src/ui/screens/RunEndScreens.tsx`), if `run.pressures.length`, list them under the
  "Deepest dive" line — they're the story of the death.
- **Battle UI nicety (optional, small):** when `deepDemands` is active, show
  `cardsPlayedThisTurn/12` somewhere subtle once the count passes ~8.

### 4.6 Save migration + sim + tests

- **`src/state/persist.ts` → `parseSaveBlob`:** add
  `if (blob.run.pressures === undefined) blob.run.pressures = [];` next to the existing
  `loop` backfill. A mid-endless old save resumes with zero Pressures — acceptable; it picks
  one on its next loop. Add a case to `src/state/persist.test.ts`.
- **`src/sim/simulate.ts`:** in the endless branch (line ~220, `beginLoop(run, newEmit())`),
  immediately resolve the offer with the policy rng:
  `if (run.pressureOffer) choosePressure(run, run.pressureOffer[Math.floor(rng() * run.pressureOffer.length)])`.
- **`src/engine/engine.test.ts`:** add — offer is deterministic per seed (same seed → same
  two ids); each Pressure's effect (card 13 is rejected under `deepDemands`; battle draw pile
  contains exactly one extra Waterlogged under `siltLungs` and `run.deck` is untouched;
  `crushingDepth` drops maxHp by 3 on `descend` with floor 15; turn-1 draw is 4 under
  `dimmingLight`; turn-1 energy under `numbingCold`; enemy block under `barnacledHulls`;
  rest heal under `hungeringDark`); Abyssal Toll fires when all 7 are held.

---

## 5. Phase 3 — Encounter escalation (`src/engine/endless.ts`)

Nuclear-Throne-style mechanical ramp. All in one file; each is a one-line curve change:

1. **Raise the budget ceiling** — `loopBudget` (line 39):
   `Math.min(2, 1 + 0.12 * loop)` → `Math.min(3, 1 + 0.15 * loop)`. Group size stays capped
   at 4 (`while (enemies.length < 4)`) — the extra budget buys *nastier* members, not more
   slots, so no UI layout risk.
2. **Cross-act mixing keeps climbing** — line 67:
   `loop >= 2 ? 0.5 : 0.3` → `Math.min(1, 0.3 + 0.15 * loop)` (60% at L2, 90% at L4, full
   alien rosters by L5).
3. **Affixes arrive earlier and go deeper:**
   - Elites (line 95): 2 affixes at `loop >= 2` (was 3); 3 affixes at `loop >= 5`.
   - Bosses (line 106): same schedule (`loop >= 2 ? 2 : 1`, 3 at `loop >= 5`).
   - Normals: at `loop >= 4`, an affixed normal has a 35% chance of a second affix
     (`rollAffixes(rng, def, 2)`); budget-cost multiplier for a double-affixed enemy goes
     from 1.3 to 1.5 (line 79).
4. Update the header comment on `loopBudget` — it currently promises "gently"; that's no
   longer the contract.

**Tests:** `engine.test.ts:205` (deterministic specs) should still pass untouched — these
are curve changes on the same seeded rng. Update any assertion that pins affix counts at
specific loops (line ~252 area).

---

## 6. Phase 4 — Score the risk

Deeper loops are now much harder, so pay them progressively. In `scoreRun`
(`src/engine/run.ts:748`), replace `run.loop * 100` with an exported helper so the UI can't
drift out of sync:

```ts
/** loop k pays 100 + 50(k−1) — deeper descents are worth more */
export function loopScore(loop: number): number {
  return 100 * loop + 25 * loop * (loop - 1);
}
```

Use it in `scoreRun` AND in the `ScorePanel` row (`src/ui/screens/RunEndScreens.tsx:24`,
which currently hand-computes `run.loop * 100`). Update the score test at
`engine.test.ts:185`. Fathoms inflation is bounded because endless deaths pay only the delta
above the banked victory (`store.ts:206`) — no change needed there.

---

## 7. Verification checklist (run in order)

1. `npm test` — all green, including the new Pressure/curve/score tests.
2. `npm run sim -- --endless` — compare against the Phase 0 baseline. Target: median death
   loop 3–4, tail ≤ ~8, and the per-loop-killer report showing deaths from *damage taken*,
   not only stat walls. Tune, in this order of preference: Pressure magnitudes → damage
   exponent (1.15 ± 0.03) → budget slope. Touch the HP exponent last, if at all.
3. Determinism: same seed twice → identical loop-1 map, specs, and pressure offer (covered
   by tests, but eyeball one seeded run).
4. Save round-trip: export a save mid-endless, import it, confirm `pressures` survive and an
   old-format save (no `pressures` key) imports cleanly.
5. Manual smoke in the dev server (`npm run dev`): win a fast run (or temporarily start a
   seeded endless state), descend, see the Pressure choice screen (with deck/relics
   accessible), pick one, confirm the HUD shows it, fight one battle at loop 1, die, and
   check GameOverScreen lists the Pressures endured.

## 8. Out of scope (deliberately)

- No new enemy content, no boss move changes (candidate for a later pass: loop bosses gain
  an extra authored move at L3+).
- No compendium entries for Pressures.
- No change to the player economy (gold/heals/boons stay as-is — the asymmetry is the wall).
- No online leaderboard; `meta.bestScore` and the loop line on GameOverScreen remain the
  scoreboard.
