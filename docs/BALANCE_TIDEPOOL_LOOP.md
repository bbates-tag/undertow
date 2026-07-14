# Balance: the Tidepool infinite (Oarfish Ribbon → Hull Ram)

*Branch `balance/tide-shift-block-combo` — the recommended package (A1 + B1 + B2 + B3,
plus the King Tide × Ribbon fix) is implemented on this branch.*

## The reported combo

Player-found in an endless Tidecaller run (~1400 damage Hull Ram, unbounded in principle):

- **Tidepool+** (`tidepool`, common skill): 0 cost, Shift 1, draw 2.
- **Oarfish Ribbon** (`oarfishRibbon`, common relic): gain 2 Block whenever you Shift. No cap.
- **Hull Ram+** (`hullRam`, uncommon attack): 0 cost, deal damage equal to your Block. No cap.

With a deck thinned to mostly Tidepool+, every play is energy-free, self-replacing-plus-one,
and grants 2 Block. `drawCards` auto-reshuffles the discard pile (battle.ts:332), so the
deck cycles forever inside a single turn. Block is only wiped at end of turn
(battle.ts:854), so the whole loop resolves before any wipe. Finish with Hull Ram+ for
Block-as-damage. The only bound is player patience.

## Why it's worse than the report

1. **Base Tidepool already loops.** Unupgraded it's 0-cost, Shift 1, *draw 1* — exactly
   self-replacing with no exhaust. In a sufficiently thinned deck that is already an
   infinite engine; the upgrade (draw 2) merely lets the loop tolerate dead cards in hand.
2. **Every "per-event" trigger is a payoff, not just Oarfish Ribbon.** Once one free
   self-replacing card exists, all of these become unbounded:
   - `oarfishRibbon` — 2 Block per Shift (the reported one)
   - `heartOfMaelstrom` (boss) — 3 Block per tide change
   - `kelpWrap` — 5 Block per shuffle (the loop shuffles constantly)
   - `drownedCompass` (rare) — **1 Might + 1 Finesse per full tide cycle** — infinite
     Might is far scarier than infinite Block
   - **Feeding Frenzy** (`perCardPlayed`) — needs *no relic at all*; the loop alone
     pushes `cardsPlayedThisTurn` arbitrarily high
   - Anchor (Hardened Shell / Nacre Bastion) even carries the Block mountain across turns.
3. **Not endless-only.** Endless just makes deck-thinning trivial; a normal run with 4–5
   removals reaches "good enough to one-shot bosses" density.
4. **Side quirk found while reading:** Oarfish Ribbon's hook sits *outside* `shiftTide`
   (battle.ts:502–504), so under King Tide (which locks the tide and early-returns,
   battle.ts:292) Shift ops still grant 2 Block despite the tide never moving.
   Heart of the Maelstrom, by contrast, only fires on a real change. Decide which
   semantics Ribbon should have.

## Root cause

A 0-cost, non-exhausting card that fully replaces itself creates a free engine: net
energy 0, net cards ≥ 0, repeatable forever. Any uncapped per-shift / per-shuffle /
per-card-played trigger then integrates to infinity. Fixing triggers one at a time is
whack-a-mole; the enabler is the card.

## Rebalance options

### A. Fix the enabler (primary — pick one)

- **A1 (recommended): Tidepool gains `exhaust` (both tiers).** Still a premium 0-cost
  cantrip ("Shift 1, draw 1, exhaust"; upgrade keeps draw 2). Kills *every* loop built on
  it — Ribbon, Kelp Wrap, Compass, Feeding Frenzy — in one line, and barely touches fair
  decks (you rarely want to play Tidepool 3× a turn anyway).
- A2: Tidepool+ draws 1 like the base; upgrade becomes "Shift 1, draw 1, gain 3 Block"
  or "Shift 2, draw 1". *Insufficient alone* — the base card still loops (see above).
- A3: Base costs 1, upgrade to 0. Changes the card's identity as the archetype's free
  tide-nudger; A1 preserves more of its feel.

### B. Cap the faucets (secondary — future-proofing, do alongside A)

Wording pattern: "the first N times each turn". Implementation: per-turn counters in
`bs.counters`, reset in `startPlayerTurn`, checked at the existing hook sites.

- **B1: Oarfish Ribbon → "The first 3 times you Shift each turn, gain 2 Block"** (6/turn).
  Fair tide-tempo hands (Riptide + Undertow + Tide Chart) occasionally hit 4 shifts; if
  that stings in playtesting, cap at 4 instead.
- **B2: Heart of the Maelstrom → first 3 tide changes each turn** (9/turn).
- **B3: Drowned Compass → first full cycle each turn.** (Infinite Might is the single
  worst payoff on this list — cap it even if nothing else ships.)
- B4: Kelp Wrap → first 2 shuffles each turn (mostly moot once A1 lands; cheap insurance).

### C. Cap the payoff (probably skip)

- C1: Hull Ram "damage equal to your Block (max 40)". Caps read badly on cards, and with
  A+B in place a dedicated Bulwark turn tops out around 30–40 Block naturally — the big
  Hull Ram turn stays as the archetype fantasy without a printed ceiling.
- C2: Hull Ram+ keeps cost 1 (upgrade grants +50% Block scaling instead of cost 0).
  Only worth it if we want Hull Ram spam decks weakened generally.
- Feeding Frenzy needs nothing once A1 bounds cards-played-per-turn.

### D. Systemic guards (noted, not recommended)

Per-turn card-play cap or deckbuilding copy limits would work but punish legitimate
combo turns and change the game's grain. StS-likes traditionally let *bounded* combos
be glorious; we only need to remove the unbounded ones.

## Recommended package

**A1 + B1 + B2 + B3** (B4 optional). This kills the infinite at the source, bounds every
current on-shift/on-cycle faucet against the *next* free engine someone finds, and leaves
Bulwark's "stack Block, ram them with it" fantasy fully intact.

Also decide the King Tide × Oarfish Ribbon interaction (move the hook inside
`shiftTide`'s tide-actually-changed branch if Ribbon should require a real shift).

## Validation plan (when we implement)

1. `npm test` — engine tests (add regression tests: Tidepool exhausts; Ribbon caps at 3/turn).
2. `npm run sim -- 200` — compare Tidecaller floor against current ~13% (same bot version);
   Tidepool is a common, so watch draft density effects on the tide-tempo archetype.
3. Manual: `?debug=1` cheat panel, hand-build the loop deck, confirm it terminates.
