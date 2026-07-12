import { motion } from 'framer-motion';
import { Shield, Swords, ChevronsUp, CloudFog, Users, Moon, HelpCircle } from 'lucide-react';
import type { BattleState, EnemyState } from '../../engine/types';
import { ENEMIES } from '../../content/enemies';
import { enemyKey, previewEnemyMove, previewPlayerAttack, getStatus } from '../../engine/battle';
import { ArtImage } from './Art';
import { StatusChips } from './StatusChips';
import { fxTargetRef } from '../fxRegistry';
// (root registers as `hit:e<uid>` so drag-to-play can hit-test drop points)
import type { Amount } from '../../engine/types';

// min(vw, vh) keeps creatures proportional in landscape phones, where width
// is plentiful but height is scarce
const SIZE: Record<string, string> = {
  sm: 'clamp(40px, min(12vw, 12vh), 72px)',
  md: 'clamp(50px, min(15vw, 15vh), 92px)',
  lg: 'clamp(62px, min(19vw, 18vh), 118px)',
  xl: 'clamp(80px, min(24vw, 21vh), 150px)',
};

function IntentBadge({ bs, e }: { bs: BattleState; e: EnemyState }) {
  const def = ENEMIES[e.defId];
  const mv = def.moves[e.moveId];
  if (!mv) return null;
  const atk = previewEnemyMove(bs, e);
  const label = mv.name;
  const icons: Record<string, React.ReactNode> = {
    attack: <Swords size={13} />,
    block: <Shield size={13} />,
    buff: <ChevronsUp size={13} />,
    debuff: <CloudFog size={13} />,
    attackBlock: <Swords size={13} />,
    attackDebuff: <Swords size={13} />,
    summon: <Users size={13} />,
    sleep: <Moon size={13} />,
    unknown: <HelpCircle size={13} />,
  };
  const isAttack = !!atk;
  return (
    <div
      className="intent"
      style={{
        color: isAttack ? 'var(--color-danger)' : 'var(--color-mist)',
        borderColor: isAttack ? 'rgba(255,111,111,0.4)' : 'rgba(95,185,255,0.28)',
      }}
      title={`Intent: ${label}`}
      aria-label={`intent: ${label}${atk ? `, ${atk.dmg}${atk.times > 1 ? ` times ${atk.times}` : ''} damage` : ''}`}
    >
      {icons[mv.intent]}
      {atk ? (
        <span>
          {atk.dmg}
          {atk.times > 1 && <span className="opacity-80">×{atk.times}</span>}
        </span>
      ) : (
        <span className="text-[10px] font-bold tracking-wide">{mv.intent === 'sleep' || mv.intent === 'unknown' ? label : ''}</span>
      )}
      {(mv.intent === 'attackDebuff' || mv.intent === 'debuff') && <CloudFog size={11} className="opacity-70" />}
    </div>
  );
}

interface EnemyViewProps {
  bs: BattleState;
  e: EnemyState;
  targeting: boolean;
  /** a dragged card is currently hovering this enemy */
  hovered?: boolean;
  previewAmount?: Amount | null;
  previewTimes?: number;
  onPick: () => void;
  /** tap outside of targeting opens the dossier; omit to disable */
  onInspect?: () => void;
  reduced: boolean;
}

export function EnemyView({ bs, e, targeting, hovered, previewAmount, previewTimes = 1, onPick, onInspect, reduced }: EnemyViewProps) {
  const def = ENEMIES[e.defId];
  const hpFrac = e.hp / e.maxHp;
  const preview = previewAmount ? previewPlayerAttack(bs, previewAmount, e) : null;
  // Hearthstone-style kill marker while drag-hovering: block soaks before HP
  const lethal = hovered && preview !== null && preview * previewTimes >= e.hp + e.block;

  return (
    <motion.div
      ref={fxTargetRef(`hit:e${e.uid}`)}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 26, filter: 'blur(4px)' }}
      transition={{ duration: 0.35 }}
      className={[
        'relative flex flex-col items-center gap-1 px-1 select-none',
        targeting || onInspect ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={(ev) => {
        if (targeting) {
          onPick();
        } else if (onInspect) {
          // don't let the tap bubble to the battlefield (which plays selected skills)
          ev.stopPropagation();
          onInspect();
        }
      }}
      role={targeting || onInspect ? 'button' : undefined}
      aria-label={`${def.name}, ${e.hp} of ${e.maxHp} HP${targeting ? ', tap to target' : onInspect ? ', tap for dossier' : ''}`}
      data-testid={`enemy-${e.uid}`}
    >
      {targeting && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-20"
          animate={reduced ? undefined : { y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          aria-hidden
        >
          <svg width="24" height="17" viewBox="0 0 24 17" style={{ filter: `drop-shadow(0 0 6px ${hovered ? 'rgba(255,206,92,0.9)' : 'rgba(255,111,111,0.8)'})` }}>
            <path d="M2 1 L22 1 L12 16 Z" fill={hovered ? 'var(--color-gold)' : 'var(--color-danger)'} stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
      <IntentBadge bs={bs} e={e} />
      <div
        ref={fxTargetRef(enemyKey(e))}
        className="relative flex items-center justify-center"
        style={{ width: SIZE[def.size ?? 'md'], height: SIZE[def.size ?? 'md'] }}
      >
        {(targeting || hovered) && (
          <div
            className={`absolute inset-[-10px] rounded-full border-2 pointer-events-none ${hovered ? '' : 'animate-pulse'}`}
            style={
              hovered
                ? { borderColor: 'var(--color-gold)', boxShadow: '0 0 30px rgba(255,206,92,0.65)', background: 'rgba(255,206,92,0.08)' }
                : { borderColor: 'var(--color-danger)', boxShadow: '0 0 22px rgba(255,111,111,0.4)' }
            }
          />
        )}
        <motion.div
          animate={reduced ? undefined : { y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3.2 + (e.uid % 3) * 0.5, ease: 'easeInOut' }}
          className="w-full h-full flex items-center justify-center"
          style={{ color: def.tier === 'boss' ? 'var(--color-lure)' : def.tier === 'elite' ? 'var(--color-gold)' : 'var(--color-mist)' }}
        >
          <ArtImage
            kind="enemies"
            id={e.defId}
            icon={def.icon}
            className="w-full h-full object-cover rounded-full border border-white/10 shadow-[0_8px_24px_rgba(2,6,14,0.6)]"
            iconSize="100%"
            alt={def.name}
          />
        </motion.div>
        {lethal && (
          <motion.div
            initial={reduced ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-full bg-black/50" />
            <svg
              viewBox="0 0 40 40"
              style={{ width: '70%', height: '70%', filter: 'drop-shadow(0 0 9px rgba(255,60,60,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}
            >
              <path d="M9 9 L31 31 M31 9 L9 31" stroke="var(--color-danger)" strokeWidth="7.5" strokeLinecap="round" />
              <path d="M9 9 L31 31 M31 9 L9 31" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.55" />
            </svg>
          </motion.div>
        )}
        {preview !== null && (
          <div
            className="absolute -right-1 -top-1 chip font-black"
            style={{ color: 'var(--color-danger)', borderColor: 'rgba(255,111,111,0.5)' }}
            aria-label={`would deal ${preview}${previewTimes > 1 ? ` times ${previewTimes}` : ''} damage${lethal ? ', lethal' : ''}`}
          >
            −{preview}{previewTimes > 1 ? `×${previewTimes}` : ''}
          </div>
        )}
      </div>
      <div className="w-[92px] max-w-[24vw]">
        <div className="bar" aria-hidden>
          <div
            className={['fill', hpFrac < 0.3 ? 'hp-low' : hpFrac < 0.65 ? 'hp-mid' : ''].join(' ')}
            style={{ width: `${hpFrac * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold mt-0.5">
          <span>{e.hp}/{e.maxHp}</span>
          {e.block > 0 && (
            <span className="chip" style={{ color: 'var(--color-shield)' }}>
              <Shield size={10} /> {e.block}
            </span>
          )}
        </div>
      </div>
      <StatusChips creature={e} />
      <div className="text-[10px] uppercase tracking-[0.14em] text-(--color-dim) font-semibold">{def.name}</div>
    </motion.div>
  );
}
