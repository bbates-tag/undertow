// Neutral cards (shops/events) and curses (events, enemies, boss relics).

import type { CardDef } from '../engine/types';

export const NEUTRAL_CARDS: CardDef[] = [
  {
    id: 'flotsamBlade', name: 'Flotsam Blade', char: 'neutral', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiBoneKnife',
    ops: [{ op: 'damage', amount: { base: 7 } }],
    opsUp: [{ op: 'damage', amount: { base: 10 } }],
  },
  {
    id: 'driftwoodShield', name: 'Driftwood Shield', char: 'neutral', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiCrackedShield',
    ops: [{ op: 'block', amount: { base: 6 } }],
    opsUp: [{ op: 'block', amount: { base: 9 } }],
  },
  {
    id: 'messageInABottle', name: 'Message in a Bottle', char: 'neutral', type: 'skill', rarity: 'common',
    cost: 0, target: 'none', icon: 'GiBrandyBottle', exhaust: true,
    ops: [{ op: 'draw', amount: 2 }],
    opsUp: [{ op: 'draw', amount: 3 }],
    flavor: 'Someone, somewhere, is still writing.',
  },
  {
    id: 'pearlDive', name: 'Pearl Dive', char: 'neutral', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiPearlNecklace', exhaust: true,
    ops: [{ op: 'gold', amount: 12 }],
    opsUp: [{ op: 'gold', amount: 20 }],
  },
  {
    id: 'seaSalt', name: 'Sea Salt', char: 'neutral', type: 'skill', rarity: 'uncommon',
    cost: 0, target: 'none', icon: 'GiFirstAidKit', exhaust: true,
    ops: [{ op: 'cleanse', target: 'self' }],
    opsUp: [{ op: 'cleanse', target: 'self', all: true }],
  },
  {
    id: 'panicThrash', name: 'Panic Thrash', char: 'neutral', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiFishEscape',
    ops: [{ op: 'damage', amount: { base: 8 } }, { op: 'status', status: 'weakened', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 11 } }, { op: 'status', status: 'weakened', amount: { base: 1 }, target: 'self' }],
  },
];

export const CURSE_CARDS: CardDef[] = [
  {
    id: 'barnacle', name: 'Barnacle', char: 'neutral', type: 'curse', rarity: 'special',
    cost: 0, target: 'none', icon: 'GiCeilingBarnacle', unplayable: true,
    ops: [],
    flavor: 'It grows on you.',
  },
  {
    id: 'dreadOfTheDeep', name: 'Dread of the Deep', char: 'neutral', type: 'curse', rarity: 'special',
    cost: 0, target: 'none', icon: 'GiDreadSkull', unplayable: true,
    ops: [],
    endTurnInHand: [{ op: 'damage', amount: { base: 2 } }],
    flavor: 'Something below is counting your heartbeats.',
  },
  {
    id: 'waterlogged', name: 'Waterlogged', char: 'neutral', type: 'curse', rarity: 'special',
    cost: 1, target: 'none', icon: 'GiDrowning', exhaust: true,
    ops: [],
    text: 'Does nothing. Exhaust.',
    flavor: 'Heavy. Useless. Yours.',
  },
  {
    id: 'sirensDebt', name: "Siren's Debt", char: 'neutral', type: 'curse', rarity: 'special',
    cost: 2, target: 'none', icon: 'GiHarp', exhaust: true,
    ops: [],
    text: 'Does nothing. Exhaust.',
    flavor: 'She sang. You listened. Now pay.',
  },
];
