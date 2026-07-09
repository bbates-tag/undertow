// Run setup: choose a character, a Depth (ascension), or take today's Daily Dive.

import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Lock, Play, Sun } from 'lucide-react';
import type { CharacterId } from '../../engine/types';
import { useGame } from '../../state/store';
import { CHARACTERS } from '../../content/characters';
import { ASCENSIONS, DAILY_MODS } from '../../content/meta';
import { todayKey } from '../../lib/util';
import { GameIcon } from '../icons';
import { ArtImage } from '../components/Art';
import { ConfirmButton } from '../components/Bits';

export function NewRunScreen() {
  const go = useGame((s) => s.go);
  const meta = useGame((s) => s.meta);
  const run = useGame((s) => s.run);
  const startRun = useGame((s) => s.startRun);
  const startDaily = useGame((s) => s.startDaily);
  const [charId, setCharId] = useState<CharacterId>('tidecaller');
  const [depth, setDepth] = useState(0);
  const [mode, setMode] = useState<'standard' | 'daily'>('standard');

  const maxDepth = meta.ascension[charId] ?? 0;
  const clampedDepth = Math.min(depth, maxDepth);
  const dailyToday = meta.dailyHistory.find((d) => d.date === todayKey());
  const hasActiveRun = !!run && !run.result;
  const dailySeedRng = todayKey();

  const begin = () => {
    if (mode === 'daily') startDaily(charId);
    else startRun(charId, clampedDepth);
  };

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center px-4 py-6 gap-4 overflow-y-auto">
      <div className="w-full max-w-xl flex items-center gap-2 pt-[env(safe-area-inset-top)]">
        <button className="btn !p-2" onClick={() => go('menu')} aria-label="Back to menu">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-xl font-bold tracking-wide">Prepare the Dive</h1>
      </div>

      {/* mode tabs */}
      <div className="flex gap-2 w-full max-w-xl">
        <button className={`btn flex-1 ${mode === 'standard' ? 'btn-primary' : ''}`} onClick={() => setMode('standard')}>
          Standard
        </button>
        <button className={`btn flex-1 ${mode === 'daily' ? 'btn-primary' : ''}`} onClick={() => setMode('daily')}>
          <Sun size={14} /> Daily Dive
        </button>
      </div>

      {/* character select */}
      <div className="grid sm:grid-cols-2 gap-3 w-full max-w-xl">
        {Object.values(CHARACTERS).map((ch) => {
          const locked = !meta.unlockedChars.includes(ch.id);
          const active = charId === ch.id && !locked;
          return (
            <button
              key={ch.id}
              className={`panel p-4 text-left transition-all ${active ? 'char-selected' : ''} ${locked ? 'opacity-55' : active ? '' : 'opacity-75 hover:opacity-100 hover:scale-[1.015]'}`}
              style={active ? ({ ['--sel' as string]: ch.color } as React.CSSProperties) : undefined}
              onClick={() => !locked && setCharId(ch.id)}
              disabled={locked}
              aria-pressed={active}
              aria-label={locked ? `${ch.name}, locked — defeat the Act 1 boss to unlock` : `select ${ch.name}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-20 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden" style={{ borderColor: ch.color, color: ch.color, background: 'rgba(8,17,32,0.7)' }}>
                  {locked ? <Lock size={20} /> : <ArtImage kind="characters" id={ch.id} icon={ch.icon} className="w-full h-full object-cover object-top" iconSize={30} alt={ch.name} />}
                </div>
                <div>
                  <div className="font-display font-bold">{ch.name}</div>
                  <div className="text-[11px] italic text-(--color-dim)">{ch.title}</div>
                </div>
              </div>
              {locked ? (
                <p className="text-xs text-(--color-mist)">Defeat the Act I boss to recruit the eel-blooded.</p>
              ) : (
                <>
                  <p className="text-xs text-(--color-mist) mb-1">{ch.blurb}</p>
                  <p className="text-[11px] text-(--color-glow)">{ch.mechanic}</p>
                  <p className="text-[11px] text-(--color-dim) mt-1">{ch.maxHp} HP · {meta.wins[ch.id] ?? 0} wins</p>
                </>
              )}
            </button>
          );
        })}
      </div>

      {mode === 'standard' ? (
        <div className="panel p-4 w-full max-w-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Depth {clampedDepth}</div>
              <div className="text-xs text-(--color-mist)">
                {clampedDepth === 0 ? 'The standard descent.' : ASCENSIONS[clampedDepth - 1].text}
              </div>
              {maxDepth === 0 && <div className="text-[11px] text-(--color-dim) mt-1">Win a run to unlock deeper, harder dives.</div>}
            </div>
            <div className="flex flex-col gap-1">
              <button className="btn !p-1.5" disabled={clampedDepth >= maxDepth} onClick={() => setDepth(clampedDepth + 1)} aria-label="Increase depth">
                <ChevronUp size={15} />
              </button>
              <button className="btn !p-1.5" disabled={clampedDepth <= 0} onClick={() => setDepth(clampedDepth - 1)} aria-label="Decrease depth">
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
          {clampedDepth > 1 && (
            <p className="text-[11px] text-(--color-dim) mt-2">
              Includes all shallower penalties: {ASCENSIONS.slice(0, clampedDepth).map((a) => a.text).join(' ')}
            </p>
          )}
        </div>
      ) : (
        <div className="panel p-4 w-full max-w-xl">
          <div className="font-bold text-sm mb-1">Today's trench — {dailySeedRng}</div>
          <p className="text-xs text-(--color-mist) mb-2">
            One seeded run, the same for every diver today. Two twists apply:
          </p>
          <div className="flex flex-col gap-1.5">
            {Object.values(DAILY_MODS).length > 0 &&
              dailyModsForToday().map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="text-(--color-glow) font-bold">{m.name}.</span>{' '}
                  <span className="text-(--color-mist)">{m.text}</span>
                </div>
              ))}
          </div>
          {dailyToday && (
            <p className="text-xs mt-2 text-(--color-gold)">
              Completed today — score {dailyToday.score}. Come back after midnight for a new trench.
            </p>
          )}
        </div>
      )}

      {hasActiveRun ? (
        <div className="flex flex-col items-center gap-1">
          <ConfirmButton
            label="Abandon current run & dive"
            confirmLabel="Sure? The current run counts as a loss"
            onConfirm={() => {
              useGame.getState().abandonRun();
              begin();
            }}
            className="btn-danger"
          />
        </div>
      ) : (
        <button
          className="btn btn-primary text-lg !px-8 !py-3"
          onClick={begin}
          disabled={mode === 'daily' && !!dailyToday}
        >
          <Play size={18} /> {mode === 'daily' ? 'Dive the Daily' : 'Begin the Descent'}
        </button>
      )}
    </div>
  );
}

import { makeRng, hashSeed } from '../../lib/rng';

function dailyModsForToday() {
  const seed = `undertow-daily-${todayKey()}`;
  const rng = makeRng(hashSeed(seed + '-mods'));
  const ids = rng.shuffle(Object.keys(DAILY_MODS)).slice(0, 2);
  return ids.map((id) => DAILY_MODS[id]);
}
