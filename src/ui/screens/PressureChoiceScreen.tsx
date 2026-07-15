// Endless: once per loop, choose 1 of 2 Pressures — permanent, stacking
// debuffs that are the deep's toll for descending further. No skip: the only
// exits are the two picks.

import { Layers } from 'lucide-react';
import { useGame } from '../../state/store';
import { PRESSURES } from '../../content/pressures';
import { GameIcon } from '../icons';
import { RelicBar } from '../components/RelicBar';
import { HpChip, GoldChip, Bubbles } from '../components/Bits';

export function PressureChoiceScreen() {
  const run = useGame((s) => s.run);
  const setOverlay = useGame((s) => s.setOverlay);
  const choosePressure = useGame((s) => s.choosePressure);
  if (!run?.pressureOffer) return null;

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-4 p-4 relative overflow-hidden" data-act={run.act}>
      <Bubbles count={8} />
      <div className="w-full max-w-2xl flex items-center gap-2 flex-wrap pt-[env(safe-area-inset-top)]">
        <div className="flex-1" />
        <HpChip hp={run.hp} maxHp={run.maxHp} />
        <GoldChip gold={run.gold} />
        <button className="chip" onClick={() => setOverlay('deck')} aria-label={`view deck, ${run.deck.length} cards`}>
          <Layers size={11} /> {run.deck.length}
        </button>
      </div>
      {run.relics.length > 0 && (
        <div className="w-full max-w-2xl -mt-1">
          <RelicBar relics={run.relics} defanged={run.defanged} />
        </div>
      )}

      <h1 className="font-display text-2xl font-bold tracking-[0.3em] pl-[0.3em] relative z-10" style={{ color: 'var(--color-lure)', textShadow: '0 0 26px rgba(255,93,162,0.4)' }}>
        THE DEEP DEMANDS ITS DUE
      </h1>
      <p className="text-center text-[11px] text-(--color-dim) italic max-w-sm relative z-10">
        Loop {run.loop + 1} — choose your burden. It stays with you for the rest of the dive.
      </p>

      <div className="flex gap-3 justify-center flex-wrap relative z-10">
        {run.pressureOffer.map((id) => {
          const def = PRESSURES[id];
          return (
            <button
              key={id}
              className="panel p-3 w-[190px] text-center hover:scale-[1.03] transition-transform"
              style={{ borderColor: 'rgba(255,111,111,0.4)' }}
              onClick={() => choosePressure(id)}
            >
              <div className="flex justify-center mb-2" style={{ color: 'var(--color-danger)' }}>
                <GameIcon id={def.icon} size={34} />
              </div>
              <div className="font-bold text-sm mb-1">{def.name}</div>
              <div className="text-[11px] text-(--color-mist)">{def.text}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
