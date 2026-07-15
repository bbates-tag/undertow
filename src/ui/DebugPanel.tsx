// Dev-only cheat panel, enabled with ?debug=1. Not linked from any UI.

import { useState } from 'react';
import { useGame } from '../state/store';
import { deepClone } from '../lib/util';
import { newEmit, startBattle } from '../engine/battle';
import { beginLoop } from '../engine/run';
import { UNLOCK_PACKS } from '../content/meta';

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const st = useGame();
  if (!new URLSearchParams(location.search).has('debug')) return null;

  const mutate = (fn: (r: NonNullable<typeof st.run>) => void) => {
    const run = deepClone(useGame.getState().run);
    if (!run) return;
    fn(run);
    useGame.setState({ run });
  };

  return (
    <div className="fixed bottom-1 left-1 z-[99]">
      <button className="chip opacity-60" onClick={() => setOpen(!open)}>
        dbg
      </button>
      {open && (
        <div className="panel p-2 flex flex-col gap-1 text-xs mt-1 w-44">
          <button className="btn !py-1" onClick={() => mutate((r) => { r.gold += 200; })}>+200 gold</button>
          <button className="btn !py-1" onClick={() => mutate((r) => { r.hp = r.maxHp; if (r.battle) r.battle.player.hp = r.battle.player.maxHp; })}>full heal</button>
          <button className="btn !py-1" onClick={() => mutate((r) => { r.battle?.enemies.forEach((e) => { e.hp = 1; }); })}>enemies→1hp</button>
          <button className="btn !py-1" onClick={() => mutate((r) => { if (r.battle) r.battle.energy = 99; })}>energy 99</button>
          <button
            className="btn !py-1"
            onClick={() => mutate((r) => {
              const emit = newEmit();
              startBattle(r, `a${r.act}_boss`, emit);
              useGame.setState({ screen: 'battle' });
            })}
          >
            fight act boss
          </button>
          <button
            className="btn !py-1"
            onClick={() => mutate((r) => {
              beginLoop(r, newEmit());
              useGame.setState({ screen: r.pressureOffer ? 'pressureChoice' : 'map' });
            })}
          >
            force loop++
          </button>
          <button
            className="btn !py-1"
            onClick={() => {
              const meta = deepClone(useGame.getState().meta);
              meta.unlockedChars = ['tidecaller', 'voltaic', 'drowned', 'weaver'];
              meta.unlockedPacks = UNLOCK_PACKS.map((p) => p.id);
              meta.fathoms += 2000;
              meta.ascension = { tidecaller: 10, voltaic: 10, drowned: 10 };
              useGame.setState({ meta });
            }}
          >
            unlock all
          </button>
        </div>
      )}
    </div>
  );
}
