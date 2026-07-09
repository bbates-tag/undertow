// The face-down card back (procedural — tokens + spiral shell motif) and the
// mini pile widgets that stand in for the draw/discard piles on the battle
// screen. Piles register as fx anchors so draws fly out of the draw pile and
// discards cascade into the discard pile.

import { GameIcon } from '../icons';
import { fxTargetRef } from '../fxRegistry';

/** full-size card back — used as the hidden face during the draw flip */
export function CardBack() {
  return (
    <div className="card-back" aria-hidden>
      <div className="card-back-ring">
        <GameIcon id="GiSpiralShell" size="46%" />
      </div>
    </div>
  );
}

interface PileWidgetProps {
  kind: 'drawPile' | 'discardPile';
  count: number;
  onClick: () => void;
  label: string;
}

/** a small stack of face-down cards with a count badge */
export function PileWidget({ kind, count, onClick, label }: PileWidgetProps) {
  const layers = count === 0 ? 0 : Math.min(4, 1 + Math.floor(count / 6));
  return (
    <button
      ref={fxTargetRef(kind)}
      className={`pile ${kind === 'discardPile' ? 'pile-discard' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {layers === 0 ? (
        <span className="pile-empty" />
      ) : (
        Array.from({ length: layers }, (_, i) => (
          <span
            key={i}
            className="pile-layer"
            style={{ transform: `translate(${-i * 2}px, ${-i * 2}px)`, zIndex: i }}
          >
            {i === layers - 1 && <GameIcon id="GiSpiralShell" size={16} />}
          </span>
        ))
      )}
      <span className="pile-count">{count}</span>
    </button>
  );
}
