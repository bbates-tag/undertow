// Full-bleed battle backdrop. Boss fights get their own arena art
// (backgrounds/<bossDefId>.webp), everything else the act's depth art
// (backgrounds/act<n>.webp). Until the image loads — or if it's missing —
// the .app-bg gradient underneath shows through, so this layer is pure
// decoration and never blocks the fight.

import { motion } from 'framer-motion';
import { ENEMIES } from '../../content/enemies';
import { useReducedMotion } from '../hooks';
import { useArt } from './Art';

interface BattleBackdropProps {
  act: number;
  enemies: { defId: string }[];
}

export function BattleBackdrop({ act, enemies }: BattleBackdropProps) {
  const reduced = useReducedMotion();
  const bossId = enemies.find((e) => ENEMIES[e.defId]?.tier === 'boss')?.defId;
  const actId = `act${act}`;
  const bossUrl = useArt('backgrounds', bossId ?? actId);
  const actUrl = useArt('backgrounds', actId);
  const url = (bossId ? bossUrl : null) ?? actUrl;

  if (!url) return null;
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden>
      <motion.img
        key={url}
        src={url}
        alt=""
        draggable={false}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.8 }}
      />
      {/* legibility scrim: keeps intents readable up top and the hand fan on a near-solid base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(4,9,19,0.6) 0%, rgba(4,9,19,0.15) 22%, rgba(4,9,19,0.2) 45%, rgba(4,9,19,0.42) 65%, rgba(4,9,19,0.8) 100%)',
        }}
      />
    </div>
  );
}
