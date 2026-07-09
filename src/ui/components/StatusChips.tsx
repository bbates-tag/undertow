import type { CreatureState, StatusId } from '../../engine/types';
import { GameIcon, STATUS_META } from '../icons';
import { KEYWORDS } from '../../content/keywords';

const ORDER: StatusId[] = ['charge', 'descent', 'might', 'finesse', 'spines', 'regen', 'anchor', 'toxin', 'weakened', 'exposed', 'brittle'];

export function StatusChips({ creature, onInfo }: { creature: CreatureState; onInfo?: (id: string) => void }) {
  const entries = ORDER.filter((s) => (creature.statuses[s] ?? 0) > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center" aria-label="status effects">
      {entries.map((s) => {
        const meta = STATUS_META[s];
        const n = creature.statuses[s]!;
        return (
          <button
            key={s}
            className="chip"
            style={{ color: meta.color, borderColor: 'rgba(95,185,255,0.2)' }}
            title={`${meta.name} ${n} — ${KEYWORDS[s]?.text ?? ''}`}
            aria-label={`${meta.name} ${n}`}
            onClick={(e) => {
              e.stopPropagation();
              onInfo?.(s);
            }}
          >
            <GameIcon id={meta.icon} size={12} />
            {n}
          </button>
        );
      })}
    </div>
  );
}
