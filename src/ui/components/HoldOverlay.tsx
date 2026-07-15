// The Hold: the full manifest of relics and endless Pressures as readable
// rows — opened from the relic strip's +N chip when the collection outgrows
// one row. Newest stowage on top.

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGame } from '../../state/store';
import { RELICS, relicText } from '../../content/relics';
import { PRESSURES } from '../../content/pressures';
import { GameIcon } from '../icons';

export function HoldOverlay() {
  const run = useGame((s) => s.run);
  const setOverlay = useGame((s) => s.setOverlay);
  if (!run) return null;

  const polished = (id: string) => !!run.defanged?.includes(id);
  const relics = [...run.relics].reverse();
  const pressures = run.pressures;
  const title = `The Hold (${run.relics.length} relic${run.relics.length === 1 ? '' : 's'}${
    pressures.length ? ` · ${pressures.length} pressure${pressures.length === 1 ? '' : 's'}` : ''
  })`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-md flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <button className="btn !p-2" onClick={() => setOverlay('none')} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mx-auto w-full max-w-xl flex flex-col gap-4">
          {pressures.length > 0 && (
            <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,111,111,0.4)' }}>
              <h3 className="text-xs font-bold tracking-wide mb-1" style={{ color: 'var(--color-danger)' }}>
                PRESSURES — the deep's toll
              </h3>
              {pressures.map((id) => {
                const def = PRESSURES[id];
                return def ? (
                  <div key={id} className="flex items-start gap-3 py-1.5">
                    <div className="shrink-0" style={{ color: 'var(--color-danger)' }}>
                      <GameIcon id={def.icon} size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{def.name}</div>
                      <div className="text-xs text-(--color-mist)">{def.text}</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div>
            {relics.map((id) => {
              const def = RELICS[id];
              return def ? (
                <div key={id} className="flex items-start gap-3 py-2 border-b border-(--color-abyss-600) last:border-0">
                  <div
                    className="shrink-0"
                    style={{ color: def.tier === 'boss' ? 'var(--color-lure)' : def.tier === 'rare' ? 'var(--color-gold)' : 'var(--color-glow)' }}
                  >
                    <GameIcon id={def.icon} size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {def.name}
                      {polished(id) && <span style={{ color: 'var(--color-gold)' }}> ✦</span>}
                    </div>
                    <div className="text-xs text-(--color-mist)">{relicText(id, run.defanged)}</div>
                    {def.flavor && <div className="text-xs italic text-(--color-dim) mt-0.5">“{def.flavor}”</div>}
                  </div>
                </div>
              ) : null;
            })}
            {relics.length === 0 && <p className="text-center text-(--color-dim) mt-6">The hold is empty.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
