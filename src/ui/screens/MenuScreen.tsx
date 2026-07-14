// Title screen: wordmark, light rays, bubbles, and the main navigation.

import { Anchor, BookMarked, BookOpen, ChartColumn, Info, Play, Settings as SettingsIcon, Sun, Trophy } from 'lucide-react';
import { useGame } from '../../state/store';
import { todayKey } from '../../lib/util';
import { Bubbles } from '../components/Bits';

export function MenuScreen() {
  const go = useGame((s) => s.go);
  const run = useGame((s) => s.run);
  const meta = useGame((s) => s.meta);
  const boot = useGame((s) => s.boot);

  const hasRun = !!run && !run.result;
  const dailyDone = meta.dailyHistory.some((d) => d.date === todayKey());

  return (
    <div className="h-dvh app-bg relative overflow-hidden flex flex-col items-center justify-center gap-3 px-6">
      <div className="light-ray" style={{ left: '12%', animationDelay: '0s' }} />
      <div className="light-ray" style={{ left: '38%', animationDelay: '-3s', width: '11vw' }} />
      <div className="light-ray" style={{ left: '64%', animationDelay: '-6s' }} />
      <Bubbles count={18} />

      <div className="text-center mb-2 relative">
        <h1
          className="font-display text-[clamp(2.6rem,10vw,4.5rem)] font-bold tracking-[0.32em] pl-[0.32em] leading-none"
          style={{ color: 'var(--color-glow)', textShadow: '0 0 42px rgba(56,225,211,0.55)' }}
        >
          UNDERTOW
        </h1>
        <svg viewBox="0 0 300 14" className="w-[min(70vw,340px)] mx-auto mt-2 opacity-70" aria-hidden>
          <path d="M0 7 Q 25 0, 50 7 T 100 7 T 150 7 T 200 7 T 250 7 T 300 7" fill="none" stroke="var(--color-glow)" strokeWidth="1.6" />
        </svg>
        <p className="text-(--color-mist) text-sm mt-2 italic font-display">a deck of the deep · descend, adapt, drown less</p>
      </div>

      <div className="flex flex-col gap-2.5 w-[min(86vw,300px)] relative z-10">
        {hasRun && (
          <button className="btn btn-primary text-base !py-3" onClick={boot} aria-label="Continue run">
            <Play size={17} /> Continue Depth {run!.floor}
          </button>
        )}
        <button className={`btn ${hasRun ? '' : 'btn-primary'} text-base !py-3`} onClick={() => go('newRun')}>
          <Anchor size={17} /> New Dive
        </button>
        <button className="btn" onClick={() => go('newRun')} title="Seeded daily run — same trench for everyone today">
          <Sun size={15} /> Daily Dive {dailyDone && <span className="text-(--color-glow) text-xs">✓ done</span>}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn text-sm" onClick={() => go('howToPlay')}>
            <BookOpen size={14} /> How to Play
          </button>
          <button className="btn text-sm" onClick={() => go('stats')}>
            <ChartColumn size={14} /> Voyage Log
          </button>
          <button className="btn text-sm" onClick={() => go('achievements')}>
            <Trophy size={14} /> Trophies
          </button>
          <button className="btn text-sm" onClick={() => go('settings')}>
            <SettingsIcon size={14} /> Settings
          </button>
        </div>
        <button className="btn text-sm" onClick={() => go('compendium')}>
          <BookMarked size={14} /> Compendium
        </button>
        <button className="text-(--color-dim) text-xs underline mx-auto mt-1" onClick={() => go('credits')}>
          <Info size={11} className="inline mr-1" />
          credits & licenses
        </button>
      </div>

      <div className="absolute bottom-3 text-[10px] text-(--color-dim) tracking-wide">
        {meta.fathoms > 0 && <span>{meta.fathoms} fathoms explored · </span>}
        fully offline · no accounts · your tab is the whole ocean
      </div>
    </div>
  );
}
