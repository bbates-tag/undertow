import type { CreatureState, EnemyState, StatusId } from '../../engine/types';
import { GameIcon, STATUS_META } from '../icons';
import { KEYWORDS } from '../../content/keywords';
import { AFFIXES } from '../../content/affixes';

const ORDER: StatusId[] = ['charge', 'descent', 'perfectRead', 'might', 'finesse', 'spines', 'regen', 'anchor', 'marked', 'toxin', 'weakened', 'exposed', 'brittle'];

// The player strip still uses a wrapping row of chips (plenty of room there).
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

type Entry = { key: string; icon?: string; label?: string; color: string; count?: number; title: string; aria: string };

// Enemies show their statuses as a compact pill under the HP bar: a single pill
// grows to hold several icon+count pairs, wrapping to a second pill row once it
// passes `perRow` (tighter when the field is crowded), then collapses the rest
// into a +N marker. The enemy name is tap-to-reveal (the dossier), so nothing
// competes with the statuses for space here. Affixes get their own pink pill.
export function StatusRow({ creature, crowd = 1 }: { creature: EnemyState; crowd?: number }) {
  const statuses: Entry[] = ORDER.filter((s) => (creature.statuses[s] ?? 0) > 0).map((s) => {
    const meta = STATUS_META[s];
    const n = creature.statuses[s]!;
    return { key: s, icon: meta.icon, color: meta.color, count: n, title: `${meta.name} ${n} — ${KEYWORDS[s]?.text ?? ''}`, aria: `${meta.name} ${n}` };
  });
  const affixes: Entry[] = (creature.affixes ?? [])
    .map((a): Entry | null => {
      const d = AFFIXES[a];
      return d ? { key: `af-${a}`, icon: d.icon, color: 'var(--color-lure)', title: `${d.name} — ${d.text}`, aria: d.name } : null;
    })
    .filter((e): e is Entry => e !== null);

  if (!statuses.length && !affixes.length) return null;

  // one pill holds up to `perRow`; allow a second row, then fold the remainder
  // into a +N marker so a heavily-stacked enemy never grows a tall ladder
  const perRow = crowd >= 4 ? 3 : 4;
  const cap = perRow * 2;
  let shown = statuses;
  if (statuses.length > cap) {
    const extra = statuses.length - (cap - 1);
    shown = [...statuses.slice(0, cap - 1), { key: 'more', label: `+${extra}`, color: 'var(--color-mist)', title: `+${extra} more status effects`, aria: `${extra} more status effects` }];
  }
  const rows: Entry[][] = [];
  for (let i = 0; i < shown.length; i += perRow) rows.push(shown.slice(i, i + perRow));

  const iconPx = crowd >= 5 ? 9 : crowd >= 4 ? 10 : 11;
  const fontPx = crowd >= 5 ? 9 : 10;
  const innerGap = crowd >= 4 ? 4 : 5;

  const pill = (entries: Entry[], key: string, border: string) => (
    <div
      key={key}
      className="inline-flex items-center rounded-full on-art"
      style={{ gap: innerGap, padding: '1px 6px', background: 'rgba(8,17,32,0.9)', border: `1px solid ${border}`, fontSize: fontPx, fontWeight: 700, lineHeight: 1 }}
    >
      {entries.map((e) => (
        <span key={e.key} className="inline-flex items-center" style={{ gap: 1, color: e.color }} title={e.title} aria-label={e.aria}>
          {e.icon && <GameIcon id={e.icon} size={iconPx} />}
          {e.label ?? e.count}
        </span>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-1 mt-0.5" aria-label="status effects">
      {rows.map((row, i) => pill(row, `s${i}`, 'rgba(95,185,255,0.28)'))}
      {affixes.length > 0 && pill(affixes, 'affix', 'rgba(255,93,162,0.45)')}
    </div>
  );
}
