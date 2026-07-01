import { describe, expect, it } from 'vitest';
import {
  calcAttack, endPlayerTurn, getStatus, newEmit, playCard, startBattle, stepEnemy,
} from './battle';
import { generateMap, newRun, generateBattleReward, applyEventEffect, completePick, buyShopItem, generateShop, scoreRun } from './run';
import { makeRng, hashSeed } from '../lib/rng';
import type { CreatureState, RunState } from './types';
import { UNLOCK_PACKS } from '../content/meta';
import { CARDS } from '../content/cards';
import { EVENTS } from '../content/events';

const ALL_PACKS = UNLOCK_PACKS.map((p) => p.id);

function testRun(seed = 'test-seed', charId: 'tidecaller' | 'voltaic' = 'tidecaller'): RunState {
  return newRun({ charId, ascension: 0, seed, unlockedPacks: ALL_PACKS });
}

function battleRun(groupId = 'a1_crab', charId: 'tidecaller' | 'voltaic' = 'tidecaller'): RunState {
  const run = testRun(`battle-${groupId}`, charId);
  startBattle(run, groupId, newEmit());
  return run;
}

function giveHand(run: RunState, defIds: string[]) {
  const bs = run.battle!;
  bs.hand = defIds.map((defId, i) => ({ uid: 9000 + i, defId, upgraded: false }));
  bs.energy = 99;
}

function runEnemyPhase(run: RunState) {
  endPlayerTurn(run, newEmit());
  for (let i = 0; i < 20; i++) {
    if (run.battle!.phase !== 'enemy') break;
    if (!stepEnemy(run, newEmit())) break;
  }
}

const creature = (over: Partial<CreatureState> = {}): CreatureState => ({
  hp: 50, maxHp: 50, block: 0, statuses: {}, ...over,
});

describe('damage math', () => {
  it('applies might, weakened, exposed in order', () => {
    expect(calcAttack(10, creature(), creature())).toBe(10);
    expect(calcAttack(10, creature({ statuses: { might: 3 } }), creature())).toBe(13);
    expect(calcAttack(10, creature({ statuses: { weakened: 1 } }), creature())).toBe(7); // floor(10*.75)
    expect(calcAttack(10, creature(), creature({ statuses: { exposed: 1 } }))).toBe(15);
    expect(calcAttack(10, creature({ statuses: { might: 2, weakened: 1 } }), creature({ statuses: { exposed: 1 } }))).toBe(13); // floor(12*.75)=9 → floor(9*1.5)=13
  });
});

describe('battle basics', () => {
  it('starts with 5 cards, 3 energy, tide Rising', () => {
    const run = battleRun();
    const bs = run.battle!;
    expect(bs.hand.length).toBe(5);
    expect(bs.energy).toBe(3);
    expect(bs.tide).toBe(1);
    expect(bs.enemies.length).toBe(1);
  });

  it('playCard spends energy, deals damage, discards', () => {
    const run = battleRun();
    const bs = run.battle!;
    giveHand(run, ['tideStrike']);
    bs.energy = 3;
    const enemy = bs.enemies[0];
    const hpBefore = enemy.hp;
    const err = playCard(run, 9000, enemy.uid, newEmit());
    expect(err).toBeNull();
    expect(bs.energy).toBe(2);
    expect(enemy.hp).toBe(hpBefore - 6);
    expect(bs.discardPile.some((c) => c.uid === 9000)).toBe(true);
    expect(bs.hand.length).toBe(0);
  });

  it('rejects unaffordable and unplayable cards', () => {
    const run = battleRun();
    giveHand(run, ['depthCharge', 'barnacle']);
    run.battle!.energy = 1;
    expect(playCard(run, 9000, run.battle!.enemies[0].uid, newEmit())).toBe('energy');
    expect(playCard(run, 9001, undefined, newEmit())).toBe('unplayable');
  });

  it('win sets phase won and syncs hp back to run', () => {
    const run = battleRun();
    const bs = run.battle!;
    bs.enemies[0].hp = 3;
    giveHand(run, ['tideStrike']);
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(bs.phase).toBe('won');
    expect(run.hp).toBe(bs.player.hp);
  });
});

describe('tide', () => {
  it('advances each turn and grants Flood bonus at High', () => {
    const run = battleRun();
    const bs = run.battle!;
    expect(bs.tide).toBe(1);
    runEnemyPhase(run); // → turn 2, tide High
    expect(bs.phase).toBe('player');
    expect(bs.tide).toBe(2);
    giveHand(run, ['tidalSlam']);
    const enemy = bs.enemies[0];
    enemy.block = 0; // it may have blocked during its phase
    const before = enemy.hp;
    playCard(run, 9000, enemy.uid, newEmit());
    expect(before - enemy.hp).toBe(12); // 7 + 5 flood
  });

  it('shift moves the tide, King Tide locks it at High', () => {
    const run = battleRun();
    const bs = run.battle!;
    giveHand(run, ['riptide', 'kingTide', 'riptide']);
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(bs.tide).toBe(2);
    playCard(run, 9001, undefined, newEmit()); // King Tide → locks High
    expect(bs.tide).toBe(2);
    playCard(run, 9002, bs.enemies[0].uid, newEmit()); // shift ignored
    expect(bs.tide).toBe(2);
    runEnemyPhase(run);
    expect(bs.tide).toBe(2); // no natural advance either
  });

  it('Ebb bonus applies at Low tide', () => {
    const run = battleRun();
    const bs = run.battle!;
    bs.tide = 0;
    giveHand(run, ['ebbguard']);
    playCard(run, 9000, undefined, newEmit());
    expect(bs.player.block).toBe(12); // 7 + 5 ebb
  });
});

describe('block & statuses', () => {
  it('block absorbs, resets next turn, anchor persists', () => {
    const run = battleRun();
    const bs = run.battle!;
    giveHand(run, ['shellUp']);
    playCard(run, 9000, undefined, newEmit());
    expect(bs.player.block).toBe(8);
    const hpBefore = bs.player.hp;
    runEnemyPhase(run);
    // whatever the crab did, hp loss should be reduced by up to 8 block
    expect(bs.player.hp).toBeGreaterThanOrEqual(hpBefore - 12);
    expect(bs.player.block).toBe(0); // reset at new turn

    giveHand(run, ['hardenedShell']);
    playCard(run, 9000, undefined, newEmit());
    const blockAfter = bs.player.block;
    expect(getStatus(bs.player, 'anchor')).toBe(1);
    runEnemyPhase(run);
    expect(bs.player.block).toBeGreaterThanOrEqual(Math.max(0, blockAfter - 20)); // anchored (minus any absorbed)
  });

  it('finesse and brittle modify block gains', () => {
    const run = battleRun();
    const bs = run.battle!;
    bs.player.statuses.finesse = 2;
    giveHand(run, ['kelpGuard']);
    playCard(run, 9000, undefined, newEmit());
    expect(bs.player.block).toBe(7); // 5+2
    bs.player.block = 0;
    bs.player.statuses.brittle = 1;
    giveHand(run, ['kelpGuard']);
    playCard(run, 9000, undefined, newEmit());
    expect(bs.player.block).toBe(5); // floor(7*.75)
  });

  it('toxin ticks enemies at enemy-phase start and decrements', () => {
    const run = battleRun();
    const bs = run.battle!;
    giveHand(run, ['toxicSlick']);
    const enemy = bs.enemies[0];
    playCard(run, 9000, enemy.uid, newEmit());
    expect(getStatus(enemy, 'toxin')).toBe(5);
    const hpBefore = enemy.hp;
    runEnemyPhase(run);
    expect(enemy.maxHp - enemy.hp).toBeGreaterThanOrEqual(5);
    expect(hpBefore - enemy.hp).toBeGreaterThanOrEqual(5);
    expect(getStatus(enemy, 'toxin')).toBe(4);
  });

  it('spines punish attackers', () => {
    const run = battleRun();
    const bs = run.battle!;
    giveHand(run, ['spineBurst']);
    playCard(run, 9000, undefined, newEmit());
    expect(getStatus(bs.player, 'spines')).toBe(3);
    const enemy = bs.enemies[0];
    enemy.moveId = 'pinch';
    const before = enemy.hp;
    runEnemyPhase(run);
    expect(enemy.hp).toBeLessThanOrEqual(before - 3);
  });
});

describe('voltaic charge', () => {
  it('conduct banks charge, discharge spends and scales', () => {
    const run = battleRun('a1_crab', 'voltaic');
    const bs = run.battle!;
    bs.player.statuses = {}; // clear storm core start
    giveHand(run, ['capacitor', 'capacitor', 'arcLash']);
    playCard(run, 9000, undefined, newEmit());
    playCard(run, 9001, undefined, newEmit());
    expect(getStatus(bs.player, 'charge')).toBe(6);
    const enemy = bs.enemies[0];
    const before = enemy.hp;
    playCard(run, 9002, enemy.uid, newEmit());
    expect(before - enemy.hp).toBe(16); // 4 + 2×6
    expect(getStatus(bs.player, 'charge')).toBe(0);
  });
});

describe('enemy scripting', () => {
  it('deep mine detonates on schedule and dies', () => {
    const run = testRun('mine');
    startBattle(run, 'a2_mine_eel', newEmit());
    const bs = run.battle!;
    const mine = bs.enemies.find((e) => e.defId === 'deepMine')!;
    expect(mine.moveId).toBe('fuse3');
    for (let t = 0; t < 4 && bs.phase === 'player'; t++) runEnemyPhase(run);
    expect(mine.dead).toBe(true);
  });

  it('bone shoal reanimates exactly once', () => {
    const run = testRun('bones');
    startBattle(run, 'a3_bones', newEmit());
    const bs = run.battle!;
    const bone = bs.enemies[0];
    bone.hp = 1;
    giveHand(run, ['tideStrike']);
    playCard(run, 9000, bone.uid, newEmit());
    expect(bone.dead).toBeFalsy();
    expect(bone.reanimated).toBe(true);
    expect(bone.hp).toBe(Math.floor(bone.maxHp / 2));
    bone.hp = 1;
    giveHand(run, ['tideStrike']);
    playCard(run, 9000, bone.uid, newEmit());
    expect(bone.dead).toBe(true);
  });

  it('same seed produces identical battles (determinism)', () => {
    const a = battleRun('a1_sardines');
    const b = battleRun('a1_sardines');
    expect(JSON.stringify(a.battle!.enemies)).toBe(JSON.stringify(b.battle!.enemies));
    expect(a.battle!.hand.map((c) => c.defId)).toEqual(b.battle!.hand.map((c) => c.defId));
  });

  it('mid-battle state survives JSON round-trip', () => {
    const run = battleRun('a1_moray');
    giveHand(run, ['venomSpit']);
    playCard(run, 9000, run.battle!.enemies[0].uid, newEmit());
    const restored: RunState = JSON.parse(JSON.stringify(run));
    runEnemyPhase(run);
    runEnemyPhase(restored);
    expect(JSON.stringify(restored.battle)).toBe(JSON.stringify(run.battle));
  });
});

describe('map generation', () => {
  it('is connected, well-typed, and stable per seed', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const rng = makeRng(hashSeed(seed));
      const map = generateMap(rng, 1);
      expect(map.rows.length).toBe(12);
      expect(map.rows[11].length).toBe(1);
      expect(map.rows[11][0].type).toBe('boss');
      expect(map.rows[10].every((n) => n.type === 'rest')).toBe(true);
      expect(map.rows[5].some((n) => n.type === 'treasure')).toBe(true);
      // every non-boss node has at least one outgoing edge to a real node
      for (let r = 0; r < 11; r++) {
        for (const n of map.rows[r]) {
          expect(n.next.length).toBeGreaterThan(0);
          for (const c of n.next) expect(map.rows[r + 1].some((t) => t.col === c)).toBe(true);
        }
        // every row r+1 node has a parent
        for (const t of map.rows[r + 1]) {
          expect(map.rows[r].some((n) => n.next.includes(t.col))).toBe(true);
        }
      }
      const elites = map.rows.flat().filter((n) => n.type === 'elite');
      expect(elites.length).toBeGreaterThanOrEqual(1);
      expect(map.rows.flat().filter((n) => n.type === 'battle' || n.type === 'elite').every((n) => n.payload)).toBe(true);
    }
  });
});

describe('run layer', () => {
  it('battle rewards: gold, 3 distinct cards; boss offers 3 boss relics', () => {
    const run = battleRun();
    run.battle!.enemies.forEach((e) => { e.hp = 0; e.dead = true; });
    run.battle!.phase = 'won';
    const reward = generateBattleReward(run);
    expect(reward.gold).toBeGreaterThan(0);
    expect(reward.cards.length).toBe(3);
    expect(new Set(reward.cards.map((c) => c.defId)).size).toBe(3);
    for (const c of reward.cards) expect(CARDS[c.defId].char === 'tidecaller' || CARDS[c.defId].char === 'neutral').toBe(true);

    const bossRun = battleRun('a1_boss');
    bossRun.battle!.enemies.forEach((e) => { e.hp = 0; e.dead = true; });
    bossRun.battle!.phase = 'won';
    const bossReward = generateBattleReward(bossRun);
    expect(bossReward.bossRelics.length).toBe(3);
  });

  it('shop: buying works and respects gold', () => {
    const run = testRun('shop');
    run.gold = 1000;
    run.shop = generateShop(run);
    const deckBefore = run.deck.length;
    const cardIdx = run.shop.items.findIndex((i) => i.kind === 'card');
    expect(buyShopItem(run, cardIdx)).toBeNull();
    expect(run.deck.length).toBe(deckBefore + 1);
    run.gold = 0;
    const other = run.shop.items.findIndex((i) => !i.sold);
    expect(buyShopItem(run, other)).toBe('gold');
  });

  it('events: effects and deck picks apply', () => {
    const run = testRun('events');
    const goldBefore = run.gold;
    applyEventEffect(run, { kind: 'gold', amount: 30 }, newEmit());
    expect(run.gold).toBe(goldBefore + 30);
    applyEventEffect(run, { kind: 'curse', id: 'barnacle' }, newEmit());
    expect(run.deck.some((c) => c.defId === 'barnacle')).toBe(true);

    const target = run.deck.find((c) => c.defId === 'tideStrike')!;
    completePick(run, 'upgrade', target.uid);
    expect(target.upgraded).toBe(true);
    const size = run.deck.length;
    completePick(run, 'duplicate', target.uid);
    expect(run.deck.length).toBe(size + 1);
    completePick(run, 'remove', target.uid);
    expect(run.deck.length).toBe(size);
    expect(Object.keys(EVENTS).length).toBeGreaterThanOrEqual(9);
  });

  it('scoring rewards progress', () => {
    const run = testRun('score');
    run.stats.floorsClimbed = 10;
    run.stats.kills = 8;
    expect(scoreRun(run)).toBeGreaterThan(80);
  });
});
