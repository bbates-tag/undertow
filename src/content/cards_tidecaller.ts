// The Tidecaller — priestess of the drowned moon.
// Archetypes: Toxin (stacking damage-over-time), Tide tempo (Flood/Ebb timing
// + Shift manipulation), and Bulwark (block, Spines, Hull Ram payoffs).

import type { CardDef } from '../engine/types';

export const TIDECALLER_CARDS: CardDef[] = [
  // ── Starters ──────────────────────────────────────────────────────────────
  {
    id: 'tideStrike', name: 'Tide Strike', char: 'tidecaller', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiWaveStrike',
    ops: [{ op: 'damage', amount: { base: 6 } }],
    opsUp: [{ op: 'damage', amount: { base: 9 } }],
    flavor: 'The sea hits back.',
  },
  {
    id: 'kelpGuard', name: 'Kelp Guard', char: 'tidecaller', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiAlgae',
    ops: [{ op: 'block', amount: { base: 5 } }],
    opsUp: [{ op: 'block', amount: { base: 8 } }],
  },
  {
    id: 'riptide', name: 'Riptide', char: 'tidecaller', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiBigWave',
    ops: [{ op: 'damage', amount: { base: 4 } }, { op: 'shift', amount: 1 }],
    opsUp: [{ op: 'damage', amount: { base: 7 } }, { op: 'shift', amount: 1 }],
    flavor: 'Pull them under.',
  },
  {
    id: 'undertow', name: 'Undertow', char: 'tidecaller', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiVortex',
    ops: [{ op: 'block', amount: { base: 4 } }, { op: 'shift', amount: 1 }],
    opsUp: [{ op: 'block', amount: { base: 7 } }, { op: 'shift', amount: 1 }],
  },

  // ── Common attacks ────────────────────────────────────────────────────────
  {
    id: 'harpoonShot', name: 'Harpoon Shot', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiHarpoonTrident',
    ops: [{ op: 'damage', amount: { base: 9 } }],
    opsUp: [{ op: 'damage', amount: { base: 12 } }],
  },
  {
    id: 'twinFins', name: 'Twin Fins', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiDoubleFish',
    ops: [{ op: 'damage', amount: { base: 3 }, times: 2 }],
    opsUp: [{ op: 'damage', amount: { base: 5 }, times: 2 }],
  },
  {
    id: 'venomSpit', name: 'Venom Spit', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiChemicalDrop',
    ops: [{ op: 'damage', amount: { base: 3 } }, { op: 'status', status: 'toxin', amount: { base: 3 }, target: 'target' }],
    opsUp: [{ op: 'damage', amount: { base: 4 } }, { op: 'status', status: 'toxin', amount: { base: 5 }, target: 'target' }],
  },
  {
    id: 'shellCrack', name: 'Shell Crack', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiOyster',
    ops: [{ op: 'damage', amount: { base: 6 } }, { op: 'status', status: 'exposed', amount: { base: 1 }, target: 'target' }],
    opsUp: [{ op: 'damage', amount: { base: 8 } }, { op: 'status', status: 'exposed', amount: { base: 2 }, target: 'target' }],
  },
  {
    id: 'tidalSlam', name: 'Tidal Slam', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiWaveCrest',
    ops: [{ op: 'damage', amount: { base: 7, flood: 5 } }],
    opsUp: [{ op: 'damage', amount: { base: 9, flood: 7 } }],
  },
  {
    id: 'ripCurrent', name: 'Rip Current', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiWaves',
    ops: [{ op: 'damage', amount: { base: 6 } }, { op: 'shift', amount: 1 }],
    opsUp: [{ op: 'damage', amount: { base: 9 } }, { op: 'shift', amount: 1 }],
  },
  {
    id: 'feedingFrenzy', name: 'Feeding Frenzy', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiPiranha',
    ops: [{ op: 'damage', amount: { base: 4, perCardPlayed: 2 } }],
    opsUp: [{ op: 'damage', amount: { base: 4, perCardPlayed: 3 } }],
  },
  {
    id: 'barbedVolley', name: 'Barbed Volley', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiSpineArrow',
    ops: [{ op: 'damage', amount: { base: 2 }, times: 3 }],
    opsUp: [{ op: 'damage', amount: { base: 3 }, times: 4 }],
  },
  {
    id: 'gnash', name: 'Gnash', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 0, target: 'enemy', icon: 'GiFangs',
    ops: [{ op: 'damage', amount: { base: 3 } }],
    opsUp: [{ op: 'damage', amount: { base: 5 } }],
  },
  {
    id: 'depthCharge', name: 'Depth Charge', char: 'tidecaller', type: 'attack', rarity: 'common',
    cost: 2, target: 'enemy', icon: 'GiUnlitBomb',
    ops: [{ op: 'damage', amount: { base: 13 } }],
    opsUp: [{ op: 'damage', amount: { base: 17 } }],
  },

  // ── Common skills ─────────────────────────────────────────────────────────
  {
    id: 'shellUp', name: 'Shell Up', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiArmouredShell',
    ops: [{ op: 'block', amount: { base: 8 } }],
    opsUp: [{ op: 'block', amount: { base: 11 } }],
  },
  {
    id: 'inkCloud', name: 'Ink Cloud', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiInkSwirl',
    ops: [{ op: 'block', amount: { base: 4 } }, { op: 'status', status: 'weakened', amount: { base: 1 }, target: 'target' }],
    opsUp: [{ op: 'block', amount: { base: 6 } }, { op: 'status', status: 'weakened', amount: { base: 2 }, target: 'target' }],
  },
  {
    id: 'currentReading', name: 'Current Reading', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiCompass',
    ops: [{ op: 'draw', amount: 2 }],
    opsUp: [{ op: 'draw', amount: 3 }],
  },
  {
    id: 'bioluminesce', name: 'Bioluminesce', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiSparkles',
    ops: [{ op: 'block', amount: { base: 5 } }, { op: 'draw', amount: 1 }],
    opsUp: [{ op: 'block', amount: { base: 7 } }, { op: 'draw', amount: 1 }],
  },
  {
    id: 'toxicSlick', name: 'Toxic Slick', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiAcidBlob',
    ops: [{ op: 'status', status: 'toxin', amount: { base: 5 }, target: 'target' }],
    opsUp: [{ op: 'status', status: 'toxin', amount: { base: 8 }, target: 'target' }],
  },
  {
    id: 'ebbguard', name: 'Ebbguard', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiShieldReflect',
    ops: [{ op: 'block', amount: { base: 7, ebb: 5 } }],
    opsUp: [{ op: 'block', amount: { base: 9, ebb: 7 } }],
  },
  {
    id: 'airPocket', name: 'Air Pocket', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 1, costUp: 0, target: 'none', icon: 'GiBubbles',
    ops: [{ op: 'energy', amount: 2 }],
    exhaust: true,
    flavor: 'One gulp of the old world.',
  },
  {
    id: 'tidepool', name: 'Tidepool', char: 'tidecaller', type: 'skill', rarity: 'common',
    cost: 0, target: 'none', icon: 'GiDroplets',
    ops: [{ op: 'shift', amount: 1 }, { op: 'draw', amount: 1 }],
    opsUp: [{ op: 'shift', amount: 1 }, { op: 'draw', amount: 2 }],
  },

  // ── Uncommon attacks ──────────────────────────────────────────────────────
  {
    id: 'lurkersAmbush', name: "Lurker's Ambush", char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiEel',
    ops: [{ op: 'damage', amount: { base: 12, flood: 8 } }],
    opsUp: [{ op: 'damage', amount: { base: 16, flood: 10 } }],
    flavor: 'Wait for the water to rise.',
  },
  {
    id: 'corrode', name: 'Corrode', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiAcid',
    ops: [
      { op: 'damage', amount: { base: 7 } },
      { op: 'if', cond: 'targetToxined', then: [{ op: 'status', status: 'toxin', amount: { base: 4 }, target: 'target' }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 9 } },
      { op: 'if', cond: 'targetToxined', then: [{ op: 'status', status: 'toxin', amount: { base: 6 }, target: 'target' }] },
    ],
  },
  {
    id: 'hullRam', name: 'Hull Ram', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 1, costUp: 0, target: 'enemy', icon: 'GiShipBow',
    ops: [{ op: 'damage', amount: { base: 0, perBlock: 1 } }],
    flavor: 'Lead with the wreck of yourself.',
  },
  {
    id: 'gaffHook', name: 'Gaff Hook', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiHook',
    ops: [
      { op: 'damage', amount: { base: 10 } },
      { op: 'if', cond: 'targetBelowHalf', then: [{ op: 'damage', amount: { base: 8 } }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 12 } },
      { op: 'if', cond: 'targetBelowHalf', then: [{ op: 'damage', amount: { base: 10 } }] },
    ],
  },
  {
    id: 'chumTheWater', name: 'Chum the Water', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiFishCorpse',
    ops: [
      { op: 'damage', amount: { base: 3 }, target: 'all' },
      { op: 'status', status: 'toxin', amount: { base: 3 }, target: 'all' },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 4 }, target: 'all' },
      { op: 'status', status: 'toxin', amount: { base: 4 }, target: 'all' },
    ],
  },
  {
    id: 'piercingSpine', name: 'Piercing Spine', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiBarbedSpear',
    ops: [{ op: 'damage', amount: { base: 7 }, pierce: true }],
    opsUp: [{ op: 'damage', amount: { base: 10 }, pierce: true }],
  },
  {
    id: 'whirlpool', name: 'Whirlpool', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'none', icon: 'GiWhirlpoolShuriken',
    ops: [{ op: 'damage', amount: { base: 7 }, target: 'all' }, { op: 'shift', amount: 1 }],
    opsUp: [{ op: 'damage', amount: { base: 10 }, target: 'all' }, { op: 'shift', amount: 1 }],
  },
  {
    id: 'frenziedBites', name: 'Frenzied Bites', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiBestialFangs',
    ops: [{ op: 'damage', amount: { base: 3, flood: 2 }, times: 3 }],
    opsUp: [{ op: 'damage', amount: { base: 4, flood: 2 }, times: 3 }],
  },
  {
    id: 'leechFangs', name: 'Leech Fangs', char: 'tidecaller', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiSnakeBite',
    ops: [{ op: 'damage', amount: { base: 7 } }, { op: 'heal', amount: { base: 3 } }],
    opsUp: [{ op: 'damage', amount: { base: 9 } }, { op: 'heal', amount: { base: 4 } }],
  },

  // ── Uncommon skills ───────────────────────────────────────────────────────
  {
    id: 'hardenedShell', name: 'Hardened Shell', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 2, target: 'none', icon: 'GiBeetleShell',
    ops: [{ op: 'block', amount: { base: 14 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 18 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'spineBurst', name: 'Spine Burst', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSpikes',
    ops: [{ op: 'status', status: 'spines', amount: { base: 3 }, target: 'self' }],
    opsUp: [{ op: 'status', status: 'spines', amount: { base: 5 }, target: 'self' }],
  },
  {
    id: 'tideChart', name: 'Tide Chart', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 1, costUp: 0, target: 'none', icon: 'GiChart',
    ops: [{ op: 'shift', amount: 2 }, { op: 'draw', amount: 2 }],
  },
  {
    id: 'patientHunter', name: 'Patient Hunter', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 2, costUp: 1, target: 'none', icon: 'GiFishingPole',
    ops: [{ op: 'draw', amount: 4 }],
  },
  {
    id: 'anglersLureCard', name: "Angler's Lure", char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiFishingLure',
    ops: [
      { op: 'status', status: 'weakened', amount: { base: 2 }, target: 'target' },
      { op: 'status', status: 'exposed', amount: { base: 1 }, target: 'target' },
    ],
    opsUp: [
      { op: 'status', status: 'weakened', amount: { base: 2 }, target: 'target' },
      { op: 'status', status: 'exposed', amount: { base: 2 }, target: 'target' },
    ],
  },
  {
    id: 'polypGraft', name: 'Polyp Graft', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiCoral', exhaust: true,
    ops: [{ op: 'heal', amount: { base: 5 } }],
    opsUp: [{ op: 'heal', amount: { base: 8 } }],
  },
  {
    id: 'mirrorScales', name: 'Mirror Scales', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 2, target: 'none', icon: 'GiFishScales',
    ops: [{ op: 'block', amount: { base: 9 } }, { op: 'status', status: 'spines', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 12 } }, { op: 'status', status: 'spines', amount: { base: 3 }, target: 'self' }],
  },
  {
    id: 'seaLegs', name: 'Sea Legs', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiWaveSurfer',
    ops: [{ op: 'status', status: 'finesse', amount: { base: 1 }, target: 'self' }, { op: 'draw', amount: 1 }],
    opsUp: [{ op: 'status', status: 'finesse', amount: { base: 2 }, target: 'self' }, { op: 'draw', amount: 1 }],
  },
  {
    id: 'inkJet', name: 'Ink Jet', char: 'tidecaller', type: 'skill', rarity: 'uncommon',
    cost: 0, target: 'none', icon: 'GiDustCloud',
    ops: [{ op: 'block', amount: { base: 3, ebb: 3 } }],
    opsUp: [{ op: 'block', amount: { base: 5, ebb: 3 } }],
  },

  // ── Powers ────────────────────────────────────────────────────────────────
  {
    id: 'miasma', name: 'Miasma', char: 'tidecaller', type: 'power', rarity: 'uncommon',
    cost: 2, target: 'none', icon: 'GiPoisonCloud',
    ops: [], powerHook: 'miasma1', powerHookUp: 'miasma2',
    flavor: 'The deep exhales.',
  },
  {
    id: 'coralCarapace', name: 'Coral Carapace', char: 'tidecaller', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiLayeredArmor',
    ops: [], powerHook: 'carapace3', powerHookUp: 'carapace5',
  },
  {
    id: 'lunarPull', name: 'Lunar Pull', char: 'tidecaller', type: 'power', rarity: 'uncommon',
    cost: 1, costUp: 0, target: 'none', icon: 'GiMoonOrbit',
    ops: [], powerHook: 'lunarPull',
    flavor: 'The moon leans closer to listen.',
  },
  {
    id: 'predatorsEye', name: "Predator's Eye", char: 'tidecaller', type: 'power', rarity: 'uncommon',
    cost: 2, costUp: 1, target: 'none', icon: 'GiBeastEye',
    ops: [], powerHook: 'predatorsEye1',
  },
  {
    id: 'bloodInWater', name: 'Blood in the Water', char: 'tidecaller', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSharkFin',
    ops: [], powerHook: 'bloodInWater1', powerHookUp: 'bloodInWater2',
  },

  // ── Rares ─────────────────────────────────────────────────────────────────
  {
    id: 'maelstrom', name: 'Maelstrom', char: 'tidecaller', type: 'attack', rarity: 'rare',
    cost: 3, target: 'none', icon: 'GiWhirlwind',
    ops: [{ op: 'damage', amount: { base: 18 }, target: 'all' }, { op: 'shift', amount: 2 }],
    opsUp: [{ op: 'damage', amount: { base: 24 }, target: 'all' }, { op: 'shift', amount: 2 }],
    flavor: 'The trench opens one eye.',
  },
  {
    id: 'abyssalFang', name: 'Abyssal Fang', char: 'tidecaller', type: 'attack', rarity: 'rare',
    cost: 2, target: 'enemy', icon: 'GiSharkBite',
    ops: [{ op: 'damage', amount: { base: 16, flood: 12 } }],
    opsUp: [{ op: 'damage', amount: { base: 20, flood: 14 } }],
  },
  {
    id: 'blightwave', name: 'Blightwave', char: 'tidecaller', type: 'skill', rarity: 'rare',
    cost: 2, costUp: 1, target: 'none', icon: 'GiPoison',
    ops: [{ op: 'doubleStatus', status: 'toxin', target: 'all' }],
    flavor: 'What festers, blooms.',
  },
  {
    id: 'kingTide', name: 'King Tide', char: 'tidecaller', type: 'power', rarity: 'rare',
    cost: 2, costUp: 1, target: 'none', icon: 'GiEclipse',
    ops: [], powerHook: 'kingTide',
    flavor: 'No more waiting on the moon.',
  },
  {
    id: 'leviathansBlood', name: "Leviathan's Blood", char: 'tidecaller', type: 'power', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiChaliceDrops',
    ops: [], powerHook: 'leviathan1', powerHookUp: 'leviathan2',
  },
  {
    id: 'nacreBastion', name: 'Nacre Bastion', char: 'tidecaller', type: 'skill', rarity: 'rare',
    cost: 3, target: 'none', icon: 'GiBellShield',
    ops: [{ op: 'block', amount: { base: 30 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 40 } }, { op: 'status', status: 'anchor', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'perpetualCurrent', name: 'Perpetual Current', char: 'tidecaller', type: 'power', rarity: 'rare',
    cost: 3, costUp: 2, target: 'none', icon: 'GiCycle',
    ops: [], powerHook: 'perpetual',
  },
  {
    id: 'depthlessHunger', name: 'Depthless Hunger', char: 'tidecaller', type: 'power', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiCarnivoreMouth',
    ops: [], powerHook: 'hunger2', powerHookUp: 'hunger3',
    flavor: 'Feed it and it remembers you.',
  },
];
