// Compendium discovery: what counts as "seen" and when withSeen no-ops.

import { describe, expect, it } from 'vitest';
import { withSeen } from './seen';
import { newRun } from '../engine/run';
import { newEmit, startBattle } from '../engine/battle';
import type { MetaState, RunState, ShopState } from '../engine/types';

const baseMeta = (over: Partial<MetaState> = {}) => ({
  version: 1, fathoms: 0, unlockedChars: ['tidecaller'], unlockedPacks: [],
  ascension: {}, wins: {}, runsPlayed: 0, achievements: {}, seenEnemies: {}, seenCards: {}, seenRelics: {},
  runHistory: [], dailyHistory: [], bestScore: 0, tutorialSeen: false, ...over,
}) as MetaState;

const freshRun = (): RunState => newRun({ charId: 'tidecaller', ascension: 0, seed: 'seen-test', unlockedPacks: [] });

describe('compendium discovery', () => {
  it("unlocked characters' starter decks always count as known, even with no run", () => {
    const next = withSeen(baseMeta(), null);
    expect(next).not.toBeNull();
    expect(next!.seenCards.tideStrike).toBe(true);
    expect(next!.seenCards.undertow).toBe(true);
    expect(next!.seenCards.gnash).toBeUndefined(); // not a starter
    expect(Object.keys(next!.seenEnemies)).toHaveLength(0);
  });

  it('battle enemies and deck cards are discovered; second pass is a no-op', () => {
    const run = freshRun();
    startBattle(run, 'a1_crab', newEmit());
    const m1 = withSeen(baseMeta(), run);
    expect(m1).not.toBeNull();
    expect(m1!.seenEnemies[run.battle!.enemies[0].defId]).toBe(true);
    expect(m1!.seenCards.riptide).toBe(true); // starter deck via the run
    expect(withSeen(m1!, run)).toBeNull(); // nothing new → null, no state churn
  });

  it('reward offers and shop stock count as seen', () => {
    const run = freshRun();
    run.reward = { gold: 0, cards: [{ uid: 900, defId: 'depthCharge', upgraded: false }], relics: [], bossRelics: [], taken: {}, source: 'battle' };
    run.shop = { items: [{ kind: 'card', card: { uid: 901, defId: 'maelstrom', upgraded: false }, price: 50 }], removalPrice: 75, removalsLeft: 1 } as ShopState;
    const next = withSeen(baseMeta(), run);
    expect(next!.seenCards.depthCharge).toBe(true);
    expect(next!.seenCards.maelstrom).toBe(true);
  });

  it('relics: owned, shop stock, and boss choices count — the salvage crate stays secret', () => {
    const run = freshRun();
    run.relics.push('oarfishRibbon');
    run.reward = { gold: 0, cards: [], relics: ['nacreCharm'], bossRelics: ['rustedHelm'], taken: {}, source: 'boss' };
    run.shop = {
      items: [{ kind: 'relic', relicId: 'kelpWrap', price: 150 }],
      removalPrice: 75, removalsLeft: 1,
      crateRelicId: 'drownedCompass', cratePrice: 85,
    } as ShopState;
    const next = withSeen(baseMeta(), run);
    expect(next!.seenRelics.livingCoral).toBe(true); // unlocked starter relic
    expect(next!.seenRelics.oarfishRibbon).toBe(true);
    expect(next!.seenRelics.nacreCharm).toBe(true);
    expect(next!.seenRelics.rustedHelm).toBe(true);
    expect(next!.seenRelics.kelpWrap).toBe(true);
    expect(next!.seenRelics.drownedCompass).toBeUndefined(); // sight-unseen until bought
  });

  it('saves from before seen-tracking (fields missing) are treated as empty', () => {
    const old = baseMeta();
    delete (old as Partial<MetaState>).seenEnemies;
    delete (old as Partial<MetaState>).seenCards;
    const next = withSeen(old, null);
    expect(next).not.toBeNull();
    expect(next!.seenCards.tideStrike).toBe(true);
  });
});
