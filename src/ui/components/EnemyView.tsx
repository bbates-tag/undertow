import { motion } from 'framer-motion';
import { Shield, Swords, ChevronsUp, CloudFog, Users, Moon, HelpCircle } from 'lucide-react';
import type { BattleState, EnemyState } from '../../engine/types';
import { ENEMIES } from '../../content/enemies';
import { enemyKey, previewEnemyMove, previewPlayerAttack, getStatus } from '../../engine/battle';
import { ArtImage } from './Art';
import { StatusChips } from './StatusChips';
import { fxTargetRef } from '../fxRegistry';
import type { Amount } from '../../engine/types';

const SIZE: Record<string, string> = {
  sm: 'clamp(44px, 12vw, 72px)',
  md: 'clamp(58px, 15vw, 92px)',
  lg: 'clamp(72px, 19vw, 118px)',
  xl: 'clamp(96px, 24vw, 150px)',
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
  previewAmount?: Amount | null;
  previewTimes?: number;
  onPick: () => void;
  reduced: boolean;
}

export function EnemyView({ bs, e, targeting, previewAmount, previewTimes = 1, onPick, reduced }: EnemyViewProps) {
  const def = ENEMIES[e.defId];
  const hpFrac = e.hp / e.maxHp;
  const preview = previewAmount ? previewPlayerAttack(bs, previewAmount, e) : null;

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 26, filter: 'blur(4px)' }}
      transition={{ duration: 0.35 }}
      className={[
        'relative flex flex-col items-center gap-1 px-1 select-none',
        targeting ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={() => targeting && onPick()}
      role={targeting ? 'button' : undefined}
      aria-label={`${def.name}, ${e.hp} of ${e.maxHp} HP${targeting ? ', tap to target' : ''}`}
      data-testid={`enemy-${e.uid}`}
    >
      <IntentBadge bs={bs} e={e} />
      <div
        ref={fxTargetRef(enemyKey(e))}
        className="relative flex items-center justify-center"
        style={{ width: SIZE[def.size ?? 'md'], height: SIZE[def.size ?? 'md'] }}
      >
        {targeting && (
          <div
            className="absolute inset-[-10px] rounded-full border-2 animate-pulse pointer-events-none"
            style={{ borderColor: 'var(--color-danger)', boxShadow: '0 0 22px rgba(255,111,111,0.4)' }}
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
        {preview !== null && (
          <div
            className="absolute -right-1 -top-1 chip font-black"
            style={{ color: 'var(--color-danger)', borderColor: 'rgba(255,111,111,0.5)' }}
            aria-label={`would deal ${preview}${previewTimes > 1 ? ` times ${previewTimes}` : ''} damage`}
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
