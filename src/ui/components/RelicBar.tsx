import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RELICS, relicText } from '../../content/relics';
import { GameIcon } from '../icons';
import { Modal } from './Bits';

export function RelicBar({ relics, defanged }: { relics: string[]; defanged?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!relics.length) return null;
  const polished = (id: string) => !!defanged?.includes(id);
  const label = (id: string) => `${RELICS[id].name}${polished(id) ? ' ✦' : ''}: ${relicText(id, defanged)}`;
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto px-2 py-1 items-center" aria-label="relics">
        {relics.map((id) => {
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
              title={label(id)}
              aria-label={label(id)}
              onClick={() => setOpen(id)}
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
      </div>
      <AnimatePresence>
        {open && RELICS[open] && (
          <Modal title={`${RELICS[open].name}${polished(open) ? ' ✦' : ''}`} onClose={() => setOpen(null)}>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border border-(--color-glow)/40 bg-(--color-abyss-900)" style={{ color: 'var(--color-glow)' }}>
                <GameIcon id={RELICS[open].icon} size={34} />
              </div>
              <div>
                <p className="text-sm text-(--color-foam)">{relicText(open, defanged)}</p>
                {polished(open) && <p className="text-xs text-(--color-gold) mt-1">✦ Defanged at the Bazaar — the downside is gone.</p>}
                {RELICS[open].flavor && <p className="text-xs italic text-(--color-dim) mt-2">“{RELICS[open].flavor}”</p>}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
