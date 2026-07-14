// The Barnacle Bazaar — curated cards, relics, a salvage crate, and the
// proprietor's services: Fillet (removal), Whetstone (upgrade), Defang
// (strip a treasure relic's downside), Pawn (sell relics back).

import { useState } from 'react';
import { ArrowLeft, Coins, Hammer, Scale, Scissors } from 'lucide-react';
import { useGame } from '../../state/store';
import { RELICS, relicText } from '../../content/relics';
import { defangEligible, sellPrice } from '../../engine/run';
import { CardView } from '../components/CardView';
import { GameIcon } from '../icons';
import { GoldChip, HpChip } from '../components/Bits';

export function ShopScreen() {
  const run = useGame((s) => s.run);
  const shopBuy = useGame((s) => s.shopBuy);
  const shopStartRemoval = useGame((s) => s.shopStartRemoval);
  const shopStartWhetstone = useGame((s) => s.shopStartWhetstone);
  const shopDefang = useGame((s) => s.shopDefang);
  const shopBuyCrate = useGame((s) => s.shopBuyCrate);
  const shopPawn = useGame((s) => s.shopPawn);
  const leaveNode = useGame((s) => s.leaveNode);
  const [defangOpen, setDefangOpen] = useState(false);
  const [pawnOpen, setPawnOpen] = useState(false);
  if (!run?.shop) return null;
  const shop = run.shop;
  const eligible = defangEligible(run);

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

        {/* salvage crate — a mystery relic, absent when the pool is dry or on pre-rework saves */}
        {shop.crateRelicId && shop.cratePrice != null && (
          <button
            className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${shop.crateSold ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={shopBuyCrate}
            disabled={!!shop.crateSold}
          >
            <span style={{ color: 'var(--color-gold)' }} className="mt-0.5 shrink-0">
              <GameIcon id="GiLockedChest" size={26} />
            </span>
            <span>
              <span className="font-bold text-sm block">Salvage Crate</span>
              <span className="text-[11px] text-(--color-mist) block mb-1">
                {shop.crateSold
                  ? `It was: ${RELICS[shop.crateRelicId].name}.`
                  : 'A relic the sea took. Sight unseen, as-is, no returns.'}
              </span>
              <span className="font-bold text-sm text-(--color-gold) inline-flex items-center gap-1">
                {shop.crateSold ? 'SOLD' : <><Coins size={13} /> {shop.cratePrice}</>}
              </span>
            </span>
          </button>
        )}

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

        {/* whetstone service — absent on pre-rework saves */}
        {shop.whetstonePrice != null && (
          <button
            className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${(shop.whetstonesLeft ?? 0) <= 0 ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={shopStartWhetstone}
            disabled={(shop.whetstonesLeft ?? 0) <= 0}
          >
            <span className="text-(--color-shield) mt-0.5 shrink-0">
              <Hammer size={24} />
            </span>
            <span>
              <span className="font-bold text-sm block">Whetstone</span>
              <span className="text-[11px] text-(--color-mist) block mb-1">Upgrade a card. The vents do it free — the proprietor does it now.</span>
              <span className="font-bold text-sm text-(--color-gold) inline-flex items-center gap-1">
                {(shop.whetstonesLeft ?? 0) <= 0 ? 'USED' : <><Coins size={13} /> {shop.whetstonePrice}</>}
              </span>
            </span>
          </button>
        )}

        {/* defang service — absent on pre-rework saves */}
        {shop.defangPrice != null && (
          <button
            className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${(shop.defangsLeft ?? 0) <= 0 || !eligible.length ? 'opacity-40' : ''} ${(shop.defangsLeft ?? 0) <= 0 ? 'pointer-events-none' : ''}`}
            onClick={() => eligible.length && setDefangOpen((o) => !o)}
            disabled={(shop.defangsLeft ?? 0) <= 0}
          >
            <span className="text-(--color-lure) mt-0.5 shrink-0">
              <GameIcon id="GiFangs" size={24} />
            </span>
            <span>
              <span className="font-bold text-sm block">Defang</span>
              <span className="text-[11px] text-(--color-mist) block mb-1">
                {eligible.length
                  ? 'File the downside off a two-edged relic. Permanently.'
                  : 'File the downside off a two-edged relic — bring one back from a treasure chest.'}
              </span>
              <span className="font-bold text-sm text-(--color-gold) inline-flex items-center gap-1">
                {(shop.defangsLeft ?? 0) <= 0 ? 'USED' : <><Coins size={13} /> {shop.defangPrice}</>}
              </span>
            </span>
          </button>
        )}

        {/* pawn counter — unlimited; hidden only on pre-rework saves (keyed off crate presence not needed: always safe) */}
        <button
          className={`panel p-3 w-[200px] text-left flex gap-2.5 items-start transition-transform hover:scale-[1.02] ${run.relics.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}
          onClick={() => run.relics.length > 0 && setPawnOpen((o) => !o)}
          disabled={run.relics.length === 0}
        >
          <span className="text-(--color-glow) mt-0.5 shrink-0">
            <Scale size={24} />
          </span>
          <span>
            <span className="font-bold text-sm block">Pawn Counter</span>
            <span className="text-[11px] text-(--color-mist) block mb-1">Sell a relic back. She pays in coin, not in sentiment.</span>
            <span className="font-bold text-sm text-(--color-gold) inline-flex items-center gap-1">~40% value</span>
          </span>
        </button>
      </div>

      {/* pawn relic picker */}
      {pawnOpen && run.relics.length > 0 && (
        <div className="panel p-3 max-w-2xl w-full flex flex-col gap-2">
          <span className="text-xs text-(--color-mist)">Choose a relic to pawn — gone for good, gold on the spot:</span>
          <div className="flex flex-wrap gap-2">
            {run.relics.map((id) => {
              const def = RELICS[id];
              if (!def) return null;
              const polished = run.defanged?.includes(id);
              return (
                <button
                  key={id}
                  className="panel !bg-(--color-abyss-800) p-2.5 w-[220px] text-left flex gap-2 items-start hover:scale-[1.02] transition-transform"
                  onClick={() => shopPawn(id)}
                >
                  <span style={{ color: 'var(--color-glow)' }} className="mt-0.5 shrink-0">
                    <GameIcon id={def.icon} size={22} />
                  </span>
                  <span>
                    <span className="font-bold text-xs block">{def.name}{polished ? ' ✦' : ''}</span>
                    <span className="text-[10px] text-(--color-mist) block">{relicText(id, run.defanged)}</span>
                    <span className="font-bold text-xs text-(--color-gold) inline-flex items-center gap-1 mt-0.5">
                      <Coins size={11} /> {sellPrice(id)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* defang relic picker */}
      {defangOpen && (shop.defangsLeft ?? 0) > 0 && eligible.length > 0 && (
        <div className="panel p-3 max-w-2xl w-full flex flex-col gap-2">
          <span className="text-xs text-(--color-mist)">Choose a relic to defang — its downside line goes, the rest stays:</span>
          <div className="flex flex-wrap gap-2">
            {eligible.map((id) => {
              const def = RELICS[id];
              return (
                <button
                  key={id}
                  className="panel !bg-(--color-abyss-800) p-2.5 w-[220px] text-left flex gap-2 items-start hover:scale-[1.02] transition-transform"
                  onClick={() => {
                    shopDefang(id);
                    setDefangOpen(false);
                  }}
                >
                  <span style={{ color: 'var(--color-gold)' }} className="mt-0.5 shrink-0">
                    <GameIcon id={def.icon} size={22} />
                  </span>
                  <span>
                    <span className="font-bold text-xs block">{def.name}</span>
                    <span className="text-[10px] text-(--color-mist) block">{def.text}</span>
                    <span className="text-[10px] text-(--color-glow) block mt-0.5">→ {def.defangedText}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={leaveNode}>
        Leave the bazaar
      </button>
    </div>
  );
}
