// Boss boons — one-shot windfalls offered in place of a boss relic once the
// pool has run dry (deep endless loops). Effects apply in engine/run.ts.

export interface BoonDef {
  id: string;
  name: string;
  icon: string;
  text: string;
}

export const BOONS: Record<string, BoonDef> = {
  leviathansFeast: { id: 'leviathansFeast', name: "Leviathan's Feast", icon: 'GiHeartOrgan', text: 'Heal to full and gain 8 Max HP.' },
  sunkenHoard: { id: 'sunkenHoard', name: 'Sunken Hoard', icon: 'GiCoinsPile', text: 'Gain 100 gold.' },
  deepTempering: { id: 'deepTempering', name: 'Deep Tempering', icon: 'GiAnvil', text: 'Upgrade 2 random cards.' },
};
