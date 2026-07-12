// Meta-progression content: ascension tiers, daily modifiers, achievements,
// and unlock packs (cards/relics gated behind cumulative Fathoms).

export interface AscensionDef {
  level: number;
  text: string;
}

/** Effects are implemented in battle.ts / run.ts via run.ascension checks. */
export const ASCENSIONS: AscensionDef[] = [
  { level: 1, text: 'Enemies have more HP.' },
  { level: 2, text: 'Enemies hit harder (+1 damage per hit).' },
  { level: 3, text: 'Resting heals less (25% instead of 30%).' },
  { level: 4, text: 'Start each run with 10 less gold.' },
  { level: 5, text: 'Begin the run with a Barnacle in your deck.' },
  { level: 6, text: 'Enemies have even more HP.' },
  { level: 7, text: 'Start with 8 less Max HP.' },
  { level: 8, text: 'Shops charge 20% more.' },
  { level: 9, text: 'Enemies hit harder still (+1 more damage per hit).' },
  { level: 10, text: 'All enemies start battles with 1 Might.' },
];

export interface DailyModDef {
  id: string;
  name: string;
  text: string;
}

export const DAILY_MODS: Record<string, DailyModDef> = {
  springTide: { id: 'springTide', name: 'Spring Tide', text: 'The tide advances 2 steps each turn.' },
  richWaters: { id: 'richWaters', name: 'Rich Waters', text: 'Battles pay out 50% more gold.' },
  toxicWaters: { id: 'toxicWaters', name: 'Toxic Waters', text: 'All enemies start battles with 4 Toxin.' },
  glassCannon: { id: 'glassCannon', name: 'Glass Cannon', text: 'Start at 60% Max HP, but +1 Energy every turn.' },
  hardShell: { id: 'hardShell', name: 'Hard Shell', text: 'Start each battle with 10 Block.' },
  swarmSeason: { id: 'swarmSeason', name: 'Swarm Season', text: 'Enemies have 15% more HP.' },
  moonstruck: { id: 'moonstruck', name: 'Moonstruck', text: 'Battles begin at High tide.' },
  barnacled: { id: 'barnacled', name: 'Barnacled', text: 'Start the run with 2 Barnacles in your deck.' },
};

export interface AchievementDef {
  id: string;
  name: string;
  text: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = Object.fromEntries(
  (
    [
      { id: 'firstBlood', name: 'First Descent', text: 'Win any battle.', icon: 'GiWaveStrike' },
      { id: 'kingslayer', name: 'Kingslayer', text: 'Defeat the Sunken King.', icon: 'GiCrownedSkull' },
      { id: 'krakenslayer', name: 'Unclencher', text: 'Defeat the Kraken.', icon: 'GiGiantSquid' },
      { id: 'godDrowner', name: 'Drown the Drowned', text: 'Defeat the Drowned God and win a run.', icon: 'GiSeaDragon' },
      { id: 'voltVictor', name: 'Storm Warning', text: 'Win a run as the Voltaic.', icon: 'GiElectric' },
      { id: 'drownedVictor', name: 'Twice Drowned', text: 'Win a run as The Drowned.', icon: 'GiDrowning' },
      { id: 'deepDescent', name: 'Terminal Velocity', text: 'Reach 25 Descent in one battle.', icon: 'GiFalling' },
      { id: 'flawless', name: 'Untouchable', text: 'Win a battle without taking any damage.', icon: 'GiEyeShield' },
      { id: 'toxinMaster', name: 'Apex Toxin', text: 'Have 25+ Toxin on one enemy.', icon: 'GiPoisonBottle' },
      { id: 'fullBattery', name: 'Fully Charged', text: 'Reach 20 Charge in one battle.', icon: 'GiBatteryPack' },
      { id: 'wallOfNacre', name: 'Wall of Nacre', text: 'Have 40+ Block at once.', icon: 'GiBellShield' },
      { id: 'minimalist', name: 'Travel Light', text: 'Win a run with 15 or fewer cards.', icon: 'GiFishingHook' },
      { id: 'hoarder', name: 'Dragon of the Deep', text: 'Hold 250 gold at once.', icon: 'GiCoinsPile' },
      { id: 'collector', name: 'Curio Cabinet', text: 'Hold 8 relics in one run.', icon: 'GiAmmonite' },
      { id: 'depth5', name: 'Pressure Rated', text: 'Win a run at Depth 5+.', icon: 'GiDivingHelmet' },
      { id: 'depth10', name: 'Hadal Certified', text: 'Win a run at Depth 10.', icon: 'GiSeaSerpent' },
      { id: 'dailyDiver', name: 'Creature of Habit', text: 'Complete a Daily Dive.', icon: 'GiSolarTime' },
      { id: 'mightyOne', name: 'Leviathan Diet', text: 'Reach 10 Might in one battle.', icon: 'GiFist' },
      { id: 'noBottom', name: 'No Bottom', text: 'Descend deeper after defeating the Drowned God.', icon: 'GiSinkingShip' },
      { id: 'pressureHolds', name: 'The Pressure Holds', text: 'Reach Loop 3 of an endless dive.', icon: 'GiVortex' },
    ] as AchievementDef[]
  ).map((a) => [a.id, a]),
);

export interface UnlockPack {
  id: string;
  name: string;
  atFathoms: number;
  cards: string[];
  relics: string[];
}

/**
 * Content gated behind cumulative Fathoms (earned every run, win or lose).
 * Everything NOT listed here is available from the first run.
 */
export const UNLOCK_PACKS: UnlockPack[] = [
  {
    id: 'pack1', name: 'Flotsam', atFathoms: 150,
    cards: ['gaffHook', 'inkJet', 'panicThrash'], relics: ['whetstoneCoral', 'glassFloat'],
  },
  {
    id: 'pack2', name: 'Spoils of the Shallows', atFathoms: 400,
    cards: ['bloodInWater', 'frenziedBites', 'seaLegs'], relics: ['chumBucket', 'sirenScale'],
  },
  {
    id: 'pack3', name: 'Trench Relics', atFathoms: 800,
    cards: ['kingTide', 'depthlessHunger', 'voltmeterSlash'], relics: ['nacreCharm', 'bioBulb'],
  },
  {
    id: 'pack4', name: 'Hadal Secrets', atFathoms: 1400,
    cards: ['maelstrom', 'supercell', 'blightwave'], relics: ['abyssalFigurehead'],
  },
];

export function lockedContent(unlockedPacks: readonly string[]): { cards: Set<string>; relics: Set<string> } {
  const cards = new Set<string>();
  const relics = new Set<string>();
  for (const p of UNLOCK_PACKS) {
    if (!unlockedPacks.includes(p.id)) {
      p.cards.forEach((c) => cards.add(c));
      p.relics.forEach((r) => relics.add(r));
    }
  }
  return { cards, relics };
}
