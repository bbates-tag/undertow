// Enemies, move sets, AI patterns, and encounter pools for all three acts.
// AI functions are pure: (ctx) -> moveId, with ctx.roll as the only randomness,
// so battles replay identically from a saved state.

import type { EnemyAiCtx, EnemyDef } from '../engine/types';

const last = (h: string[]) => h[h.length - 1];
const twiceInARow = (h: string[], id: string) => h.length >= 2 && h[h.length - 1] === id && h[h.length - 2] === id;

export const ENEMIES: Record<string, EnemyDef> = {
  // ═══ ACT 1 — THE SUNLIT SHALLOWS ═══════════════════════════════════════════
  snapperCrab: {
    id: 'snapperCrab', name: 'Snapper Crab', icon: 'GiCrab', hp: [26, 30], tier: 'normal', act: 1, size: 'md',
    moves: {
      pinch: { id: 'pinch', name: 'Pinch', intent: 'attack', attack: { amount: 7 } },
      shellWall: { id: 'shellWall', name: 'Shell Wall', intent: 'block', block: 7 },
      crush: { id: 'crush', name: 'Crush', intent: 'attack', attack: { amount: 11 } },
    },
    ai: (c: EnemyAiCtx) => {
      if (last(c.history) === 'shellWall') return c.roll < 0.6 ? 'crush' : 'pinch';
      if (twiceInARow(c.history, 'pinch')) return 'shellWall';
      return c.roll < 0.55 ? 'pinch' : 'shellWall';
    },
  },
  jellyDrifter: {
    id: 'jellyDrifter', name: 'Jelly Drifter', icon: 'GiJellyfish', hp: [18, 22], tier: 'normal', act: 1, size: 'sm',
    moves: {
      sting: { id: 'sting', name: 'Sting', intent: 'attackDebuff', attack: { amount: 4 }, toPlayer: [['toxin', 2]] },
      pulse: { id: 'pulse', name: 'Pulse', intent: 'attack', attack: { amount: 6 } },
    },
    ai: (c) => (twiceInARow(c.history, 'sting') ? 'pulse' : c.roll < 0.65 ? 'sting' : 'pulse'),
  },
  barbUrchin: {
    id: 'barbUrchin', name: 'Barb Urchin', icon: 'GiSpikedShell', hp: [13, 16], tier: 'normal', act: 1, size: 'sm',
    startStatuses: { spines: 3 },
    moves: {
      bristle: { id: 'bristle', name: 'Bristle', intent: 'buff', block: 4, toSelf: [['spines', 2]] },
      jab: { id: 'jab', name: 'Jab', intent: 'attack', attack: { amount: 5 } },
    },
    ai: (c) => (last(c.history) === 'bristle' ? 'jab' : c.roll < 0.5 ? 'bristle' : 'jab'),
  },
  sardine: {
    id: 'sardine', name: 'Sardine', icon: 'GiCirclingFish', hp: [8, 10], tier: 'normal', act: 1, size: 'sm',
    moves: {
      dart: { id: 'dart', name: 'Dart', intent: 'attack', attack: { amount: 3 } },
      school: { id: 'school', name: 'Schooling', intent: 'buff', toAllies: [['might', 1]] },
    },
    ai: (c) => (c.roll < 0.8 || c.allyCount <= 1 ? 'dart' : 'school'),
  },
  morayLurker: {
    id: 'morayLurker', name: 'Moray Lurker', icon: 'GiEel', hp: [32, 36], tier: 'normal', act: 1, size: 'lg',
    moves: {
      lurk: { id: 'lurk', name: 'Coil', intent: 'block', block: 8 },
      bite: { id: 'bite', name: 'Lunging Bite', intent: 'attack', attack: { amount: 13 } },
    },
    ai: (c) => (last(c.history) === 'lurk' ? 'bite' : 'lurk'),
  },
  tideSprite: {
    id: 'tideSprite', name: 'Tide Sprite', icon: 'GiWaterSplash', hp: [20, 24], tier: 'normal', act: 1, size: 'sm',
    tideTouched: 1,
    moves: {
      splash: { id: 'splash', name: 'Splash', intent: 'attack', attack: { amount: 5 } },
      surge: { id: 'surge', name: 'Surge', intent: 'attack', attack: { amount: 9 } },
      swell: { id: 'swell', name: 'Swell', intent: 'buff', block: 3, shift: 1 },
    },
    ai: (c) => (c.tide === 2 ? 'surge' : c.roll < 0.3 && last(c.history) !== 'swell' ? 'swell' : 'splash'),
  },
  anglerfish: {
    id: 'anglerfish', name: 'Anglerfish', icon: 'GiAnglerFish', hp: [46, 52], tier: 'elite', act: 1, size: 'lg',
    moves: {
      lure: { id: 'lure', name: 'Hypnotic Lure', intent: 'debuff', toPlayer: [['weakened', 2]] },
      chomp: { id: 'chomp', name: 'Chomp', intent: 'attack', attack: { amount: 12 } },
      gulp: { id: 'gulp', name: 'Gulp Whole', intent: 'attack', attack: { amount: 17 } },
    },
    ai: (c) => {
      if (c.history.length === 0) return 'lure';
      if (last(c.history) === 'lure') return 'chomp';
      if (last(c.history) === 'chomp' && c.roll < 0.6) return 'gulp';
      return c.roll < 0.35 ? 'lure' : 'chomp';
    },
  },
  riptideElemental: {
    id: 'riptideElemental', name: 'Riptide Elemental', icon: 'GiBigWave', hp: [44, 50], tier: 'elite', act: 1, size: 'lg',
    tideTouched: 2,
    moves: {
      crash: { id: 'crash', name: 'Crash', intent: 'attack', attack: { amount: 9 } },
      drag: { id: 'drag', name: 'Dragging Current', intent: 'attackDebuff', attack: { amount: 6 }, shift: 1 },
      highSurge: { id: 'highSurge', name: 'High Surge', intent: 'attack', attack: { amount: 14 } },
    },
    ai: (c) => (c.tide === 2 ? 'highSurge' : c.roll < 0.45 ? 'drag' : 'crash'),
  },
  sunkenKing: {
    id: 'sunkenKing', name: 'The Sunken King', title: 'Boss of the Shallows', icon: 'GiCrownedSkull',
    hp: [100, 108], tier: 'boss', act: 1, size: 'xl',
    moves: {
      decree: { id: 'decree', name: 'Drowned Decree', intent: 'buff', toSelf: [['might', 1]], block: 4 },
      clawSweep: { id: 'clawSweep', name: 'Claw Sweep', intent: 'attack', attack: { amount: 5, times: 2 } },
      royalGuard: { id: 'royalGuard', name: 'Royal Guard', intent: 'block', block: 12, toSelf: [['spines', 1]] },
      crush: { id: 'crush', name: 'Sceptre Crush', intent: 'attack', attack: { amount: 15 } },
    },
    ai: (c) => {
      if (c.history.length === 0) return 'decree';
      const cycle = ['clawSweep', 'royalGuard', 'crush'];
      const step = c.history.filter((m) => m !== 'decree').length % 3;
      // re-buffs roughly every 4th action, more aggressive when bloodied
      if (c.history.length % 4 === 3 && last(c.history) !== 'decree') return 'decree';
      if (c.hpFrac < 0.5 && c.roll < 0.3) return 'crush';
      return cycle[step];
    },
  },

  // ═══ ACT 2 — THE TWILIGHT TRENCH ═══════════════════════════════════════════
  ghostEel: {
    id: 'ghostEel', name: 'Ghost Eel', icon: 'GiFloatingGhost', hp: [30, 34], tier: 'normal', act: 2, size: 'md',
    moves: {
      slipAway: { id: 'slipAway', name: 'Slip Away', intent: 'block', block: 9 },
      phaseBite: { id: 'phaseBite', name: 'Phase Bite', intent: 'attack', attack: { amount: 10 } },
    },
    ai: (c) => (last(c.history) === 'slipAway' ? 'phaseBite' : c.roll < 0.55 ? 'slipAway' : 'phaseBite'),
  },
  vampireSquid: {
    id: 'vampireSquid', name: 'Vampire Squid', icon: 'GiGiantSquid', hp: [36, 42], tier: 'normal', act: 2, size: 'md',
    moves: {
      drain: { id: 'drain', name: 'Drain', intent: 'attack', attack: { amount: 7 }, heal: 5 },
      inkVeil: { id: 'inkVeil', name: 'Ink Veil', intent: 'block', block: 9 },
      redFeast: { id: 'redFeast', name: 'Red Feast', intent: 'attack', attack: { amount: 11 }, heal: 3 },
    },
    ai: (c) => {
      if (c.hpFrac < 0.5 && c.roll < 0.5) return 'drain';
      if (twiceInARow(c.history, 'drain')) return c.roll < 0.5 ? 'inkVeil' : 'redFeast';
      return c.roll < 0.45 ? 'drain' : c.roll < 0.75 ? 'redFeast' : 'inkVeil';
    },
  },
  hatchetfish: {
    id: 'hatchetfish', name: 'Hatchetfish', icon: 'GiFlatfish', hp: [22, 26], tier: 'normal', act: 2, size: 'sm',
    moves: {
      gleam: { id: 'gleam', name: 'Baleful Gleam', intent: 'buff', toAllies: [['might', 1]] },
      snap: { id: 'snap', name: 'Snap', intent: 'attack', attack: { amount: 8 } },
    },
    ai: (c) => (c.allyCount > 1 && c.roll < 0.4 && last(c.history) !== 'gleam' ? 'gleam' : 'snap'),
  },
  deepMine: {
    id: 'deepMine', name: 'Drifting Mine', icon: 'GiMineExplosion', hp: [24, 28], tier: 'normal', act: 2, size: 'md',
    moves: {
      fuse3: { id: 'fuse3', name: 'Fuse: 3', intent: 'sleep' },
      fuse2: { id: 'fuse2', name: 'Fuse: 2', intent: 'sleep', block: 6 },
      fuse1: { id: 'fuse1', name: 'Fuse: 1', intent: 'sleep', block: 6 },
      detonate: { id: 'detonate', name: 'DETONATE', intent: 'attack', attack: { amount: 30 }, selfDestruct: true },
    },
    ai: (c) => {
      if (c.history.includes('fuse1')) return 'detonate';
      if (c.history.includes('fuse2')) return 'fuse1';
      if (c.history.includes('fuse3')) return 'fuse2';
      return 'fuse3';
    },
  },
  pressureWraith: {
    id: 'pressureWraith', name: 'Pressure Wraith', icon: 'GiGhost', hp: [38, 44], tier: 'normal', act: 2, size: 'md',
    moves: {
      crushGrip: { id: 'crushGrip', name: 'Crushing Grip', intent: 'attackDebuff', attack: { amount: 8 }, toPlayer: [['brittle', 1]] },
      harrow: { id: 'harrow', name: 'Harrow', intent: 'attack', attack: { amount: 11 } },
      deepen: { id: 'deepen', name: 'Deepen', intent: 'buff', toSelf: [['might', 2]] },
    },
    ai: (c) => {
      if (c.history.length % 3 === 2) return 'deepen';
      return c.roll < 0.5 ? 'crushGrip' : 'harrow';
    },
  },
  kelpHorror: {
    id: 'kelpHorror', name: 'Kelp Horror', icon: 'GiSwamp', hp: [44, 50], tier: 'normal', act: 2, size: 'lg',
    moves: {
      grapple: { id: 'grapple', name: 'Grapple', intent: 'attackDebuff', attack: { amount: 5 }, toPlayer: [['weakened', 1], ['brittle', 1]] },
      squeeze: { id: 'squeeze', name: 'Squeeze', intent: 'attack', attack: { amount: 13 } },
      regrow: { id: 'regrow', name: 'Regrow', intent: 'block', block: 8, heal: 5 },
    },
    ai: (c) => {
      if (last(c.history) === 'grapple') return 'squeeze';
      if (c.hpFrac < 0.4 && c.roll < 0.4) return 'regrow';
      return c.roll < 0.5 ? 'grapple' : 'squeeze';
    },
  },
  krakenCultist: {
    id: 'krakenCultist', name: 'Kraken Cultist', icon: 'GiTentaclesSkull', hp: [72, 80], tier: 'elite', act: 2, size: 'lg',
    moves: {
      beckon: { id: 'beckon', name: 'Beckon the Deep', intent: 'summon', summon: ['tentacleSpawn'] },
      hymn: { id: 'hymn', name: 'Drowned Hymn', intent: 'buff', toAllies: [['might', 2]] },
      scourge: { id: 'scourge', name: 'Scourge', intent: 'attack', attack: { amount: 11 } },
    },
    ai: (c) => {
      if (c.allyCount < 2 && last(c.history) !== 'beckon') return 'beckon';
      if (c.roll < 0.35 && last(c.history) !== 'hymn') return 'hymn';
      return 'scourge';
    },
  },
  tentacleSpawn: {
    id: 'tentacleSpawn', name: 'Tentacle', icon: 'GiCurledTentacle', hp: [16, 20], tier: 'minion', act: 0, size: 'sm',
    moves: {
      lash: { id: 'lash', name: 'Lash', intent: 'attack', attack: { amount: 6 } },
    },
    ai: () => 'lash',
  },
  abyssalWarden: {
    id: 'abyssalWarden', name: 'Abyssal Warden', icon: 'GiVikingHelmet', hp: [82, 90], tier: 'elite', act: 2, size: 'lg',
    startStatuses: { spines: 4 },
    moves: {
      bulwark: { id: 'bulwark', name: 'Bulwark', intent: 'block', block: 16 },
      slam: { id: 'slam', name: 'Gate Slam', intent: 'attack', attack: { amount: 14 } },
      hone: { id: 'hone', name: 'Hone Spines', intent: 'buff', toSelf: [['spines', 3]], block: 6 },
    },
    ai: (c) => {
      const cycle = ['bulwark', 'slam', 'hone', 'slam'];
      return cycle[c.history.length % 4];
    },
  },
  krakenHead: {
    id: 'krakenHead', name: 'The Kraken', title: 'Terror of the Trench', icon: 'GiGiantSquid',
    hp: [148, 158], tier: 'boss', act: 2, size: 'xl',
    moves: {
      inkSpray: { id: 'inkSpray', name: 'Ink Spray', intent: 'debuff', toPlayer: [['weakened', 2], ['brittle', 2]] },
      crushJaws: { id: 'crushJaws', name: 'Crushing Jaws', intent: 'attack', attack: { amount: 15 } },
      thrash: { id: 'thrash', name: 'Thrash', intent: 'attack', attack: { amount: 6, times: 3 } },
      regrow: { id: 'regrow', name: 'Regrow Arms', intent: 'summon', summon: ['krakenArm', 'krakenArm'], block: 10 },
    },
    ai: (c) => {
      if (c.allyCount > 1) {
        // arms alive: control pattern
        if (last(c.history) === 'inkSpray') return 'crushJaws';
        return c.roll < 0.45 ? 'inkSpray' : 'crushJaws';
      }
      // alone: furious — occasionally regrows
      if (last(c.history) !== 'regrow' && c.roll < 0.3) return 'regrow';
      return c.roll < 0.6 ? 'thrash' : 'crushJaws';
    },
  },
  krakenArm: {
    id: 'krakenArm', name: 'Kraken Arm', icon: 'GiSuckeredTentacle', hp: [26, 30], tier: 'minion', act: 0, size: 'md',
    moves: {
      slap: { id: 'slap', name: 'Slap', intent: 'attack', attack: { amount: 7 } },
      constrict: { id: 'constrict', name: 'Constrict', intent: 'attackDebuff', attack: { amount: 4 }, toPlayer: [['weakened', 1]] },
    },
    ai: (c) => (c.roll < 0.6 ? 'slap' : 'constrict'),
  },

  // ═══ ACT 3 — THE HADAL DEEP ════════════════════════════════════════════════
  voidAngler: {
    id: 'voidAngler', name: 'Void Angler', icon: 'GiAnglerFish', hp: [48, 54], tier: 'normal', act: 3, size: 'lg',
    moves: {
      mark: { id: 'mark', name: 'Mark Prey', intent: 'debuff', toPlayer: [['exposed', 2]] },
      devour: { id: 'devour', name: 'Devour', intent: 'attack', attack: { amount: 16 } },
      glare: { id: 'glare', name: 'Abyssal Glare', intent: 'debuff', toPlayer: [['weakened', 2]] },
    },
    ai: (c) => {
      if (last(c.history) === 'mark' || last(c.history) === 'glare') return 'devour';
      return c.roll < 0.5 ? 'mark' : c.roll < 0.75 ? 'glare' : 'devour';
    },
  },
  boneShoal: {
    id: 'boneShoal', name: 'Bone Shoal', icon: 'GiFishbone', hp: [26, 30], tier: 'normal', act: 3, size: 'md',
    reanimates: true,
    moves: {
      gnaw: { id: 'gnaw', name: 'Gnawing Swarm', intent: 'attack', attack: { amount: 4, times: 2 } },
      rattle: { id: 'rattle', name: 'Rattle', intent: 'buff', block: 6, toSelf: [['might', 1]] },
    },
    ai: (c) => (c.roll < 0.7 ? 'gnaw' : 'rattle'),
  },
  hadalHorror: {
    id: 'hadalHorror', name: 'Hadal Horror', icon: 'GiFishMonster', hp: [56, 62], tier: 'normal', act: 3, size: 'lg',
    moves: {
      grow: { id: 'grow', name: 'Pressure Bloom', intent: 'buff', toSelf: [['might', 2]] },
      rend: { id: 'rend', name: 'Rend', intent: 'attack', attack: { amount: 9 } },
    },
    ai: (c) => (c.history.length % 2 === 0 ? 'grow' : 'rend'),
  },
  abyssIdol: {
    id: 'abyssIdol', name: 'Abyss Idol', icon: 'GiSunkenEye', hp: [50, 56], tier: 'normal', act: 3, size: 'md',
    moves: {
      hum: { id: 'hum', name: 'Maddening Hum', intent: 'debuff', addCardToPlayer: { card: 'dreadOfTheDeep', pile: 'discardPile', count: 1 } },
      gaze: { id: 'gaze', name: 'Hollow Gaze', intent: 'debuff', toPlayer: [['brittle', 2], ['weakened', 1]] },
      pulse: { id: 'pulse', name: 'Dark Pulse', intent: 'attack', attack: { amount: 8 } },
    },
    ai: (c) => {
      const cycle = ['hum', 'gaze', 'pulse'];
      return cycle[c.history.length % 3];
    },
  },
  trenchStalker: {
    id: 'trenchStalker', name: 'Trench Stalker', icon: 'GiSharkJaws', hp: [40, 46], tier: 'normal', act: 3, size: 'md',
    moves: {
      stalk: { id: 'stalk', name: 'Circle Below', intent: 'block', block: 11 },
      ambush: { id: 'ambush', name: 'Ambush', intent: 'attack', attack: { amount: 18 } },
    },
    ai: (c) => (last(c.history) === 'stalk' ? 'ambush' : 'stalk'),
  },
  trenchColossus: {
    id: 'trenchColossus', name: 'Trench Colossus', icon: 'GiStoneTablet', hp: [112, 124], tier: 'elite', act: 3, size: 'xl',
    moves: {
      quake: { id: 'quake', name: 'Quake', intent: 'attack', attack: { amount: 14 } },
      wall: { id: 'wall', name: 'Living Wall', intent: 'block', block: 20 },
      avalanche: { id: 'avalanche', name: 'Avalanche', intent: 'attack', attack: { amount: 22 } },
    },
    ai: (c) => {
      if (last(c.history) === 'wall') return 'avalanche';
      return c.roll < 0.55 ? 'quake' : 'wall';
    },
  },
  heraldOfDeep: {
    id: 'heraldOfDeep', name: 'Herald of the Deep', icon: 'GiBrainTentacle', hp: [96, 106], tier: 'elite', act: 3, size: 'lg',
    moves: {
      benediction: { id: 'benediction', name: 'Black Benediction', intent: 'buff', toAllies: [['might', 3]] },
      call: { id: 'call', name: 'Call the Drowned', intent: 'summon', summon: ['boneShoalMinion'] },
      smite: { id: 'smite', name: 'Smite', intent: 'attackDebuff', attack: { amount: 12 }, toPlayer: [['toxin', 3]] },
    },
    ai: (c) => {
      if (c.allyCount < 2 && c.roll < 0.5 && last(c.history) !== 'call') return 'call';
      if (last(c.history) !== 'benediction' && c.roll < 0.35) return 'benediction';
      return 'smite';
    },
  },
  boneShoalMinion: {
    id: 'boneShoalMinion', name: 'Bone Shoal', icon: 'GiFishbone', hp: [18, 22], tier: 'minion', act: 0, size: 'sm',
    moves: {
      gnaw: { id: 'gnaw', name: 'Gnawing Swarm', intent: 'attack', attack: { amount: 3, times: 2 } },
    },
    ai: () => 'gnaw',
  },
  drownedGod: {
    id: 'drownedGod', name: 'The Drowned God', title: 'It Dreams at the Bottom of Everything', icon: 'GiSeaDragon',
    hp: [235, 250], tier: 'boss', act: 3, size: 'xl',
    moves: {
      lap: { id: 'lap', name: 'Lapping Dark', intent: 'attack', attack: { amount: 10 } },
      murmur: { id: 'murmur', name: 'Sleeper\'s Murmur', intent: 'attackDebuff', attack: { amount: 6 }, toPlayer: [['toxin', 4]] },
      swell: { id: 'swell', name: 'The Sea Rises', intent: 'block', block: 12, shift: 1 },
      tsunami: { id: 'tsunami', name: 'TSUNAMI', intent: 'attack', attack: { amount: 22 } },
      awaken: { id: 'awaken', name: 'IT WAKES', intent: 'buff', toSelf: [['might', 3]], block: 20 },
      doubleSlam: { id: 'doubleSlam', name: 'Double Slam', intent: 'attack', attack: { amount: 11, times: 2 } },
      abyssCall: { id: 'abyssCall', name: 'Abyssal Call', intent: 'debuff', addCardToPlayer: { card: 'dreadOfTheDeep', pile: 'discardPile', count: 2 } },
    },
    ai: (c) => {
      const awake = c.history.includes('awaken');
      if (!awake && c.hpFrac <= 0.5) return 'awaken';
      if (c.tide === 2) return 'tsunami'; // it surges with the High tide — plan around it
      if (!awake) {
        if (last(c.history) === 'swell') return 'lap';
        return c.roll < 0.4 ? 'murmur' : c.roll < 0.7 ? 'lap' : 'swell';
      }
      if (last(c.history) === 'abyssCall') return 'doubleSlam';
      return c.roll < 0.25 ? 'abyssCall' : c.roll < 0.7 ? 'doubleSlam' : 'murmur';
    },
  },
};

// ── Encounter pools ──────────────────────────────────────────────────────────

export interface EncounterDef {
  id: string;
  enemies: string[];
  pool: 'easy' | 'hard' | 'elite' | 'boss';
  act: 1 | 2 | 3;
}

export const ENCOUNTERS: Record<string, EncounterDef> = Object.fromEntries(
  (
    [
      // Act 1
      { id: 'a1_crab', enemies: ['snapperCrab'], pool: 'easy', act: 1 },
      { id: 'a1_jelly_urchin', enemies: ['jellyDrifter', 'barbUrchin'], pool: 'easy', act: 1 },
      { id: 'a1_sardines', enemies: ['sardine', 'sardine', 'sardine'], pool: 'easy', act: 1 },
      { id: 'a1_urchins', enemies: ['barbUrchin', 'jellyDrifter'], pool: 'easy', act: 1 },
      { id: 'a1_moray', enemies: ['morayLurker'], pool: 'hard', act: 1 },
      { id: 'a1_sprite_jelly', enemies: ['tideSprite', 'jellyDrifter'], pool: 'hard', act: 1 },
      { id: 'a1_crab_sardines', enemies: ['snapperCrab', 'sardine', 'sardine'], pool: 'hard', act: 1 },
      { id: 'a1_sprite_urchin', enemies: ['tideSprite', 'barbUrchin'], pool: 'hard', act: 1 },
      { id: 'a1_elite_angler', enemies: ['anglerfish'], pool: 'elite', act: 1 },
      { id: 'a1_elite_riptide', enemies: ['riptideElemental'], pool: 'elite', act: 1 },
      { id: 'a1_boss', enemies: ['sunkenKing'], pool: 'boss', act: 1 },
      // Act 2
      { id: 'a2_eel', enemies: ['ghostEel'], pool: 'easy', act: 2 },
      { id: 'a2_squid', enemies: ['vampireSquid'], pool: 'easy', act: 2 },
      { id: 'a2_hatchets', enemies: ['hatchetfish', 'hatchetfish'], pool: 'easy', act: 2 },
      { id: 'a2_mine_eel', enemies: ['deepMine', 'ghostEel'], pool: 'hard', act: 2 },
      { id: 'a2_wraith', enemies: ['pressureWraith'], pool: 'hard', act: 2 },
      { id: 'a2_kelp', enemies: ['kelpHorror'], pool: 'hard', act: 2 },
      { id: 'a2_squid_mine', enemies: ['vampireSquid', 'deepMine'], pool: 'hard', act: 2 },
      { id: 'a2_wraith_hatchet', enemies: ['pressureWraith', 'hatchetfish'], pool: 'hard', act: 2 },
      { id: 'a2_elite_cultist', enemies: ['krakenCultist'], pool: 'elite', act: 2 },
      { id: 'a2_elite_warden', enemies: ['abyssalWarden'], pool: 'elite', act: 2 },
      { id: 'a2_boss', enemies: ['krakenArm', 'krakenHead', 'krakenArm'], pool: 'boss', act: 2 },
      // Act 3
      { id: 'a3_angler', enemies: ['voidAngler'], pool: 'easy', act: 3 },
      { id: 'a3_stalker', enemies: ['trenchStalker'], pool: 'easy', act: 3 },
      { id: 'a3_bones', enemies: ['boneShoal', 'boneShoal'], pool: 'easy', act: 3 },
      { id: 'a3_horror', enemies: ['hadalHorror'], pool: 'hard', act: 3 },
      { id: 'a3_idol', enemies: ['abyssIdol'], pool: 'hard', act: 3 },
      { id: 'a3_angler_bones', enemies: ['voidAngler', 'boneShoal'], pool: 'hard', act: 3 },
      { id: 'a3_stalker_idol', enemies: ['trenchStalker', 'abyssIdol'], pool: 'hard', act: 3 },
      { id: 'a3_elite_colossus', enemies: ['trenchColossus'], pool: 'elite', act: 3 },
      { id: 'a3_elite_herald', enemies: ['heraldOfDeep'], pool: 'elite', act: 3 },
      { id: 'a3_boss', enemies: ['drownedGod'], pool: 'boss', act: 3 },
    ] as EncounterDef[]
  ).map((e) => [e.id, e]),
);

export function encounterPool(act: 1 | 2 | 3, pool: EncounterDef['pool']): EncounterDef[] {
  return Object.values(ENCOUNTERS).filter((e) => e.act === act && e.pool === pool);
}
