// Full-screen card-list overlay: browse deck/piles, and the pick-a-card flow
// for removals, upgrades, duplications, and transformations.

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CardInstance } from '../../engine/types';
import { CARDS } from '../../content/cards';
import { useGame } from '../../state/store';
import { CardView } from './CardView';

const PICK_LABEL: Record<string, string> = {
  remove: 'Choose a card to REMOVE from your deck',
  upgrade: 'Choose a card to UPGRADE',
  duplicate: 'Choose a card to DUPLICATE',
  transform: 'Choose a card to TRANSFORM',
};

export function DeckOverlay() {
  const overlay = useGame((s) => s.overlay);
  const run = useGame((s) => s.run);
  const pendingPick = useGame((s) => s.pendingPick);
  const setOverlay = useGame((s) => s.setOverlay);
  const pickDeckCard = useGame((s) => s.pickDeckCard);
  const cancelPick = useGame((s) => s.cancelPick);
  if (!run) return null;

  let cards: CardInstance[] = [];
  let title = '';
  if (overlay === 'deck') {
    cards = [...run.deck].sort((a, b) => CARDS[a.defId].name.localeCompare(CARDS[b.defId].name));
    title = `Deck (${run.deck.length})`;
  } else if (overlay === 'drawPile') {
    cards = [...(run.battle?.drawPile ?? [])].sort((a, b) => CARDS[a.defId].name.localeCompare(CARDS[b.defId].name));
    title = `Draw pile (${cards.length}) — order hidden`;
  } else if (overlay === 'discardPile') {
    cards = run.battle?.discardPile ?? [];
    title = `Discard pile (${cards.length})`;
  } else if (overlay === 'exhaustPile') {
    cards = run.battle?.exhaustPile ?? [];
    title = `Exhausted (${cards.length})`;
  } else {
    return null;
  }

  // discard & exhausted share one overlay with two tabs
  const pileTabs = overlay === 'discardPile' || overlay === 'exhaustPile';

  const picking = pendingPick && overlay === 'deck';
  const pickable = (c: CardInstance) => {
    if (!picking) return false;
    const def = CARDS[c.defId];
    switch (pendingPick!.kind) {
      case 'upgrade': return !c.upgraded && def.type !== 'curse';
      case 'remove': return true;
      case 'transform':
      case 'duplicate': return def.type !== 'curse';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-md flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
        {pileTabs ? (
          <div className="flex gap-2" role="tablist" aria-label="battle piles">
            <button
              className={`btn !py-1.5 !px-3 text-sm ${overlay === 'discardPile' ? 'btn-primary' : ''}`}
              onClick={() => setOverlay('discardPile')}
              role="tab"
              aria-selected={overlay === 'discardPile'}
            >
              Discard ({run.battle?.discardPile.length ?? 0})
            </button>
            <button
              className={`btn !py-1.5 !px-3 text-sm ${overlay === 'exhaustPile' ? 'btn-primary' : ''}`}
              onClick={() => setOverlay('exhaustPile')}
              role="tab"
              aria-selected={overlay === 'exhaustPile'}
            >
              Exhausted ({run.battle?.exhaustPile.length ?? 0})
            </button>
          </div>
        ) : (
          <h2 className="font-display text-lg font-bold">{picking ? PICK_LABEL[pendingPick!.kind] : title}</h2>
        )}
        <button
          className="btn !p-2"
          onClick={() => (picking ? cancelPick() : setOverlay('none'))}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      {picking && pendingPick!.kind === 'upgrade' && (
        <p className="px-4 pb-2 text-xs text-(--color-mist)">Upgrading improves numbers, costs, or effects — permanently for this run.</p>
      )}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6">
        {cards.length === 0 ? (
          <p className="text-center text-(--color-dim) mt-10">Empty.</p>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {cards.map((c) => {
              const ok = pickable(c);
              return (
                <div key={c.uid} className={picking && !ok ? 'opacity-35 pointer-events-none' : ''}>
                  <CardView
                    card={c}
                    onClick={picking ? () => pickDeckCard(c.uid) : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
