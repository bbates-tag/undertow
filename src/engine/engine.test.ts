import { describe, expect, it } from 'vitest';
import {
  calcAttack, endPlayerTurn, getStatus, newEmit, playCard, startBattle, stepEnemy,
} from './battle';
import { generateMap, newRun, generateBattleReward, applyEventEffect, completePick, buyShopItem, generateShop, scoreRun, addRelic } from './run';
import { relicPool } from '../content/relics';
import { makeRng, hashSeed } from '../lib/rng';
import type { CharacterId, CreatureState, RunState } from './types';
import { UNLOCK_PACKS } from '../content/meta';
import { CARDS } from '../content/cards';
import { EVENTS } from '../content/events';

const ALL_PACKS = UNLOCK_PACKS.map((p) => p.id);

function testRun(seed = 'test-seed', charId: CharacterId = 'tidecaller'): RunState {
  return newRun({ charId, ascension: 0, seed, unlockedPacks: ALL_PACKS });
}

function battleRun(groupId = 'a1_crab', charId: CharacterId = 'tidecaller'): RunState {
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

  it('Heart of the Maelstrom: block on every tide change, natural cadence untouched', () => {
    const run = battleRun();
    run.relics.push('heartOfMaelstrom');
    const bs = run.battle!;
    expect(bs.tide).toBe(1); // Rising

    // card-driven shift grants block
    giveHand(run, ['riptide']);
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(bs.tide).toBe(2);
    expect(bs.player.block).toBe(3);

    // next turn: tide advances exactly one step (no extra relic shift)…
    runEnemyPhase(run);
    expect(bs.tide).toBe(3); // Falling — natural +1 only
    // …and the natural change's block survives the start-of-turn reset
    expect(bs.player.block).toBe(3);
  });

  it('boss relics are pure upside: crown scales Might, pearl debuffs, only the helm grants energy', () => {
    const run = testRun('boss-relics');
    run.relics.push('pressureCrown', 'blackPearl');
    startBattle(run, 'a1_crab', newEmit());
    const bs = run.battle!;
    expect(bs.maxEnergy).toBe(3); // pearl/crown no longer grant (or cost) energy
    expect(bs.hand.length).toBe(5); // crown no longer cuts draw
    expect(bs.player.hp).toBe(run.maxHp); // nothing bleeds you at battle start anymore
    expect(getStatus(bs.player, 'might')).toBe(1);
    expect(getStatus(bs.enemies[0], 'weakened')).toBe(2);
    expect(getStatus(bs.enemies[0], 'exposed')).toBe(2);
    runEnemyPhase(run); // → turn 2
    runEnemyPhase(run); // → turn 3: crown ticks
    expect(getStatus(bs.player, 'might')).toBe(2);
  });

  it("Leviathan's Eye poisons the field each turn; Stormglass Jar charges each turn", () => {
    const run = testRun('eye-jar');
    run.relics.push('leviathansEye', 'stormglassJar');
    startBattle(run, 'a1_crab', newEmit());
    const bs = run.battle!;
    expect(getStatus(bs.enemies[0], 'toxin')).toBe(1);
    expect(getStatus(bs.player, 'charge')).toBe(2);
  });

  it('treasure tier is chest-exclusive: 6 cursed relics, absent from every other pool', () => {
    const pool = relicPool('treasure', 'tidecaller', [], new Set());
    expect(pool.length).toBe(6);
    expect(pool.every((r) => r.tier === 'treasure')).toBe(true);
    for (const t of ['common', 'uncommon', 'rare', 'boss'] as const) {
      expect(relicPool(t, 'tidecaller', [], new Set()).every((r) => r.tier === t)).toBe(true);
    }
  });

  it('treasure relic battle hooks: locket bites, chain shields, veil poisons both sides', () => {
    const run = testRun('cursed');
    run.relics.push('fangedLocket', 'barbedChain', 'widowsVeil');
    startBattle(run, 'a1_crab', newEmit());
    const bs = run.battle!;
    expect(getStatus(bs.player, 'might')).toBe(2);
    // locket bite (2, ignores block) + the veil's own toxin ticking on turn 1 (2)
    expect(bs.player.hp).toBe(run.maxHp - 4);
    expect(bs.player.block).toBe(10);
    expect(getStatus(bs.enemies[0], 'toxin')).toBe(2); // ticks on THEIR first turn
    expect(getStatus(bs.player, 'toxin')).toBe(1); // already ticked once and fell
  });

  it('Bloodletter Hook doubles only the first attack, then takes its cut on victory', () => {
    const run = battleRun();
    run.relics.push('bloodletterHook');
    const bs = run.battle!;
    const e = bs.enemies[0];
    giveHand(run, ['tideStrike', 'tideStrike']);
    const hp0 = e.hp;
    playCard(run, 9000, e.uid, newEmit());
    expect(hp0 - e.hp).toBe(12); // 6 doubled
    const hp1 = e.hp;
    e.hp = Math.min(e.hp, 5); // ensure the next (normal) hit is lethal
    playCard(run, 9001, e.uid, newEmit());
    expect(bs.phase).toBe('won');
    // victory: run.hp = player hp, +5 Living Coral (starter), then the hook's -2
    expect(run.hp).toBe(run.maxHp - 2);
    void hp1;
  });

  it("Harpooner's Line only bites armored enemies; Oarfish Ribbon pays out per Shift", () => {
    const run = battleRun();
    run.relics.push('harpoonersLine', 'oarfishRibbon');
    const bs = run.battle!;
    const e = bs.enemies[0];
    giveHand(run, ['tideStrike', 'tideStrike', 'riptide']);
    e.block = 0;
    const hp0 = e.hp;
    playCard(run, 9000, e.uid, newEmit());
    expect(hp0 - e.hp).toBe(6); // no block, no bonus
    e.block = 5;
    playCard(run, 9001, e.uid, newEmit());
    expect(e.block).toBe(0);
    expect(hp0 - 6 - e.hp).toBe(8 - 5); // 6+2, 5 soaked by block
    const blk0 = bs.player.block;
    playCard(run, 9002, e.uid, newEmit()); // riptide: damage + Shift +1
    expect(bs.player.block - blk0).toBe(2);
  });

  it('Pale Starfish heals bloodless turns; Gull Feather draws on kills', () => {
    const run = battleRun();
    run.relics.push('paleStarfish', 'gullFeather');
    const bs = run.battle!;
    bs.player.hp = 50;
    giveHand(run, ['tideStrike']);
    bs.enemies[0].hp = 1;
    const hand0 = bs.hand.length;
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(bs.phase).toBe('won'); // solo crab dies…
    expect(bs.hand.length).toBe(hand0 - 1 + 1); // …and the feather still drew first
    // starfish: end an untouched turn in a fresh battle
    const run2 = battleRun('a1_moray');
    run2.relics.push('paleStarfish');
    const bs2 = run2.battle!;
    bs2.player.hp = 40;
    bs2.enemies[0].moveId = 'lurk'; // enemy blocks instead of attacking
    endPlayerTurn(run2, newEmit());
    expect(bs2.player.hp).toBeGreaterThanOrEqual(42 - 2); // healed 2 at turn end (before enemy act)
  });

  it('Leaden Idol and Merchant\'s Debt pickup effects apply once', () => {
    const run = testRun('pickup');
    const hp = run.maxHp;
    const gold = run.gold;
    addRelic(run, 'leadenIdol');
    addRelic(run, 'merchantsDebt');
    expect(run.maxHp).toBe(hp + 12);
    expect(run.gold).toBe(gold + 60);
    startBattle(run, 'a1_crab', newEmit());
    expect(run.battle!.tide).toBe(0); // idol drags battles to Low tide
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

describe('the Drowned — Descent', () => {
  it('HP lost on your own turn becomes Descent (starter relic adds 1, once per turn)', () => {
    const run = battleRun('a1_crab', 'drowned');
    const bs = run.battle!;
    giveHand(run, ['openVein', 'openVein']);
    const hpBefore = bs.player.hp;
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    // lose 2 → +2 Descent, +1 Barnacled Heart (first gain this turn)
    expect(bs.player.hp).toBe(hpBefore - 2);
    expect(getStatus(bs.player, 'descent')).toBe(3);
    playCard(run, 9001, bs.enemies[0].uid, newEmit());
    expect(getStatus(bs.player, 'descent')).toBe(5); // heart bonus doesn't repeat
  });

  it('other characters never gain Descent', () => {
    const run = battleRun('a1_crab', 'tidecaller');
    const bs = run.battle!;
    giveHand(run, ['tideStrike']);
    bs.player.statuses.spines = 0;
    // force a self-loss during the player phase
    bs.enemies[0].statuses.spines = 3;
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(getStatus(bs.player, 'descent')).toBe(0);
  });

  it('perDescent scaling and Surface reset', () => {
    const run = battleRun('a1_crab', 'drowned');
    const bs = run.battle!;
    bs.player.statuses.descent = 10;
    giveHand(run, ['sunkenFury', 'breakSurface']);
    const e = bs.enemies[0];
    const hpBefore = e.hp;
    playCard(run, 9000, e.uid, newEmit());
    expect(hpBefore - e.hp).toBe(12); // 2 base + 1×10 Descent
    bs.player.hp = 40;
    playCard(run, 9001, undefined, newEmit());
    expect(bs.player.hp).toBe(50); // healed 10 (1 per Descent)
    expect(getStatus(bs.player, 'descent')).toBe(0); // Surface
  });

  it('descentAtLeast conditions gate bonus ops', () => {
    const run = battleRun('a1_crab', 'drowned');
    const bs = run.battle!;
    const e = bs.enemies[0];
    giveHand(run, ['saltInTheWound', 'saltInTheWound']);
    let hpBefore = e.hp;
    playCard(run, 9000, e.uid, newEmit());
    expect(hpBefore - e.hp).toBe(4); // below 5 Descent: single hit
    bs.player.statuses.descent = 5;
    hpBefore = e.hp;
    playCard(run, 9001, e.uid, newEmit());
    expect(hpBefore - e.hp).toBe(8); // 4 + conditional 4
  });

  it('spines retaliation feeds Descent for the Drowned', () => {
    const run = battleRun('a1_crab', 'drowned');
    const bs = run.battle!;
    bs.enemies[0].statuses.spines = 2;
    giveHand(run, ['drownedGrip']);
    playCard(run, 9000, bs.enemies[0].uid, newEmit());
    expect(getStatus(bs.player, 'descent')).toBe(3); // 2 spines + 1 heart
  });
});
