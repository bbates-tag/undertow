// DOM position registry for fx targets (player, enemies) so damage floaters
// and particle bursts can find where to spawn without prop-drilling refs.

const els = new Map<string, HTMLElement>();

export function fxTargetRef(key: string) {
  return (el: HTMLElement | null) => {
    if (el) els.set(key, el);
    else els.delete(key);
  };
}

export function fxTargetEl(key: string): HTMLElement | null {
  return els.get(key) ?? null;
}

export function fxTargetCenter(key: string): { x: number; y: number } | null {
  const el = els.get(key);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
}

/**
 * Drag-to-play drop zones: EnemyView roots register as `hit:e<uid>`.
 * Returns the uid of the enemy under a viewport point (with a little padding
 * so drops don't need pixel precision), or null.
 */
export function enemyUidAtPoint(x: number, y: number): number | null {
  const PAD = 16;
  for (const [key, el] of els) {
    if (!key.startsWith('hit:e')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (x >= r.left - PAD && x <= r.right + PAD && y >= r.top - PAD && y <= r.bottom + PAD) {
      return Number(key.slice(5));
    }
  }
  return null;
}
