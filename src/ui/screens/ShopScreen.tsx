// The Barnacle Bazaar — cards, relics, and card removal for gold.

import { ArrowLeft, Coins, Scissors } from 'lucide-react';
import { useGame } from '../../state/store';
import { RELICS } from '../../content/relics';
import { CardView } from '../components/CardView';
import { GameIcon } from '../icons';
import { GoldChip, HpChip } from '../components/Bits';

export function ShopScreen() {
  const run = useGame((s) => s.run);
  const shopBuy = useGame((s) => s.shopBuy);
  const shopStartRemoval = useGame((s) => s.shopStartRemoval);
  const leaveNode = useGame((s) => s.leaveNode);
  if (!run?.shop) return null;
  const shop = run.shop;

  return (
    <div className="min-h-dvh app-bg flex flex-col items-center p-4 gap-4 overflow-y-auto" data-act={run.act}>
      <div className="w-full max-w-2xl flex items-center gap-2 pt-[env(safe-area-inset-top)]">
        <button className="btn !p-2" onClick={leaveNode} aria-label="Leave shop">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-xl font-bold tracking-wide flex items-center gap-2">
          <GameIcon id="GiShrimp" size={20} /> The Barnacle Bazaar
        </h1>
        <div className="flex-1" />
        <HpChip hp={run.hp} maxHp={run.maxHp} />
        <GoldChip gold={run.gold} />
      </div>
      <p className="text-xs text-(--color-dim) italic -mt-2">"Everything sinks eventually. I just get to it first." — the proprietor</p>

      {/* cards */}
      <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
        {shop.items.filter((i) => i.kind === 'card').map((item) => {
          const idx = shop.items.indexOf(item);
          const sold = !!item.sold;
          const afford = run.gold >= item.price;
          return (
            <div key={idx} className={`flex flex-col items-center gap-1.5 ${sold ? 'opacity-30 pointer-events-none' : ''}`}>
              {item.kind === 'card' && <CardView card={item.card} onClick={() => !sold && shopBuy(idx)} />}
              <button
                className={`chip !text-sm font-bold ${afford ? '' : 'opacity-50'}`}
                style={{ color: 'var(--color-gold)' }}
                onClick={() => shopBuy(idx)}
                disabled={sold}
              >
                {sold ? 'SOLD' : <><Coins size={13} /> {item.price}</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* relics */}
      <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
        {shop.items.filter((i) => i.kind === 'relic').map((item) => {
          const idx = shop.items.indexOf(item);
          if (item.kind !== 'relic') return null;
          const def = RELICS[item.relicId];
          const sold = !!item.sold;
          const afford = run.gold >= item.price;
          return (
            <button
              key={idx}
              className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${sold ? 'opacity-30 pointer-events-none' : ''}`}
              onClick={() => shopBuy(idx)}
              disabled={sold}
            >
              <span style={{ color: 'var(--color-power)' }} className="mt-0.5 shrink-0">
                <GameIcon id={def.icon} size={26} />
              </span>
              <span>
                <span className="font-bold text-sm block">{def.name}</span>
                <span className="text-[11px] text-(--color-mist) block mb-1">{def.text}</span>
                <span className={`font-bold text-sm inline-flex items-center gap-1 ${afford ? 'text-(--color-gold)' : 'text-(--color-dim)'}`}>
                  {sold ? 'SOLD' : <><Coins size={13} /> {item.price}</>}
                </span>
              </span>
            </button>
          );
        })}

        {/* removal service */}
        <button
          className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${shop.removalsLeft <= 0 ? 'opacity-30 pointer-events-none' : ''}`}
          onClick={shopStartRemoval}
          disabled={shop.removalsLeft <= 0}
        >
          <span className="text-(--color-danger) mt-0.5 shrink-0">
            <Scissors size={24} />
          </span>
          <span>
            <span className="font-bold text-sm block">Fillet Service</span>
            <span className="text-[11px] text-(--color-mist) block mb-1">Remove a card from your deck. Forever. A leaner deck draws its best cards more often.</span>
            <span className="font-bold text-sm text-(--color-gold) inline-flex items-center gap-1">
              {shop.removalsLeft <= 0 ? 'USED' : <><Coins size={13} /> {shop.removalPrice}</>}
            </span>
          </span>
        </button>
      </div>

      <button className="btn btn-primary" onClick={leaveNode}>
        Leave the bazaar
      </button>
    </div>
  );
}
