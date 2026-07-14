# The Pilot — character design doc

*"She has swum beside every jaw in the ocean. None has closed on her."*

Status: **design draft** — nothing implemented. Numbers are first-pass and flagged
where they need sim/playtest pressure. Companion to the character roster in
`src/content/characters.ts` and the design pillars in `DESIGN.md`.

## Fantasy

A pilot-fish rider — a wiry navigator who survives the open ocean not by armor
or venom but by *knowing what everything intends before it moves*. She is the
character who plays the game's own core pillar as a weapon: every enemy
telegraphs, and she is the one diver who really listens.

Player fantasy in one sentence: **read the room, then be somewhere else.**

## Identity

| | |
| --- | --- |
| id | `pilot` |
| Name / title | The Pilot — *Never Once Bitten* |
| HP | **68** (middle-light: she expects not to be hit) |
| Color | a pale sight-line silver-blue (new `--color-pilot`, e.g. `#9fd8ff`) |
| Icon | `GiDoubleFish` or `GiFishEscape` (pilot fish + escort fantasy) |
| Starter relic | *Pilot's Instinct* |
| Unlock | `battlesFlawless`-based (see Unlock) |

**Mechanical axis vs the roster:** Tidecaller owns *timing a shared clock*,
Voltaic owns *banking a private resource*, the Drowned owns *spending flesh*.
The Pilot owns ***information*** — conditions on what enemies are about to do.
No other character's cards ever read the intent line.

## Core mechanic 1 — Read

**Read** riders are conditions keyed to telegraphed intents:

> *Riposte — 1⚡ Attack: Deal 5. **Read** (attacker): deal 9 instead and gain 2 Block.*

Intent kinds group into four **Read classes** (keyword glossary entries):

| Read class | IntentKinds covered | Fantasy |
| --- | --- | --- |
| **attacker** | `attack`, `attackBlock`, `attackDebuff` | jaws opening |
| **schemer** | `buff`, `debuff`, `summon` | rituals to interrupt |
| **guarded** | `block` | shells to strike around |
| **dormant** | `sleep`, `unknown` | things best not woken |

Engine shape: one `Cond` extension —

```ts
| { intends: IntentClass | IntentClass[]; who: 'target' | 'anyOnYou' | 'none' }
```

- `who: 'target'` — the card's target's intent (attacks/targeted skills)
- `who: 'anyOnYou'` — any living enemy intends an attack class move (mass-brace skills)
- `who: 'none'` — quiet-turn payoffs (draw/energy when nothing is coming)

`condMet` already receives `(bs, cond, target)`; intents resolve from
`ENEMIES[e.defId].moves[e.moveId].intent`, all data that exists at cast time.
`describe.ts` gains one text branch per `who`. **No new statuses required** —
the kit leans on Block, Spines, Weakened, Exposed, Finesse.

## Core mechanic 2 — Foresight

The Pilot sees **one move further ahead**: enemy intent pills show next turn's
move in a smaller ghosted chip beside the current one (her runs only).

- Enemy move selection is seeded and pattern-based, so the next move is
  computable — but today it's rolled at turn start. Implementation: roll moves
  **one turn ahead into a queue** (`e.moveId`, `e.nextMoveId`); turn start pops
  the queue and rolls the new tail. Deterministic, save-friendly (old saves:
  backfill by rolling once on load).
- **Summons and phase-triggered swaps** (Kraken regrow, Drowned God TSUNAMI at
  High tide) may invalidate the preview — acceptable: the ghost chip renders
  with a `~` and the glossary says foresight is a *forecast, not a promise*.
  The Drowned God's tide-locked pattern actually makes her stronger there by
  design; that fight is her exam.
- A small card package treats the **next tide phase** as live:
  *"Flood — now or next turn."* One new cond: `{ floodSoon: true }` /
  `{ ebbSoon: true }` (tide + 1 step is pure arithmetic on `bs.tide`).

Foresight is the character's *innate* perk — not a status, not a stack — so the
UI cost is paid once and every card in the pool gets smarter for it.

## Starter deck (10)

| Card | Count | Cost | Text |
| --- | --- | --- | --- |
| **Pilot Jab** | ×4 | 1⚡ | Attack. Deal 5. Read (attacker): deal 8. |
| **Slip Aside** | ×4 | 1⚡ | Skill. Gain 4 Block. Read (anyOnYou): gain 7. |
| **Read the Water** | ×1 | 0⚡ | Skill. Draw 1. Read (none): draw 2. |
| **Undertow Feint** | ×1 | 1⚡ | Attack. Deal 4. Read (schemer): deal 10. |

Starter texture teaches the loop: hit attackers harder, brace when jaws open,
cash quiet turns for tempo, punish rituals.

## Card pool draft (28: 4 starter / 9 common / 9 uncommon / 6 rare)

Upgrade values in parens. All numbers are **draft** — the flagged ones (⚠) are
the likely balance hotspots.

**Common (9)**
1. *Riposte* — 1⚡ A: Deal 5 (7). Read (attacker): deal 9 (12) and gain 2 (3) Block.
2. *Sidestep* — 0⚡ S: Gain 3 (4) Block. Read (anyOnYou): +3 (+4).
3. *Shark's Shadow* — 1⚡ A: Deal 7 (9). If you lost no HP last turn, +4 (+5). (pairs with `paleStarfish` precedent)
4. *Wake Reader* — 1⚡ S: Draw 1, gain 3 (5) Block.
5. *Chart the Strike* — 1⚡ S: Apply Exposed 1 (2). Read (attacker): also Weakened 1.
6. *Escort Instinct* — 1⚡ S: Gain 5 Block. Read: +2 per enemy intending an attack (⚠ multi-fight scaling).
7. *Jawline* — 2⚡ A: Deal 11 (14). Read (attacker): apply Weakened 1 (2).
8. *Flickerfin* — 0⚡ A: Deal 3 (4). Read (guarded or schemer): draw 1.
9. *Current Sense* — 1⚡ S: Shift +1. If the tide will be High next turn, gain 6 (8) Block. (foresight teaser at common)

**Uncommon (9)**
1. *Interrupt* — 1⚡ A: Deal 6 (8). Read (schemer): deal 13 (16). (the ritual-cutter)
2. *Slip the Jaws* — 1⚡ S: Gain 7 (9) Block. Read (exactly one attacker on you): gain 12 (15) instead.
3. *Dead Reckoning* — 1⚡ S: Draw 2. Read (none): costs 0 (⚠ tempo engine).
4. *Countercurrent* — 2⚡ A: Deal 4 (5) ×3. Read (attacker): each hit +2.
5. *Weather Eye* — 1⚡ P: At the start of your turn, Read (anyOnYou): gain 3 (4) Block. (auto-brace)
6. *Bait the Lunge* — 1⚡ S: Gain 3 (4) Spines. Read (2+ attackers): gain 5 (7) instead.
7. *Future Swell* — 1⚡ S: Gain 8 (10) Block. Flood — now or next turn: draw 2.
8. *Pinpoint* — 1⚡ A: Deal 8 (11). Read (guarded): pierce (ignores Block). (strike where the shell isn't)
9. *Pilot's Grace* — 1⚡ P: The first attack that hits you each turn deals 3 (4) less.

**Rare (6)**
1. *Called Shot* — 1⚡ S: Choose an enemy. If it dies this turn, gain 2⚡ (3⚡) and draw 2 (3). (kill-sequencing payoff)
2. *Perfect Read* — 2⚡ P: Your Read riders always trigger (⚠ warps every card; costed high on purpose).
3. *Never Bitten* — 3⚡ (2⚡) A: Deal 2× (3×) the target's telegraphed attack damage. Read fails vs non-attackers: deal 10 flat. (⚠ vs big-telegraph elites — cap may be needed)
4. *Eye of the Storm* — 2⚡ S: Read (none): gain 2⚡ and draw 3. Otherwise: gain 12 (16) Block.
5. *Second Sight* — 1⚡ S: Draw 3 (4). Exhaust. Foresight flavor: also reveals `unknown` intents this battle.
6. *Apex Escort* — 3⚡ P: At the start of your turn, deal 4 (5) to every enemy intending an attack. (⚠ stacks with Weather Eye into a turtle engine)

## Relics

| Relic | Tier | Text |
| --- | --- | --- |
| **Pilot's Instinct** | starter | The first Read rider that triggers each turn draws a card. |
| *Barometer Shell* | common (char) | Battles start with 5 Block if any enemy opens with an attack. |
| *Gyre Charts* | uncommon (char) | Your Flood and Ebb effects also trigger when the matching phase is **next**. (⚠ effectively doubles tide uptime — maybe rare) |
| *Eye of the Gyre* | boss (char) | At the start of each turn, apply Exposed 1 to every enemy intending an attack. `unknown` intents are always revealed to you. |

## Unlock

`battlesFlawless` is already tracked per run. Proposal:

> **lockText:** "End three battles untouched in a single dive. Nothing has ever
> touched her."

You unlock the character by playing like her. Checked at run end alongside the
other char unlocks (Voltaic: act-1 boss; Drowned: two act bosses in one dive).

## Balance risks & guardrails

- **Turtle assembly** (Weather Eye + Apex Escort + Pilot's Grace): passive value
  that plays itself. Guardrails: all three are per-*turn* not per-attack, Toxin
  and mines ignore the whole plan, and Act III's schemer-heavy pools starve
  attacker-Reads.
- **Read texture collapse**: if a fight is all-attackers (or none), half the
  riders go flat. Bestiary audit needed: every act's pools should keep both
  attack and non-attack intents in most encounters — mostly true today
  (buff/summon/block moves are everywhere), verify with a script over
  `ENEMIES[*].moves` before content lock.
- **Never Bitten vs telegraph inflation**: ascension/endless add flat enemy
  damage (`ascEnemyDmgBonus`), which silently buffs this card. Consider capping
  at 40 or scaling with base (pre-bonus) damage.
- **Dead Reckoning / Eye of the Storm quiet-turn loops**: "none intends attack"
  is common in schemer fights — watch for degenerate draw engines; both exhaust
  if needed.
- **Sim bot**: the greedy bot ignores intents entirely, so the winrate floor
  will read artificially low. Teach it one heuristic — prefer Read cards whose
  rider is currently met — or accept a lower floor for this char (document it
  in the sim output either way).

## Implementation plan (when we build)

1. **Engine** (small): `intends`/`floodSoon` conds in `types.ts` + `condMet`;
   `nextMoveId` queue in enemy state + roll-ahead in the turn loop; describe.ts
   text for the new conds. Save-compat: backfill `nextMoveId` on load.
2. **Content**: `cards_pilot.ts` (28), `characters.ts` entry, relics, keywords
   (`read` classes + `foresight`), unlock check, ART_PROMPTS section.
3. **UI**: ghost intent chip (next move) on EnemyView for `charId === 'pilot'`;
   `~` variant when the forecast can break; glossary entries.
4. **Balance**: bestiary intent-mix audit script; sim run; Depth 1–10 pass.

Rough order: engine + a 10-card starter slice first, playable behind the
existing character-selection unlock gating, then fill the pool.

## Open questions

- Should Foresight be innate (current design) or a starter-relic effect the
  player can lose/trade? Innate is cleaner to teach; relic-based is more
  roguelite. **Leaning innate.**
- Does the ghost intent chip fit on mobile at `size: 'sm'` enemies, or does
  next-move preview live in the tap-to-inspect dossier instead? (Dossier-only
  is a fine v1.)
- Name check: "The Pilot" vs "The Pilotfish" vs "The Lookout" — current pick
  is The Pilot with the fish in the art, not the name.
