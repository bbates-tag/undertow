// Collapsed relic strip: Pressures first (danger-tinted), then the most
// recent relics, capped to a single row that never scrolls. When the
// collection overflows, a +N chip opens the Hold overlay (HoldOverlay.tsx)
// with the full manifest. Tapping any visible icon keeps the quick-detail
// modal.

import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RELICS, relicText } from '../../content/relics';
import { PRESSURES } from '../../content/pressures';
import { useGame } from '../../state/store';
import { GameIcon } from '../icons';
import { Modal } from './Bits';

const SLOT = 38; // 32px icon + 6px gap
const CHIP = 56; // reserved width for the +N chip
const DIVIDER = 13; // pressure/relic separator rule + gap
const PAD = 16; // the strip's own px-2 padding

type Detail = { kind: 'relic' | 'pressure'; id: string } | null;

export function RelicBar({ relics, defanged, pressures = [] }: { relics: string[]; defanged?: string[]; pressures?: string[] }) {
  const setOverlay = useGame((s) => s.setOverlay);
  const [open, setOpen] = useState<Detail>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  if (!relics.length && !pressures.length) return null;

  const polished = (id: string) => !!defanged?.includes(id);
  const total = pressures.length + relics.length;
  const dividerW = pressures.length && relics.length ? DIVIDER : 0;
  // before the first measure, render everything — useLayoutEffect corrects pre-paint
  const fitAll = width === 0 || total * SLOT - 6 + dividerW <= width - PAD;
  const slots = fitAll ? total : Math.max(1, Math.floor((width - PAD - CHIP - dividerW) / SLOT));
  const shownPressures = pressures.slice(0, slots);
  const relicSlots = Math.max(0, slots - shownPressures.length);
  // truncate from the old end — the newest pickups stay visible
  const shownRelics = relics.slice(Math.max(0, relics.length - relicSlots));
  const hidden = total - shownPressures.length - shownRelics.length;

  const relicLabel = (id: string) => `${RELICS[id].name}${polished(id) ? ' ✦' : ''}: ${relicText(id, defanged)}`;
  const pressureLabel = (id: string) => `${PRESSURES[id].name}: ${PRESSURES[id].text}`;

  return (
    <>
      <div ref={wrapRef} className="flex gap-1.5 px-2 py-1 items-center overflow-hidden" aria-label="pressures and relics">
        {shownPressures.map((id) => {
          const def = PRESSURES[id];
          if (!def) return null;
          return (
            <button
              key={id}
              className="relative w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border transition-transform hover:scale-110"
              style={{ borderColor: 'rgba(255,111,111,0.5)', background: 'rgba(8,17,32,0.8)', color: 'var(--color-danger)' }}
              title={pressureLabel(id)}
              aria-label={pressureLabel(id)}
              onClick={() => setOpen({ kind: 'pressure', id })}
            >
              <GameIcon id={def.icon} size={19} />
            </button>
          );
        })}
        {shownPressures.length > 0 && shownRelics.length > 0 && (
          <div className="w-px h-6 shrink-0" style={{ background: 'rgba(95,185,255,0.2)' }} aria-hidden />
        )}
        {shownRelics.map((id) => {
          const def = RELICS[id];
          if (!def) return null;
          return (
            <button
              key={id}
              className="relative w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border transition-transform hover:scale-110"
              style={{
                borderColor: def.tier === 'boss' ? 'rgba(255,93,162,0.5)' : def.tier === 'rare' ? 'rgba(255,206,92,0.5)' : 'rgba(95,185,255,0.28)',
                background: 'rgba(8,17,32,0.8)',
                color: def.tier === 'boss' ? 'var(--color-lure)' : def.tier === 'rare' ? 'var(--color-gold)' : 'var(--color-glow)',
              }}
              title={relicLabel(id)}
              aria-label={relicLabel(id)}
              onClick={() => setOpen({ kind: 'relic', id })}
            >
              <GameIcon id={def.icon} size={19} />
              {polished(id) && (
                <span className="absolute -top-1 -right-1 text-[9px] leading-none" style={{ color: 'var(--color-gold)' }} aria-hidden>
                  ✦
                </span>
              )}
            </button>
          );
        })}
        {hidden > 0 && (
          <button
            className="h-8 shrink-0 rounded-lg px-2 flex items-center justify-center border text-[12px] font-bold transition-transform hover:scale-110"
            style={{ borderColor: 'rgba(95,185,255,0.45)', background: 'rgba(18,35,60,0.9)', color: 'var(--color-glow)' }}
            onClick={() => setOverlay('hold')}
            aria-label={`${hidden} more — view all ${relics.length} relics${pressures.length ? ` and ${pressures.length} pressures` : ''}`}
          >
            +{hidden}
          </button>
        )}
      </div>
      <AnimatePresence>
        {open?.kind === 'relic' && RELICS[open.id] && (
          <Modal title={`${RELICS[open.id].name}${polished(open.id) ? ' ✦' : ''}`} onClose={() => setOpen(null)}>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border border-(--color-glow)/40 bg-(--color-abyss-900)" style={{ color: 'var(--color-glow)' }}>
                <GameIcon id={RELICS[open.id].icon} size={34} />
              </div>
              <div>
                <p className="text-sm text-(--color-foam)">{relicText(open.id, defanged)}</p>
                {polished(open.id) && <p className="text-xs text-(--color-gold) mt-1">✦ Defanged at the Bazaar — the downside is gone.</p>}
                {RELICS[open.id].flavor && <p className="text-xs italic text-(--color-dim) mt-2">“{RELICS[open.id].flavor}”</p>}
              </div>
            </div>
          </Modal>
        )}
        {open?.kind === 'pressure' && PRESSURES[open.id] && (
          <Modal title={PRESSURES[open.id].name} onClose={() => setOpen(null)}>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border border-(--color-danger)/40 bg-(--color-abyss-900)" style={{ color: 'var(--color-danger)' }}>
                <GameIcon id={PRESSURES[open.id].icon} size={34} />
              </div>
              <p className="text-sm text-(--color-foam)">{PRESSURES[open.id].text}</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
