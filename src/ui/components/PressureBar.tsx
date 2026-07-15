// Endless: persistent HUD strip of held Pressures — mirrors RelicBar, but
// danger-tinted, since these are burdens rather than boons.

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PRESSURES } from '../../content/pressures';
import { GameIcon } from '../icons';
import { Modal } from './Bits';

export function PressureBar({ pressures }: { pressures: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!pressures.length) return null;
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto px-2 py-1 items-center" aria-label="pressures">
        {pressures.map((id) => {
          const def = PRESSURES[id];
          if (!def) return null;
          return (
            <button
              key={id}
              className="relative w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border transition-transform hover:scale-110"
              style={{ borderColor: 'rgba(255,111,111,0.5)', background: 'rgba(8,17,32,0.8)', color: 'var(--color-danger)' }}
              title={`${def.name}: ${def.text}`}
              aria-label={`${def.name}: ${def.text}`}
              onClick={() => setOpen(id)}
            >
              <GameIcon id={def.icon} size={19} />
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {open && PRESSURES[open] && (
          <Modal title={PRESSURES[open].name} onClose={() => setOpen(null)}>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border border-(--color-danger)/40 bg-(--color-abyss-900)" style={{ color: 'var(--color-danger)' }}>
                <GameIcon id={PRESSURES[open].icon} size={34} />
              </div>
              <p className="text-sm text-(--color-foam)">{PRESSURES[open].text}</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
