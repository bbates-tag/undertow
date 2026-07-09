// Card registry + reward-pool helpers.

import type { CardDef, CardInstance, CharacterId, Rarity } from '../engine/types';
import { TIDECALLER_CARDS } from './cards_tidecaller';
import { VOLTAIC_CARDS } from './cards_voltaic';
import { DROWNED_CARDS } from './cards_drowned';
import { CURSE_CARDS, NEUTRAL_CARDS } from './cards_shared';

export const ALL_CARDS: CardDef[] = [
  ...TIDECALLER_CARDS,
  ...VOLTAIC_CARDS,
  ...DROWNED_CARDS,
  ...NEUTRAL_CARDS,
  ...CURSE_CARDS,
];

export const CARDS: Record<string, CardDef> = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));

if (ALL_CARDS.length !== Object.keys(CARDS).length) {
  throw new Error('Duplicate card ids in content');
}

/** Cards that can appear as rewards/shop stock for a character. */
export function rewardableCards(charId: CharacterId, lockedIds: ReadonlySet<string>): CardDef[] {
  return ALL_CARDS.filter(
    (c) =>
      (c.char === charId || c.char === 'neutral') &&
      c.rarity !== 'starter' &&
      c.rarity !== 'special' &&
      c.type !== 'curse' &&
      !lockedIds.has(c.id),
  );
}

export const RARITY_WEIGHTS: Record<'battle' | 'elite' | 'boss' | 'shop', [Rarity, number][]> = {
  battle: [['common', 60], ['uncommon', 35], ['rare', 5]],
  elite: [['common', 40], ['uncommon', 44], ['rare', 16]],
  boss: [['rare', 100]],
  shop: [['common', 45], ['uncommon', 40], ['rare', 15]],
};

export function instanceOf(defId: string, uid: number, upgraded = false): CardInstance {
  if (!CARDS[defId]) throw new Error(`Unknown card: ${defId}`);
  return { uid, defId, upgraded };
}
