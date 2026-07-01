// DOM position registry for fx targets (player, enemies) so damage floaters
// and particle bursts can find where to spawn without prop-drilling refs.

const els = new Map<string, HTMLElement>();

export function fxTargetRef(key: string) {
  return (el: HTMLElement | null) => {
    if (el) els.set(key, el);
    else els.delete(key);
  };
}

export function fxTargetCenter(key: string): { x: number; y: number } | null {
  const el = els.get(key);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
}
