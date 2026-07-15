// The Wakeweaver — she reads the wakes. Unlocked by ending three battles
// untouched in a single dive. Archetypes: Read riders (intent-conditional
// payoffs), positional defense (small blocks that are huge when timed),
// and Foresight (she sees one move further ahead; a few cards treat the
// next tide phase as already live). Design doc: docs/WAKEWEAVER.md.

import type { CardDef } from '../engine/types';

export const WEAVER_CARDS: CardDef[] = [
  // ── Starters ──────────────────────────────────────────────────────────────
  {
    id: 'needleJab', name: 'Needle Jab', char: 'weaver', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiSewingNeedle',
    ops: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 8 } }], else: [{ op: 'damage', amount: { base: 5 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 11 } }], else: [{ op: 'damage', amount: { base: 7 } }] }],
  },
  {
    id: 'slipAside', name: 'Slip Aside', char: 'weaver', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiFishEscape',
    ops: [{ op: 'block', amount: { base: 4 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 3 } }] }],
    opsUp: [{ op: 'block', amount: { base: 5 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 4 } }] }],
  },
  {
    id: 'readTheWater', name: 'Read the Water', char: 'weaver', type: 'skill', rarity: 'starter',
    cost: 0, target: 'none', icon: 'GiBubbles',
    ops: [{ op: 'draw', amount: 1 }, { op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'draw', amount: 1 }] }],
    opsUp: [{ op: 'draw', amount: 1 }, { op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'draw', amount: 2 }] }],
    flavor: 'Every jaw writes its intentions in the water first.',
  },
  {
    id: 'undertowFeint', name: 'Undertow Feint', char: 'weaver', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiInkSwirl',
    ops: [{ op: 'if', cond: { intends: 'schemer', who: 'target' }, then: [{ op: 'damage', amount: { base: 10 } }], else: [{ op: 'damage', amount: { base: 4 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'schemer', who: 'target' }, then: [{ op: 'damage', amount: { base: 13 } }], else: [{ op: 'damage', amount: { base: 5 } }] }],
  },

  // ── Commons ───────────────────────────────────────────────────────────────
  {
    id: 'riposte', name: 'Riposte', char: 'weaver', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiCrossedSwords',
    ops: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 9 } }, { op: 'block', amount: { base: 2 } }], else: [{ op: 'damage', amount: { base: 5 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 12 } }, { op: 'block', amount: { base: 3 } }], else: [{ op: 'damage', amount: { base: 7 } }] }],
  },
  {
    id: 'sidestep', name: 'Sidestep', char: 'weaver', type: 'skill', rarity: 'common',
    cost: 0, target: 'none', icon: 'GiWaterSplash',
    ops: [{ op: 'block', amount: { base: 3 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 3 } }] }],
    opsUp: [{ op: 'block', amount: { base: 4 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 4 } }] }],
  },
  {
    id: 'sharksShadow', name: "Shark's Shadow", char: 'weaver', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiSharkFin',
    ops: [{ op: 'if', cond: { intends: ['schemer', 'guarded'], who: 'target' }, then: [{ op: 'damage', amount: { base: 10 } }], else: [{ op: 'damage', amount: { base: 6 } }] }],
    opsUp: [{ op: 'if', cond: { intends: ['schemer', 'guarded'], who: 'target' }, then: [{ op: 'damage', amount: { base: 13 } }], else: [{ op: 'damage', amount: { base: 8 } }] }],
    flavor: 'Swim beside the thing with teeth. Nothing else will bother you.',
  },
  {
    id: 'wakeReader', name: 'Wake Reader', char: 'weaver', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiWaveCrest',
    ops: [{ op: 'draw', amount: 1 }, { op: 'block', amount: { base: 3 } }],
    opsUp: [{ op: 'draw', amount: 1 }, { op: 'block', amount: { base: 5 } }],
  },
  {
    id: 'chartTheStrike', name: 'Chart the Strike', char: 'weaver', type: 'skill', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiCrosshair',
    ops: [{ op: 'status', status: 'exposed', amount: { base: 1 }, target: 'target' }, { op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'status', status: 'weakened', amount: { base: 1 }, target: 'target' }] }],
    opsUp: [{ op: 'status', status: 'exposed', amount: { base: 2 }, target: 'target' }, { op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'status', status: 'weakened', amount: { base: 1 }, target: 'target' }] }],
  },
  {
    id: 'escortInstinct', name: 'Escort Instinct', char: 'weaver', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiCirclingFish',
    ops: [{ op: 'block', amount: { base: 5 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 4 } }] }],
    opsUp: [{ op: 'block', amount: { base: 6 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'block', amount: { base: 6 } }] }],
  },
  {
    id: 'jawline', name: 'Jawline', char: 'weaver', type: 'attack', rarity: 'common',
    cost: 2, target: 'enemy', icon: 'GiSharkJaws',
    ops: [{ op: 'damage', amount: { base: 11 } }, { op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'status', status: 'weakened', amount: { base: 1 }, target: 'target' }] }],
    opsUp: [{ op: 'damage', amount: { base: 14 } }, { op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'status', status: 'weakened', amount: { base: 2 }, target: 'target' }] }],
  },
  {
    id: 'flickerfin', name: 'Flickerfin', char: 'weaver', type: 'attack', rarity: 'common',
    cost: 0, target: 'enemy', icon: 'GiDoubleFish',
    ops: [{ op: 'damage', amount: { base: 3 } }, { op: 'if', cond: { intends: ['schemer', 'guarded'], who: 'target' }, then: [{ op: 'draw', amount: 1 }] }],
    opsUp: [{ op: 'damage', amount: { base: 4 } }, { op: 'if', cond: { intends: ['schemer', 'guarded'], who: 'target' }, then: [{ op: 'draw', amount: 1 }] }],
  },
  {
    id: 'currentSense', name: 'Current Sense', char: 'weaver', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiFloatingCrystal',
    ops: [{ op: 'shift', amount: 1 }, { op: 'if', cond: 'floodSoon', then: [{ op: 'block', amount: { base: 6 } }] }],
    opsUp: [{ op: 'shift', amount: 1 }, { op: 'if', cond: 'floodSoon', then: [{ op: 'block', amount: { base: 8 } }] }],
  },

  // ── Uncommons ─────────────────────────────────────────────────────────────
  {
    id: 'interrupt', name: 'Interrupt', char: 'weaver', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiCandleSkull',
    ops: [{ op: 'if', cond: { intends: 'schemer', who: 'target' }, then: [{ op: 'damage', amount: { base: 13 } }], else: [{ op: 'damage', amount: { base: 6 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'schemer', who: 'target' }, then: [{ op: 'damage', amount: { base: 16 } }], else: [{ op: 'damage', amount: { base: 8 } }] }],
    flavor: 'The ritual has one hard requirement: finishing.',
  },
  {
    id: 'slipTheJaws', name: 'Slip the Jaws', char: 'weaver', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiFangsCircle',
    ops: [{ op: 'block', amount: { base: 7 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'draw', amount: 1 }] }],
    opsUp: [{ op: 'block', amount: { base: 10 } }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'draw', amount: 1 }] }],
  },
  {
    id: 'deadReckoning', name: 'Dead Reckoning', char: 'weaver', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiCompass',
    ops: [{ op: 'draw', amount: 2 }, { op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'energy', amount: 1 }] }],
    opsUp: [{ op: 'draw', amount: 3 }, { op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'energy', amount: 1 }] }],
  },
  {
    id: 'countercurrent', name: 'Countercurrent', char: 'weaver', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiWhirlwind',
    ops: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 6 }, times: 3 }], else: [{ op: 'damage', amount: { base: 4 }, times: 3 }] }],
    opsUp: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 7 }, times: 3 }], else: [{ op: 'damage', amount: { base: 5 }, times: 3 }] }],
  },
  {
    id: 'weatherEye', name: 'Weather Eye', char: 'weaver', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSpyglass',
    ops: [], powerHook: 'weatherEye3', powerHookUp: 'weatherEye4',
  },
  {
    id: 'baitTheLunge', name: 'Bait the Lunge', char: 'weaver', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiFishingLure',
    ops: [{ op: 'status', status: 'spines', amount: { base: 3 }, target: 'self' }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'status', status: 'spines', amount: { base: 2 }, target: 'self' }] }],
    opsUp: [{ op: 'status', status: 'spines', amount: { base: 4 }, target: 'self' }, { op: 'if', cond: { intends: 'attacker', who: 'anyOnYou' }, then: [{ op: 'status', status: 'spines', amount: { base: 3 }, target: 'self' }] }],
    flavor: 'Stand somewhere inviting.',
  },
  {
    id: 'futureSwell', name: 'Future Swell', char: 'weaver', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiBigWave',
    ops: [{ op: 'block', amount: { base: 8 } }, { op: 'if', cond: 'floodSoon', then: [{ op: 'draw', amount: 2 }] }],
    opsUp: [{ op: 'block', amount: { base: 10 } }, { op: 'if', cond: 'floodSoon', then: [{ op: 'draw', amount: 2 }] }],
  },
  {
    id: 'pinpoint', name: 'Pinpoint', char: 'weaver', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiBarbedSpear',
    ops: [{ op: 'if', cond: { intends: 'guarded', who: 'target' }, then: [{ op: 'damage', amount: { base: 8 }, pierce: true }], else: [{ op: 'damage', amount: { base: 8 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'guarded', who: 'target' }, then: [{ op: 'damage', amount: { base: 11 }, pierce: true }], else: [{ op: 'damage', amount: { base: 11 } }] }],
    flavor: 'Armor is a list of places she is not aiming.',
  },
  {
    id: 'weaversGrace', name: "Weaver's Grace", char: 'weaver', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiPearlNecklace',
    ops: [], powerHook: 'grace3', powerHookUp: 'grace4',
  },

  // ── Rares ─────────────────────────────────────────────────────────────────
  {
    id: 'calledShot', name: 'Called Shot', char: 'weaver', type: 'skill', rarity: 'rare',
    cost: 1, target: 'enemy', icon: 'GiFishingHook',
    ops: [{ op: 'status', status: 'marked', amount: { base: 1 }, target: 'target' }],
    opsUp: [{ op: 'status', status: 'marked', amount: { base: 2 }, target: 'target' }],
    flavor: 'That one. There. Now.',
  },
  {
    // charges, not a battle-long blanket — a permanent "all Reads true" deleted
    // the archetype's whole decision layer (see PR: Perfect Read rework)
    id: 'perfectRead', name: 'Perfect Read', char: 'weaver', type: 'power', rarity: 'rare',
    cost: 2, costUp: 1, target: 'none', icon: 'GiBeastEye',
    ops: [{ op: 'status', status: 'perfectRead', amount: { base: 3 }, target: 'self' }],
    flavor: 'She has already seen this fight. Three of the endings were wrong.',
  },
  {
    id: 'neverBitten', name: 'Never Bitten', char: 'weaver', type: 'attack', rarity: 'rare',
    cost: 3, costUp: 2, target: 'enemy', icon: 'GiFangs',
    ops: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 0, perTelegraph: 2 } }], else: [{ op: 'damage', amount: { base: 10 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'attacker', who: 'target' }, then: [{ op: 'damage', amount: { base: 0, perTelegraph: 2 } }], else: [{ op: 'damage', amount: { base: 12 } }] }],
    flavor: 'It cannot close. It knows it cannot close.',
  },
  {
    id: 'eyeOfTheStorm', name: 'Eye of the Storm', char: 'weaver', type: 'skill', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiMoonOrbit',
    ops: [{ op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'energy', amount: 2 }, { op: 'draw', amount: 3 }], else: [{ op: 'block', amount: { base: 12 } }] }],
    opsUp: [{ op: 'if', cond: { intends: 'attacker', who: 'none' }, then: [{ op: 'energy', amount: 2 }, { op: 'draw', amount: 3 }], else: [{ op: 'block', amount: { base: 16 } }] }],
  },
  {
    id: 'secondSight', name: 'Second Sight', char: 'weaver', type: 'skill', rarity: 'rare',
    cost: 1, target: 'none', icon: 'GiMirrorMirror',
    ops: [{ op: 'draw', amount: 3 }],
    opsUp: [{ op: 'draw', amount: 4 }],
    exhaust: true,
    flavor: 'One pair of eyes for now. One for what comes next.',
  },
  {
    id: 'apexEscort', name: 'Apex Escort', char: 'weaver', type: 'power', rarity: 'rare',
    cost: 3, target: 'none', icon: 'GiFishMonster',
    ops: [], powerHook: 'apexEscort4', powerHookUp: 'apexEscort5',
    flavor: 'She stitched herself a shark.',
  },
];
