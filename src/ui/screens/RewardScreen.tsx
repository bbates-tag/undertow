// Post-battle spoils: auto-collected gold/relics shown as lines, a pick-one-of-
// three card choice (or skip), and boss-relic choice after act bosses.

import { ChevronRight, Coins } from 'lucide-react';
import { useGame } from '../../state/store';
import { RELICS } from '../../content/relics';
import { CardView } from '../components/CardView';
import { GameIcon } from '../icons';
import { Bubbles } from '../components/Bits';

export function RewardScreen() {
  const run = useGame((s) => s.run);
  const takeCard = useGame((s) => s.rewardTakeCard);
  const skipCards = useGame((s) => s.rewardSkipCards);
  const takeBossRelic = useGame((s) => s.rewardTakeBossRelic);
  const leaveReward = useGame((s) => s.leaveReward);
  if (!run?.reward) return null;
  const r = run.reward;

  const cardsPending = r.cards.length > 0 && !r.taken.card;
  const bossPending = r.bossRelics.length > 0 && !r.taken.bossRelic;
  const title =
    r.source === 'boss' ? 'THE DEEP YIELDS' :
    r.source === 'elite' ? 'ELITE SPOILS' :
    r.source === 'treasure' ? 'SUNKEN TREASURE' : 'SPOILS';

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-4 p-4 relative overflow-hidden" data-act={run.act}>
      <Bubbles count={8} />
      <h1 className="font-display text-2xl font-bold tracking-[0.3em] pl-[0.3em]" style={{ color: 'var(--color-gold)', textShadow: '0 0 26px rgba(255,206,92,0.4)' }}>
        {title}
      </h1>

      <div className="flex flex-col gap-1 items-center text-sm">
        {r.gold > 0 && (
          <div className="chip !text-sm" style={{ color: 'var(--color-gold)' }}>
            <Coins size={13} /> +{r.gold} gold collected
          </div>
        )}
        {r.relics.map((id) => (
          <div key={id} className="chip !text-sm" style={{ color: 'var(--color-power)' }}>
            <GameIcon id={RELICS[id].icon} size={13} /> {RELICS[id].name} — {RELICS[id].text}
          </div>
        ))}
      </div>

      {bossPending && (
        <div className="w-full max-w-2xl">
          <h2 className="text-center text-sm font-bold text-(--color-lure) mb-2 tracking-wide">CHOOSE A BOSS RELIC</h2>
          <div className="flex gap-3 justify-center flex-wrap">
            {r.bossRelics.map((id, i) => {
              const def = RELICS[id];
              return (
                <button
                  key={id}
                  className="panel p-3 w-[170px] text-center hover:scale-[1.03] transition-transform"
                  style={{ borderColor: 'rgba(255,93,162,0.4)' }}
                  onClick={() => takeBossRelic(i)}
                >
                  <div className="flex justify-center mb-2" style={{ color: 'var(--color-lure)' }}>
                    <GameIcon id={def.icon} size={34} />
                  </div>
                  <div className="font-bold text-sm mb-1">{def.name}</div>
                  <div className="text-[11px] text-(--color-mist)">{def.text}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cardsPending && !bossPending && (
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-bold text-(--color-glow) tracking-wide">ADD A CARD TO YOUR DECK</h2>
          <div className="flex gap-3 justify-center flex-wrap">
            {r.cards.map((c, i) => (
              <CardView key={c.uid} card={c} scale="lg" onClick={() => takeCard(i)} />
            ))}
          </div>
          <button className="text-(--color-dim) text-sm underline" onClick={skipCards}>
            Skip — keep the deck lean
          </button>
        </div>
      )}

      {!cardsPending && !bossPending && (
        <button className="btn btn-primary text-base !px-7 !py-3" onClick={leaveReward} autoFocus>
          {r.source === 'boss' ? (run.act >= 3 ? 'Surface victorious' : 'Descend deeper') : 'Back to the trench'}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
