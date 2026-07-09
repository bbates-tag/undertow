// Relics — passive run-long modifiers. Effects are interpreted by id at hook
// sites in engine/battle.ts (combat hooks) and engine/run.ts (map-layer hooks).

import type { CharacterId } from '../engine/types';

export type RelicTier = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss';

export interface RelicDef {
  id: string;
  name: string;
  icon: string;
  tier: RelicTier;
  text: string;
  char?: CharacterId; // character-specific pool
  flavor?: string;
}

export const RELICS: Record<string, RelicDef> = Object.fromEntries(
  (
    [
      // ── Starters ──
      { id: 'livingCoral', name: 'Living Coral', icon: 'GiCoral', tier: 'starter', char: 'tidecaller', text: 'Heal 5 HP after each battle.', flavor: 'It grew into the wound and stayed.' },
      { id: 'stormCore', name: 'Storm Core', icon: 'GiEnergyTank', tier: 'starter', char: 'voltaic', text: 'Start each battle with 3 Charge.', flavor: 'A heart, if a heart were weather.' },
      { id: 'barnacledHeart', name: 'Barnacled Heart', icon: 'GiChainedHeart', tier: 'starter', char: 'drowned', text: 'The first time you gain Descent each turn, gain 1 more. Heal 4 HP after each battle.', flavor: "It beats. That's not the worrying part." },
      // ── Common ──
      { id: 'sharktoothCharm', name: 'Sharktooth Charm', icon: 'GiFangsCircle', tier: 'common', text: 'Start each battle with 1 Might.' },
      { id: 'deepstoneIdol', name: 'Deepstone Idol', icon: 'GiDolmen', tier: 'common', text: 'On pickup: gain 8 Max HP.' },
      { id: 'barnacledAnchor', name: 'Barnacled Anchor', icon: 'GiAnchor', tier: 'common', text: 'Start each battle with 7 Block.' },
      { id: 'anglersLantern', name: "Angler's Lantern", icon: 'GiLantern', tier: 'common', text: 'At the start of each battle, apply 1 Weakened to ALL enemies.' },
      { id: 'venomGland', name: 'Venom Gland', icon: 'GiPoisonBottle', tier: 'common', text: 'Your first Attack each battle applies 3 Toxin.' },
      { id: 'pumicePearl', name: 'Pumice Pearl', icon: 'GiMineralHeart', tier: 'common', text: 'Whenever you apply Toxin, apply 1 more.' },
      { id: 'tideBell', name: 'Tide Bell', icon: 'GiMoon', tier: 'common', text: 'Whenever the tide becomes High, draw 1 card.' },
      { id: 'kelpWrap', name: 'Kelp Wrap', icon: 'GiThornyVine', tier: 'common', text: 'Whenever you shuffle your deck, gain 5 Block.' },
      { id: 'ledgerOfTheDrowned', name: 'Ledger of the Drowned', icon: 'GiScrollQuill', tier: 'common', text: 'Gain 8 extra gold after each battle.', flavor: 'The dead keep meticulous accounts.' },
      { id: 'hermitShell', name: "Hermit's Shell", icon: 'GiSpiralShell', tier: 'common', text: 'Gain 2 Block at the end of each turn.' },
      { id: 'moonChart', name: 'Moon Chart', icon: 'GiTreasureMap', tier: 'common', text: 'Battles start at High tide.' },
      { id: 'whetstoneCoral', name: 'Whetstone Coral', icon: 'GiAnvil', tier: 'common', text: 'Attacks that hit more than once deal +1 damage per hit.' },
      { id: 'glassFloat', name: 'Glass Float', icon: 'GiFloatingCrystal', tier: 'common', text: 'Draw 2 extra cards on your first turn each battle.' },
      { id: 'whaleOilFlask', name: 'Whale-Oil Flask', icon: 'GiSpermWhale', tier: 'common', text: 'Resting heals 15 extra HP.' },
      { id: 'saltVein', name: 'Salt Vein', icon: 'GiHeartDrop', tier: 'common', char: 'drowned', text: 'Start each battle with 3 Descent.' },
      // ── Uncommon / Rare ──
      { id: 'chumBucket', name: 'Chum Bucket', icon: 'GiCauldron', tier: 'uncommon', text: 'Enemies start each battle with 3 Toxin.' },
      { id: 'sirenScale', name: 'Siren Scale', icon: 'GiMusicalNotes', tier: 'uncommon', text: 'Whenever you play a Power, draw 2 cards.' },
      { id: 'capacitorCoil', name: 'Capacitor Coil', icon: 'GiElectricalSocket', tier: 'uncommon', char: 'voltaic', text: 'Whenever you shuffle your deck, Conduct 3.' },
      { id: 'deepSextant', name: 'Deep Sextant', icon: 'GiSextant', tier: 'uncommon', text: 'Card removal at shops costs half.' },
      { id: 'bioBulb', name: 'Bioluminescent Bulb', icon: 'GiCandlebright', tier: 'uncommon', text: 'At the start of each battle, apply 1 Exposed to ALL enemies.' },
      { id: 'spinedBracers', name: 'Spined Bracers', icon: 'GiSpikedArmor', tier: 'uncommon', text: 'Start each battle with 3 Spines.' },
      { id: 'nacreCharm', name: 'Nacre Charm', icon: 'GiCrystalShine', tier: 'rare', text: 'The first time you would lose HP each battle, prevent it.', flavor: 'Mother-of-pearl remembers being soft.' },
      { id: 'abyssalFigurehead', name: 'Abyssal Figurehead', icon: 'GiShipWheel', tier: 'rare', text: 'Elite enemies drop an extra relic.' },
      // ── Boss (choose one after each act boss) ──
      { id: 'rustedHelm', name: 'Rusted Diving Helm', icon: 'GiDivingHelmet', tier: 'boss', text: '+1 Energy each turn. Take 3 damage at the start of each battle.' },
      { id: 'blackPearl', name: 'Black Pearl', icon: 'GiEclipseFlare', tier: 'boss', text: '+1 Energy each turn. You can no longer heal at rest sites.' },
      { id: 'pressureCrown', name: 'Pressure Crown', icon: 'GiCrown', tier: 'boss', text: '+1 Energy each turn. Draw 1 fewer card each turn.' },
      { id: 'heartOfMaelstrom', name: 'Heart of the Maelstrom', icon: 'GiTentacleHeart', tier: 'boss', text: 'Whenever the tide changes, gain 3 Block.', flavor: 'The churn shields those who ride it.' },
      { id: 'grimoireOfBrine', name: 'Grimoire of Brine', icon: 'GiSpellBook', tier: 'boss', text: 'Draw 1 extra card each turn.' },
      { id: 'graveBallast', name: 'Grave Ballast', icon: 'GiWeight', tier: 'boss', char: 'drowned', text: '+1 Energy each turn. At the start of each battle, lose 4 HP.', flavor: 'Sink faster. Arrive first.' },
    ] as RelicDef[]
  ).map((r) => [r.id, r]),
);

export function relicPool(tier: 'common' | 'uncommon' | 'rare' | 'boss', charId: CharacterId, owned: readonly string[], lockedIds: ReadonlySet<string>): RelicDef[] {
  return Object.values(RELICS).filter(
    (r) => r.tier === tier && (!r.char || r.char === charId) && !owned.includes(r.id) && !lockedIds.has(r.id),
  );
}
