// The descent map: SVG edges under absolutely-positioned node buttons.
// You start at the surface (top) and dive toward the act boss (bottom).

import { useEffect, useMemo, useRef } from 'react';
import { Layers, Menu as MenuIcon } from 'lucide-react';
import type { MapNode } from '../../engine/types';
import { useGame } from '../../state/store';
import { reachableNodes } from '../../engine/run';
import { hashSeed } from '../../lib/rng';
import { ENEMIES, ENCOUNTERS } from '../../content/enemies';
import { CHARACTERS } from '../../content/characters';
import { GameIcon } from '../icons';
import { GoldChip, HpChip, Bubbles } from '../components/Bits';
import { RelicBar } from '../components/RelicBar';

const COL_W = 62;
const ROW_H = 96;
const PAD_X = 34;
const PAD_Y = 60;

const NODE_ICON: Record<string, string> = {
  battle: 'GiCrossedSwords',
  elite: 'GiDaemonSkull',
  shop: 'GiCoins',
  rest: 'GiCampfire',
  treasure: 'GiOpenTreasureChest',
};

const NODE_COLOR: Record<string, string> = {
  battle: 'var(--color-mist)',
  elite: 'var(--color-gold)',
  shop: 'var(--color-gold)',
  rest: 'var(--color-toxin)',
  event: 'var(--color-power)',
  treasure: 'var(--color-gold)',
  boss: 'var(--color-lure)',
};

const ACT_NAMES = ['', 'Act I — The Sunlit Shallows', 'Act II — The Twilight Trench', 'Act III — The Hadal Deep'];
const ACT_BASE_DEPTH = [0, 0, 180, 420];

function nodePos(seed: string, n: MapNode) {
  const h = hashSeed(`${seed}:${n.row}:${n.col}`);
  const jx = ((h % 17) - 8) * 1.2;
  const jy = (((h >> 5) % 13) - 6) * 1.4;
  return {
    x: PAD_X + n.col * COL_W + COL_W / 2 + (n.row === 0 || n.type === 'boss' ? 0 : jx),
    y: PAD_Y + n.row * ROW_H + (n.type === 'boss' ? 10 : jy),
  };
}

export function MapScreen() {
  const run = useGame((s) => s.run);
  const pickNode = useGame((s) => s.pickNode);
  const setOverlay = useGame((s) => s.setOverlay);
  const go = useGame((s) => s.go);
  const scroller = useRef<HTMLDivElement>(null);

  const reachable = useMemo(() => (run ? reachableNodes(run) : []), [run]);

  useEffect(() => {
    if (!run || !scroller.current) return;
    const row = run.pos?.row ?? 0;
    scroller.current.scrollTo({ top: Math.max(0, row * ROW_H - 140), behavior: 'smooth' });
  }, [run?.pos?.row, run?.act]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!run) return null;
  const ch = CHARACTERS[run.charId];
  const width = PAD_X * 2 + 6 * COL_W;
  const height = PAD_Y * 2 + (run.map.rows.length - 1) * ROW_H + 40;
  const isReachable = (n: MapNode) => reachable.some((r) => r.row === n.row && r.col === n.col);
  const current = run.pos;

  return (
    <div className="h-dvh flex flex-col app-bg" data-act={run.act}>
      {/* header */}
      <div className="flex items-center gap-2 px-2 pt-[calc(env(safe-area-inset-top)+6px)] pb-1 flex-wrap z-10">
        <button className="btn !p-2" onClick={() => go('settings')} aria-label="Menu & settings">
          <MenuIcon size={15} />
        </button>
        <HpChip hp={run.hp} maxHp={run.maxHp} />
        <GoldChip gold={run.gold} />
        <button className="chip" onClick={() => setOverlay('deck')} aria-label={`view deck, ${run.deck.length} cards`}>
          <Layers size={11} /> {run.deck.length}
        </button>
        <div className="flex-1" />
        <span className="text-[11px] font-display italic text-(--color-mist)">{ACT_NAMES[run.act]}</span>
      </div>
      <RelicBar relics={run.relics} />
      {run.daily && (
        <div className="px-3 py-0.5 text-[10px] text-(--color-glow) tracking-wide">
          DAILY DIVE — {run.daily.mods.join(' · ')}
        </div>
      )}

      {/* scrolling map */}
      <div ref={scroller} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Bubbles count={10} />
        <div className="relative mx-auto" style={{ width, height }}>
          {/* edges */}
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            {run.map.rows.flatMap((row) =>
              row.flatMap((n) => {
                const from = nodePos(run.seed, n);
                return n.next.map((nc) => {
                  const target = run.map.rows[n.row + 1]?.find((t) => t.col === nc);
                  if (!target) return null;
                  const to = nodePos(run.seed, target);
                  const onPath = n.visited && target.visited;
                  const live = n.visited && isReachable(target);
                  return (
                    <path
                      key={`${n.row}-${n.col}-${nc}`}
                      d={`M ${from.x} ${from.y + 20} C ${from.x} ${from.y + 55}, ${to.x} ${to.y - 55}, ${to.x} ${to.y - 20}`}
                      fill="none"
                      stroke={onPath ? 'var(--color-glow)' : live ? 'rgba(56,225,211,0.55)' : 'rgba(95,185,255,0.16)'}
                      strokeWidth={onPath || live ? 2 : 1.4}
                      strokeDasharray={live ? '4 5' : onPath ? undefined : '2 6'}
                      strokeLinecap="round"
                    />
                  );
                });
              }),
            )}
          </svg>

          {/* depth labels */}
          {run.map.rows.map((_, r) =>
            r % 3 === 0 ? (
              <div
                key={r}
                className="absolute text-[9px] tracking-[0.2em] text-(--color-dim) select-none"
                style={{ left: 2, top: PAD_Y + r * ROW_H - 5 }}
                aria-hidden
              >
                −{ACT_BASE_DEPTH[run.act] + r * 15}m
              </div>
            ) : null,
          )}

          {/* nodes */}
          {run.map.rows.flatMap((row) =>
            row.map((n) => {
              const pos = nodePos(run.seed, n);
              const canGo = isReachable(n);
              const isCurrent = current && current.row === n.row && current.col === n.col;
              const size = n.type === 'boss' ? 64 : 44;
              const bossIcon = n.type === 'boss' ? ENEMIES[ENCOUNTERS[n.payload!].enemies.find((e) => ENEMIES[e].tier === 'boss')!].icon : null;
              return (
                <button
                  key={`${n.row}-${n.col}`}
                  className={[
                    'map-node absolute rounded-full border-2 flex items-center justify-center',
                    canGo ? 'reachable' : n.visited ? 'visited' : 'dimmed',
                  ].join(' ')}
                  style={{
                    left: pos.x - size / 2,
                    top: pos.y - size / 2,
                    width: size,
                    height: size,
                    color: NODE_COLOR[n.type],
                    borderColor: isCurrent ? 'var(--color-glow)' : canGo ? 'currentColor' : 'rgba(95,185,255,0.25)',
                    background: isCurrent ? 'rgba(56,225,211,0.18)' : 'rgba(8,17,32,0.9)',
                    cursor: canGo ? 'pointer' : 'default',
                  }}
                  disabled={!canGo}
                  onClick={() => pickNode(n.row, n.col)}
                  aria-label={`${n.type} node, row ${n.row + 1}${canGo ? ', available' : ''}`}
                >
                  {n.type === 'event' ? (
                    <span className="font-display font-bold text-xl" aria-hidden>?</span>
                  ) : (
                    <GameIcon id={bossIcon ?? NODE_ICON[n.type]} size={n.type === 'boss' ? 40 : 24} />
                  )}
                  {isCurrent && (
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--color-glow)', color: '#06222a' }}
                      aria-label="you are here"
                    >
                      <GameIcon id={ch.icon} size={13} />
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* legend */}
      <div className="flex gap-2 justify-center flex-wrap px-2 py-1.5 text-[9px] text-(--color-dim)" aria-hidden>
        {(['battle', 'elite', 'event', 'shop', 'rest', 'treasure', 'boss'] as const).map((t) => (
          <span key={t} className="flex items-center gap-1" style={{ color: NODE_COLOR[t] }}>
            {t === 'event' ? <span className="font-bold">?</span> : <GameIcon id={t === 'boss' ? 'GiDaemonSkull' : NODE_ICON[t]} size={11} />}
            <span className="uppercase tracking-wider">{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
