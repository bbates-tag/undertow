// Victory & game-over: score breakdown, fathoms earned, unlocks, next steps.

import { Anchor, Home, RotateCcw } from 'lucide-react';
import { useGame } from '../../state/store';
import { scoreRun } from '../../engine/run';
import { CHARACTERS } from '../../content/characters';
import { Bubbles } from '../components/Bits';

function ScorePanel() {
  const run = useGame((s) => s.run);
  const newlyUnlocked = useGame((s) => s.newlyUnlocked);
  if (!run) return null;
  const s = run.stats;
  const score = scoreRun(run);
  const rows: [string, number][] = [
    [`Depth reached (${s.floorsClimbed} floors)`, s.floorsClimbed * 8],
    [`Creatures slain (${s.kills})`, s.kills * 3],
    [`Elites (${s.elitesKilled})`, s.elitesKilled * 20],
    [`Bosses (${s.bossesKilled})`, s.bossesKilled * 60],
    [`Flawless fights (${s.battlesFlawless})`, s.battlesFlawless * 10],
    ['Gold purse', Math.round(run.gold / 5)],
  ];
  if (run.ascension > 0) rows.push([`Depth ${run.ascension} bravery`, run.ascension * 15]);
  if (run.result === 'win') rows.push(['Survived the Drowned God', 150 + run.hp]);

  return (
    <div className="panel p-4 w-[min(92vw,380px)] text-sm">
      {rows.filter(([, v]) => v > 0).map(([label, v]) => (
        <div key={label} className="flex justify-between py-0.5">
          <span className="text-(--color-mist)">{label}</span>
          <span className="font-bold">{v}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-(--color-abyss-600) mt-2 pt-2 font-bold">
        <span>Score</span>
        <span style={{ color: 'var(--color-gold)' }}>{score}</span>
      </div>
      <div className="flex justify-between text-xs text-(--color-glow) mt-1">
        <span>Fathoms earned (unlock progress)</span>
        <span>+{score}</span>
      </div>
      {newlyUnlocked.length > 0 && (
        <div className="mt-3 border-t border-(--color-abyss-600) pt-2">
          {newlyUnlocked.map((u) => (
            <div key={u} className="text-xs font-bold text-(--color-glow) py-0.5">
              ★ UNLOCKED: {u}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EndButtons() {
  const go = useGame((s) => s.go);
  return (
    <div className="flex gap-3">
      <button className="btn btn-primary" onClick={() => go('newRun')}>
        <RotateCcw size={15} /> One more dive
      </button>
      <button className="btn" onClick={() => go('menu')}>
        <Home size={15} /> Surface
      </button>
    </div>
  );
}

export function GameOverScreen() {
  const run = useGame((s) => s.run);
  if (!run) return null;
  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-4 p-4" data-act={run.act}>
      <h1 className="font-display text-3xl font-bold tracking-[0.25em] pl-[0.25em]" style={{ color: 'var(--color-danger)', textShadow: '0 0 30px rgba(255,111,111,0.4)' }}>
        DROWNED
      </h1>
      <p className="text-(--color-mist) text-sm italic -mt-2">
        {run.killedBy ? `Taken by ${run.killedBy}, ${run.floor * 15}m down.` : 'The trench keeps what it catches.'}
      </p>
      <ScorePanel />
      <p className="text-xs text-(--color-dim) max-w-[340px] text-center">
        Every dive earns fathoms — dead or alive. Spend nothing; unlocks are forever.
      </p>
      <EndButtons />
    </div>
  );
}

export function VictoryScreen() {
  const run = useGame((s) => s.run);
  if (!run) return null;
  const ch = CHARACTERS[run.charId];
  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-4 p-4 relative overflow-hidden">
      <Bubbles count={26} />
      <h1 className="font-display text-3xl font-bold tracking-[0.25em] pl-[0.25em] relative z-10" style={{ color: 'var(--color-glow)', textShadow: '0 0 38px rgba(56,225,211,0.6)' }}>
        THE TIDE TURNS
      </h1>
      <p className="text-(--color-mist) text-sm italic -mt-2 relative z-10 text-center max-w-sm">
        The Drowned God sinks back into its dream. {ch.name} rises through {run.floor * 15} meters of silence, alive.
      </p>
      <ScorePanel />
      <p className="text-xs text-(--color-gold) relative z-10">Depth {run.ascension + 1} is now open — a crueler trench awaits.</p>
      <EndButtons />
    </div>
  );
}
