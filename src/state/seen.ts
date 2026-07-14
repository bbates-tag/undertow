// Compendium discovery tracking: which enemies and cards the player has
// actually encountered. Recorded store-side — the engine stays meta-free
// (same rule as unlock gating). Unlocked characters' starter decks always
// count as known, so a fresh profile's compendium isn't completely dark.

import type { MetaState, RunState } from '../engine/types';
import { CHARACTERS } from '../content/characters';

/** every enemy/card/relic def id currently visible to the player */
export function visibleIds(run: RunState | null): { enemies: string[]; cards: string[]; relics: string[] } {
  if (!run) return { enemies: [], cards: [], relics: [] };
  const cards = run.deck.map((c) => c.defId);
  for (const c of run.reward?.cards ?? []) cards.push(c.defId);
  const relics = [...run.relics];
  for (const r of run.reward?.relics ?? []) relics.push(r);
  for (const r of run.reward?.bossRelics ?? []) relics.push(r);
  for (const it of run.shop?.items ?? []) {
    if (it.kind === 'card') cards.push(it.card.defId);
    else if (it.kind === 'relic') relics.push(it.relicId);
  }
  // deliberately NOT shop.crateRelicId — the salvage crate is sight-unseen
  // until bought (the purchase lands it in run.relics, which discovers it)
  const enemies: string[] = [];
  const bs = run.battle;
  if (bs) {
    for (const e of bs.enemies) enemies.push(e.defId); // includes mid-battle summons
    for (const pile of [bs.hand, bs.drawPile, bs.discardPile, bs.exhaustPile]) {
      for (const c of pile) cards.push(c.defId); // catches battle-generated cards
    }
  }
  return { enemies, cards, relics };
}

/** union everything visible (plus unlocked starters) into meta;
    returns a new MetaState only if something new was discovered */
export function withSeen(meta: MetaState, run: RunState | null): MetaState | null {
  const { enemies, cards, relics } = visibleIds(run);
  for (const chId of meta.unlockedChars) {
    for (const s of CHARACTERS[chId]?.starterDeck ?? []) cards.push(s.card);
    if (CHARACTERS[chId]) relics.push(CHARACTERS[chId].starterRelic);
  }
  // older saves predate these fields — treat missing as empty
  const newEnemies = enemies.filter((id) => !meta.seenEnemies?.[id]);
  const newCards = cards.filter((id) => !meta.seenCards?.[id]);
  const newRelics = relics.filter((id) => !meta.seenRelics?.[id]);
  if (!newEnemies.length && !newCards.length && !newRelics.length) return null;
  return {
    ...meta,
    seenEnemies: { ...meta.seenEnemies, ...Object.fromEntries(newEnemies.map((id) => [id, true as const])) },
    seenCards: { ...meta.seenCards, ...Object.fromEntries(newCards.map((id) => [id, true as const])) },
    seenRelics: { ...meta.seenRelics, ...Object.fromEntries(newRelics.map((id) => [id, true as const])) },
  };
}
