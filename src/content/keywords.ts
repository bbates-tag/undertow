// Keyword glossary — rendered as tap/hover tooltips wherever rules text appears.

export interface KeywordDef {
  id: string;
  name: string;
  text: string;
}

export const KEYWORDS: Record<string, KeywordDef> = {
  block: { id: 'block', name: 'Block', text: 'Absorbs damage before HP. Falls off at the start of your next turn.' },
  toxin: { id: 'toxin', name: 'Toxin', text: 'At the start of its turn, the bearer loses HP equal to its Toxin (ignores Block), then Toxin falls by 1.' },
  weakened: { id: 'weakened', name: 'Weakened', text: 'Attacks deal 25% less damage. Falls by 1 each turn.' },
  exposed: { id: 'exposed', name: 'Exposed', text: 'Takes 50% more damage from attacks. Falls by 1 each turn.' },
  brittle: { id: 'brittle', name: 'Brittle', text: 'Gains 25% less Block. Falls by 1 each turn.' },
  might: { id: 'might', name: 'Might', text: 'Attacks deal +1 damage per Might. Lasts the battle.' },
  finesse: { id: 'finesse', name: 'Finesse', text: 'Cards grant +1 Block per Finesse. Lasts the battle.' },
  spines: { id: 'spines', name: 'Spines', text: 'Attackers take this much damage each time they hit you.' },
  regen: { id: 'regen', name: 'Regen', text: 'Heal this much at the end of the turn, then Regen falls by 1.' },
  anchor: { id: 'anchor', name: 'Anchor', text: 'Your Block is not removed at the start of your next turn.' },
  charge: { id: 'charge', name: 'Charge', text: 'Stored voltage. It does not fade between turns. Discharge cards consume all of it.' },
  conduct: { id: 'conduct', name: 'Conduct', text: 'Conduct X: gain X Charge.' },
  discharge: { id: 'discharge', name: 'Discharge', text: 'The effect scales with your Charge — then ALL Charge is spent.' },
  descent: { id: 'descent', name: 'Descent', text: 'When you lose HP during your own turn, gain that much Descent. Lasts the battle; some cards grow stronger per Descent.' },
  surface: { id: 'surface', name: 'Surface', text: 'After this card resolves, ALL your Descent is lost.' },
  flood: { id: 'flood', name: 'Flood', text: 'Bonus applies while the tide is High.' },
  ebb: { id: 'ebb', name: 'Ebb', text: 'Bonus applies while the tide is Low.' },
  shift: { id: 'shift', name: 'Shift', text: 'Advance the tide: Low → Rising → High → Falling → Low. The tide also advances on its own each turn.' },
  tide: { id: 'tide', name: 'Tide', text: 'The tide cycles Low → Rising → High → Falling, advancing at the start of each of your turns. Flood effects want High; Ebb effects want Low.' },
  exhaust: { id: 'exhaust', name: 'Exhaust', text: 'Removed for the rest of the battle after being played.' },
  unplayable: { id: 'unplayable', name: 'Unplayable', text: 'This card cannot be played. It clogs your hand.' },
  pierce: { id: 'pierce', name: 'Pierce', text: 'This damage ignores Block.' },
  intent: { id: 'intent', name: 'Intent', text: 'The icon above an enemy telegraphs its next move — attack numbers shown are final (buffs included).' },
  read: { id: 'read', name: 'Read', text: 'A bonus that triggers off what enemies telegraph: attack, Block, or scheming (buff / debuff / summon).' },
  foresight: { id: 'foresight', name: 'Foresight', text: 'The Wakeweaver sees each enemy’s move one turn further ahead — the small ghosted icon. A forecast, not a promise: wounds and summons can change a mind.' },
  marked: { id: 'marked', name: 'Marked', text: 'If a Marked enemy dies this turn, gain Energy and draw cards (1 + Marked of each). Marks fade at the start of your next turn.' },
};

/** Order matters: longer names first so e.g. "Weakened" matches before "Weak". */
export const KEYWORD_PATTERN = new RegExp(
  `\\b(${['Discharge', 'Unplayable', 'Weakened', 'Conduct', 'Descent', 'Exhaust', 'Surface', 'Brittle', 'Exposed', 'Finesse', 'Anchor', 'Charge', 'Marked', 'Spines', 'Toxin', 'Might', 'Regen', 'Block', 'Flood', 'Pierce', 'Shift', 'Read', 'Ebb'].join('|')})\\b`,
  'g',
);

export function keywordIdFor(word: string): string | null {
  const k = word.toLowerCase();
  return KEYWORDS[k] ? k : null;
}
