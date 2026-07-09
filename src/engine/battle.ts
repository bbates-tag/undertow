// ─────────────────────────────────────────────────────────────────────────────
// Battle engine. Pure data-in/data-out: functions mutate the RunState they are
// given (callers clone first) and append visual/audio events to an Emit
// collector so the UI layer can stage animation and sound.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Amount, BattlePhase, BattleState, CardDef, CardInstance, Cond, CreatureState, EnemyState,
  Fx, Op, PowerHookId, RunState, StatusId, Tide,
} from './types';
import { DEBUFFS } from './types';
import { makeRng } from '../lib/rng';
import { nextFxId } from '../lib/util';
import { CARDS } from '../content/cards';
import { ENEMIES, ENCOUNTERS } from '../content/enemies';

export interface Emit {
  fx: Fx[];
  sfx: string[];
}
export const newEmit = (): Emit => ({ fx: [], sfx: [] });

/** Omit that distributes over a discriminated union */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function fx(e: Emit, f: DistributiveOmit<Fx, 'id'>) {
  e.fx.push({ ...f, id: nextFxId() } as Fx);
}
function sfx(e: Emit, name: string) {
  e.sfx.push(name);
}

// ── Small helpers ────────────────────────────────────────────────────────────

export const getStatus = (c: CreatureState, s: StatusId): number => c.statuses[s] ?? 0;

export function setStatus(c: CreatureState, s: StatusId, n: number) {
  if (n <= 0) delete c.statuses[s];
  else c.statuses[s] = n;
}

export const addStatus = (c: CreatureState, s: StatusId, n: number) =>
  setStatus(c, s, getStatus(c, s) + n);

export const living = (bs: BattleState): EnemyState[] => bs.enemies.filter((e) => !e.dead);

/** reads phase through a call so TS control-flow narrowing can't get stale after mutations */
const phaseNow = (bs: BattleState): BattlePhase => bs.phase;

export const enemyKey = (e: EnemyState) => `e${e.uid}` as const;

export function cardDef(c: CardInstance): CardDef {
  return CARDS[c.defId];
}
export function cardCost(c: CardInstance): number {
  const d = cardDef(c);
  return c.upgraded ? (d.costUp ?? d.cost) : d.cost;
}
export function cardOps(c: CardInstance): Op[] {
  const d = cardDef(c);
  return c.upgraded ? (d.opsUp ?? d.ops) : d.ops;
}
export function cardExhausts(c: CardInstance): boolean {
  const d = cardDef(c);
  return c.upgraded ? (d.exhaustUp ?? d.exhaust ?? false) : (d.exhaust ?? false);
}
export function cardHook(c: CardInstance): PowerHookId | undefined {
  const d = cardDef(c);
  return c.upgraded ? (d.powerHookUp ?? d.powerHook) : d.powerHook;
}

function battleRng(bs: BattleState) {
  const r = makeRng(bs.rng);
  return {
    r,
    done: () => {
      bs.rng = r.state();
    },
  };
}

// ── Amount / damage math ─────────────────────────────────────────────────────

export function resolveAmount(bs: BattleState, a: Amount, target?: EnemyState): number {
  let n = a.base;
  if (a.perToxinOnTarget && target) n += a.perToxinOnTarget * getStatus(target, 'toxin');
  if (a.perCharge) n += a.perCharge * getStatus(bs.player, 'charge');
  if (a.perCardPlayed) n += a.perCardPlayed * bs.cardsPlayedThisTurn;
  if (a.perBlock) n += a.perBlock * bs.player.block;
  if (a.flood && bs.tide === 2) n += a.flood;
  if (a.ebb && bs.tide === 0) n += a.ebb;
  return Math.max(0, n);
}

export function calcAttack(base: number, attacker: CreatureState, defender: CreatureState): number {
  let d = base + getStatus(attacker, 'might');
  if (getStatus(attacker, 'weakened') > 0) d = Math.floor(d * 0.75);
  if (getStatus(defender, 'exposed') > 0) d = Math.floor(d * 1.5);
  return Math.max(0, d);
}

/** Full preview of what one hit of a player attack would deal to a target. */
export function previewPlayerAttack(bs: BattleState, amount: Amount, target: EnemyState): number {
  return calcAttack(resolveAmount(bs, amount, target), bs.player, target);
}

export function previewEnemyMove(bs: BattleState, e: EnemyState): { dmg: number; times: number } | null {
  const mv = ENEMIES[e.defId].moves[e.moveId];
  if (!mv?.attack) return null;
  return { dmg: calcAttack(mv.attack.amount, e, bs.player), times: mv.attack.times ?? 1 };
}

export function blockGain(c: CreatureState, base: number): number {
  let b = base + getStatus(c, 'finesse');
  if (getStatus(c, 'brittle') > 0) b = Math.floor(b * 0.75);
  return Math.max(0, b);
}

// ── HP changes ───────────────────────────────────────────────────────────────

function damageEnemy(
  run: RunState, bs: BattleState, e: EnemyState, dmg: number, emit: Emit,
  opts: { pierce?: boolean; fromAttack?: boolean } = {},
): number {
  if (e.dead) return 0;
  const blocked = opts.pierce ? 0 : Math.min(e.block, dmg);
  e.block -= blocked;
  const hpLoss = Math.min(e.hp, dmg - blocked);
  e.hp -= hpLoss;
  if (blocked > 0) fx(emit, { kind: 'blocked', target: enemyKey(e), amount: blocked });
  if (hpLoss > 0) {
    fx(emit, { kind: 'dmg', target: enemyKey(e), amount: hpLoss, pierce: opts.pierce });
    run.stats.damageDealt += hpLoss;
  }
  if (e.hp <= 0) killEnemy(run, bs, e, emit);
  return hpLoss;
}

function killEnemy(run: RunState, bs: BattleState, e: EnemyState, emit: Emit) {
  const def = ENEMIES[e.defId];
  if (def.reanimates && !e.reanimated) {
    e.reanimated = true;
    e.hp = Math.floor(e.maxHp / 2);
    e.statuses = {};
    fx(emit, { kind: 'burst', target: enemyKey(e), color: 'bone', n: 14, shape: 'ring' });
    sfx(emit, 'reanimate');
    return;
  }
  e.dead = true;
  e.hp = 0;
  run.stats.kills++;
  fx(emit, { kind: 'burst', target: enemyKey(e), color: 'ink', n: 18, shape: 'bubble' });
  sfx(emit, 'enemyDie');
  // Depthless Hunger power
  for (const p of bs.powers) {
    if (p === 'hunger2' || p === 'hunger3') {
      const n = p === 'hunger2' ? 2 : 3;
      addStatus(bs.player, 'might', n);
      healPlayer(run, bs, n + 3, emit);
      fx(emit, { kind: 'status', target: 'player', status: 'might', amount: n });
    }
  }
}

/** All player HP loss funnels through here (attacks, toxin, self-damage). */
function losePlayerHp(
  run: RunState, bs: BattleState, dmg: number, emit: Emit,
  opts: { ignoreBlock?: boolean; source?: string } = {},
): number {
  const p = bs.player;
  const blocked = opts.ignoreBlock ? 0 : Math.min(p.block, dmg);
  p.block -= blocked;
  let hpLoss = dmg - blocked;
  if (blocked > 0) fx(emit, { kind: 'blocked', target: 'player', amount: blocked });
  if (hpLoss > 0 && run.relics.includes('nacreCharm') && !bs.counters.nacreUsed) {
    bs.counters.nacreUsed = 1;
    hpLoss = 0;
    fx(emit, { kind: 'burst', target: 'player', color: 'pearl', n: 16, shape: 'ring' });
    sfx(emit, 'shield');
  }
  if (hpLoss > 0) {
    p.hp = Math.max(0, p.hp - hpLoss);
    bs.battleDamageTaken += hpLoss;
    run.stats.damageTaken += hpLoss;
    fx(emit, { kind: 'dmg', target: 'player', amount: hpLoss });
    fx(emit, { kind: 'shake', strength: Math.min(1, hpLoss / 14) });
    if (p.hp <= 0) {
      bs.phase = 'lost';
      run.killedBy = opts.source;
      sfx(emit, 'defeat');
    }
  }
  return hpLoss;
}

export function healPlayer(run: RunState, bs: BattleState | null, n: number, emit: Emit): number {
  const p = bs ? bs.player : null;
  const hp = p ? p.hp : run.hp;
  const maxHp = p ? p.maxHp : run.maxHp;
  const healed = Math.min(maxHp - hp, Math.max(0, n));
  if (healed <= 0) return 0;
  if (p) p.hp += healed;
  else run.hp += healed;
  fx(emit, { kind: 'heal', target: 'player', amount: healed });
  return healed;
}

function gainPlayerBlock(run: RunState, bs: BattleState, base: number, emit: Emit, fromCard = true) {
  const amt = fromCard ? blockGain(bs.player, base) : Math.max(0, base);
  if (amt <= 0) return;
  bs.player.block += amt;
  run.stats.maxBlock = Math.max(run.stats.maxBlock, bs.player.block);
  fx(emit, { kind: 'block', target: 'player', amount: amt });
  sfx(emit, 'block');
}

// ── Charge / tide ────────────────────────────────────────────────────────────

export function gainCharge(run: RunState, bs: BattleState, n: number, emit: Emit) {
  if (n <= 0) return;
  addStatus(bs.player, 'charge', n);
  run.stats.maxCharge = Math.max(run.stats.maxCharge, getStatus(bs.player, 'charge'));
  fx(emit, { kind: 'status', target: 'player', status: 'charge', amount: n });
  sfx(emit, 'charge');
  // Tesla Scales: whenever you Conduct, zap all enemies
  for (const p of bs.powers) {
    if (p === 'teslaScales1' || p === 'teslaScales2') {
      const z = p === 'teslaScales1' ? 1 : 2;
      for (const e of living(bs)) damageEnemy(run, bs, e, z, emit);
      sfx(emit, 'zap');
    }
  }
}

export function shiftTide(run: RunState, bs: BattleState, n: number, emit: Emit, silent = false) {
  if (bs.powers.includes('kingTide')) return;
  const before = bs.tide;
  bs.tide = (((bs.tide + n) % 4) + 4) % 4 as Tide;
  if (bs.tide !== before) {
    // card-driven shifts get the water-sweep visual; the quiet natural advance doesn't
    fx(emit, { kind: 'tide', tide: bs.tide, sweep: !silent });
    if (!silent) sfx(emit, 'tide');
    // Heart of the Maelstrom: the churn shields you
    if (run.relics.includes('heartOfMaelstrom')) gainPlayerBlock(run, bs, 3, emit, false);
    if (bs.tide === 2) onTideHigh(run, bs, emit);
  }
}

function onTideHigh(run: RunState, bs: BattleState, emit: Emit) {
  if (run.relics.includes('tideBell')) {
    drawCards(run, bs, 1, emit);
  }
  for (const e of living(bs)) {
    const t = ENEMIES[e.defId].tideTouched;
    if (t) {
      addStatus(e, 'might', t);
      fx(emit, { kind: 'status', target: enemyKey(e), status: 'might', amount: t });
    }
  }
}

// ── Draw / discard ───────────────────────────────────────────────────────────

export function drawCards(run: RunState, bs: BattleState, n: number, emit: Emit) {
  for (let i = 0; i < n; i++) {
    if (bs.hand.length >= 10) return;
    if (bs.drawPile.length === 0) {
      if (bs.discardPile.length === 0) return;
      const { r, done } = battleRng(bs);
      bs.drawPile = r.shuffle([...bs.discardPile]);
      bs.discardPile = [];
      done();
      sfx(emit, 'shuffle');
      // shuffle relics
      if (run.relics.includes('kelpWrap')) gainPlayerBlock(run, bs, 5, emit, false);
      if (run.relics.includes('capacitorCoil')) gainCharge(run, bs, 3, emit);
    }
    const card = bs.drawPile.pop();
    if (card) bs.hand.push(card);
  }
  sfx(emit, 'draw');
}

// ── Ops interpreter ──────────────────────────────────────────────────────────

function condMet(bs: BattleState, cond: Cond, target?: EnemyState): boolean {
  if (cond === 'flood') return bs.tide === 2;
  if (cond === 'ebb') return bs.tide === 0;
  if (cond === 'targetToxined') return !!target && getStatus(target, 'toxin') > 0;
  if (cond === 'targetBelowHalf') return !!target && target.hp <= target.maxHp / 2;
  return getStatus(bs.player, 'charge') >= cond.chargeAtLeast;
}

function statusFxColor(_s: StatusId): string {
  return 'status';
}

function applyStatusTo(
  run: RunState, bs: BattleState, c: CreatureState, s: StatusId, n: number, emit: Emit, targetKey: Fx['target' & keyof Fx] | string,
) {
  if (n === 0) return;
  // Pumice Pearl: +1 whenever you apply Toxin to an enemy
  if (s === 'toxin' && c !== bs.player && run.relics.includes('pumicePearl')) n += 1;
  addStatus(c, s, n);
  if (s === 'toxin' && c !== bs.player) {
    run.stats.maxToxinApplied = Math.max(run.stats.maxToxinApplied, getStatus(c, 'toxin'));
  }
  fx(emit, { kind: 'status', target: targetKey as never, status: s, amount: n });
  sfx(emit, DEBUFFS.includes(s) ? 'debuff' : 'buff');
}

export function runOps(
  run: RunState, bs: BattleState, ops: Op[], emit: Emit,
  ctx: { targetUid?: number; isAttackCard?: boolean },
) {
  const targetOf = (uid?: number) => living(bs).find((e) => e.uid === uid);

  for (const op of ops) {
    if (bs.phase !== 'player') return; // battle ended mid-resolution
    const target = targetOf(ctx.targetUid);
    switch (op.op) {
      case 'damage': {
        const times = op.times === 'charge' ? getStatus(bs.player, 'charge') : (op.times ?? 1);
        // Whetstone Coral: multi-hit attacks get +1 per hit
        const whetstone = times > 1 && run.relics.includes('whetstoneCoral') ? 1 : 0;
        for (let i = 0; i < times; i++) {
          let victims: EnemyState[] = [];
          if (op.target === 'all') victims = living(bs);
          else if (op.target === 'random') {
            const pool = living(bs);
            if (pool.length) {
              const { r, done } = battleRng(bs);
              victims = [r.pick(pool)];
              done();
            }
          } else {
            const t = targetOf(ctx.targetUid);
            if (t) victims = [t];
          }
          for (const v of victims) {
            const raw = resolveAmount(bs, op.amount, v) + whetstone;
            const dmg = calcAttack(raw, bs.player, v);
            damageEnemy(run, bs, v, dmg, emit, { pierce: op.pierce, fromAttack: true });
            fx(emit, { kind: 'burst', target: enemyKey(v), color: 'hit', n: 8, shape: 'spark' });
            // Spines on the victim retaliate per hit
            const spines = getStatus(v, 'spines');
            if (spines > 0 && !v.dead) losePlayerHp(run, bs, spines, emit, { source: ENEMIES[v.defId].name });
            if (bs.phase !== 'player') return;
          }
          sfx(emit, 'hit');
        }
        break;
      }
      case 'block':
        gainPlayerBlock(run, bs, resolveAmount(bs, op.amount), emit);
        break;
      case 'status': {
        const n = resolveAmount(bs, op.amount, target);
        if (op.target === 'self') {
          if (op.status === 'charge') gainCharge(run, bs, n, emit);
          else applyStatusTo(run, bs, bs.player, op.status, n, emit, 'player');
        } else if (op.target === 'all') {
          for (const e of living(bs)) applyStatusTo(run, bs, e, op.status, n, emit, enemyKey(e));
        } else if (op.target === 'random') {
          const pool = living(bs);
          if (pool.length) {
            const { r, done } = battleRng(bs);
            const e = r.pick(pool);
            done();
            applyStatusTo(run, bs, e, op.status, n, emit, enemyKey(e));
          }
        } else if (target) {
          applyStatusTo(run, bs, target, op.status, n, emit, enemyKey(target));
        }
        break;
      }
      case 'draw':
        drawCards(run, bs, op.amount, emit);
        break;
      case 'energy':
        bs.energy = Math.max(0, bs.energy + op.amount);
        sfx(emit, 'energy');
        break;
      case 'heal':
        healPlayer(run, bs, resolveAmount(bs, op.amount), emit);
        sfx(emit, 'heal');
        break;
      case 'shift':
        shiftTide(run, bs, op.amount, emit);
        break;
      case 'gold':
        run.gold += op.amount;
        run.stats.goldEarned += op.amount;
        fx(emit, { kind: 'gold', target: 'player', amount: op.amount });
        sfx(emit, 'gold');
        break;
      case 'doubleStatus': {
        const targets = op.target === 'all' ? living(bs) : [];
        for (const e of targets) {
          const cur = getStatus(e, op.status);
          if (cur > 0) applyStatusTo(run, bs, e, op.status, cur, emit, enemyKey(e));
        }
        if (op.target === 'self') {
          const cur = getStatus(bs.player, op.status);
          if (cur > 0) {
            if (op.status === 'charge') gainCharge(run, bs, cur, emit);
            else applyStatusTo(run, bs, bs.player, op.status, cur, emit, 'player');
          }
        }
        break;
      }
      case 'cleanse': {
        const debuffs = DEBUFFS.filter((d) => getStatus(bs.player, d) > 0);
        const toRemove = op.all ? debuffs : debuffs.slice(0, 1);
        for (const d of toRemove) setStatus(bs.player, d, 0);
        if (toRemove.length) sfx(emit, 'heal');
        break;
      }
      case 'addCard': {
        const count = op.count ?? 1;
        for (let i = 0; i < count; i++) {
          const inst: CardInstance = { uid: bs.nextUid++, defId: op.card, upgraded: !!op.upgraded };
          if (op.pile === 'hand' && bs.hand.length < 10) bs.hand.push(inst);
          else if (op.pile === 'hand') bs.discardPile.push(inst);
          else bs[op.pile].push(inst);
        }
        break;
      }
      case 'if':
        runOps(run, bs, condMet(bs, op.cond, target) ? op.then : (op.else ?? []), emit, ctx);
        break;
    }
  }
  checkVictory(run, bs, emit);
}

// ── Relic hook sites ─────────────────────────────────────────────────────────

function relicsBattleStart(run: RunState, bs: BattleState, emit: Emit) {
  for (const r of run.relics) {
    switch (r) {
      case 'barnacledAnchor': gainPlayerBlock(run, bs, 7, emit, false); break;
      case 'anglersLantern': for (const e of living(bs)) applyStatusTo(run, bs, e, 'weakened', 1, emit, enemyKey(e)); break;
      case 'chumBucket': for (const e of living(bs)) applyStatusTo(run, bs, e, 'toxin', 3, emit, enemyKey(e)); break;
      case 'bioBulb': for (const e of living(bs)) applyStatusTo(run, bs, e, 'exposed', 1, emit, enemyKey(e)); break;
      case 'stormCore': gainCharge(run, bs, 3, emit); break;
      case 'spinedBracers': applyStatusTo(run, bs, bs.player, 'spines', 3, emit, 'player'); break;
      case 'sharktoothCharm': addStatus(bs.player, 'might', 1); break;
      case 'rustedHelm': losePlayerHp(run, bs, 3, emit, { ignoreBlock: true, source: 'Rusted Diving Helm' }); break;
      case 'moonChart': bs.tide = 2; onTideHigh(run, bs, emit); break;
    }
  }
  if (run.daily?.mods.includes('hardShell')) gainPlayerBlock(run, bs, 10, emit, false);
  if (run.daily?.mods.includes('moonstruck')) { bs.tide = 2; onTideHigh(run, bs, emit); }
}

function relicsTurnStart(run: RunState, bs: BattleState, emit: Emit) {
  if (run.relics.includes('glassFloat') && bs.turn === 1) drawCards(run, bs, 2, emit);
}

function relicsTurnEnd(run: RunState, bs: BattleState, emit: Emit) {
  if (run.relics.includes('hermitShell')) gainPlayerBlock(run, bs, 2, emit, false);
}

// ── Power hook sites ─────────────────────────────────────────────────────────

function powersTurnStart(run: RunState, bs: BattleState, emit: Emit) {
  for (const p of bs.powers) {
    switch (p) {
      case 'miasma1': case 'miasma2': {
        const n = p === 'miasma1' ? 1 : 2;
        for (const e of living(bs)) applyStatusTo(run, bs, e, 'toxin', n, emit, enemyKey(e));
        break;
      }
      case 'leviathan1': case 'leviathan2':
        addStatus(bs.player, 'might', p === 'leviathan1' ? 1 : 2);
        fx(emit, { kind: 'status', target: 'player', status: 'might', amount: p === 'leviathan1' ? 1 : 2 });
        break;
      case 'eelCoil1': gainCharge(run, bs, 1, emit); break;
      case 'eelCoil2': gainCharge(run, bs, 2, emit); break;
      case 'dynamo2': gainCharge(run, bs, 2, emit); break;
      case 'dynamo3': gainCharge(run, bs, 3, emit); break;
      case 'supercell': {
        const c = getStatus(bs.player, 'charge');
        if (c > 0) {
          for (const e of living(bs)) damageEnemy(run, bs, e, c, emit);
          sfx(emit, 'zap');
        }
        break;
      }
      case 'perpetual':
        shiftTide(run, bs, 1, emit);
        drawCards(run, bs, 1, emit);
        break;
      default: break;
    }
  }
  checkVictory(run, bs, emit);
}

function powersTurnEnd(run: RunState, bs: BattleState, emit: Emit) {
  for (const p of bs.powers) {
    if (p === 'carapace3') gainPlayerBlock(run, bs, 3, emit);
    if (p === 'carapace5') gainPlayerBlock(run, bs, 5, emit);
  }
}

// ── Battle lifecycle ─────────────────────────────────────────────────────────

export function maxEnergyFor(run: RunState): number {
  let e = 3;
  for (const r of run.relics) {
    if (r === 'rustedHelm' || r === 'blackPearl' || r === 'pressureCrown') e += 1;
  }
  if (run.daily?.mods.includes('glassCannon')) e += 1;
  return e;
}

function drawCountFor(run: RunState, bs: BattleState): number {
  let n = 5;
  if (run.relics.includes('pressureCrown')) n -= 1;
  if (run.relics.includes('grimoireOfBrine')) n += 1;
  for (const p of bs.powers) {
    if (p === 'predatorsEye1') n += 1;
    if (p === 'predatorsEye2') n += 2;
  }
  return n;
}

export function startBattle(run: RunState, groupId: string, emit: Emit) {
  const group = ENCOUNTERS[groupId];
  const r = makeRng(run.rng);
  const enemies: EnemyState[] = group.enemies.map((defId, i) => {
    const def = ENEMIES[defId];
    let hp = r.int(def.hp[0], def.hp[1]);
    hp = Math.round(hp * ascHpScale(run));
    return {
      uid: i + 1,
      defId,
      hp,
      maxHp: hp,
      block: 0,
      statuses: { ...(def.startStatuses ?? {}) },
      moveId: '',
      history: [],
    };
  });
  const battleSeed = r.int(0, 2 ** 31);
  run.rng = r.state();

  const bs: BattleState = {
    groupId,
    isElite: group.pool === 'elite',
    isBoss: group.pool === 'boss',
    phase: 'player',
    turn: 0,
    tide: 1, // Rising
    energy: 0,
    maxEnergy: maxEnergyFor(run),
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    player: { hp: run.hp, maxHp: run.maxHp, block: 0, statuses: {} },
    enemies,
    cardsPlayedThisTurn: 0,
    attacksPlayedThisTurn: 0,
    powers: [],
    enemyActIdx: 0,
    rng: battleSeed, // forked battle stream so battles replay deterministically
    counters: {},
    battleDamageTaken: 0,
    nextUid: 1000,
  };

  // shuffled copy of the run deck
  const { r: br, done } = battleRng(bs);
  bs.drawPile = br.shuffle(run.deck.map((c) => ({ ...c })));
  done();

  run.battle = bs;

  // ascension 10: all enemies open with +1 Might
  if (run.ascension >= 10) for (const e of living(bs)) addStatus(e, 'might', 1);
  if (run.daily?.mods.includes('toxicWaters')) for (const e of living(bs)) addStatus(e, 'toxin', 4);

  relicsBattleStart(run, bs, emit);
  rollAllIntents(run, bs);
  startPlayerTurn(run, bs, emit);
  sfx(emit, bs.isBoss ? 'bossIntro' : 'battleStart');
}

function ascHpScale(run: RunState): number {
  let s = 1;
  if (run.ascension >= 1) s += 0.08;
  if (run.ascension >= 6) s += 0.08;
  if (run.daily?.mods.includes('swarmSeason')) s += 0.15;
  return s;
}

export function ascEnemyDmgBonus(run: RunState): number {
  let b = 0;
  if (run.ascension >= 2) b += 1;
  if (run.ascension >= 9) b += 1;
  return b;
}

function rollAllIntents(run: RunState, bs: BattleState) {
  for (const e of living(bs)) rollIntent(run, bs, e);
}

function rollIntent(_run: RunState, bs: BattleState, e: EnemyState) {
  const def = ENEMIES[e.defId];
  const { r, done } = battleRng(bs);
  const roll = r.next();
  done();
  e.moveId = def.ai({
    turn: bs.turn + 1,
    hpFrac: e.hp / e.maxHp,
    history: e.history,
    roll,
    tide: bs.tide,
    allyCount: living(bs).length,
  });
}

export function startPlayerTurn(run: RunState, bs: BattleState, emit: Emit) {
  bs.turn += 1;
  bs.phase = 'player';
  bs.enemyActIdx = 0;
  bs.cardsPlayedThisTurn = 0;
  bs.attacksPlayedThisTurn = 0;

  // block falls off unless anchored — BEFORE the tide advances, so block
  // granted by tide-change effects (Heart of the Maelstrom) survives the turn
  if (getStatus(bs.player, 'anchor') > 0) addStatus(bs.player, 'anchor', -1);
  else bs.player.block = 0;

  // tide advances (after turn 1)
  if (bs.turn > 1) {
    let steps = bs.powers.includes('lunarPull') ? 2 : 1;
    if (run.daily?.mods.includes('springTide')) steps += 1;
    shiftTide(run, bs, steps, emit, true);
  }

  // toxin ticks on the player
  const tox = getStatus(bs.player, 'toxin');
  if (tox > 0) {
    losePlayerHp(run, bs, tox, emit, { ignoreBlock: true, source: 'Toxin' });
    addStatus(bs.player, 'toxin', -1);
    sfx(emit, 'toxin');
    if (phaseNow(bs) === 'lost') return;
  }

  bs.energy = bs.maxEnergy;
  drawCards(run, bs, drawCountFor(run, bs), emit);
  relicsTurnStart(run, bs, emit);
  powersTurnStart(run, bs, emit);
  run.stats.turnsPlayed += 1;
}

export type PlayError = 'notFound' | 'energy' | 'unplayable' | 'needsTarget' | 'phase';

export function canPlay(bs: BattleState, uid: number): PlayError | null {
  if (bs.phase !== 'player') return 'phase';
  const c = bs.hand.find((h) => h.uid === uid);
  if (!c) return 'notFound';
  const def = cardDef(c);
  if (def.unplayable) return 'unplayable';
  if (cardCost(c) > bs.energy) return 'energy';
  return null;
}

export function playCard(run: RunState, uid: number, targetUid: number | undefined, emit: Emit): PlayError | null {
  const bs = run.battle!;
  const err = canPlay(bs, uid);
  if (err) return err;
  const c = bs.hand.find((h) => h.uid === uid)!;
  const def = cardDef(c);
  if (def.target === 'enemy' && targetUid === undefined) return 'needsTarget';

  bs.energy -= cardCost(c);
  bs.hand = bs.hand.filter((h) => h.uid !== uid);

  sfx(emit, def.type === 'attack' ? 'playAttack' : def.type === 'power' ? 'playPower' : 'playSkill');

  // Discharge spectacle: lightning leaps from the player to the victims.
  // Emitted before ops resolve so lethal discharges still show their bolts.
  if (def.discharge && getStatus(bs.player, 'charge') > 0) {
    const hasDamage = (ops: Op[]): boolean =>
      ops.some((op) => op.op === 'damage' || (op.op === 'if' && (hasDamage(op.then) || hasDamage(op.else ?? []))));
    if (hasDamage(cardOps(c))) {
      const victims = def.target === 'enemy' ? living(bs).filter((e) => e.uid === targetUid) : living(bs);
      for (const v of victims.slice(0, 5)) fx(emit, { kind: 'bolt', from: 'player', to: enemyKey(v) });
    } else {
      // self-directed discharge (Ground Out, Defibrillate): surge ring instead
      fx(emit, { kind: 'burst', target: 'player', color: 'volt', n: 14, shape: 'ring' });
    }
  }

  runOps(run, bs, cardOps(c), emit, { targetUid, isAttackCard: def.type === 'attack' });

  // relic: Venom Gland — first attack each battle poisons
  if (def.type === 'attack' && run.relics.includes('venomGland') && !bs.counters.venomGland) {
    bs.counters.venomGland = 1;
    const t = living(bs).find((e) => e.uid === targetUid) ?? living(bs)[0];
    if (t && bs.phase === 'player') applyStatusTo(run, bs, t, 'toxin', 3, emit, enemyKey(t));
  }

  // powers reacting to card plays
  if (def.type === 'attack' && bs.phase === 'player') {
    for (const p of bs.powers) {
      if (p === 'bloodInWater1' || p === 'bloodInWater2') {
        const pool = living(bs);
        if (pool.length) {
          const { r, done } = battleRng(bs);
          const v = r.pick(pool);
          done();
          damageEnemy(run, bs, v, p === 'bloodInWater1' ? 1 : 2, emit);
        }
      }
    }
  }
  if (def.type === 'power' && run.relics.includes('sirenScale') && bs.phase === 'player') {
    drawCards(run, bs, 2, emit);
  }

  // Discharge: spend all charge, then Lightning Rod refunds some
  if (def.discharge) {
    setStatus(bs.player, 'charge', 0);
    for (const p of bs.powers) {
      if (p === 'lightningRod3') gainCharge(run, bs, 3, emit);
      if (p === 'lightningRod4') gainCharge(run, bs, 4, emit);
    }
  }

  bs.cardsPlayedThisTurn += 1;
  if (def.type === 'attack') bs.attacksPlayedThisTurn += 1;
  run.stats.cardsPlayed += 1;

  // where does the card go?
  if (bs.phase === 'player' || bs.phase === 'won') {
    const hook = cardHook(c);
    if (def.type === 'power') {
      if (hook) bs.powers.push(hook);
      if (hook === 'kingTide' && bs.tide !== 2) {
        bs.tide = 2;
        fx(emit, { kind: 'tide', tide: 2, sweep: true });
        onTideHigh(run, bs, emit);
      }
      // power cards are consumed entirely
    } else if (cardExhausts(c)) {
      bs.exhaustPile.push(c);
    } else {
      bs.discardPile.push(c);
    }
  }
  checkVictory(run, bs, emit);
  return null;
}

export function endPlayerTurn(run: RunState, emit: Emit) {
  const bs = run.battle!;
  if (bs.phase !== 'player') return;

  // curses that sting in hand
  for (const c of [...bs.hand]) {
    const def = cardDef(c);
    if (def.endTurnInHand) {
      for (const op of def.endTurnInHand) {
        if (op.op === 'damage') {
          losePlayerHp(run, bs, op.amount.base, emit, { ignoreBlock: true, source: def.name });
        }
      }
      if (phaseNow(bs) === 'lost') return;
    }
  }

  powersTurnEnd(run, bs, emit);
  relicsTurnEnd(run, bs, emit);

  // regen
  const rg = getStatus(bs.player, 'regen');
  if (rg > 0) {
    healPlayer(run, bs, rg, emit);
    addStatus(bs.player, 'regen', -1);
  }
  // player duration debuffs tick at end of own turn
  for (const s of ['weakened', 'exposed', 'brittle'] as StatusId[]) {
    if (getStatus(bs.player, s) > 0) addStatus(bs.player, s, -1);
  }

  // discard hand
  bs.discardPile.push(...bs.hand);
  bs.hand = [];

  bs.phase = 'enemy';
  bs.enemyActIdx = 0;

  // enemy phase start: block resets, toxin ticks
  for (const e of living(bs)) {
    e.block = 0;
    const tox = getStatus(e, 'toxin');
    if (tox > 0) {
      damageEnemy(run, bs, e, tox, emit, { pierce: true });
      addStatus(e, 'toxin', -1);
      sfx(emit, 'toxin');
    }
  }
  checkVictory(run, bs, emit);
}

/** Executes the next living enemy's telegraphed move. Returns true if more remain. */
export function stepEnemy(run: RunState, emit: Emit): boolean {
  const bs = run.battle!;
  if (bs.phase !== 'enemy') return false;
  const actors = living(bs);
  if (bs.enemyActIdx >= actors.length) {
    finishEnemyPhase(run, bs, emit);
    return false;
  }
  const e = actors[bs.enemyActIdx];
  bs.enemyActIdx += 1;
  executeMove(run, bs, e, emit);
  if (bs.phase !== 'enemy') return false;
  if (bs.enemyActIdx >= living(bs).length) {
    finishEnemyPhase(run, bs, emit);
    return false;
  }
  return true;
}

function executeMove(run: RunState, bs: BattleState, e: EnemyState, emit: Emit) {
  const def = ENEMIES[e.defId];
  const mv = def.moves[e.moveId];
  if (!mv) return;
  e.history.push(mv.id);

  if (mv.attack) {
    const times = mv.attack.times ?? 1;
    for (let i = 0; i < times; i++) {
      const dmg = calcAttack(mv.attack.amount + ascEnemyDmgBonus(run), e, bs.player);
      losePlayerHp(run, bs, dmg, emit, { source: def.name });
      fx(emit, { kind: 'burst', target: 'player', color: 'hit', n: 7, shape: 'spark' });
      sfx(emit, 'enemyHit');
      // player spines
      const spines = getStatus(bs.player, 'spines');
      if (spines > 0) damageEnemy(run, bs, e, spines, emit);
      if (bs.phase !== 'enemy' || e.dead) break;
    }
  }
  if (bs.phase !== 'enemy') return;
  if (mv.block) {
    e.block += mv.block;
    fx(emit, { kind: 'block', target: enemyKey(e), amount: mv.block });
    sfx(emit, 'block');
  }
  if (mv.heal) {
    const healed = Math.min(e.maxHp - e.hp, mv.heal);
    e.hp += healed;
    if (healed > 0) fx(emit, { kind: 'heal', target: enemyKey(e), amount: healed });
  }
  if (mv.toPlayer) for (const [s, n] of mv.toPlayer) applyStatusTo(run, bs, bs.player, s, n, emit, 'player');
  if (mv.toSelf) for (const [s, n] of mv.toSelf) applyStatusTo(run, bs, e, s, n, emit, enemyKey(e));
  if (mv.toAllies) {
    for (const ally of living(bs)) for (const [s, n] of mv.toAllies) applyStatusTo(run, bs, ally, s, n, emit, enemyKey(ally));
  }
  if (mv.summon && living(bs).length < 5) {
    for (const id of mv.summon) {
      if (living(bs).length >= 5) break;
      const sdef = ENEMIES[id];
      const { r, done } = battleRng(bs);
      const hp = r.int(sdef.hp[0], sdef.hp[1]);
      done();
      bs.enemies.push({
        uid: bs.nextUid++, defId: id, hp, maxHp: hp, block: 0,
        statuses: { ...(sdef.startStatuses ?? {}) }, moveId: '', history: [],
      });
      const spawned = bs.enemies[bs.enemies.length - 1];
      rollIntent(run, bs, spawned);
      fx(emit, { kind: 'burst', target: enemyKey(spawned), color: 'ink', n: 12, shape: 'bubble' });
    }
    sfx(emit, 'summon');
  }
  if (mv.addCardToPlayer) {
    for (let i = 0; i < mv.addCardToPlayer.count; i++) {
      bs[mv.addCardToPlayer.pile].push({ uid: bs.nextUid++, defId: mv.addCardToPlayer.card, upgraded: false });
    }
    sfx(emit, 'curse');
  }
  if (mv.shift) shiftTide(run, bs, mv.shift, emit);
  if (mv.selfDestruct && !e.dead) {
    e.dead = true;
    e.hp = 0;
    fx(emit, { kind: 'burst', target: enemyKey(e), color: 'hit', n: 22, shape: 'ring' });
    checkVictory(run, bs, emit);
  }
}

function finishEnemyPhase(run: RunState, bs: BattleState, emit: Emit) {
  // enemy duration statuses tick at end of enemy phase
  for (const e of living(bs)) {
    for (const s of ['weakened', 'exposed', 'brittle'] as StatusId[]) {
      if (getStatus(e, s) > 0) addStatus(e, s, -1);
    }
    const rg = getStatus(e, 'regen');
    if (rg > 0) {
      e.hp = Math.min(e.maxHp, e.hp + rg);
      addStatus(e, 'regen', -1);
    }
    rollIntent(run, bs, e);
  }
  startPlayerTurn(run, bs, emit);
}

function checkVictory(run: RunState, bs: BattleState, emit: Emit) {
  if (bs.phase === 'won' || bs.phase === 'lost') return;
  if (living(bs).length === 0) {
    bs.phase = 'won';
    run.hp = bs.player.hp;
    if (bs.battleDamageTaken === 0) run.stats.battlesFlawless += 1;
    sfx(emit, 'victory');
  }
}
