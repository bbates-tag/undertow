// Auto-generates rules text from a card's ops so all ~90 cards read
// consistently, and so in-battle text shows live, modifier-adjusted numbers.

import type { Amount, BattleState, CardDef, EnemyState, Op, PowerHookId, StatusId } from './types';
import { calcAttack, resolveAmount } from './battle';

export interface DescribeCtx {
  bs: BattleState;
  target?: EnemyState;
}

const STATUS_NAMES: Record<StatusId, string> = {
  toxin: 'Toxin', weakened: 'Weakened', exposed: 'Exposed', brittle: 'Brittle',
  might: 'Might', finesse: 'Finesse', spines: 'Spines', regen: 'Regen',
  anchor: 'Anchor', charge: 'Charge', descent: 'Descent',
};

const HOOK_TEXT: Record<PowerHookId, string> = {
  miasma1: 'At the start of your turn, apply 1 Toxin to ALL enemies.',
  miasma2: 'At the start of your turn, apply 2 Toxin to ALL enemies.',
  carapace3: 'At the end of your turn, gain 3 Block.',
  carapace5: 'At the end of your turn, gain 5 Block.',
  lunarPull: 'The tide advances twice each turn.',
  predatorsEye1: 'Draw 1 additional card each turn.',
  predatorsEye2: 'Draw 2 additional cards each turn.',
  bloodInWater1: 'Whenever you play an Attack, deal 1 damage to a random enemy.',
  bloodInWater2: 'Whenever you play an Attack, deal 2 damage to a random enemy.',
  kingTide: 'The tide no longer moves. It is always High.',
  leviathan1: 'At the start of your turn, gain 1 Might.',
  leviathan2: 'At the start of your turn, gain 2 Might.',
  perpetual: 'At the start of your turn, Shift +1 and draw 1 card.',
  hunger2: 'Whenever an enemy dies, gain 2 Might and heal 5 HP.',
  hunger3: 'Whenever an enemy dies, gain 3 Might and heal 6 HP.',
  eelCoil1: 'At the start of your turn, Conduct 1.',
  eelCoil2: 'At the start of your turn, Conduct 2.',
  teslaScales1: 'Whenever you Conduct, deal 1 damage to ALL enemies.',
  teslaScales2: 'Whenever you Conduct, deal 2 damage to ALL enemies.',
  dynamo2: 'At the start of your turn, Conduct 2.',
  dynamo3: 'At the start of your turn, Conduct 3.',
  lightningRod3: 'After you play a Discharge card, Conduct 3.',
  lightningRod4: 'After you play a Discharge card, Conduct 4.',
  supercell: 'At the start of your turn, deal damage equal to your Charge to ALL enemies.',
  weepingHull4: 'At the start of your turn, lose 1 HP and gain 4 Block.',
  weepingHull6: 'At the start of your turn, lose 1 HP and gain 6 Block.',
  marrowBloom2: 'Whenever you gain Descent, gain 2 Block.',
  marrowBloom3: 'Whenever you gain Descent, gain 3 Block.',
  communion2: 'At the start of your turn, lose 2 HP and gain 2 Might.',
  communion3: 'At the start of your turn, lose 2 HP and gain 3 Might.',
  echoPain: 'Whenever you gain Descent, deal that much damage to a random enemy.',
};

function amountClauses(a: Amount): string[] {
  const parts: string[] = [];
  if (a.perToxinOnTarget) parts.push(`+${a.perToxinOnTarget} per Toxin on the target`);
  if (a.perCharge) parts.push(`+${a.perCharge} per Charge`);
  if (a.perDescent) parts.push(`+${a.perDescent} per Descent`);
  if (a.perCardPlayed) parts.push(`+${a.perCardPlayed} for each card played before it this turn`);
  return parts;
}

function dmgNumber(a: Amount, ctx?: DescribeCtx): number {
  if (!ctx) return a.base;
  const raw = resolveAmount(ctx.bs, a, ctx.target);
  const dummy: EnemyState = { uid: -1, defId: '', hp: 1, maxHp: 1, block: 0, statuses: {}, moveId: '', history: [] };
  return calcAttack(raw, ctx.bs.player, ctx.target ?? dummy);
}

function blockNumber(a: Amount, ctx?: DescribeCtx): number {
  if (!ctx) return a.base;
  let b = resolveAmount(ctx.bs, a) + (ctx.bs.player.statuses.finesse ?? 0);
  if ((ctx.bs.player.statuses.brittle ?? 0) > 0) b = Math.floor(b * 0.75);
  return Math.max(0, b);
}

function opText(op: Op, ctx?: DescribeCtx): string {
  switch (op.op) {
    case 'damage': {
      const a = op.amount;
      const equalBlock = a.base === 0 && a.perBlock === 1;
      const n = dmgNumber(a, ctx);
      // when the tide bonus is live, the number already contains it — fold the
      // clause into a prefix instead of double-stating it as "+X"
      const floodLive = !!ctx && !!a.flood && ctx.bs.tide === 2;
      const ebbLive = !!ctx && !!a.ebb && ctx.bs.tide === 0;
      const where = op.target === 'all' ? ' to ALL enemies' : op.target === 'random' ? ' to a random enemy' : '';
      let s: string;
      if (equalBlock && !ctx) s = `Deal damage equal to your Block${where}.`;
      else if (equalBlock) s = `Deal ${n} damage${where} (equal to your Block).`;
      else {
        const times = op.times === 'charge' ? ' once per Charge' : op.times && op.times > 1 ? ` ${op.times} times` : '';
        s = `Deal ${n} damage${where}${times}.`;
      }
      if (floodLive) s = `Flood: ${s}`;
      if (ebbLive) s = `Ebb: ${s}`;
      if (op.pierce) s += ' Pierce.';
      const clauses = amountClauses(a);
      if (clauses.length && !equalBlock) s += ` (${clauses.join(', ')}.)`;
      if (a.flood && !floodLive) s += ` Flood: +${a.flood} damage.`;
      if (a.ebb && !ebbLive) s += ` Ebb: +${a.ebb} damage.`;
      return s;
    }
    case 'loseHp':
      return `Lose ${op.amount} HP.`;
    case 'block': {
      const n = blockNumber(op.amount, ctx);
      const floodLive = !!ctx && !!op.amount.flood && ctx.bs.tide === 2;
      const ebbLive = !!ctx && !!op.amount.ebb && ctx.bs.tide === 0;
      let s = `Gain ${n} Block.`;
      if (floodLive) s = `Flood: ${s}`;
      if (ebbLive) s = `Ebb: ${s}`;
      const clauses = amountClauses(op.amount);
      if (op.amount.perBlock) clauses.push(`+${op.amount.perBlock} per current Block`);
      if (clauses.length) s += ` (${clauses.join(', ')}.)`;
      if (op.amount.flood && !floodLive) s += ` Flood: +${op.amount.flood} Block.`;
      if (op.amount.ebb && !ebbLive) s += ` Ebb: +${op.amount.ebb} Block.`;
      return s;
    }
    case 'status': {
      const name = STATUS_NAMES[op.status];
      const n = ctx ? resolveAmount(ctx.bs, op.amount, ctx.target) : op.amount.base;
      if (op.target === 'self') {
        if (op.status === 'charge') return `Conduct ${n}.`;
        if (op.status === 'anchor') return 'Anchor.';
        return `Gain ${n} ${name}.`;
      }
      const where = op.target === 'all' ? ' to ALL enemies' : op.target === 'random' ? ' to a random enemy' : '';
      return `Apply ${n} ${name}${where}.`;
    }
    case 'draw':
      return op.amount === 1 ? 'Draw 1 card.' : `Draw ${op.amount} cards.`;
    case 'energy':
      return `Gain ${op.amount} Energy.`;
    case 'heal': {
      const clauses = amountClauses(op.amount);
      const n = ctx ? resolveAmount(ctx.bs, op.amount) : op.amount.base;
      if (op.amount.perCharge && op.amount.base === 0 && !ctx) return `Heal ${op.amount.perCharge} HP per Charge.`;
      if (op.amount.perDescent && op.amount.base === 0 && !ctx) return `Heal ${op.amount.perDescent} HP per Descent.`;
      let s = `Heal ${n} HP.`;
      if (clauses.length && ctx) s += ` (${clauses.join(', ')}.)`;
      return s;
    }
    case 'shift':
      return `Shift +${op.amount}.`;
    case 'gold':
      return `Gain ${op.amount} gold.`;
    case 'doubleStatus':
      if (op.target === 'self') return op.status === 'charge' ? 'Double your Charge.' : `Double your ${STATUS_NAMES[op.status]}.`;
      return `Double the ${STATUS_NAMES[op.status]} on ALL enemies.`;
    case 'cleanse':
      return op.all ? 'Remove all your debuffs.' : 'Remove a debuff.';
    case 'addCard': {
      const n = op.count ?? 1;
      const pile = op.pile === 'hand' ? 'your hand' : op.pile === 'drawPile' ? 'your draw pile' : 'your discard pile';
      return n === 1 ? `Add a copy of ${op.card} to ${pile}.` : `Add ${n} copies of ${op.card} to ${pile}.`;
    }
    case 'if': {
      const inner = op.then.map((o) => opText(o, ctx)).join(' ');
      const alt = op.else?.length ? ` Otherwise: ${op.else.map((o) => opText(o, ctx)).join(' ')}` : '';
      if (op.cond === 'flood') return `Flood: ${inner}${alt}`;
      if (op.cond === 'ebb') return `Ebb: ${inner}${alt}`;
      if (op.cond === 'targetToxined') return `If the target has Toxin: ${inner}${alt}`;
      if (op.cond === 'targetBelowHalf') return `If the target is at half HP or less: ${inner}${alt}`;
      if ('descentAtLeast' in op.cond) return `If you have ${op.cond.descentAtLeast}+ Descent: ${inner}${alt}`;
      return `If you have ${op.cond.chargeAtLeast}+ Charge: ${inner}${alt}`;
    }
  }
}

/**
 * True when a globally-checkable condition on this card (Flood/Ebb tide
 * bonuses, Charge/Descent thresholds) is currently met — the UI glows the
 * card. Target-dependent conditions (targetToxined, targetBelowHalf) can't
 * be judged without a chosen target and never glow.
 */
export function cardConditionActive(def: CardDef, upgraded: boolean, bs: BattleState): boolean {
  const amountLive = (a: Amount) => (!!a.flood && bs.tide === 2) || (!!a.ebb && bs.tide === 0);
  const check = (ops: Op[]): boolean =>
    ops.some((op) => {
      if ((op.op === 'damage' || op.op === 'block' || op.op === 'status' || op.op === 'heal') && amountLive(op.amount)) return true;
      if (op.op === 'if') {
        const c = op.cond;
        if (c === 'flood') return bs.tide === 2;
        if (c === 'ebb') return bs.tide === 0;
        if (typeof c === 'object' && 'descentAtLeast' in c) return (bs.player.statuses.descent ?? 0) >= c.descentAtLeast;
        if (typeof c === 'object' && 'chargeAtLeast' in c) return (bs.player.statuses.charge ?? 0) >= c.chargeAtLeast;
        return false;
      }
      return false;
    });
  return check(upgraded ? (def.opsUp ?? def.ops) : def.ops);
}

export function describeCard(def: CardDef, upgraded: boolean, ctx?: DescribeCtx): string {
  const override = upgraded ? (def.textUp ?? def.text) : def.text;
  if (override && !ctx) return override;

  const parts: string[] = [];
  if (def.unplayable) parts.push('Unplayable.');
  const ops = upgraded ? (def.opsUp ?? def.ops) : def.ops;
  for (const op of ops) parts.push(opText(op, ctx));
  const hook = upgraded ? (def.powerHookUp ?? def.powerHook) : def.powerHook;
  if (hook) parts.push(HOOK_TEXT[hook]);
  if (def.discharge) parts.push('Discharge.');
  if (def.surface) parts.push('Surface.');
  if (def.endTurnInHand) {
    for (const op of def.endTurnInHand) {
      if (op.op === 'damage') parts.push(`At the end of your turn, if this is in your hand, lose ${op.amount.base} HP.`);
    }
  }
  const exhausts = upgraded ? (def.exhaustUp ?? def.exhaust) : def.exhaust;
  if (exhausts) parts.push('Exhaust.');
  return parts.join(' ');
}
