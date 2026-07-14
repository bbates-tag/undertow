# UNDERTOW — design notes

*The short version of every decision that matters, per §11.5 of the build brief.*

## The core loop

**Moment to moment (10–60s):** read enemy intents → read the tide → sequence 3 energy of cards → watch numbers pop → end turn. The skill is *sequencing under two clocks*: the enemy's telegraphed move (this turn's problem) and the tide phase (this turn's opportunity).

**Run to run (15–35 min):** climb down a branching map, spend rewards on deck identity, hit the sawtooth: normal fights build resources → elite/boss spikes spend them → post-boss heal + power spike resets the curve, one act deeper and meaner.

**Session to session:** fathoms accumulate win or lose → unlock packs, second character, Depth tiers, Daily Dive streaks, trophies. Failure always pays forward.

## The signature mechanic: the Tide

A global 4-phase cycle — **Low → Rising → High → Falling** — advancing at the start of every player turn.

- **Flood: +X** effects trigger while the tide is High (offense wants High).
- **Ebb: +X** effects trigger while Low (defense wants Low).
- **Shift +N** advances the cycle on demand.

Why it works: it's *free depth*. A new player can ignore it completely and lose nothing but upside; a veteran sequences Shift cards so Lurker's Ambush always lands on High tide, or builds **King Tide** (tide locked to High) and warps their whole deck around it. It also gives bosses legible drama — the Drowned God casts TSUNAMI **every High tide**, turning the shared clock into a dodge-window puzzle: shift past it, or brace.

Design guardrails: exactly one phase per bonus keyword (no matrix of conditions), bonuses are flat numbers (no multipliers), and the dial + banner make the current phase unmissable.

## Characters & archetypes

**The Tidecaller** (72 HP, starter relic: heal 5 after each battle) — three overlapping archetypes:

1. **Toxin** — stack damage-over-time (Venom Spit, Toxic Slick, Chum the Water), multiply it (Blightwave doubles, Miasma automates), win while blocking. Counterplay tension: toxin ignores Block but takes time — bad against Deep Mines and summoners.
2. **Tide tempo** — Flood haymakers (Tidal Slam, Lurker's Ambush, Abyssal Fang) + Shift control (Riptide, Tide Chart, Lunar Pull, Perpetual Current). The "play the clock" deck.
3. **Bulwark** — big Block, Anchor to bank it, Spines and **Hull Ram** (damage = your Block) to make defense lethal. Ebb cards reward defending on schedule.

**The Voltaic** (70 HP, unlocked by beating the Act I boss; starter relic: start with 3 Charge) — one resource, two speeds:

1. **Charge/Discharge burst** — Conduct cards bank Charge (it never decays); Discharge cards (Arc Lash, Gigavolt, Storm of the Century) spend *all* of it at once. The decision every turn: bank or spend? Amplify (double Charge) and Lightning Rod (refund after Discharge) are the payoff engines.
2. **Storm engines** — passive Conduct (Eel Coil, Dynamo) feeding **Tesla Scales** (AoE per Conduct) and **Supercell** (turn-start AoE = Charge) for a no-Discharge "keep the storm" build.

Neutral cards fill gaps; 4 curses (from events, greed, and Act III enemies) give removal a second job.

## Balance philosophy

- **Deaths must be legible.** Every enemy telegraphs; attack numbers shown are final (buffs included). If you die, the killing turn was visible at least one decision earlier.
- **RNG widens options, never gates.** Card rewards offer 3+skip; shops always sell removal; rest sites always offer both choices; enemy AI is seeded and pattern-based (learnable), with variance only inside patterns.
- **Sawtooth attrition targets:** normal fight ≈ 4–10 HP net loss early act (before sustain comes online), elites ≈ 12–20, boss arrives with the player at 60–90% if they've played the map well. Act transitions heal 25%.
- **The simulator sets the floor, not the ceiling.** `npm run sim` plays runs with a deliberately mediocre greedy bot (no tide timing, no charge banking, mechanical drafting). Current envelope: the bot reaches floor ~18–20 of 36, dies spread across all three acts, and wins ~4% as Tidecaller. A human who reads intents and times the tide should sit around 15–30% at Depth 0, trending toward the classic roguelite "earned win." Depth 1–10 exist to keep 90%+ winrate players uncomfortable.
- **Elites are archetype exams:** Abyssal Warden (Spines) punishes multi-hit spam; Anglerfish (Weak) taxes attack-only decks; Kraken Cultist punishes slow decks with a widening board. If an "exam" kills you, the fix is a draft habit, not a retry.

## Retention systems (all local, no dark patterns)

- **Fathoms** = run score, banked win or lose → unlock packs at 150/400/800/1400 (12 cards + 7 relics gated at launch, so early pools stay readable).
- **Depths 1–10** per character after a win — additive difficulty modifiers, StS-ascension style.
- **Daily Dive** — seed `undertow-daily-YYYY-MM-DD` → identical map/enemies/rewards for everyone that day + 2 rotating modifiers; local best-score history. One completion per day.
- **16 trophies**, run history (last 40), lifetime stats.
- Sessions are respectful: battles are 1–3 minutes, every screen is a safe quit point, and the save (including mid-battle) restores on load.

## Asset system (§7 compliance)

One `@theme` token block in `src/index.css` defines the palette (abyss navies, bioluminescent cyan/magenta, treasure gold), type scale, radii, and shadows; every frame, panel, map node, bar, and card derives from it. Card "art" = recipe of *(game-icons.net glyph) + (type-tinted token frame) + (auto-generated rules text)* — which is what keeps 91 cards and 29 relics looking like one set. FX are Framer Motion + one canvas particle layer (sparks/bubbles/rings). Audio is 35 ZzFX presets + a generative underwater score (drone pair, brown-noise pressure bed, pentatonic droplets through a feedback delay; boss fights add a pulsing low third). Ship weight: zero images, zero audio files.

## Deliberate scope cuts

- **No potions** — the consumable slot is fun but the tide + charge already fill the "timing resource" niche; cut to keep battle UI clean on phones.
- **No X-cost or cost-morphing cards** (beyond upgrades) — keeps the ops DSL total and previews exact.
- **Boss relics are the only "energy+" sources** — energy inflation is the classic balance leak.
- **Howler.js skipped** — all audio is synthesized, so Web Audio direct (explicitly permitted by the brief) avoids shipping a player for files that don't exist.

## The Barnacle Bazaar (v2 rework)

*Problem:* v1 shops were a vending machine for loot you already get free — 5 cards from the same reward pool (a post-battle pick costs nothing), relics priced at most of an act's income (~250–300g), and exactly one thing worth crossing the map for (removal). Gold had no other sink, so it accumulated with nothing to want.

*Identity:* the proprietor is a salvager and butcher. The Bazaar sells **services, not stock** — things get cut, filed, and polished here, and nowhere else.

**Stock (cut from 5 cards to 3):** slot 1 is a guaranteed **rare**, slots 2–3 roll the existing shop rarity weights; one of the three is half price. Fewer, better cards — each slot reads as curated, not filler. Relic slots unchanged (2). Prices per rarity unchanged.

**Services (one use each per shop):**

| Service | Does | Price |
| --- | --- | --- |
| Fillet (existing) | Remove a card from the deck | 75 + 25 per removal bought this run; Deep Sextant halves |
| **Whetstone** | Upgrade a card | 90 + 30 per whetstone bought this run |
| **Defang** | Permanently remove the downside of one owned two-edged (treasure) relic | 140 flat |

- **Whetstone** relieves the rest-site heal/upgrade tension without removing it: the upgrade is buyable, but costs most of an act's normal-battle gold, and escalation stops it from replacing vents wholesale. Deliberately *not* discounted by Deep Sextant.
- **Defang** targets the treasure tier's "power with teeth": Fanged Locket, Leaden Idol, Barbed Chain, Bloodletter Hook, Widow's Veil. A defanged relic shows a ✦ and its cleaned-up text. Second-order effect: treasure chests get better too — you can grab a risky relic planning to defang it later. **Merchant's Debt is excluded** (defanging −10g/battle is just buying gold; also: "that one's a debt, not a defect"). The service greys out with nothing eligible — visible early, so players learn it exists before they can use it.
- Engine shape: `run.defanged: string[]` checked at the same hook sites as the relic ids; `defangedText` on the relic def replaces the display text. Ascension 8's ×1.2 price scale applies to everything above.

**Salvage crate (one per shop):** a mystery relic, sight unseen, for **85g** — cheaper than any known relic, no tier promise. Tier roll: common 50 / uncommon 35 / rare 15, drawn from the same pool rules as relic stock (never owned, never a duplicate of the shop's open stock). Rolled at shop generation on the seeded run stream — Daily Dive players all open the same crate. If the pool is dry (deep endless), the crate simply isn't on the shelf.

**Pawn counter (unlimited per shop):** sell an owned relic back to the proprietor at roughly 40% of tier value — flat prices, and deliberately *not* raised by the Ascension 8 scale:

| starter | common | uncommon | rare | treasure | boss |
| --- | --- | --- | --- | --- | --- |
| 25g | 40g | 60g | 95g | 55g | 110g |

- Anything can be pawned — selling your starter relic or a boss relic is a real (usually bad, occasionally brilliant) decision. On-pickup effects already banked (Max HP, gold) are kept; the sell price is low enough to price that in.
- **Merchant's Debt is the designed escape valve:** pickup pays 60g, pawning it later pays 55g and ends the −10g/battle bleed — breakeven around eleven battles, so holding it is still usually right. The proprietor buying back a debt is exactly her kind of business.
- Pawning a defanged relic just works (the `defanged` entry is cleaned up with it); you're forfeiting the 140g polish, which the picker makes visible with the ✦.
- Second-order effect: dead relics (a tide relic when the tide is locked, char-specific leftovers) become ~half a service voucher, and the pawn→defang loop gives late shops something to do with gold surplus.

*Deferred to a later slice:* chum specials (cheap next-battle-only blessings) — wait for a playtest of the four-sink economy first; same for the uncommon relic price trim (145–170 → ~120–140).

## Tuning knobs (where to reach first)

| Feels wrong | Reach for |
| --- | --- |
| Runs too hard/easy overall | enemy `hp` ranges and `ascHpScale`/`ascEnemyDmgBonus` in `battle.ts` |
| An act wall | that act's `hard`/`elite` pools in `content/enemies.ts` (the sim's "top killers" table names the culprit) |
| Archetype under/overperforming | its commons first (they dominate draft density), rares last |
| Economy | reward gold in `generateBattleReward`, prices in `generateShop` |
