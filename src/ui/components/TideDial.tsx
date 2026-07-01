import type { Tide } from '../../engine/types';
import { TIDE_NAMES } from '../../engine/types';
import { KEYWORDS } from '../../content/keywords';

/** Four-phase tide indicator: Low → Rising → High → Falling. */
export function TideDial({ tide, locked, compact }: { tide: Tide; locked?: boolean; compact?: boolean }) {
  return (
    <div
      className="tide-dial"
      role="status"
      aria-label={`Tide: ${TIDE_NAMES[tide]}${locked ? ' (locked)' : ''}`}
      title={KEYWORDS.tide.text}
    >
      {!compact && (
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-bold"
          style={{ color: tide === 2 ? 'var(--color-glow)' : tide === 0 ? 'var(--color-shield)' : 'var(--color-mist)' }}
        >
          {locked ? 'High∞' : TIDE_NAMES[tide]}
        </span>
      )}
      <div className="flex items-center gap-[5px]">
        {[0, 1, 2, 3].map((p) => (
          <div
            key={p}
            className={['tide-phase', p === tide ? 'active' : '', p === 2 ? 'high-marker' : ''].join(' ')}
            style={p === 2 && p === tide ? { background: 'var(--color-glow)' } : p === 0 && p === tide ? { background: 'var(--color-shield)', boxShadow: '0 0 10px var(--color-shield)' } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
