// Endless-loop player-side debuffs ("Pressures") — one is chosen each loop
// and stacks permanently with previous picks. Effects live at hook sites in
// engine/battle.ts and engine/run.ts; offer/choice lifecycle (beginLoop,
// choosePressure) lives in engine/run.ts.

export interface PressureDef {
  id: string;
  name: string;
  icon: string;
  text: string;
}

export const PRESSURES: Record<string, PressureDef> = {
  crushingDepth: { id: 'crushingDepth', name: 'Crushing Depth', icon: 'GiWeightCrush', text: 'Lose 3 Max HP each time you descend to a new act (never below 15).' },
  deepDemands: { id: 'deepDemands', name: 'The Deep Demands', icon: 'GiKrakenTentacle', text: 'You cannot play more than 12 cards in a turn.' },
  siltLungs: { id: 'siltLungs', name: 'Silt in the Lungs', icon: 'GiLungs', text: 'Battles begin with a Waterlogged shuffled into your draw pile.' },
  dimmingLight: { id: 'dimmingLight', name: 'Dimming Light', icon: 'GiEclipse', text: 'Draw 1 fewer card on your first turn of battle.' },
  numbingCold: { id: 'numbingCold', name: 'Numbing Cold', icon: 'GiThermometerCold', text: '1 less Energy on your first turn of battle.' },
  barnacledHulls: { id: 'barnacledHulls', name: 'Barnacled Hulls', icon: 'GiCeilingBarnacle', text: 'Enemies begin battle with Block equal to 4× the loop.' },
  hungeringDark: { id: 'hungeringDark', name: 'The Hungering Dark', icon: 'GiBottledShadow', text: 'Rest sites heal 10% less.' },
};
