// Full-screen dossier for one enemy — opened by tapping a creature in battle.
// Mostly art, plus a few sentences of lore and how the thing fights.

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ENEMIES } from '../../content/enemies';
import { ArtImage } from './Art';

/** minions that reuse another enemy's art masters */
const ART_ALIAS: Record<string, string> = { boneShoalMinion: 'boneShoal' };

const ACT_NAME: Record<number, string> = {
  0: 'Summoned',
  1: 'The Sunlit Shallows',
  2: 'The Twilight Trench',
  3: 'The Hadal Deep',
};

const TIER_LABEL: Record<string, string> = { normal: 'Denizen', elite: 'Elite', boss: 'Boss', minion: 'Minion' };

export function EnemyDossier({ defId, onClose }: { defId: string; onClose: () => void }) {
  const def = ENEMIES[defId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!def) return null;
  const tierColor =
    def.tier === 'boss' ? 'var(--color-lure)' : def.tier === 'elite' ? 'var(--color-gold)' : 'var(--color-mist)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      /* above the tutorial hints (85), below toasts (90) */
      className="fixed inset-0 z-[88] bg-black/75 backdrop-blur-md flex items-center justify-center"
      style={{ padding: 'max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${def.name} dossier`}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="panel relative w-[min(94vw,420px)] max-h-full overflow-y-auto overflow-x-hidden"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="relative">
          <div
            className="w-full aspect-square flex items-center justify-center overflow-hidden"
            style={{ color: tierColor, background: 'rgba(4,10,20,0.6)' }}
          >
            <ArtImage
              kind="enemies"
              id={ART_ALIAS[defId] ?? defId}
              icon={def.icon}
              className="w-full h-full object-cover"
              iconSize="55%"
              alt={def.name}
            />
          </div>
          {/* fade the art into the panel so the text sits on solid ground */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(13,25,43,0.92))' }}
            aria-hidden
          />
          <button
            className="btn !p-2 absolute top-2 right-2 z-10"
            style={{ background: 'rgba(8,17,32,0.8)' }}
            onClick={onClose}
            aria-label="Close dossier"
            autoFocus
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-5 -mt-6 relative">
          <div className="font-display text-xl font-bold leading-tight" style={{ color: tierColor }}>
            {def.name}
          </div>
          {def.title && <div className="text-xs italic text-(--color-mist) mt-0.5">{def.title}</div>}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="chip font-bold uppercase tracking-wider" style={{ color: tierColor }}>
              {TIER_LABEL[def.tier]}
            </span>
            <span className="chip text-(--color-dim)">{ACT_NAME[def.act]}</span>
          </div>
          {def.lore && <p className="text-sm leading-relaxed text-(--color-foam) mt-3">{def.lore}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
