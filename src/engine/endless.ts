// Endless-loop procedural encounters. Threat costs are derived from enemy
// data (never hand-maintained), budgets are calibrated against the authored
// encounter pools, and generation runs on the seeded map rng so loops replay
// identically per seed. Loop 0 — the authored three acts — never touches this.

import type { EncounterSpec, EnemyDef } from './types';
import type { Rng } from '../lib/rng';
import { ENEMIES, encounterPool } from '../content/enemies';
import { AFFIXES } from '../content/affixes';

/** summon-only creatures never spawn on their own */
const MINIONS = new Set(['tentacleSpawn', 'krakenArm', 'boneShoalMinion']);

/**
 * How dangerous one enemy is, derived from its data: staying power (avg HP)
 * plus punch (mean damage of its attack moves). Pure-support enemies still
 * cost a floor amount — buffs and summons threaten indirectly.
 */
export function threatCost(def: EnemyDef): number {
  const avgHp = (def.hp[0] + def.hp[1]) / 2;
  const attacks = Object.values(def.moves).filter((m) => m.attack);
  const avgHit = attacks.length
    ? attacks.reduce((a, m) => a + m.attack!.amount * (m.attack!.times ?? 1), 0) / attacks.length
    : 3;
  let cost = avgHp * 0.5 + avgHit * 2;
  if (def.tier === 'elite') cost *= 1.25;
  if (def.tier === 'boss') cost *= 1.5;
  return Math.round(cost);
}

/** average total threat of the authored encounters in (act, pool) — the budget baseline */
function authoredBudget(act: 1 | 2 | 3, pool: 'easy' | 'hard' | 'elite'): number {
  const encs = encounterPool(act, pool);
  const totals = encs.map((e) => e.enemies.reduce((a, id) => a + threatCost(ENEMIES[id]), 0));
  return totals.reduce((a, b) => a + b, 0) / totals.length;
}

/** stat scaling already compounds per loop — the budget adds count/mix pressure, gently */
function loopBudget(base: number, loop: number): number {
  return base * Math.min(2, 1 + 0.12 * loop);
}

/** roll `count` distinct affixes that make sense on this enemy */
function rollAffixes(rng: Rng, def: EnemyDef, count: number): string[] {
  const hasAttack = Object.values(def.moves).some((m) => m.attack);
  const pool = Object.keys(AFFIXES).filter((a) => {
    if (a === 'venomous' && !hasAttack) return false; // toothless venom
    if (a === 'relentless' && def.reanimates) return false; // already does
    return true;
  });
  return rng.shuffle([...pool]).slice(0, Math.min(count, pool.length));
}

/** odds a normal enemy spawns affixed — climbs with depth */
const affixChance = (loop: number) => Math.min(0.9, 0.25 + 0.15 * loop);

const normals = (act?: 1 | 2 | 3): EnemyDef[] =>
  Object.values(ENEMIES).filter(
    (e) => e.tier === 'normal' && !MINIONS.has(e.id) && e.act > 0 && (act === undefined || e.act === act),
  );

/** ordinary battle node: fill a threat budget, mixing across acts at deeper loops */
export function generateBattleSpec(
  rng: Rng, act: 1 | 2 | 3, pool: 'easy' | 'hard', loop: number, id: string,
): EncounterSpec {
  const budget = loopBudget(authoredBudget(act, pool), loop);
  const crossChance = loop >= 2 ? 0.5 : 0.3;
  const sameAct = normals(act);
  const anyAct = normals();
  const enemies: EncounterSpec['enemies'] = [];
  let spent = 0;
  while (enemies.length < 4) {
    const src = rng.chance(crossChance) ? anyAct : sameAct;
    const affordable = src.filter((e) => threatCost(e) <= budget - spent);
    if (!affordable.length) break;
    const def = rng.pick(affordable);
    const affixes = rng.chance(affixChance(loop)) ? rollAffixes(rng, def, 1) : [];
    enemies.push(affixes.length ? { defId: def.id, affixes } : { defId: def.id });
    spent += threatCost(def) * (affixes.length ? 1.3 : 1); // affixes aren't free
    // within tolerance of the budget, sometimes stop early — variety in group size
    if (spent >= budget * 0.75 && rng.chance(0.55)) break;
  }
  if (!enemies.length) enemies.push({ defId: rng.pick(sameAct).id });
  return { id, enemies, pool };
}

/** elite node: an authored elite anchors it; deeper loops pull elites from any act */
export function generateEliteSpec(rng: Rng, act: 1 | 2 | 3, loop: number, id: string): EncounterSpec {
  const elites = Object.values(ENEMIES).filter(
    (e) => e.tier === 'elite' && (loop >= 2 || e.act === act),
  );
  const anchor = rng.pick(elites);
  const budget = loopBudget(authoredBudget(act, 'elite'), loop);
  // the anchor always spawns affixed — two affixes past loop 2
  const anchorAffixes = rollAffixes(rng, anchor, loop >= 3 ? 2 : 1);
  const enemies: EncounterSpec['enemies'] = [{ defId: anchor.id, affixes: anchorAffixes }];
  const remaining = budget - threatCost(anchor) * 1.3;
  const adjuncts = normals().filter((e) => threatCost(e) <= remaining);
  if (adjuncts.length && rng.chance(0.6)) enemies.push({ defId: rng.pick(adjuncts).id });
  return { id, enemies, pool: 'elite' };
}

/** loop boss: the authored encounter, but the boss-tier creature spawns affixed */
export function generateBossSpec(rng: Rng, act: 1 | 2 | 3, loop: number, id: string): EncounterSpec {
  const enc = encounterPool(act, 'boss')[0];
  const count = loop >= 3 ? 2 : 1;
  return {
    id,
    pool: 'boss',
    enemies: enc.enemies.map((defId) => {
      const def = ENEMIES[defId];
      return def.tier === 'boss' ? { defId, affixes: rollAffixes(rng, def, count) } : { defId };
    }),
  };
}
