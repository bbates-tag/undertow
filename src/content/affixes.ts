// Endless-loop enemy affixes — per-instance modifiers rolled at map-gen time
// and applied when the battle materializes. Effects live at hook sites in
// engine/battle.ts; assignment logic in engine/endless.ts.

export interface AffixDef {
  id: string;
  name: string;
  icon: string;
  text: string;
}

export const AFFIXES: Record<string, AffixDef> = {
  hulking: { id: 'hulking', name: 'Hulking', icon: 'GiWeight', text: '+35% Max HP.' },
  raging: { id: 'raging', name: 'Raging', icon: 'GiFist', text: 'Starts with 2 Might.' },
  spined: { id: 'spined', name: 'Spined', icon: 'GiSpikes', text: 'Starts with 3 Spines.' },
  shielded: { id: 'shielded', name: 'Shielded', icon: 'GiBellShield', text: 'Starts with 12 Block.' },
  tidetouched: { id: 'tidetouched', name: 'Tide-Touched', icon: 'GiHighTide', text: 'Gains 2 Might whenever the tide becomes High.' },
  relentless: { id: 'relentless', name: 'Relentless', icon: 'GiRibcage', text: 'Reanimates once at half HP.' },
  venomous: { id: 'venomous', name: 'Venomous', icon: 'GiPoison', text: 'Its attacks apply 2 Toxin.' },
};
