// Thermal vent rest site: heal OR upgrade — the classic trade-off.

import { Flame, Hammer } from 'lucide-react';
import { useGame } from '../../state/store';
import { canRestHeal, restHealAmount } from '../../engine/run';
import { GoldChip, HpChip, Bubbles } from '../components/Bits';

export function RestScreen() {
  const run = useGame((s) => s.run);
  const restHeal = useGame((s) => s.restHeal);
  const restStartUpgrade = useGame((s) => s.restStartUpgrade);
  const leaveNode = useGame((s) => s.leaveNode);
  if (!run) return null;
  const healAmt = restHealAmount(run);
  const healOk = canRestHeal(run);
  const upgradable = run.deck.some((c) => !c.upgraded);

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center justify-center gap-5 p-4 relative overflow-hidden" data-act={run.act}>
      <Bubbles count={16} />
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-[0.2em] pl-[0.2em]" style={{ color: 'var(--color-toxin)' }}>
          THERMAL VENT
        </h1>
        <p className="text-sm text-(--color-mist) italic mt-1 max-w-sm">
          Warm water rises from the seafloor. For a moment, the deep feels almost kind.
        </p>
        <div className="flex gap-2 justify-center mt-2">
          <HpChip hp={run.hp} maxHp={run.maxHp} />
          <GoldChip gold={run.gold} />
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          className={`panel p-5 w-[210px] text-center transition-transform hover:scale-[1.03] ${!healOk || run.hp >= run.maxHp ? 'opacity-45' : ''}`}
          onClick={restHeal}
          disabled={!healOk || run.hp >= run.maxHp}
        >
          <Flame size={36} className="mx-auto mb-2" style={{ color: 'var(--color-toxin)' }} />
          <div className="font-display font-bold mb-1">Bask</div>
          <div className="text-xs text-(--color-mist)">
            {healOk ? `Heal ${healAmt} HP.` : 'The Black Pearl forbids rest. (No healing.)'}
          </div>
        </button>

        <button
          className={`panel p-5 w-[210px] text-center transition-transform hover:scale-[1.03] ${!upgradable ? 'opacity-45' : ''}`}
          onClick={restStartUpgrade}
          disabled={!upgradable}
        >
          <Hammer size={36} className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
          <div className="font-display font-bold mb-1">Hone</div>
          <div className="text-xs text-(--color-mist)">
            {upgradable ? 'Upgrade a card — permanently better numbers.' : 'Every card is already honed.'}
          </div>
        </button>
      </div>

      <button className="text-(--color-dim) text-sm underline" onClick={leaveNode}>
        Press on without stopping
      </button>
    </div>
  );
}
