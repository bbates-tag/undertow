import { memo } from 'react';
import type { BattleState, CardInstance, EnemyState } from '../../engine/types';
import { CARDS } from '../../content/cards';
import { cardCost } from '../../engine/battle';
import { cardConditionActive, describeCard } from '../../engine/describe';
import { ArtImage } from './Art';
import { KEYWORD_PATTERN } from '../../content/keywords';

const TYPE_LABEL: Record<string, string> = {
  attack: 'Attack', skill: 'Skill', power: 'Power', curse: 'Curse',
};

export function highlightText(text: string) {
  const parts = text.split(KEYWORD_PATTERN);
  return parts.map((part, i) => {
    if (i % 2 === 1) return <span key={i} className="kw">{part}</span>;
    // bold standalone numbers for scannability
    const numSplit = part.split(/(\d+)/);
    return (
      <span key={i}>
        {numSplit.map((s, j) => (j % 2 === 1 ? <b key={j}>{s}</b> : s))}
      </span>
    );
  });
}

interface CardViewProps {
  card: CardInstance;
  battle?: BattleState;
  target?: EnemyState;
  selected?: boolean;
  /** drag-to-play: card is past the release threshold / over a target */
  armed?: boolean;
  affordable?: boolean;
  inHand?: boolean;
  scale?: 'hand' | 'lg';
  onClick?: () => void;
  tabIndex?: number;
  ariaLabel?: string;
}

export const CardView = memo(function CardView({
  card, battle, target, selected, armed, affordable = true, inHand, scale, onClick, tabIndex, ariaLabel,
}: CardViewProps) {
  const def = CARDS[card.defId];
  if (!def) return null;
  const cost = cardCost(card);
  const text = describeCard(def, card.upgraded, battle ? { bs: battle, target } : undefined);
  const name = card.upgraded ? `${def.name}+` : def.name;
  // a Flood/Ebb/Charge/Descent condition is live right now — glow the frame
  const condActive = battle ? cardConditionActive(def, card.upgraded, battle) : false;

  return (
    <div
      className={[
        'card-frame',
        inHand ? 'hand-card' : '',
        selected ? 'selected' : '',
        armed ? 'armed' : '',
        condActive ? 'cond-active' : '',
        !affordable ? 'unaffordable' : '',
      ].join(' ')}
      style={scale === 'lg' ? { width: 'calc(var(--card-w) * 1.5)', height: 'calc(var(--card-h) * 1.5)' } : undefined}
      data-type={def.type}
      data-rarity={def.rarity}
      data-upgraded={card.upgraded}
      onClick={onClick}
      role="button"
      tabIndex={tabIndex ?? 0}
      aria-label={ariaLabel ?? `${name}, costs ${cost} energy. ${text}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {!def.unplayable && <div className="card-cost">{cost}</div>}
      <div className="card-name">{name}</div>
      <div className="card-art">
        <ArtImage
          kind="cards"
          id={def.id}
          icon={def.icon}
          className="card-art-img"
          style={def.artFocus ? { objectPosition: def.artFocus } : undefined}
          iconClassName="relative z-[1] opacity-90"
          iconSize="52%"
        />
      </div>
      <div className={`card-text ${text.length >= 70 ? 'long' : ''}`}>
        <div style={scale === 'lg' ? { fontSize: '13px', lineHeight: 1.35 } : undefined}>{highlightText(text)}</div>
      </div>
      <div className="card-footer">{TYPE_LABEL[def.type]}</div>
    </div>
  );
});
