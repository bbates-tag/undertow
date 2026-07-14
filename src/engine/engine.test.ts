import { describe, expect, it } from 'vitest';
import {
  ascEnemyDmgBonus, calcAttack, endPlayerTurn, getStatus, newEmit, playCard, previewEnemyMove,
  startBattle, stepEnemy,
} from './battle';
import { generateMap, newRun, generateBattleReward, applyEventEffect, applyBoon, buyCrate, buyDefang, buyWhetstone, completePick, buyShopItem, defangEligible, generateShop, pawnRelic, scoreRun, sellPrice, addRelic, beginLoop, restHealAmount } from './run';
import { RELICS, relicPool } from '../content/relics';
import { cardConditionActive, describeCard } from './describe';
import { generateBossSpec, threatCost } from './endless';
import { ENEMIES } from '../content/enemies';
import { makeRng, hashSeed } from '../lib/rng';
import type { CharacterId, CreatureState, RunState } from './types';
import { UNLOCK_PACKS } from '../content/meta';
import { ALL_CARDS, CARDS } from '../content/cards';
import { CHARACTERS } from '../content/characters';
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

  it('endless: beginLoop cycles to Act I deterministically and compounds enemy stats', () => {
    const run = testRun('endless');
    run.act = 3;
    run.result = 'win';
    beginLoop(run, newEmit());
    expect(run.loop).toBe(1);
    expect(run.act).toBe(1);
    expect(run.result).toBeNull();
    expect(run.map.act).toBe(1);
    expect(run.map.rows.length).toBeGreaterThan(0);

    // same seed, same path → identical loop-1 map
    const run2 = testRun('endless');
    run2.act = 3;
    run2.result = 'win';
    beginLoop(run2, newEmit());
    expect(JSON.stringify(run2.map)).toBe(JSON.stringify(run.map));

    // loop 1: HP ×1.28, +2 enemy damage, +1 starting Might
    startBattle(run, 'a1_crab', newEmit());
    const e = run.battle!.enemies[0];
    expect(getStatus(e, 'might')).toBe(1);
    expect(e.maxHp).toBeGreaterThanOrEqual(Math.round(26 * 1.28)); // crab floor, scaled
    expect(ascEnemyDmgBonus(run)).toBe(2);

    // each loop is worth 100 score
    const s1 = scoreRun(run);
    run.loop = 2;
    expect(scoreRun(run) - s1).toBe(100);
  });

  it('endless: every enemy has a sane derived threat cost', () => {
    for (const def of Object.values(ENEMIES)) {
      const c = threatCost(def);
      expect(Number.isFinite(c)).toBe(true);
      expect(c).toBeGreaterThan(0);
    }
    // elites must out-cost the average act-1 normal
    const normalsAvg =
      Object.values(ENEMIES).filter((e) => e.tier === 'normal' && e.act === 1)
        .reduce((a, e) => a + threatCost(e), 0) /
      Object.values(ENEMIES).filter((e) => e.tier === 'normal' && e.act === 1).length;
    expect(threatCost(ENEMIES.anglerfish)).toBeGreaterThan(normalsAvg);
  });

  it('endless: loop maps carry deterministic procedural specs; loop 0 has none', () => {
    const run0 = testRun('proc');
    expect(run0.map.rows.flat().every((n) => !n.encounter)).toBe(true);

    const run = testRun('proc');
    run.act = 3;
    run.result = 'win';
    beginLoop(run, newEmit());
    const nodes = run.map.rows.flat();
    const fights = nodes.filter((n) => n.type === 'battle' || n.type === 'elite');
    expect(fights.length).toBeGreaterThan(0);
    expect(fights.every((n) => !!n.encounter)).toBe(true);
    // bosses keep the authored roster but spawn affixed
    const bossSpec = nodes.find((n) => n.type === 'boss')!.encounter!;
    expect(bossSpec.enemies.map((e) => e.defId)).toEqual(['sunkenKing']);
    expect(bossSpec.enemies[0].affixes?.length).toBe(1);

    const MINIONS = ['tentacleSpawn', 'krakenArm', 'boneShoalMinion'];
    for (const n of fights) {
      const spec = n.encounter!;
      expect(spec.enemies.length).toBeGreaterThanOrEqual(1);
      expect(spec.enemies.length).toBeLessThanOrEqual(4);
      expect(spec.enemies.every((e) => !MINIONS.includes(e.defId))).toBe(true);
      if (n.type === 'elite') {
        expect(spec.enemies.some((e) => ENEMIES[e.defId].tier === 'elite')).toBe(true);
      }
    }

    // boss nodes carry BOTH the spec and the authored payload — a payload-only
    // consumer (map boss icon) crashed the whole tree when this was missing
    const bossNode = nodes.find((n) => n.type === 'boss')!;
    expect(bossNode.payload).toBe('a1_boss');

    // same seed, same path → identical procedural maps
    const run2 = testRun('proc');
    run2.act = 3;
    run2.result = 'win';
    beginLoop(run2, newEmit());
    expect(JSON.stringify(run2.map)).toBe(JSON.stringify(run.map));

    // a spec battle materializes with the spec's id and enemy list
    const first = fights[0].encounter!;
    startBattle(run, first, newEmit());
    expect(run.battle!.groupId).toBe(first.id);
    expect(run.battle!.enemies.length).toBe(first.enemies.length);
  });

  it('endless affixes: spawn effects apply, relentless revives once, venomous poisons', () => {
    const run = testRun('affix');
    run.loop = 1;
    const spec = {
      id: 'affix-test',
      pool: 'easy' as const,
      enemies: [
        { defId: 'sardine', affixes: ['hulking', 'raging', 'spined', 'shielded'] },
        { defId: 'sardine', affixes: ['relentless'] },
        { defId: 'sardine', affixes: ['venomous'] },
      ],
    };
    startBattle(run, spec, newEmit());
    const bs = run.battle!;
    const [a, b, c] = bs.enemies;
    expect(a.maxHp).toBeGreaterThanOrEqual(14); // hulking on top of loop scaling
    expect(getStatus(a, 'might')).toBe(3); // 2 raging + 1 loop
    expect(getStatus(a, 'spines')).toBe(3);
    expect(a.block).toBe(12);

    // relentless: first kill revives at half, second kill sticks
    giveHand(run, ['tideStrike', 'tideStrike']);
    b.hp = 1;
    b.block = 0;
    playCard(run, 9000, b.uid, newEmit());
    expect(b.dead).toBeUndefined();
    expect(b.reanimated).toBe(true);
    expect(b.hp).toBe(Math.floor(b.maxHp / 2));
    b.hp = 1;
    playCard(run, 9001, b.uid, newEmit());
    expect(b.dead).toBe(true);

    // venomous: after the enemy phase, its strike left toxin behind
    runEnemyPhase(run);
    expect(getStatus(bs.player, 'toxin')).toBeGreaterThanOrEqual(1);
    void c;
  });

  it('summons surface with sickness: telegraph first, act only next phase', () => {
    const run = battleRun('a2_elite_cultist');
    const bs = run.battle!;
    expect(bs.enemies[0].moveId).toBe('beckon'); // alone, the cultist calls the deep
    const hp0 = bs.player.hp;
    giveHand(run, []);
    runEnemyPhase(run);
    const tentacle = bs.enemies.find((e) => e.defId === 'tentacleSpawn')!;
    expect(tentacle).toBeTruthy();
    expect(bs.player.hp).toBe(hp0); // the fresh tentacle did NOT lash this phase
    expect(tentacle.surfacing).toBeUndefined(); // sickness cleared at phase end…
    expect(tentacle.moveId).toBe('lash'); // …and its intent is telegraphed
    giveHand(run, []);
    runEnemyPhase(run);
    expect(hp0 - bs.player.hp).toBeGreaterThanOrEqual(6); // now the lash lands
  });

  it('deep endless: boons replace a drained boss pool, and each boon works', () => {
    const run = battleRun('a1_boss');
    run.relics.push('rustedHelm', 'blackPearl', 'pressureCrown', 'heartOfMaelstrom', 'grimoireOfBrine', 'leviathansEye');
    const reward = generateBattleReward(run);
    expect(reward.bossRelics.length).toBe(0);
    expect(reward.bossBoons).toEqual(['leviathansFeast', 'sunkenHoard', 'deepTempering']);

    run.hp = 10;
    const hpMax = run.maxHp;
    applyBoon(run, 'leviathansFeast', newEmit());
    expect(run.maxHp).toBe(hpMax + 8);
    expect(run.hp).toBe(run.maxHp);

    const gold0 = run.gold;
    applyBoon(run, 'sunkenHoard', newEmit());
    expect(run.gold).toBe(gold0 + 100);

    const upBefore = run.deck.filter((c) => c.upgraded).length;
    applyBoon(run, 'deepTempering', newEmit());
    expect(run.deck.filter((c) => c.upgraded).length).toBe(Math.min(upBefore + 2, run.deck.length));
  });

  it('elite rewards fall through drained tiers, then pay gold', () => {
    const run = battleRun('a1_elite_angler');
    for (const rel of Object.values(RELICS)) {
      if (rel.tier === 'common' || rel.tier === 'uncommon' || rel.tier === 'rare') run.relics.push(rel.id);
    }
    const reward = generateBattleReward(run);
    expect(reward.relics.length).toBe(0);
    expect(reward.gold).toBeGreaterThanOrEqual(28 + 40); // elite floor + compensation
  });

  it('rest heals warm up with loop depth, capped at half Max HP', () => {
    const run = testRun('rest');
    expect(restHealAmount(run)).toBe(Math.round(run.maxHp * 0.3));
    run.loop = 3;
    expect(restHealAmount(run)).toBe(Math.round(run.maxHp * 0.42));
    run.loop = 10;
    expect(restHealAmount(run)).toBe(Math.round(run.maxHp * 0.5)); // capped
  });

  it('enemy intent previews include the ascension/endless damage bonus', () => {
    const run = battleRun();
    const bs = run.battle!;
    const e = bs.enemies[0];
    const base = previewEnemyMove(run, bs, e);
    run.loop = 2; // +4 enemy damage
    const scaled = previewEnemyMove(run, bs, e);
    if (base && scaled) expect(scaled.dmg - base.dmg).toBe(4);
    else expect(base).toBe(scaled); // non-attack intent for both
  });

  it('endless: loop bosses spawn affixed, their minions stay clean', () => {
    const rng = makeRng(hashSeed('boss-affix'));
    const spec1 = generateBossSpec(rng, 3, 1, 'b1'); // the act-3 kraken: arm, head, arm
    const head = spec1.enemies.find((e) => e.defId === 'krakenHead')!;
    const arms = spec1.enemies.filter((e) => e.defId === 'krakenArm');
    expect(head.affixes?.length).toBe(1);
    expect(arms.every((e) => !e.affixes)).toBe(true);
    const spec3 = generateBossSpec(rng, 1, 3, 'b3');
    expect(spec3.enemies[0].affixes?.length).toBe(2);
  });

  it('conditional text folds in when live: "Flood: Deal 12" at High tide, "+5" suffix otherwise', () => {
    const run = battleRun();
    const bs = run.battle!;
    const slam = CARDS.tidalSlam;
    bs.tide = 1; // Rising — condition dormant
    expect(describeCard(slam, false, { bs })).toBe('Deal 7 damage. Flood: +5 damage.');
    expect(cardConditionActive(slam, false, bs)).toBe(false);
    bs.tide = 2; // High — bonus folds into the number, suffix drops
    expect(describeCard(slam, false, { bs })).toBe('Flood: Deal 12 damage.');
    expect(cardConditionActive(slam, false, bs)).toBe(true);
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

  it('shop: stock is 3 cards with a guaranteed rare + 2 relics + services', () => {
    const run = testRun('shop-stock');
    run.shop = generateShop(run);
    const cards = run.shop.items.filter((i) => i.kind === 'card');
    expect(cards.length).toBe(3);
    expect(cards.some((c) => c.kind === 'card' && CARDS[c.card.defId].rarity === 'rare')).toBe(true);
    expect(run.shop.items.filter((i) => i.kind === 'relic').length).toBe(2);
    expect(run.shop.whetstonePrice).toBe(90);
    expect(run.shop.defangPrice).toBe(140);
  });

  it('shop: whetstone upgrades a card, escalates, and respects limits', () => {
    const run = testRun('whetstone');
    run.gold = 500;
    run.shop = generateShop(run);
    const card = run.deck.find((c) => !c.upgraded)!;
    expect(buyWhetstone(run, card.uid)).toBeNull();
    expect(card.upgraded).toBe(true);
    expect(run.gold).toBe(500 - 90);
    // one per shop
    const other = run.deck.find((c) => !c.upgraded)!;
    expect(buyWhetstone(run, other.uid)).toBe('none');
    // escalation: next shop charges more
    run.shop = generateShop(run);
    expect(run.shop.whetstonePrice).toBe(120);
    // can't sharpen an already-upgraded card
    expect(buyWhetstone(run, card.uid)).toBe('none');
  });

  it('shop: defang strips a treasure relic downside for good', () => {
    const run = testRun('defang');
    run.gold = 500;
    addRelic(run, 'fangedLocket');
    run.shop = generateShop(run);
    expect(defangEligible(run)).toEqual(['fangedLocket']);

    // with teeth: battle start costs 2 HP (alongside the 2 Might)
    startBattle(run, 'a1_crab', newEmit());
    expect(run.battle!.player.hp).toBe(run.hp - 2);
    expect(run.battle!.player.statuses.might).toBe(2);
    run.battle = null;

    expect(buyDefang(run, 'fangedLocket')).toBeNull();
    expect(run.gold).toBe(500 - 140);
    expect(defangEligible(run)).toEqual([]);
    expect(buyDefang(run, 'fangedLocket')).toBe('none'); // no double-dipping

    // defanged: the might stays, the bite is gone
    startBattle(run, 'a1_crab', newEmit());
    expect(run.battle!.player.hp).toBe(run.hp);
    expect(run.battle!.player.statuses.might).toBe(2);
  });

  it("shop: merchant's debt cannot be defanged", () => {
    const run = testRun('debt');
    run.gold = 500;
    addRelic(run, 'merchantsDebt');
    run.shop = generateShop(run);
    expect(defangEligible(run)).toEqual([]);
    expect(buyDefang(run, 'merchantsDebt')).toBe('none');
  });

  it('shop: salvage crate holds a valid unowned relic and buying reveals it', () => {
    const run = testRun('crate');
    run.gold = 500;
    run.shop = generateShop(run);
    const id = run.shop.crateRelicId!;
    expect(id).toBeTruthy();
    expect(RELICS[id]).toBeDefined();
    expect(run.relics.includes(id)).toBe(false);
    // never a duplicate of the open relic stock
    const offered = run.shop.items.filter((i) => i.kind === 'relic').map((i) => i.kind === 'relic' && i.relicId);
    expect(offered.includes(id)).toBe(false);
    expect(run.shop.cratePrice).toBe(85);

    expect(buyCrate(run)).toBeNull();
    expect(run.relics.includes(id)).toBe(true);
    expect(run.gold).toBe(500 - 85);
    expect(buyCrate(run)).toBe('none'); // one crate per shop
  });

  it('shop: pawn counter pays tier value and forgets the defang', () => {
    const run = testRun('pawn');
    run.gold = 0;
    addRelic(run, 'fangedLocket');
    run.defanged = ['fangedLocket'];
    run.shop = generateShop(run);

    expect(sellPrice('fangedLocket')).toBe(55);
    expect(pawnRelic(run, 'fangedLocket')).toBeNull();
    expect(run.gold).toBe(55);
    expect(run.relics.includes('fangedLocket')).toBe(false);
    expect(run.defanged.includes('fangedLocket')).toBe(false);
    // can't pawn what you don't own
    expect(pawnRelic(run, 'fangedLocket')).toBe('none');
    // starter relic is pawnable — cheap, but allowed
    expect(pawnRelic(run, 'livingCoral')).toBeNull();
    expect(run.gold).toBe(55 + 25);
  });

  it('weaver: read riders key off the target telegraph', () => {
    const run = battleRun('a1_crab', 'weaver');
    const bs = run.battle!;
    const crab = bs.enemies[0];
    giveHand(run, ['needleJab', 'needleJab']);

    crab.moveId = 'pinch'; // attack intent → the rider triggers
    const hpBefore = crab.hp;
    playCard(run, bs.hand[0].uid, crab.uid, newEmit());
    expect(hpBefore - crab.hp).toBe(8);

    crab.moveId = 'shellWall'; // block intent → base damage only
    bs.energy = 3;
    const hp2 = crab.hp;
    playCard(run, bs.hand[0].uid, crab.uid, newEmit());
    expect(hp2 - crab.hp).toBe(5);
  });

  it('weaver: foresight forecasts a valid next move for every enemy', () => {
    const run = battleRun('a1_crab', 'weaver');
    for (const e of run.battle!.enemies) {
      expect(e.nextMoveId).toBeTruthy();
      expect(ENEMIES[e.defId].moves[e.nextMoveId!]).toBeDefined();
    }
  });

  it('weaver: never bitten scales with the telegraph, called shot pays on death', () => {
    const run = battleRun('a1_crab', 'weaver');
    const bs = run.battle!;
    const crab = bs.enemies[0];
    giveHand(run, ['neverBitten', 'calledShot']);
    bs.energy = 5;

    crab.moveId = 'crush'; // telegraphs an 11 attack → 2× = 22
    crab.hp = crab.maxHp = 100;
    playCard(run, bs.hand.find((c) => c.defId === 'neverBitten')!.uid, crab.uid, newEmit());
    expect(100 - crab.hp).toBe(22);

    playCard(run, bs.hand.find((c) => c.defId === 'calledShot')!.uid, crab.uid, newEmit());
    const energyBefore = bs.energy;
    const handBefore = bs.hand.length;
    crab.hp = 1;
    giveHand(run, ['needleJab', ...bs.hand.map(() => 'needleJab')].slice(0, 1)); // keep a card to kill with
    bs.energy = energyBefore;
    crab.moveId = 'pinch';
    playCard(run, bs.hand[0].uid, crab.uid, newEmit());
    expect(crab.dead).toBe(true);
    // marked 1 → +2 energy, +2 cards (hand had 1 card which was played → 2 drawn)
    expect(bs.energy).toBe(energyBefore - 1 + 2);
    expect(bs.hand.length).toBe(2);
    void handBefore;
  });

  it('weaver: unlock content is wired (28 cards, char entry, relics)', () => {
    const pool = ALL_CARDS.filter((c) => c.char === 'weaver');
    expect(pool.length).toBe(28);
    expect(CHARACTERS.weaver.starterRelic).toBe('weaversInstinct');
    expect(RELICS.weaversInstinct.char).toBe('weaver');
    expect(RELICS.eyeOfTheGyre.tier).toBe('boss');
    // starter deck ids all resolve
    for (const s of CHARACTERS.weaver.starterDeck) expect(CARDS[s.card]).toBeDefined();
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
