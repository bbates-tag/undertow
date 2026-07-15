// Headless balance simulator: plays full runs with a greedy heuristic policy
// and reports winrate, death floors, and per-act HP attrition.
//   npm run sim            → 60 runs per character
//   npm run sim -- 200     → custom run count
// The policy is deliberately mediocre (no tide timing, no synergy planning),
// so target winrates here are LOW: a skilled human should roughly double it.

import { newEmit, playCard, endPlayerTurn, stepEnemy, canPlay, cardCost, cardDef, living, readClassOf, scaleEnemyAttack, startBattle } from '../engine/battle';
import type { BattleState, CardInstance, EnemyState, Op } from '../engine/types';
import {
  addRelic, applyBoon, applyEventEffect, beginLoop, buyCrate, buyDefang, buyRemoval, buyShopItem, buyWhetstone,
  choosePressure, defangEligible, descend, doRestHeal, enterNode, generateBattleReward, generateShop, newRun,
  reachableNodes, scoreRun, completePick,
} from '../engine/run';
import type { CharacterId, MapNode, RunState } from '../engine/types';
import { CARDS } from '../content/cards';
import { EVENTS } from '../content/events';
import { UNLOCK_PACKS } from '../content/meta';
import { hashSeed, makeRng } from '../lib/rng';

const ALL_PACKS = UNLOCK_PACKS.map((p) => p.id);

interface SimResult {
  win: boolean;
  floor: number;
  act: number;
  loop: number;
  score: number;
  killedBy?: string;
  deckSize: number;
  turns: number;
  /** escort mode only: deaths forgiven before the target act */
  revives?: number;
}

function playBattle(run: RunState, rng: () => number): void {
  const bs = run.battle!;
  let guard = 0;
  while (bs.phase === 'player' || bs.phase === 'enemy') {
    if (++guard > 400) throw new Error(`battle stalled: ${bs.groupId}`);
    if (bs.phase === 'enemy') {
      let steps = 0;
      while (stepEnemy(run, newEmit())) if (++steps > 30) break;
      continue;
    }
    // player: estimate incoming damage
    const incoming = living(bs).reduce((sum, e) => {
      const def = ENEMY_CACHE[e.defId] ?? (ENEMY_CACHE[e.defId] = true);
      void def;
      const mv = e.moveId;
      const enemyDef = getEnemyMove(e.defId, mv);
      if (!enemyDef?.attack) return sum;
      const might = e.statuses.might ?? 0;
      const weak = (e.statuses.weakened ?? 0) > 0 ? 0.75 : 1;
      // ascension/endless scaling included — otherwise the bot under-blocks in deep loops
      return sum + Math.floor((scaleEnemyAttack(run, enemyDef.attack.amount) + might) * weak) * (enemyDef.attack.times ?? 1);
    }, 0);

    const playable = bs.hand.filter((c) => canPlay(run, bs, c.uid) === null && cardCost(c) <= bs.energy);
    if (!playable.length) {
      endPlayerTurn(run, newEmit());
      continue;
    }

    const needBlock = incoming > bs.player.block + 3;
    // presumptive target for scoring conditional riders (same pick as playCard below)
    const presumptiveTarget = [...living(bs)].sort((a, b) => a.hp - b.hp)[0];
    const best = pickBestCard(bs, playable, needBlock, presumptiveTarget);
    if (best.score <= 0.4 && !needBlock) {
      endPlayerTurn(run, newEmit());
      continue;
    }
    const target = presumptiveTarget;
    const err = playCard(run, best.card.uid, cardDef(best.card).target === 'enemy' ? target?.uid : undefined, newEmit());
    if (err) {
      endPlayerTurn(run, newEmit());
    }
    void rng;
  }
}

/** Resolve `if` ops against live state — the bot's whole Read heuristic:
    conditions that are true right now count, ones that aren't don't. */
function liveOps(bs: BattleState, ops: Op[], target?: EnemyState): Op[] {
  const out: Op[] = [];
  const classOf = (e: EnemyState) => readClassOf(ENEMIES[e.defId].moves[e.moveId]?.intent ?? 'unknown');
  for (const op of ops) {
    if (op.op !== 'if') { out.push(op); continue; }
    const c = op.cond;
    let met = false;
    if (c === 'flood') met = bs.tide === 2;
    else if (c === 'ebb') met = bs.tide === 0;
    else if (c === 'floodSoon') met = bs.tide === 1 || bs.tide === 2;
    else if (c === 'ebbSoon') met = bs.tide === 3 || bs.tide === 0;
    else if (c === 'targetToxined') met = !!target && (target.statuses.toxin ?? 0) > 0;
    else if (c === 'targetBelowHalf') met = !!target && target.hp <= target.maxHp / 2;
    else if (typeof c === 'object' && 'intends' in c) {
      const set = Array.isArray(c.intends) ? c.intends : [c.intends];
      if (c.who === 'target') met = !!target && set.includes(classOf(target));
      else {
        const any = living(bs).some((e) => set.includes(classOf(e)));
        met = c.who === 'anyOnYou' ? any : !any;
      }
    } else if (typeof c === 'object' && 'descentAtLeast' in c) met = (bs.player.statuses.descent ?? 0) >= c.descentAtLeast;
    else if (typeof c === 'object' && 'chargeAtLeast' in c) met = (bs.player.statuses.charge ?? 0) >= c.chargeAtLeast;
    out.push(...liveOps(bs, met ? op.then : (op.else ?? []), target));
  }
  return out;
}

function pickBestCard(
  bs: BattleState, playable: CardInstance[], needBlock: boolean, presumptiveTarget?: EnemyState,
): { card: CardInstance; score: number } {
  const score = (uid: number): number => {
      const c = bs.hand.find((h) => h.uid === uid)!;
      const def = cardDef(c);
      const cost = Math.max(1, cardCost(c));
      let s = 0;
      const ops = liveOps(bs, c.upgraded ? (def.opsUp ?? def.ops) : def.ops, presumptiveTarget);
      for (const op of ops) {
        if (op.op === 'damage') {
          const times = op.times === 'charge' ? (bs.player.statuses.charge ?? 0) : (op.times ?? 1);
          let dmg = op.amount.base + (op.amount.perCharge ?? 0) * (bs.player.statuses.charge ?? 0)
            + (op.amount.perDescent ?? 0) * (bs.player.statuses.descent ?? 0);
          if (op.amount.perBlock) dmg += bs.player.block;
          s += dmg * times * (op.target === 'all' ? living(bs).length : 1);
        }
        if (op.op === 'block') s += (op.amount.base + (op.amount.perCharge ?? 0) * (bs.player.statuses.charge ?? 0)
          + (op.amount.perDescent ?? 0) * (bs.player.statuses.descent ?? 0)) * (needBlock ? 2.2 : 0.55);
        // blood costs: cheap while healthy, prohibitive when low
        if (op.op === 'loseHp') s -= op.amount * (bs.player.hp < bs.player.maxHp * 0.3 ? 6 : bs.player.hp < bs.player.maxHp * 0.55 ? 1.2 : 0.35);
        if (op.op === 'status' && op.target !== 'self') s += op.amount.base * 1.6;
        if (op.op === 'status' && op.target === 'self') s += op.amount.base * 1.2;
        if (op.op === 'draw') s += op.amount * 1.5;
        if (op.op === 'energy') s += op.amount * 2;
        if (op.op === 'heal') {
          const amt = op.amount.base + (op.amount.perDescent ?? 0) * (bs.player.statuses.descent ?? 0);
          s += bs.player.hp < bs.player.maxHp * 0.6 ? amt * 1.5 : 1;
        }
      }
      if (def.powerHook) s += 9; // engines early
      if (def.type === 'curse') s = -1;
      // hold Discharge cards until a real payoff is banked
      if (def.discharge && (bs.player.statuses.charge ?? 0) < 5) s *= 0.3;
      if (op0IsCharge(def) ) s *= 1.25;
      return s / cost;
    };
  const op0IsCharge = (def: ReturnType<typeof cardDef>) =>
    def.ops.some((o) => o.op === 'status' && o.target === 'self' && o.status === 'charge');
  const bestCard = [...playable].sort((a, b) => score(b.uid) - score(a.uid))[0];
  return { card: bestCard, score: score(bestCard.uid) };
}

// small helpers reading enemy content without importing UI
import { ENEMIES } from '../content/enemies';
const ENEMY_CACHE: Record<string, boolean> = {};
function getEnemyMove(defId: string, moveId: string) {
  return ENEMIES[defId]?.moves[moveId];
}

function pickNodeHeuristic(run: RunState, nodes: MapNode[], rng: () => number): MapNode {
  const hpFrac = run.hp / run.maxHp;
  const prefer = (t: MapNode['type']) => nodes.find((n) => n.type === t);
  if (hpFrac < 0.45 && prefer('rest')) return prefer('rest')!;
  if (hpFrac > 0.7 && prefer('elite') && rng() < 0.6) return prefer('elite')!;
  if (prefer('treasure')) return prefer('treasure')!;
  if (rng() < 0.3 && prefer('event')) return prefer('event')!;
  if (prefer('battle')) return prefer('battle')!;
  return nodes[Math.floor(rng() * nodes.length)];
}

export function simulateRun(charId: CharacterId, seed: string, opts?: { endless?: boolean; escortToAct?: number }): SimResult {
  const run = newRun({ charId, ascension: 0, seed, unlockedPacks: ALL_PACKS });
  const r = makeRng(hashSeed(seed + '-policy'));
  const rng = () => r.next();
  let guard = 0;
  let revives = 0;

  while (!run.result) {
    if (++guard > (opts?.endless ? 2000 : 200)) throw new Error('run stalled');
    const nodes = reachableNodes(run);
    if (!nodes.length) throw new Error('no reachable nodes');
    const node = pickNodeHeuristic(run, nodes, rng);
    const outcome = enterNode(run, node.row, node.col, newEmit());

    if (outcome === 'battle') {
      playBattle(run, rng);
      const bs = run.battle!;
      if (bs.phase === 'lost') {
        // escort mode: deaths before the target act revive the bot so its deck
        // keeps drafting organically — used to get late-act data for characters
        // the bot can't reliably pilot that far. No loot from the lost fight.
        if (opts?.escortToAct && run.act < opts.escortToAct) {
          revives += 1;
          run.hp = Math.round(run.maxHp * 0.75);
          run.killedBy = undefined;
          const lostToBoss = bs.isBoss;
          run.battle = null;
          // a lost boss fight still descends (no reward) — the escort's job is
          // to deliver the deck to the target act, not to farm the boss node
          if (lostToBoss) descend(run, newEmit());
          continue;
        }
        run.result = 'loss';
        break;
      }
      // rewards: gold auto, draft with a curated quality list + deck discipline
      const reward = generateBattleReward(run);
      run.gold += reward.gold;
      for (const relic of reward.relics) addRelic(run, relic);
      if (reward.bossRelics.length) addRelic(run, reward.bossRelics[Math.floor(rng() * reward.bossRelics.length)]);
      else if (reward.bossBoons?.length) applyBoon(run, reward.bossBoons[Math.floor(rng() * reward.bossBoons.length)], newEmit());
      if (reward.cards.length) {
        const pick = [...reward.cards].sort((a, b) => draftScore(b.defId) - draftScore(a.defId))[0];
        const full = run.deck.length >= 22;
        if (draftScore(pick.defId) >= 3 || (!full && rng() < 0.6)) run.deck.push(pick);
      }
      const wasBoss = bs.isBoss;
      run.battle = null;
      if (wasBoss) {
        if (opts?.endless && run.act >= 4) {
          beginLoop(run, newEmit()); // the bot always descends deeper
          if (run.pressureOffer) choosePressure(run, run.pressureOffer[Math.floor(rng() * run.pressureOffer.length)]);
          continue;
        }
        const next = descend(run, newEmit());
        if (next === 'victory') break;
      }
    } else if (outcome === 'shop') {
      run.shop = run.shop ?? generateShop(run);
      // remove a starter strike if affordable, then buy quality cards/relics
      if (run.gold >= run.shop.removalPrice) {
        const strike = run.deck.find((c) => CARDS[c.defId].rarity === 'starter' && CARDS[c.defId].type === 'attack');
        if (strike) buyRemoval(run, strike.uid);
      }
      // defang first (pure upside), then whetstone if there's spare coin
      if (run.shop.defangPrice != null && run.gold >= run.shop.defangPrice + 60) {
        const tooth = defangEligible(run)[0];
        if (tooth) buyDefang(run, tooth);
      }
      if (run.shop.whetstonePrice != null && run.gold >= run.shop.whetstonePrice + 60) {
        const cand = run.deck.find((c) => !c.upgraded && CARDS[c.defId].type !== 'curse' && draftScore(c.defId) >= 3);
        if (cand) buyWhetstone(run, cand.uid);
      }
      // gamble on the crate only with a deep purse
      if (run.shop.cratePrice != null && run.gold >= run.shop.cratePrice + 150) buyCrate(run);
      for (let b = 0; b < 2; b++) {
        const buyIdx = run.shop.items.findIndex(
          (i) => !i.sold && i.price <= run.gold - 40 && (i.kind === 'relic' || (i.kind === 'card' && draftScore(i.card.defId) >= 3)),
        );
        if (buyIdx >= 0) buyShopItem(run, buyIdx);
      }
      run.shop = null;
    } else if (outcome === 'rest') {
      if (run.hp < run.maxHp * 0.68) doRestHeal(run, newEmit());
      else {
        const cand = run.deck.filter((c) => !c.upgraded && CARDS[c.defId].type !== 'curse');
        if (cand.length) completePick(run, 'upgrade', cand[Math.floor(rng() * cand.length)].uid);
      }
    } else if (outcome === 'event') {
      const ev = EVENTS[run.eventId!];
      const choice = ev.choices[Math.floor(rng() * ev.choices.length)];
      const { pendingPick } = applyEventEffect(run, choice.effect, newEmit());
      if (pendingPick) {
        const cand = pendingPick.kind === 'upgrade' ? run.deck.filter((c) => !c.upgraded && CARDS[c.defId].type !== 'curse') : run.deck.filter((c) => CARDS[c.defId].type !== 'curse');
        if (cand.length) completePick(run, pendingPick.kind, cand[Math.floor(rng() * cand.length)].uid);
      }
      run.eventId = null;
    } else if (outcome === 'reward') {
      // treasure relics
      for (const relic of run.reward?.relics ?? []) addRelic(run, relic);
      run.reward = null;
    }
  }

  return {
    win: run.result === 'win',
    floor: run.floor,
    act: run.act,
    loop: run.loop,
    score: scoreRun(run),
    killedBy: run.killedBy,
    deckSize: run.deck.length,
    turns: run.stats.turnsPlayed,
    ...(opts?.escortToAct ? { revives } : {}),
  };
}

/** curated "a decent player takes these" list — keeps the bot's drafting honest */
const GOOD_PICKS = new Set([
  // tidecaller
  'harpoonShot', 'shellUp', 'venomSpit', 'toxicSlick', 'depthCharge', 'hardenedShell',
  'miasma', 'coralCarapace', 'leviathansBlood', 'abyssalFang', 'maelstrom', 'whirlpool',
  'currentReading', 'bioluminesce', 'tidalSlam', 'lurkersAmbush', 'chumTheWater',
  'blightwave', 'nacreBastion', 'mirrorScales', 'ebbguard', 'corrode',
  // voltaic
  'voltageSpike', 'insulate', 'capacitor', 'thunderbite', 'staticBurst', 'gigavolt',
  'dynamo', 'eelCoil', 'teslaScales', 'stormShell', 'groundOut', 'stormOfCentury',
  'liveWire', 'battery', 'currentSurge', 'supercell', 'voltmeterSlash',
]);

function draftScore(defId: string): number {
  if (GOOD_PICKS.has(defId)) return 3;
  const r = CARDS[defId].rarity;
  return r === 'rare' ? 2 : r === 'uncommon' ? 1.5 : 1;
}

// ── CLI entry (runs under tsx/node; `process` typed loosely to avoid @types/node) ──

declare const process: { argv: string[] } | undefined;

const isMain = typeof process !== 'undefined' && process.argv[1]?.includes('simulate');
if (isMain) {
  const N = Number(process!.argv[2]) || 60;
  const endless = process!.argv.includes('--endless');
  for (const charId of ['tidecaller', 'voltaic', 'drowned', 'weaver'] as CharacterId[]) {
    const results: SimResult[] = [];
    const deaths: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      try {
        const res = simulateRun(charId, `sim-${charId}-${i}`, { endless });
        results.push(res);
        if (!res.win && res.killedBy) deaths[res.killedBy] = (deaths[res.killedBy] ?? 0) + 1;
      } catch (err) {
        console.error(`  run ${i} CRASHED:`, err);
      }
    }
    const wins = results.filter((r) => r.win).length;
    const avgFloor = results.reduce((a, b) => a + b.floor, 0) / results.length;
    const acts = [1, 2, 3, 4].map((a) => results.filter((r) => !r.win && r.act === a).length);
    console.log(`\n═══ ${charId.toUpperCase()} — ${results.length} greedy-bot runs${endless ? ' (ENDLESS)' : ''} ═══`);
    if (endless) {
      const loopers = results.filter((r) => r.loop > 0);
      const maxLoop = Math.max(0, ...results.map((r) => r.loop));
      const loopDist = Array.from({ length: maxLoop + 1 }, (_, l) => results.filter((r) => r.loop === l).length);
      console.log(`  reached endless: ${loopers.length}/${results.length}  |  deepest loop: ${maxLoop}`);
      console.log(`  died at loop: ${loopDist.map((n, l) => `L${l}=${n}`).join(' ')}`);
      // what actually ends deep runs — stat walls read differently from bad rolls
      for (let l = 1; l <= maxLoop; l++) {
        const at = results.filter((r) => r.loop === l && r.killedBy);
        if (!at.length) continue;
        const k: Record<string, number> = {};
        for (const r of at) k[r.killedBy!] = (k[r.killedBy!] ?? 0) + 1;
        const top = Object.entries(k).sort((a, b) => b[1] - a[1]).slice(0, 3);
        console.log(`    L${l} killers: ${top.map(([n, v]) => `${n}×${v}`).join(', ')}`);
      }
    } else {
      console.log(`  winrate: ${((wins / results.length) * 100).toFixed(1)}%  (bot is weak; human target ~2-3x)`);
    }
    console.log(`  avg floor reached: ${avgFloor.toFixed(1)}${endless ? '' : ' / 48'}`);
    console.log(`  deaths by act: A1=${acts[0]} A2=${acts[1]} A3=${acts[2]} A4=${acts[3]} | wins=${wins}`);
    const topDeaths = Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 6);
    console.log(`  top killers: ${topDeaths.map(([k, v]) => `${k}×${v}`).join(', ') || '—'}`);
    console.log(`  avg deck: ${(results.reduce((a, b) => a + b.deckSize, 0) / results.length).toFixed(1)} cards, avg turns: ${(results.reduce((a, b) => a + b.turns, 0) / results.length).toFixed(0)}`);
  }
}
