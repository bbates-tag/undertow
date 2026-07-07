// The battle screen: enemies with telegraphed intents, the hand fan, energy,
// tide dial, targeting flow, damage previews, victory/defeat, and tutorial.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronRight, Layers, Menu as MenuIcon, Shield, SkipForward, Trash2 } from 'lucide-react';
import { useGame, checkFlawless } from '../../state/store';
import { CARDS } from '../../content/cards';
import { CHARACTERS } from '../../content/characters';
import { ENEMIES } from '../../content/enemies';
import { KEYWORDS, KEYWORD_PATTERN } from '../../content/keywords';
import { cardCost, cardDef, living } from '../../engine/battle';
import { describeCard } from '../../engine/describe';
import type { Amount, Op } from '../../engine/types';
import { CardView, highlightText } from '../components/CardView';
import { EnemyView } from '../components/EnemyView';
import { FxLayer } from '../components/FxLayer';
import { RelicBar } from '../components/RelicBar';
import { StatusChips } from '../components/StatusChips';
import { TideDial } from '../components/TideDial';
import { GoldChip, HpChip } from '../components/Bits';
import { StatusChipsGlossary, useReducedMotion } from '../hooks';
import { fxTargetRef } from '../fxRegistry';
import { ArtImage } from '../components/Art';

function firstDamageOp(ops: Op[]): { amount: Amount; times: number } | null {
  for (const op of ops) {
    if (op.op === 'damage' && op.target !== 'all' && op.target !== 'random') {
      return { amount: op.amount, times: op.times === 'charge' ? 1 : (op.times ?? 1) };
    }
    if (op.op === 'if') {
      const inner = firstDamageOp(op.then);
      if (inner) return inner;
    }
  }
  return null;
}

const TUTORIAL_STEPS = [
  { text: 'This is your hand. Tap a card to select it, then play it — attacks need a target.', pos: 'bottom' },
  { text: 'Enemies telegraph their next move above their heads. Red numbers are damage you will take — Block absorbs it.', pos: 'top' },
  { text: 'Cards cost Energy (the orb). It refills every turn. Spend it, then End Turn.', pos: 'left' },
  { text: 'The Tide cycles Low → Rising → High → Falling each turn. Flood cards surge at High tide; Ebb cards at Low.', pos: 'topright' },
];

export function BattleScreen() {
  const run = useGame((s) => s.run);
  const selectedCard = useGame((s) => s.selectedCard);
  const selectCard = useGame((s) => s.selectCard);
  const playSelected = useGame((s) => s.playSelected);
  const endTurn = useGame((s) => s.endTurn);
  const proceedAfterBattle = useGame((s) => s.proceedAfterBattle);
  const enemyTurnRunning = useGame((s) => s.enemyTurnRunning);
  const setOverlay = useGame((s) => s.setOverlay);
  const tutorialStep = useGame((s) => s.tutorialStep);
  const advanceTutorial = useGame((s) => s.advanceTutorial);
  const go = useGame((s) => s.go);
  const reduced = useReducedMotion();
  const shakeRef = useRef<HTMLDivElement>(null);
  const [kbTarget, setKbTarget] = useState(0);

  const bs = run?.battle;

  const selected = useMemo(
    () => (bs && selectedCard != null ? bs.hand.find((c) => c.uid === selectedCard) ?? null : null),
    [bs, selectedCard],
  );
  const selectedDef = selected ? CARDS[selected.defId] : null;
  const needsTarget = selectedDef?.target === 'enemy';
  const enemies = bs ? living(bs) : [];
  const previewDmg = selected && needsTarget ? firstDamageOp(selected.upgraded ? (selectedDef!.opsUp ?? selectedDef!.ops) : selectedDef!.ops) : null;

  // flawless achievement check on win
  const phase = bs?.phase;
  useEffect(() => {
    if (phase === 'won') checkFlawless();
  }, [phase]);

  // keyboard play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!bs || bs.phase !== 'player') return;
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        const card = bs.hand[idx];
        if (card) selectCard(card.uid === selectedCard ? null : card.uid);
      } else if (e.key === 'Escape') {
        selectCard(null);
      } else if (e.key === 'e' || e.key === 'E') {
        endTurn();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (needsTarget && enemies.length > 1) {
          e.preventDefault();
          setKbTarget((t) => (t + (e.key === 'ArrowRight' ? 1 : enemies.length - 1)) % enemies.length);
        }
      } else if (e.key === 'Enter' && selected) {
        if (!needsTarget) playSelected();
        else if (enemies.length) playSelected(enemies[Math.min(kbTarget, enemies.length - 1)].uid);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bs, selected, selectedCard, needsTarget, enemies, kbTarget, selectCard, playSelected, endTurn]);

  if (!run || !bs) return null;
  const ch = CHARACTERS[run.charId];
  const handOverlap = bs.hand.length > 7 ? -30 : bs.hand.length > 5 ? -22 : bs.hand.length > 3 ? -12 : -4;

  const selectedKeywords = selected
    ? [...new Set(Array.from(describeCard(selectedDef!, selected.upgraded).matchAll(KEYWORD_PATTERN)).map((m) => m[1].toLowerCase()))]
        .map((k) => KEYWORDS[k])
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return (
    <div ref={shakeRef} className="h-dvh flex flex-col app-bg relative overflow-hidden" data-act={run.act} id="battle-root">
      <FxLayer shakeTarget={shakeRef} reduced={reduced} />

      {/* top bar */}
      <div className="flex items-center gap-2 px-2 pt-[calc(env(safe-area-inset-top)+6px)] pb-1 flex-wrap">
        <button className="btn !p-2" onClick={() => go('settings')} aria-label="Menu & settings">
          <MenuIcon size={15} />
        </button>
        <HpChip hp={bs.player.hp} maxHp={bs.player.maxHp} />
        <GoldChip gold={run.gold} />
        <span className="chip text-(--color-dim)">Depth {run.floor}</span>
        <div className="flex-1" />
        <TideDial tide={bs.tide} locked={bs.powers.includes('kingTide')} />
        <button className="btn !p-2" onClick={() => setOverlay('glossary')} aria-label="Keyword glossary">
          <BookOpen size={15} />
        </button>
      </div>
      <RelicBar relics={run.relics} />

      {/* boss banner */}
      <AnimatePresence>
        {bs.isBoss && bs.turn === 1 && bs.phase === 'player' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center pointer-events-none"
          >
            <div className="font-display text-xl font-bold tracking-[0.3em] pl-[0.3em]" style={{ color: 'var(--color-lure)', textShadow: '0 0 30px currentColor' }}>
              {(enemies.find((e) => ENEMIES[e.defId].tier === 'boss') && ENEMIES[enemies.find((e) => ENEMIES[e.defId].tier === 'boss')!.defId].name) || 'BOSS'}
            </div>
            <div className="text-xs text-(--color-dim) italic">
              {enemies.find((e) => ENEMIES[e.defId].tier === 'boss') ? ENEMIES[enemies.find((e) => ENEMIES[e.defId].tier === 'boss')!.defId].title : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* enemies */}
      <div
        className="flex-1 flex items-center justify-evenly flex-wrap content-center gap-1 px-2 min-h-0"
        onClick={() => {
          if (selected && !needsTarget) playSelected();
        }}
      >
        <AnimatePresence mode="popLayout">
          {enemies.map((e, i) => (
            <EnemyView
              key={e.uid}
              bs={bs}
              e={e}
              targeting={!!selected && needsTarget}
              previewAmount={selected && needsTarget ? previewDmg?.amount ?? null : null}
              previewTimes={previewDmg?.times ?? 1}
              onPick={() => playSelected(e.uid)}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* player strip */}
      <div className="flex items-center justify-center gap-2 px-3 py-1">
        <div ref={fxTargetRef('player')} className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden"
            style={{ borderColor: ch.color, color: ch.color, background: 'rgba(8,17,32,0.8)' }}
            aria-hidden
          >
            <ArtImage kind="characters" id={ch.id} icon={ch.icon} className="w-full h-full object-cover object-top" iconSize={20} />
          </div>
          {bs.player.block > 0 && (
            <span className="chip !text-sm font-black" style={{ color: 'var(--color-shield)', borderColor: 'rgba(95,185,255,0.5)' }}>
              <Shield size={13} /> {bs.player.block}
            </span>
          )}
          <StatusChips creature={bs.player} />
        </div>
      </div>

      {/* selected card panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="absolute left-1/2 -translate-x-1/2 z-40 flex items-end gap-3"
            style={{ bottom: 'calc(var(--card-h) + 64px)' }}
          >
            <CardView card={selected} battle={bs} scale="lg" ariaLabel="selected card preview" />
            <div className="flex flex-col gap-2 max-w-[180px] pb-1">
              {selectedKeywords.map((k) => (
                <div key={k.id} className="text-[10px] leading-tight text-(--color-mist)">
                  <span className="kw font-bold">{k.name}</span> — {k.text}
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <button className="btn !py-1.5 !px-3 text-xs" onClick={() => selectCard(null)}>
                  Cancel
                </button>
                {needsTarget && enemies.length > 1 ? (
                  <span className="text-xs text-(--color-glow) font-bold self-center animate-pulse">Tap a target →</span>
                ) : (
                  <button
                    className="btn btn-primary !py-1.5 !px-3 text-xs"
                    onClick={() => (needsTarget ? playSelected(enemies[0]?.uid) : playSelected())}
                  >
                    Play <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* hand + controls */}
      <div className="relative shrink-0">
        <div className="flex items-end justify-between px-2 gap-1">
          {/* energy orb */}
          <div className="flex flex-col items-center gap-1 pb-3 shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg relative"
              style={{
                color: '#06222a',
                background: 'radial-gradient(circle at 35% 30%, #b8fff5, var(--color-glow) 60%, #0f8d84)',
                boxShadow: bs.energy > 0 ? '0 0 22px rgba(56,225,211,0.55)' : 'none',
                opacity: bs.energy > 0 ? 1 : 0.55,
              }}
              role="status"
              aria-label={`${bs.energy} of ${bs.maxEnergy} energy`}
            >
              {bs.energy}/{bs.maxEnergy}
            </div>
            <button className="chip" onClick={() => setOverlay('drawPile')} aria-label={`draw pile, ${bs.drawPile.length} cards`}>
              <Layers size={11} /> {bs.drawPile.length}
            </button>
          </div>

          {/* hand */}
          <div className="hand-area flex-1 overflow-visible" style={{ ['--hand-overlap' as string]: `${handOverlap}px` }}>
            <AnimatePresence mode="popLayout">
              {bs.hand.map((c, i) => {
                const affordable = cardCost(c) <= bs.energy && !cardDef(c).unplayable;
                const n = bs.hand.length;
                const rot = reduced ? 0 : (i - (n - 1) / 2) * Math.min(4, 26 / n);
                const lift = reduced ? 0 : Math.abs(i - (n - 1) / 2) * Math.min(3.4, 18 / n);
                return (
                  <motion.div
                    key={c.uid}
                    layout={!reduced}
                    initial={reduced ? false : { y: 110, opacity: 0, scale: 0.6 }}
                    animate={{ y: lift, opacity: 1, scale: 1, rotate: rot }}
                    exit={reduced ? { opacity: 0 } : { y: -70, x: 120, opacity: 0, scale: 0.5, transition: { duration: 0.28 } }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    className="hand-card"
                    style={{ ['--z' as string]: 10 + i, zIndex: selectedCard === c.uid ? 45 : undefined }}
                  >
                    <CardView
                      card={c}
                      battle={bs}
                      inHand
                      selected={selectedCard === c.uid}
                      affordable={affordable}
                      onClick={() => selectCard(selectedCard === c.uid ? null : c.uid)}
                      ariaLabel={`hand card ${i + 1}: ${CARDS[c.defId].name}`}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {bs.hand.length === 0 && bs.phase === 'player' && (
              <div className="text-(--color-dim) text-sm self-center pb-8">No cards — end your turn</div>
            )}
          </div>

          {/* end turn + discard */}
          <div className="flex flex-col items-center gap-1 pb-3 shrink-0">
            <button
              className={`btn ${bs.phase === 'player' && !enemyTurnRunning ? 'btn-primary' : ''} !px-3 !py-2 text-xs font-bold`}
              disabled={bs.phase !== 'player' || enemyTurnRunning}
              onClick={endTurn}
              aria-label="End turn (E)"
            >
              {enemyTurnRunning || bs.phase === 'enemy' ? '· · ·' : <>End<br />Turn</>}
            </button>
            <div className="flex gap-1">
              <button className="chip" onClick={() => setOverlay('discardPile')} aria-label={`discard pile, ${bs.discardPile.length} cards`}>
                <Trash2 size={11} /> {bs.discardPile.length}
              </button>
              {bs.exhaustPile.length > 0 && (
                <button className="chip" onClick={() => setOverlay('exhaustPile')} aria-label={`exhausted, ${bs.exhaustPile.length} cards`}>
                  <SkipForward size={11} /> {bs.exhaustPile.length}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* victory overlay */}
      <AnimatePresence>
        {bs.phase === 'won' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
          >
            <motion.div initial={{ scale: 0.9, y: 8 }} animate={{ scale: 1, y: 0 }} className="panel px-8 py-6 text-center">
              <div className="font-display text-2xl font-bold tracking-[0.25em] pl-[0.25em] mb-1" style={{ color: 'var(--color-glow)', textShadow: '0 0 24px currentColor' }}>
                VICTORY
              </div>
              {bs.battleDamageTaken === 0 && <div className="text-xs mb-2" style={{ color: 'var(--color-gold)' }}>Flawless!</div>}
              <button className="btn btn-primary mt-2" onClick={proceedAfterBattle} autoFocus>
                Claim spoils <ChevronRight size={15} />
              </button>
            </motion.div>
          </motion.div>
        )}
        {bs.phase === 'lost' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="font-display text-2xl font-bold tracking-[0.3em] pl-[0.3em]" style={{ color: 'var(--color-danger)' }}>
              YOU SINK…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tutorial */}
      <AnimatePresence>
        {tutorialStep >= 0 && tutorialStep < TUTORIAL_STEPS.length && bs.phase === 'player' && (
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={[
              'fixed z-[85] panel px-4 py-3 w-[min(88vw,340px)]',
              TUTORIAL_STEPS[tutorialStep].pos === 'bottom' ? 'bottom-[calc(var(--card-h)+86px)] left-1/2 -translate-x-1/2' : '',
              TUTORIAL_STEPS[tutorialStep].pos === 'top' ? 'top-[16%] left-1/2 -translate-x-1/2' : '',
              TUTORIAL_STEPS[tutorialStep].pos === 'left' ? 'bottom-[calc(var(--card-h)+86px)] left-3' : '',
              TUTORIAL_STEPS[tutorialStep].pos === 'topright' ? 'top-[calc(env(safe-area-inset-top)+52px)] right-3' : '',
            ].join(' ')}
            style={{ borderColor: 'rgba(56,225,211,0.45)' }}
            role="dialog"
            aria-label="tutorial hint"
          >
            <p className="text-sm leading-snug">{highlightText(TUTORIAL_STEPS[tutorialStep].text)}</p>
            <div className="flex justify-between items-center mt-2">
              <button className="text-xs text-(--color-dim) underline" onClick={() => { while (useGame.getState().tutorialStep >= 0) advanceTutorial(); }}>
                Skip
              </button>
              <button className="btn btn-primary !py-1 !px-3 text-xs" onClick={advanceTutorial}>
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Dive!' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusChipsGlossary />
    </div>
  );
}
