import type { CharacterDef } from '../engine/types';

export const CHARACTERS: Record<string, CharacterDef> = {
  tidecaller: {
    id: 'tidecaller',
    name: 'The Tidecaller',
    title: 'Priestess of the Drowned Moon',
    icon: 'GiTrident',
    color: 'var(--color-glow)',
    maxHp: 72,
    starterRelic: 'livingCoral',
    starterDeck: [
      { card: 'tideStrike', count: 4 },
      { card: 'kelpGuard', count: 4 },
      { card: 'riptide', count: 1 },
      { card: 'undertow', count: 1 },
    ],
    blurb: 'Reads the tide and strikes when it rises. Toxin, spines, and the patience of the moon.',
    mechanic: 'Tide — time Flood cards for High tide, Ebb cards for Low, or Shift the cycle yourself.',
  },
  voltaic: {
    id: 'voltaic',
    name: 'The Voltaic',
    title: 'Eel-Blooded Duelist',
    icon: 'GiElectric',
    color: 'var(--color-volt)',
    maxHp: 70,
    starterRelic: 'stormCore',
    starterDeck: [
      { card: 'joltStrike', count: 4 },
      { card: 'eelGuard', count: 4 },
      { card: 'staticField', count: 1 },
      { card: 'arcLash', count: 1 },
    ],
    blurb: 'Banks voltage with every move, then spends the whole storm at once.',
    mechanic: 'Charge — Conduct cards bank it, Discharge cards consume it all for massive effects.',
  },
};
