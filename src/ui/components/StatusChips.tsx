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

type Bubble = { key: string; icon?: string; label?: string; color: string; count?: number; title: string; aria: string };

// Enemies wear their statuses as small round bubbles pinned to the avatar's
// rim — a single column down the right edge, spilling to the left only when
// crowded — so the name below stays uncrowded and legible. Affixes (rarer,
// permanent) live on the left. Render this INSIDE the `relative` avatar box;
// it's purely informational (pointer-events pass through to the drop target).
export function StatusBubbles({ creature, crowd = 1 }: { creature: EnemyState; crowd?: number }) {
  const statusBubbles: Bubble[] = ORDER.filter((s) => (creature.statuses[s] ?? 0) > 0).map((s) => {
    const meta = STATUS_META[s];
    const n = creature.statuses[s]!;
    return { key: s, icon: meta.icon, color: meta.color, count: n, title: `${meta.name} ${n} — ${KEYWORDS[s]?.text ?? ''}`, aria: `${meta.name} ${n}` };
  });
  const affixBubbles: Bubble[] = (creature.affixes ?? [])
    .map((a): Bubble | null => {
      const d = AFFIXES[a];
      return d ? { key: `af-${a}`, icon: d.icon, color: 'var(--color-lure)', title: `${d.name} — ${d.text}`, aria: d.name } : null;
    })
    .filter((b): b is Bubble => b !== null);

  if (!statusBubbles.length && !affixBubbles.length) return null;

  // per-column cap keeps a heavily-stacked enemy from sprouting an endless
  // ladder of bubbles; the tightest fields (4-5 columns) hold fewer + shrink
  const cap = crowd >= 4 ? 3 : 4;
  const rightCol = statusBubbles.slice(0, cap);
  const overflow = statusBubbles.slice(cap);
  const leftRaw = [...affixBubbles, ...overflow];
  const leftCol = leftRaw.length > cap ? [...leftRaw.slice(0, cap - 1), overflowBubble(leftRaw.length - (cap - 1))] : leftRaw;

  const k = crowd >= 5 ? 0.8 : crowd >= 4 ? 0.9 : 1;
  const bw = Math.round(25 * k);
  const bh = Math.round(20 * k);
  const iconPx = Math.round(11 * k);
  const fontPx = crowd >= 5 ? 9 : 10;
  const pull = crowd >= 4 ? 10 : 7; // overlap onto the rim; tighter when crowded

  const render = (b: Bubble) => (
    <span
      key={b.key}
      className="flex items-center justify-center rounded-full font-bold on-art"
      style={{
        width: bw,
        height: bh,
        gap: 1,
        fontSize: fontPx,
        color: b.color,
        background: 'rgba(10,18,30,0.92)',
        border: `1px solid color-mix(in srgb, ${b.color} 60%, transparent)`,
      }}
      title={b.title}
      aria-label={b.aria}
    >
      {b.icon && <GameIcon id={b.icon} size={iconPx} />}
      {b.label ?? (b.count != null && b.count)}
    </span>
  );

  return (
    <>
      {rightCol.length > 0 && (
        <div
          className="absolute top-1 left-full flex flex-col gap-1 z-10 pointer-events-none"
          style={{ marginLeft: -pull }}
          aria-label="status effects"
        >
          {rightCol.map(render)}
        </div>
      )}
      {leftCol.length > 0 && (
        <div
          className="absolute top-1 right-full flex flex-col gap-1 z-10 items-end pointer-events-none"
          style={{ marginRight: -pull }}
        >
          {leftCol.map(render)}
        </div>
      )}
    </>
  );
}

function overflowBubble(n: number): Bubble {
  return { key: 'more', label: `+${n}`, color: 'var(--color-mist)', title: `+${n} more status effects`, aria: `${n} more status effects` };
}
