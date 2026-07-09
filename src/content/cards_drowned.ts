// The Drowned — what the sea gave back. Unlocked by winning a full run.
// Archetypes: blood economy (pay HP, gain Descent, hit harder per Descent),
// pain engines (Weeping Hull, Echo of Pain), and Surface cash-outs.
// Ebb-leaning: the Drowned is strongest when the water is Low.

import type { CardDef } from '../engine/types';

export const DROWNED_CARDS: CardDef[] = [
  // ── Starters ──────────────────────────────────────────────────────────────
  {
    id: 'drownedGrip', name: "Dead Man's Grip", char: 'drowned', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiSkeletalHand',
    ops: [{ op: 'damage', amount: { base: 6 } }],
    opsUp: [{ op: 'damage', amount: { base: 9 } }],
  },
  {
    id: 'soddenGuard', name: 'Sodden Guard', char: 'drowned', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiRibcage',
    ops: [{ op: 'block', amount: { base: 5 } }],
    opsUp: [{ op: 'block', amount: { base: 8 } }],
  },
  {
    id: 'openVein', name: 'Open Vein', char: 'drowned', type: 'attack', rarity: 'starter',
    cost: 0, target: 'enemy', icon: 'GiOpenWound',
    ops: [{ op: 'loseHp', amount: 2 }, { op: 'damage', amount: { base: 7 } }],
    opsUp: [{ op: 'loseHp', amount: 2 }, { op: 'damage', amount: { base: 10 } }],
    flavor: 'The sea wants salt. Give it yours.',
  },
  {
    id: 'sunkenFury', name: 'Sunken Fury', char: 'drowned', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiDrowning',
    ops: [{ op: 'damage', amount: { base: 2, perDescent: 1 } }],
    opsUp: [{ op: 'damage', amount: { base: 4, perDescent: 1 } }],
  },

  // ── Commons ───────────────────────────────────────────────────────────────
  {
    id: 'deadThrash', name: 'Dead Thrash', char: 'drowned', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiFishbone',
    ops: [{ op: 'damage', amount: { base: 9 } }],
    opsUp: [{ op: 'damage', amount: { base: 12 } }],
  },
  {
    id: 'bleedOut', name: 'Bleed Out', char: 'drowned', type: 'skill', rarity: 'common',
    cost: 0, target: 'none', icon: 'GiBleedingWound',
    ops: [{ op: 'loseHp', amount: 2 }, { op: 'block', amount: { base: 6 } }],
    opsUp: [{ op: 'loseHp', amount: 2 }, { op: 'block', amount: { base: 9 } }],
  },
  {
    id: 'coldGrasp', name: 'Cold Grasp', char: 'drowned', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiHook',
    ops: [{ op: 'damage', amount: { base: 6, ebb: 4 } }],
    opsUp: [{ op: 'damage', amount: { base: 8, ebb: 5 } }],
  },
  {
    id: 'sinkingFeeling', name: 'Sinking Feeling', char: 'drowned', type: 'skill', rarity: 'common',
    cost: 0, target: 'none', icon: 'GiFalling',
    ops: [{ op: 'loseHp', amount: 2 }, { op: 'draw', amount: 2 }],
    opsUp: [{ op: 'loseHp', amount: 2 }, { op: 'draw', amount: 3 }],
    flavor: 'Down is just another direction to read the cards.',
  },
  {
    id: 'saltInTheWound', name: 'Salt in the Wound', char: 'drowned', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiSaltShaker',
    ops: [
      { op: 'damage', amount: { base: 4 } },
      { op: 'if', cond: { descentAtLeast: 5 }, then: [{ op: 'damage', amount: { base: 4 } }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 6 } },
      { op: 'if', cond: { descentAtLeast: 5 }, then: [{ op: 'damage', amount: { base: 6 } }] },
    ],
  },
  {
    id: 'graveWeight', name: 'Grave Weight', char: 'drowned', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiWeight',
    ops: [{ op: 'block', amount: { base: 7 } }],
    opsUp: [{ op: 'block', amount: { base: 10 } }],
  },
  {
    id: 'numbFlesh', name: 'Numb Flesh', char: 'drowned', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiInnerSelf',
    ops: [{ op: 'block', amount: { base: 4 } }, { op: 'status', status: 'descent', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 6 } }, { op: 'status', status: 'descent', amount: { base: 3 }, target: 'self' }],
  },
  {
    id: 'hollowLung', name: 'Hollow Lung', char: 'drowned', type: 'attack', rarity: 'common',
    cost: 2, target: 'enemy', icon: 'GiLungs',
    ops: [{ op: 'loseHp', amount: 2 }, { op: 'damage', amount: { base: 14 } }],
    opsUp: [{ op: 'loseHp', amount: 2 }, { op: 'damage', amount: { base: 18 } }],
  },
  {
    id: 'ebbtideFangs', name: 'Ebbtide Fangs', char: 'drowned', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiBoneGnawer',
    ops: [{ op: 'damage', amount: { base: 7 } }, { op: 'if', cond: 'ebb', then: [{ op: 'draw', amount: 1 }] }],
    opsUp: [{ op: 'damage', amount: { base: 10 } }, { op: 'if', cond: 'ebb', then: [{ op: 'draw', amount: 1 }] }],
  },

  // ── Uncommons ─────────────────────────────────────────────────────────────
  {
    id: 'weepingHull', name: 'Weeping Hull', char: 'drowned', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiShipWreck',
    ops: [], powerHook: 'weepingHull4', powerHookUp: 'weepingHull6',
    flavor: 'Every plank remembers the storm.',
  },
  {
    id: 'marrowBloom', name: 'Marrow Bloom', char: 'drowned', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSeaStar',
    ops: [], powerHook: 'marrowBloom2', powerHookUp: 'marrowBloom3',
  },
  {
    id: 'lastBreath', name: 'Last Breath', char: 'drowned', type: 'skill', rarity: 'uncommon',
    cost: 1, costUp: 0, target: 'none', icon: 'GiCandleSkull', exhaust: true,
    ops: [{ op: 'doubleStatus', status: 'descent', target: 'self' }],
    flavor: 'Hold it. Hold it.',
  },
  {
    id: 'anglerfishPact', name: 'Anglerfish Pact', char: 'drowned', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiOldLantern',
    ops: [{ op: 'loseHp', amount: 4 }, { op: 'damage', amount: { base: 22 } }],
    opsUp: [{ op: 'loseHp', amount: 4 }, { op: 'damage', amount: { base: 28 } }],
    flavor: 'The light is a fee, not a gift.',
  },
  {
    id: 'brinePulse', name: 'Brine Pulse', char: 'drowned', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiWaterSplash',
    ops: [{ op: 'damage', amount: { base: 0, perDescent: 1 }, target: 'all' }],
    opsUp: [{ op: 'damage', amount: { base: 3, perDescent: 1 }, target: 'all' }],
  },
  {
    id: 'wakeOfTheDead', name: 'Wake of the Dead', char: 'drowned', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiGraveyard',
    ops: [{ op: 'block', amount: { base: 3, perDescent: 1 } }],
    opsUp: [{ op: 'block', amount: { base: 6, perDescent: 1 } }],
  },
  {
    id: 'coffinNail', name: 'Coffin Nail', char: 'drowned', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiCoffin',
    ops: [
      { op: 'damage', amount: { base: 6 } },
      { op: 'if', cond: { descentAtLeast: 6 }, then: [{ op: 'status', status: 'exposed', amount: { base: 2 }, target: 'target' }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 8 } },
      { op: 'if', cond: { descentAtLeast: 6 }, then: [{ op: 'status', status: 'exposed', amount: { base: 2 }, target: 'target' }] },
    ],
  },
  {
    id: 'stillHeart', name: 'Still Heart', char: 'drowned', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiHeartOrgan',
    ops: [{ op: 'status', status: 'regen', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'status', status: 'regen', amount: { base: 3 }, target: 'self' }],
    flavor: 'It beats when it remembers to.',
  },
  {
    id: 'tidewornShroud', name: 'Tideworn Shroud', char: 'drowned', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSpectre',
    ops: [{ op: 'block', amount: { base: 5 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 7 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
  },

  // ── Rares ─────────────────────────────────────────────────────────────────
  {
    id: 'breakSurface', name: 'Break the Surface', char: 'drowned', type: 'skill', rarity: 'rare',
    cost: 1, target: 'none', icon: 'GiWaveCrest', exhaust: true, surface: true,
    ops: [{ op: 'heal', amount: { base: 0, perDescent: 1 } }],
    opsUp: [{ op: 'heal', amount: { base: 4, perDescent: 1 } }],
    flavor: 'One gulp of sky, then back under.',
  },
  {
    id: 'abyssalCommunion', name: 'Abyssal Communion', char: 'drowned', type: 'power', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiKrakenTentacle',
    ops: [], powerHook: 'communion2', powerHookUp: 'communion3',
    flavor: 'It asked for so little. Every turn.',
  },
  {
    id: 'crushingFathoms', name: 'Crushing Fathoms', char: 'drowned', type: 'attack', rarity: 'rare',
    cost: 3, costUp: 2, target: 'enemy', icon: 'GiHeavyFall',
    ops: [{ op: 'damage', amount: { base: 2, perDescent: 2 }, pierce: true }],
    flavor: 'Six miles of water arrives all at once.',
  },
  {
    id: 'secondDrowning', name: 'Second Drowning', char: 'drowned', type: 'skill', rarity: 'rare',
    cost: 0, target: 'none', icon: 'GiSinkingShip', exhaust: true,
    ops: [{ op: 'loseHp', amount: 6 }, { op: 'energy', amount: 2 }, { op: 'draw', amount: 3 }],
    opsUp: [{ op: 'loseHp', amount: 4 }, { op: 'energy', amount: 2 }, { op: 'draw', amount: 3 }],
    flavor: 'The first one taught it everything.',
  },
  {
    id: 'graveTide', name: 'Grave Tide', char: 'drowned', type: 'attack', rarity: 'rare',
    cost: 2, target: 'enemy', icon: 'GiHighTide',
    ops: [
      { op: 'damage', amount: { base: 4 }, times: 3 },
      { op: 'if', cond: 'ebb', then: [{ op: 'damage', amount: { base: 4 }, times: 2 }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 5 }, times: 3 },
      { op: 'if', cond: 'ebb', then: [{ op: 'damage', amount: { base: 5 }, times: 2 }] },
    ],
  },
  {
    id: 'echoOfPain', name: 'Echo of Pain', char: 'drowned', type: 'power', rarity: 'rare',
    cost: 2, costUp: 1, target: 'none', icon: 'GiBrokenHeart',
    ops: [], powerHook: 'echoPain',
    flavor: 'Hurt is a wave. Waves travel.',
  },
];
