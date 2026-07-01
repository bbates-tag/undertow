// Consumes the store's fx queue and turns it into damage floaters, canvas
// particles, screen shake, and tide banners. All juice flows through here.

import { useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useGame } from '../../state/store';
import { fxTargetCenter } from '../fxRegistry';
import { TIDE_NAMES } from '../../engine/types';
import { STATUS_META } from '../icons';

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  icon?: 'shield';
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  r: number; color: string; shape: 'spark' | 'bubble' | 'ring';
}

const BURST_COLORS: Record<string, string> = {
  hit: '#ff6f6f',
  ink: '#43678f',
  pearl: '#dcedf6',
  bone: '#e8e0c8',
  status: '#38e1d3',
};

export function FxLayer({ shakeTarget, reduced }: { shakeTarget: RefObject<HTMLElement | null>; reduced: boolean }) {
  const fx = useGame((s) => s.fx);
  const clearFxBefore = useGame((s) => s.clearFxBefore);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [tideBanner, setTideBanner] = useState<string | null>(null);
  const lastId = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);

  // particle loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    let running = true;
    const tick = () => {
      if (!running) return;
      const ps = particles.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ps.length) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          p.life -= 1;
          if (p.life <= 0) {
            ps.splice(i, 1);
            continue;
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.shape === 'bubble') p.vy -= 0.06;
          else p.vy += 0.12;
          const a = p.life / p.maxLife;
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color;
          ctx.fillStyle = p.color;
          const dpr = devicePixelRatio;
          if (p.shape === 'ring') {
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.arc(p.x * dpr, p.y * dpr, p.r * (1 + (1 - a) * 3) * dpr, 0, Math.PI * 2);
            ctx.stroke();
          } else if (p.shape === 'bubble') {
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(p.x * dpr, p.y * dpr, p.r * a * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const fresh = fx.filter((f) => f.id > lastId.current);
    if (!fresh.length) return;
    lastId.current = fx[fx.length - 1].id;

    const newFloaters: Floater[] = [];
    let stagger = 0;
    for (const f of fresh) {
      const jitter = () => (Math.random() - 0.5) * 34;
      const spawn = (key: string, text: string, color: string, size = 22, icon?: 'shield') => {
        const pos = fxTargetCenter(key);
        if (!pos) return;
        newFloaters.push({ id: f.id * 100 + newFloaters.length, x: pos.x + jitter(), y: pos.y + jitter() * 0.5 - stagger * 8, text, color, size, icon });
        stagger += 1;
      };
      switch (f.kind) {
        case 'dmg':
          spawn(f.target, `−${f.amount}`, f.target === 'player' ? '#ff6f6f' : '#ffdfdf', f.amount >= 12 ? 30 : 22);
          break;
        case 'blocked':
          spawn(f.target, `${f.amount}`, '#5fb9ff', 17, 'shield');
          break;
        case 'block':
          spawn(f.target, `+${f.amount}`, '#5fb9ff', 18, 'shield');
          break;
        case 'heal':
          spawn(f.target, `+${f.amount}`, '#7ef29a', 20);
          break;
        case 'gold':
          spawn(f.target, `+${f.amount}`, '#ffce5c', 18);
          break;
        case 'status': {
          const meta = STATUS_META[f.status];
          spawn(f.target, `${f.amount > 0 ? '+' : ''}${f.amount} ${meta?.name ?? f.status}`, 'var(--color-glow)', 13);
          break;
        }
        case 'burst': {
          if (reduced) break;
          const pos = fxTargetCenter(f.target);
          if (!pos) break;
          const n = Math.min(f.n ?? 10, 26);
          for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = f.shape === 'bubble' ? 0.6 + Math.random() * 1.4 : 1.5 + Math.random() * 3.4;
            particles.current.push({
              x: pos.x, y: pos.y,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - (f.shape === 'bubble' ? 0.5 : 0.8),
              life: 34 + Math.random() * 22,
              maxLife: 56,
              r: f.shape === 'ring' ? 8 : 1.6 + Math.random() * 2.6,
              color: BURST_COLORS[f.color] ?? BURST_COLORS.status,
              shape: f.shape ?? 'spark',
            });
          }
          break;
        }
        case 'shake': {
          if (reduced) break;
          const el = shakeTarget.current;
          if (el) {
            const cls = f.strength > 0.6 ? 'shake-l' : 'shake-s';
            el.classList.remove('shake-s', 'shake-l');
            void el.offsetWidth; // restart animation
            el.classList.add(cls);
            setTimeout(() => el.classList.remove(cls), 400);
          }
          break;
        }
        case 'tide': {
          if (f.tide === 2 || f.tide === 0) {
            setTideBanner(f.tide === 2 ? 'HIGH TIDE' : 'LOW TIDE');
            setTimeout(() => setTideBanner(null), 1400);
          }
          break;
        }
      }
    }
    if (newFloaters.length) {
      setFloaters((cur) => [...cur.slice(-14), ...newFloaters]);
      const ids = new Set(newFloaters.map((f) => f.id));
      setTimeout(() => setFloaters((cur) => cur.filter((f) => !ids.has(f.id))), 1100);
    }
    if (fx.length > 60) clearFxBefore(fx[fx.length - 30].id);
  }, [fx, reduced, shakeTarget, clearFxBefore]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[55] w-full h-full" aria-hidden />
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            className="floater"
            initial={{ x: f.x, y: f.y, opacity: 0, scale: 0.6 }}
            animate={{ y: reduced ? f.y : f.y - 46, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1.05, times: [0, 0.15, 0.7, 1] }}
            style={{ color: f.color, fontSize: f.size, left: 0, top: 0 }}
            aria-hidden
          >
            {f.icon === 'shield' && <Shield size={f.size - 4} className="inline mr-0.5 -mt-1" />}
            {f.text}
          </motion.div>
        ))}
        {tideBanner && (
          <motion.div
            key="tide-banner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-[22%] left-0 right-0 text-center pointer-events-none z-[70]"
            role="status"
          >
            <span
              className="font-display text-2xl font-bold tracking-[0.5em] pl-[0.5em]"
              style={{
                color: tideBanner === 'HIGH TIDE' ? 'var(--color-glow)' : 'var(--color-shield)',
                textShadow: '0 0 24px currentColor',
              }}
            >
              {tideBanner}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function tideName(t: number) {
  return TIDE_NAMES[t as 0 | 1 | 2 | 3];
}
