// The Voltaic — eel-blooded duelist. Unlocked by defeating the Act 1 boss.
// Archetypes: Charge/Discharge burst (bank voltage, spend it all at once)
// and storm engines (passive Conduct, Tesla Scales, Supercell).

import type { CardDef } from '../engine/types';

export const VOLTAIC_CARDS: CardDef[] = [
  // ── Starters ──────────────────────────────────────────────────────────────
  {
    id: 'joltStrike', name: 'Jolt Strike', char: 'voltaic', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiLightningSlashes',
    ops: [{ op: 'damage', amount: { base: 6 } }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 9 } }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'eelGuard', name: 'Eel Guard', char: 'voltaic', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiBoltShield',
    ops: [{ op: 'block', amount: { base: 5 } }],
    opsUp: [{ op: 'block', amount: { base: 8 } }],
  },
  {
    id: 'staticField', name: 'Static Field', char: 'voltaic', type: 'skill', rarity: 'starter',
    cost: 1, target: 'none', icon: 'GiCircleSparks',
    ops: [{ op: 'block', amount: { base: 4 } }, { op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 6 } }, { op: 'status', status: 'charge', amount: { base: 3 }, target: 'self' }],
  },
  {
    id: 'arcLash', name: 'Arc Lash', char: 'voltaic', type: 'attack', rarity: 'starter',
    cost: 1, target: 'enemy', icon: 'GiElectricWhip', discharge: true,
    ops: [{ op: 'damage', amount: { base: 4, perCharge: 2 } }],
    opsUp: [{ op: 'damage', amount: { base: 4, perCharge: 3 } }],
    flavor: 'Spend the storm.',
  },

  // ── Commons ───────────────────────────────────────────────────────────────
  {
    id: 'sparkFin', name: 'Spark Fin', char: 'voltaic', type: 'attack', rarity: 'common',
    cost: 0, target: 'enemy', icon: 'GiFlintSpark',
    ops: [{ op: 'damage', amount: { base: 3 } }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 5 } }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'voltageSpike', name: 'Voltage Spike', char: 'voltaic', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiThunderStruck',
    ops: [{ op: 'damage', amount: { base: 9 } }],
    opsUp: [{ op: 'damage', amount: { base: 12 } }],
  },
  {
    id: 'capacitor', name: 'Capacitor', char: 'voltaic', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiBatteryPack',
    ops: [{ op: 'status', status: 'charge', amount: { base: 3 }, target: 'self' }, { op: 'block', amount: { base: 3 } }],
    opsUp: [{ op: 'status', status: 'charge', amount: { base: 4 }, target: 'self' }, { op: 'block', amount: { base: 4 } }],
  },
  {
    id: 'chainNip', name: 'Chain Nip', char: 'voltaic', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiChainLightning',
    ops: [{ op: 'damage', amount: { base: 3 }, times: 2 }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 4 }, times: 2 }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'insulate', name: 'Insulate', char: 'voltaic', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiArmorVest',
    ops: [{ op: 'block', amount: { base: 8 } }],
    opsUp: [{ op: 'block', amount: { base: 11 } }],
  },
  {
    id: 'liveWire', name: 'Live Wire', char: 'voltaic', type: 'attack', rarity: 'common',
    cost: 1, target: 'enemy', icon: 'GiLightningArc',
    ops: [
      { op: 'damage', amount: { base: 5 } },
      { op: 'if', cond: { chargeAtLeast: 5 }, then: [{ op: 'damage', amount: { base: 5 } }] },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 7 } },
      { op: 'if', cond: { chargeAtLeast: 5 }, then: [{ op: 'damage', amount: { base: 7 } }] },
    ],
  },
  {
    id: 'currentSurge', name: 'Current Surge', char: 'voltaic', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiLightningBranches',
    ops: [{ op: 'draw', amount: 2 }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'draw', amount: 3 }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'groundOut', name: 'Ground Out', char: 'voltaic', type: 'skill', rarity: 'common',
    cost: 1, target: 'none', icon: 'GiLightningDissipation', discharge: true,
    ops: [{ op: 'block', amount: { base: 0, perCharge: 2 } }],
    opsUp: [{ op: 'block', amount: { base: 0, perCharge: 3 } }],
  },

  // ── Uncommons ─────────────────────────────────────────────────────────────
  {
    id: 'thunderbite', name: 'Thunderbite', char: 'voltaic', type: 'attack', rarity: 'uncommon',
    cost: 2, target: 'enemy', icon: 'GiThunderball',
    ops: [{ op: 'damage', amount: { base: 12 } }, { op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 16 } }, { op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
  },
  {
    id: 'forkLightning', name: 'Fork Lightning', char: 'voltaic', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiLightningTrio', discharge: true,
    ops: [{ op: 'damage', amount: { base: 3 }, times: 'charge', target: 'random' }],
    opsUp: [{ op: 'damage', amount: { base: 4 }, times: 'charge', target: 'random' }],
    flavor: 'The storm picks its own targets.',
  },
  {
    id: 'overclock', name: 'Overclock', char: 'voltaic', type: 'skill', rarity: 'uncommon',
    cost: 0, target: 'none', icon: 'GiClockwork',
    ops: [{ op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'status', status: 'charge', amount: { base: 3 }, target: 'self' }, { op: 'draw', amount: 1 }],
  },
  {
    id: 'stormShell', name: 'Storm Shell', char: 'voltaic', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiSpikedShell',
    ops: [{ op: 'block', amount: { base: 6 } }, { op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
    opsUp: [{ op: 'block', amount: { base: 9 } }, { op: 'status', status: 'charge', amount: { base: 2 }, target: 'self' }],
  },
  {
    id: 'amplify', name: 'Amplify', char: 'voltaic', type: 'skill', rarity: 'uncommon',
    cost: 1, costUp: 0, target: 'none', icon: 'GiBatteryPlus', exhaust: true,
    ops: [{ op: 'doubleStatus', status: 'charge', target: 'self' }],
  },
  {
    id: 'eelCoil', name: 'Eel Coil', char: 'voltaic', type: 'power', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiTentacurl',
    ops: [], powerHook: 'eelCoil1', powerHookUp: 'eelCoil2',
  },
  {
    id: 'teslaScales', name: 'Tesla Scales', char: 'voltaic', type: 'power', rarity: 'uncommon',
    cost: 2, target: 'none', icon: 'GiDorsalScales',
    ops: [], powerHook: 'teslaScales1', powerHookUp: 'teslaScales2',
    flavor: 'Every scale a storm cloud.',
  },
  {
    id: 'staticBurst', name: 'Static Burst', char: 'voltaic', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiBurstBlob',
    ops: [{ op: 'damage', amount: { base: 6 }, target: 'all' }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
    opsUp: [{ op: 'damage', amount: { base: 9 }, target: 'all' }, { op: 'status', status: 'charge', amount: { base: 1 }, target: 'self' }],
  },
  {
    id: 'battery', name: 'Battery', char: 'voltaic', type: 'skill', rarity: 'uncommon',
    cost: 1, target: 'none', icon: 'GiBatteries',
    ops: [
      { op: 'block', amount: { base: 6 } },
      { op: 'if', cond: { chargeAtLeast: 6 }, then: [{ op: 'energy', amount: 1 }] },
    ],
    opsUp: [
      { op: 'block', amount: { base: 8 } },
      { op: 'if', cond: { chargeAtLeast: 5 }, then: [{ op: 'energy', amount: 1 }] },
    ],
  },
  {
    id: 'voltmeterSlash', name: 'Voltmeter Slash', char: 'voltaic', type: 'attack', rarity: 'uncommon',
    cost: 1, target: 'enemy', icon: 'GiPowerLightning',
    ops: [{ op: 'damage', amount: { base: 4, perCharge: 2 } }],
    opsUp: [{ op: 'damage', amount: { base: 6, perCharge: 2 } }],
  },

  // ── Rares ─────────────────────────────────────────────────────────────────
  {
    id: 'gigavolt', name: 'Gigavolt', char: 'voltaic', type: 'attack', rarity: 'rare',
    cost: 3, target: 'enemy', icon: 'GiFocusedLightning', discharge: true,
    ops: [{ op: 'damage', amount: { base: 8, perCharge: 4 } }],
    opsUp: [{ op: 'damage', amount: { base: 8, perCharge: 5 } }],
    flavor: 'Name your thunder.',
  },
  {
    id: 'stormOfCentury', name: 'Storm of the Century', char: 'voltaic', type: 'attack', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiLightningStorm', discharge: true,
    ops: [
      { op: 'damage', amount: { base: 2 }, times: 'charge', target: 'all' },
      { op: 'status', status: 'weakened', amount: { base: 1 }, target: 'all' },
    ],
    opsUp: [
      { op: 'damage', amount: { base: 3 }, times: 'charge', target: 'all' },
      { op: 'status', status: 'weakened', amount: { base: 1 }, target: 'all' },
    ],
  },
  {
    id: 'dynamo', name: 'Dynamo', char: 'voltaic', type: 'power', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiGears',
    ops: [], powerHook: 'dynamo2', powerHookUp: 'dynamo3',
  },
  {
    id: 'lightningRod', name: 'Lightning Rod', char: 'voltaic', type: 'power', rarity: 'rare',
    cost: 2, target: 'none', icon: 'GiLightningTree',
    ops: [], powerHook: 'lightningRod3', powerHookUp: 'lightningRod4',
  },
  {
    id: 'supercell', name: 'Supercell', char: 'voltaic', type: 'power', rarity: 'rare',
    cost: 3, costUp: 2, target: 'none', icon: 'GiLightningHelix',
    ops: [], powerHook: 'supercell',
    flavor: 'Keep the storm. Let it keep you.',
  },
  {
    id: 'defibrillate', name: 'Defibrillate', char: 'voltaic', type: 'skill', rarity: 'rare',
    cost: 1, target: 'none', icon: 'GiHeartPlus', discharge: true, exhaust: true,
    ops: [{ op: 'heal', amount: { base: 0, perCharge: 1 } }],
    opsUp: [{ op: 'heal', amount: { base: 4, perCharge: 1 } }],
  },
];
