// Voyage log (stats + run history + daily history), trophies, settings,
// how-to-play, and credits.

import { ArrowLeft } from 'lucide-react';
import { useGame, type Screen } from '../../state/store';
import { ACHIEVEMENTS, ASCENSIONS } from '../../content/meta';
import { CHARACTERS } from '../../content/characters';
import { KEYWORDS } from '../../content/keywords';
import { GameIcon, STATUS_META } from '../icons';
import { ConfirmButton } from '../components/Bits';
import { highlightText } from '../components/CardView';

function Shell({ title, children, back = 'menu' }: { title: string; children: React.ReactNode; back?: Screen }) {
  const go = useGame((s) => s.go);
  return (
    <div className="min-h-dvh app-bg flex flex-col items-center p-4 gap-4 overflow-y-auto">
      <div className="w-full max-w-2xl flex items-center gap-2 pt-[env(safe-area-inset-top)]">
        <button className="btn !p-2" onClick={() => go(back)} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-xl font-bold tracking-wide">{title}</h1>
      </div>
      <div className="w-full max-w-2xl flex flex-col gap-4 pb-8">{children}</div>
    </div>
  );
}

export function StatsScreen() {
  const meta = useGame((s) => s.meta);
  const totalWins = Object.values(meta.wins).reduce((a, b) => a + b, 0);
  return (
    <Shell title="Voyage Log">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['Dives', meta.runsPlayed],
          ['Victories', totalWins],
          ['Best score', meta.bestScore],
          ['Fathoms', meta.fathoms],
        ].map(([label, v]) => (
          <div key={label} className="panel p-3 text-center">
            <div className="text-xl font-bold" style={{ color: 'var(--color-glow)' }}>{v}</div>
            <div className="text-[10px] uppercase tracking-widest text-(--color-dim)">{label}</div>
          </div>
        ))}
      </div>

      {meta.dailyHistory.length > 0 && (
        <div className="panel p-3">
          <h2 className="font-bold text-sm mb-2">Daily Dives</h2>
          {meta.dailyHistory.slice(0, 10).map((d, i) => (
            <div key={i} className="flex justify-between text-xs py-1 border-b border-(--color-abyss-700) last:border-0">
              <span className="text-(--color-mist)">{d.date}</span>
              <span>{d.result === 'win' ? '🏆' : `floor ${d.floor}`}</span>
              <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{d.score}</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel p-3">
        <h2 className="font-bold text-sm mb-2">Recent runs</h2>
        {meta.runHistory.length === 0 && <p className="text-xs text-(--color-dim)">No dives yet. The trench is patient.</p>}
        {meta.runHistory.slice(0, 15).map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-(--color-abyss-700) last:border-0">
            <span style={{ color: CHARACTERS[r.charId].color }}>
              <GameIcon id={CHARACTERS[r.charId].icon} size={14} />
            </span>
            <span className={r.result === 'win' ? 'text-(--color-glow) font-bold' : 'text-(--color-danger)'}>
              {r.result === 'win' ? 'WON' : 'LOST'}
            </span>
            <span className="text-(--color-mist)">
              {r.daily ? 'daily · ' : r.ascension > 0 ? `D${r.ascension} · ` : ''}
              act {r.act}, floor {r.floor}
              {r.killedBy ? ` · ${r.killedBy}` : ''}
            </span>
            <span className="flex-1" />
            <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{r.score}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function AchievementsScreen() {
  const meta = useGame((s) => s.meta);
  const earned = Object.keys(meta.achievements).length;
  return (
    <Shell title={`Trophies — ${earned}/${Object.keys(ACHIEVEMENTS).length}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.values(ACHIEVEMENTS).map((a) => {
          const got = !!meta.achievements[a.id];
          return (
            <div key={a.id} className={`panel p-3 flex items-center gap-3 ${got ? '' : 'opacity-45'}`}>
              <div
                className="w-11 h-11 rounded-full border flex items-center justify-center shrink-0"
                style={{ borderColor: got ? 'var(--color-gold)' : 'var(--color-abyss-600)', color: got ? 'var(--color-gold)' : 'var(--color-dim)' }}
              >
                <GameIcon id={a.icon} size={22} />
              </div>
              <div>
                <div className="font-bold text-sm">{a.name}</div>
                <div className="text-[11px] text-(--color-mist)">{a.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

export function SettingsScreen() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const resetSave = useGame((s) => s.resetSave);
  const run = useGame((s) => s.run);
  const go = useGame((s) => s.go);
  const abandonRun = useGame((s) => s.abandonRun);
  const inRun = !!run && !run.result;
  const backTo: Screen = run?.battle ? 'battle' : run?.shop ? 'shop' : run?.eventId ? 'event' : run?.reward ? 'reward' : inRun ? 'map' : 'menu';

  return (
    <Shell title="Settings" back={backTo}>
      <div className="panel p-4 flex flex-col gap-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Volume</span>
          <input
            type="range" min={0} max={1} step={0.05} value={settings.volume}
            onChange={(e) => setSettings({ volume: Number(e.target.value) })}
            className="w-40 accent-(--color-glow)"
            aria-label="Master volume"
          />
        </label>
        {([
          ['sfx', 'Sound effects'],
          ['music', 'Ambient music'],
          ['fastMode', 'Fast enemy turns'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between text-sm cursor-pointer">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={settings[key] as boolean}
              onChange={(e) => setSettings({ [key]: e.target.checked })}
              className="w-5 h-5 accent-(--color-glow)"
            />
          </label>
        ))}
        <label className="flex items-center justify-between text-sm">
          <span>Reduced motion</span>
          <select
            value={settings.reducedMotion}
            onChange={(e) => setSettings({ reducedMotion: e.target.value as 'auto' | 'on' | 'off' })}
            className="bg-(--color-abyss-800) border border-(--color-abyss-600) rounded-lg px-2 py-1"
          >
            <option value="auto">Follow system</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>

      {inRun && (
        <div className="panel p-4 flex flex-col gap-2">
          <h2 className="font-bold text-sm">Current run</h2>
          <p className="text-xs text-(--color-mist)">Your run is saved automatically — close the tab any time and resume later.</p>
          <ConfirmButton label="Abandon run" confirmLabel="Really abandon? Counts as a loss" onConfirm={() => { abandonRun(); go('menu'); }} className="btn-danger self-start" />
        </div>
      )}

      <div className="panel p-4 flex flex-col gap-2">
        <h2 className="font-bold text-sm text-(--color-danger)">Danger zone</h2>
        <p className="text-xs text-(--color-mist)">Erases all progress: unlocks, trophies, history, the works.</p>
        <ConfirmButton label="Reset all save data" confirmLabel="Really erase EVERYTHING?" onConfirm={resetSave} className="btn-danger self-start" />
      </div>
    </Shell>
  );
}

export function HowToPlayScreen() {
  return (
    <Shell title="How to Play">
      <div className="panel p-4 text-sm leading-relaxed flex flex-col gap-3 text-(--color-mist)">
        <p>
          <b className="text-(--color-foam)">The run.</b> Descend a branching trench across three acts. Each node is a battle, a shop,
          a rest vent, treasure, or something stranger. Your HP persists between fights — the run ends when it hits zero. Reach and
          defeat the boss at the bottom of Act III to win.
        </p>
        <p>
          <b className="text-(--color-foam)">Battles.</b> {highlightText('Each turn you draw 5 cards and get 3 Energy. Attacks hit; skills Block or bend the fight; Powers install permanent engines. Play a card by tapping it, or drag it out of your hand Hearthstone-style — drop attacks straight onto your target. Enemies telegraph their next move — the number over their head is exactly what you will take. Block absorbs it but washes away at the start of your next turn.')}
        </p>
        <p>
          <b className="text-(--color-foam)">The tide.</b> {highlightText('A four-phase cycle (Low → Rising → High → Falling) that advances every turn. Flood cards hit harder at High tide; Ebb cards guard better at Low. Shift cards move the cycle on your schedule — time your haymakers.')}
        </p>
        <p>
          <b className="text-(--color-foam)">Build your deck.</b> After fights, add one of three cards — or skip; thin decks are
          reliable decks. Shops remove cards. Rest vents heal <i>or</i> upgrade. Relics bend the rules all run. The best runs make
          the tide, the toxin, and the relics agree on a plan.
        </p>
        <p>
          <b className="text-(--color-foam)">Forever.</b> Every dive earns fathoms toward permanent unlocks, win or drown. Winning
          opens deeper Depths (harder modifiers) and the Daily Dive is one seeded trench, the same for everyone, every day.
        </p>
      </div>

      <div className="panel p-4">
        <h2 className="font-bold text-sm mb-2">Keywords</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {Object.values(KEYWORDS).map((k) => (
            <div key={k.id} className="flex items-start gap-2 text-xs">
              {STATUS_META[k.id] ? (
                <span className="mt-0.5 shrink-0" style={{ color: STATUS_META[k.id].color }}>
                  <GameIcon id={STATUS_META[k.id].icon} size={13} />
                </span>
              ) : (
                <span className="w-[13px] shrink-0" />
              )}
              <p className="text-(--color-mist)">
                <span className="font-bold text-(--color-foam)">{k.name}.</span> {k.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <h2 className="font-bold text-sm mb-2">Depths (after your first win)</h2>
        {ASCENSIONS.map((a) => (
          <div key={a.level} className="text-xs py-0.5 text-(--color-mist)">
            <b className="text-(--color-foam)">D{a.level}.</b> {a.text}
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function CreditsScreen() {
  return (
    <Shell title="Credits & Licenses">
      <div className="panel p-4 text-sm flex flex-col gap-3 text-(--color-mist)">
        <p>
          <b className="text-(--color-foam)">UNDERTOW</b> — a singleplayer deep-sea roguelite deckbuilder. Built entirely from code:
          every visual is SVG/CSS/Canvas, every sound is synthesized at runtime. No servers, no accounts, no tracking; your save
          lives in this browser.
        </p>
        <div>
          <b className="text-(--color-foam)">Iconography</b>
          <p className="text-xs mt-1">
            Card, relic, and creature art from <a className="underline text-(--color-glow)" href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a>,
            licensed <a className="underline" href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.
            Icons by Lorc, Delapouite, Skoll, Caro Asercion, and the game-icons.net contributors — thank you.
            Interface icons from <a className="underline text-(--color-glow)" href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a> (ISC license).
          </p>
        </div>
        <div>
          <b className="text-(--color-foam)">Audio</b>
          <p className="text-xs mt-1">
            Sound effects synthesized with <a className="underline text-(--color-glow)" href="https://github.com/KilledByAPixel/ZzFX" target="_blank" rel="noreferrer">ZzFX</a> by
            Frank Force (public domain / MIT). Ambient music generated live with the Web Audio API.
          </p>
        </div>
        <div>
          <b className="text-(--color-foam)">Built with</b>
          <p className="text-xs mt-1">React, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion, react-icons — all MIT/ISC licensed. Designed & implemented by a game-loving AI, directed by a human.</p>
        </div>
      </div>
    </Shell>
  );
}
