// Small shared UI pieces: toasts, resource chips, ambient bubbles, modal shell.

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Coins, X } from 'lucide-react';
import { useGame } from '../../state/store';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+8px)] left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 items-center pointer-events-none w-[min(92vw,420px)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel px-4 py-2 text-sm font-semibold text-center"
            style={{
              borderColor:
                t.kind === 'achievement' ? 'rgba(255,206,92,0.5)' :
                t.kind === 'unlock' ? 'rgba(56,225,211,0.5)' :
                t.kind === 'relic' ? 'rgba(180,143,255,0.5)' : undefined,
            }}
            role="status"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function HpChip({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <span className="chip" style={{ color: hp / maxHp < 0.3 ? 'var(--color-danger)' : 'var(--color-foam)' }} aria-label={`${hp} of ${maxHp} HP`}>
      <Heart size={12} style={{ color: 'var(--color-danger)' }} fill="currentColor" />
      {hp}/{maxHp}
    </span>
  );
}

export function GoldChip({ gold }: { gold: number }) {
  return (
    <span className="chip" style={{ color: 'var(--color-gold)' }} aria-label={`${gold} gold`}>
      <Coins size={12} />
      {gold}
    </span>
  );
}

/** ambient rising bubbles — pure CSS animation, capped count, seeded per mount */
export function Bubbles({ count = 14 }: { count?: number }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 9,
        dur: 9 + Math.random() * 14,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 80,
        op: 0.15 + Math.random() * 0.3,
        key: i,
      })),
    [count],
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {bubbles.map((b) => (
        <div
          key={b.key}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            ['--bub-drift' as string]: `${b.drift}px`,
            ['--bub-op' as string]: b.op,
          }}
        />
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title?: string; onClose?: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className={`panel p-4 max-h-[86dvh] overflow-y-auto ${wide ? 'w-[min(96vw,760px)]' : 'w-[min(94vw,460px)]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold tracking-wide">{title}</h2>
            {onClose && (
              <button className="btn !p-2" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

/** double-tap confirm button for destructive actions */
export function ConfirmButton({ label, confirmLabel, onConfirm, className }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`btn ${armed ? 'btn-danger' : ''} ${className ?? ''}`}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
          setTimeout(() => setArmed(false), 2600);
        }
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
