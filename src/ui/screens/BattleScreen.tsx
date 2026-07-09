// The battle screen: enemies with telegraphed intents, the hand fan, energy,
// tide dial, targeting flow (tap-to-play AND Hearthstone-style drag-to-play),
// damage previews, victory/defeat, and tutorial.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useIsPresent, type PanInfo } from 'framer-motion';
import { BookOpen, ChevronRight, Heart, Layers, Menu as MenuIcon, Shield, SkipForward, Trash2 } from 'lucide-react';
import { useGame, checkFlawless } from '../../state/store';
import { CARDS } from '../../content/cards';
import { CHARACTERS } from '../../content/characters';
import { ENEMIES } from '../../content/enemies';
import { KEYWORDS, KEYWORD_PATTERN } from '../../content/keywords';
import { cardCost, cardDef, living } from '../../engine/battle';
import { describeCard } from '../../engine/describe';
import type { Amount, BattleState, CardInstance, Op } from '../../engine/types';
import { CardView, highlightText } from '../components/CardView';
import { EnemyView } from '../components/EnemyView';
import { FxLayer } from '../components/FxLayer';
import { RelicBar } from '../components/RelicBar';
import { StatusChips } from '../components/StatusChips';
import { TideDial } from '../components/TideDial';
import { GoldChip } from '../components/Bits';
import { StatusChipsGlossary, useReducedMotion } from '../hooks';
import { enemyUidAtPoint, fxTargetRef } from '../fxRegistry';
import { ArtImage } from '../components/Art';

/** minimum drag displacement (px, mostly upward) before releasing plays an untargeted card */
const DRAG_PLAY_DIST = 120;

function dragPastThreshold(info: PanInfo): boolean {
  return Math.hypot(info.offset.x, info.offset.y) > DRAG_PLAY_DIST && info.offset.y < -40;
}

interface DragState {
  uid: number;
  needsTarget: boolean;
  armed: boolean;
  hoverUid: number | null;
}

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
  { text: 'This is your hand. Tap a card to select it, then play it — or drag a card out of your hand to play it (drop attacks right onto an enemy).', pos: 'bottom' },
  { text: 'Enemies telegraph their next move above their heads. Red numbers are damage you will take — Block absorbs it.', pos: 'top' },
  { text: 'Cards cost Energy — the glowing counter beside your portrait. It refills every turn. Spend it, then End Turn.', pos: 'left' },
  { text: 'The Tide cycles Low → Rising → High → Falling each turn. Flood cards surge at High tide; Ebb cards at Low.', pos: 'topright' },
];

export function BattleScreen() {
  const run = useGame((s) => s.run);
  const selectedCard = useGame((s) => s.selectedCard);
  const selectCard = useGame((s) => s.selectCard);
  const playSelected = useGame((s) => s.playSelected);
  const playCardAt = useGame((s) => s.playCardAt);
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
  const [drag, setDrag] = useState<DragState | null>(null);

  const bs = run?.battle;

  const selected = useMemo(
    () => (bs && selectedCard != null ? bs.hand.find((c) => c.uid === selectedCard) ?? null : null),
    [bs, selectedCard],
  );
  const selectedDef = selected ? CARDS[selected.defId] : null;
  const needsTarget = selectedDef?.target === 'enemy';
  const enemies = bs ? living(bs) : [];

  // damage preview follows whichever card is active — tap-selected or mid-drag
  const previewCard = selected ?? (drag && bs ? bs.hand.find((c) => c.uid === drag.uid) ?? null : null);
  const previewDef = previewCard ? CARDS[previewCard.defId] : null;
  const previewNeedsTarget = previewDef?.target === 'enemy';
  const previewDmg = previewCard && previewNeedsTarget
    ? firstDamageOp(previewCard.upgraded ? (previewDef!.opsUp ?? previewDef!.ops) : previewDef!.ops)
    : null;
  const targetingActive = (!!selected && needsTarget) || (drag?.needsTarget ?? false);

  // ── drag-to-play handlers ──
  const onDragStartCard = (c: CardInstance, needs: boolean) => {
    if (selectedCard != null) selectCard(null);
    setDrag({ uid: c.uid, needsTarget: needs, armed: false, hoverUid: null });
  };
  const onDragMoveCard = (needs: boolean, info: PanInfo) => {
    setDrag((d) => {
      if (!d) return d;
      if (needs) {
        const hover = enemyUidAtPoint(info.point.x - window.scrollX, info.point.y - window.scrollY);
        if (hover === d.hoverUid && d.armed === (hover != null)) return d;
        return { ...d, hoverUid: hover, armed: hover != null };
      }
      const armed = dragPastThreshold(info);
      return armed === d.armed ? d : { ...d, armed };
    });
  };
  const onDragEndCard = (c: CardInstance, needs: boolean, info: PanInfo) => {
    setDrag(null);
    if (needs) {
      const hover = enemyUidAtPoint(info.point.x - window.scrollX, info.point.y - window.scrollY);
      if (hover != null) playCardAt(c.uid, hover);
    } else if (dragPastThreshold(info)) {
      playCardAt(c.uid);
    }
  };

  // watchdog: any pointer release ends the drag interaction — if framer's
  // onDragEnd was lost (edge cases), the armed glow / targeting UI must not
  // stay stuck. Runs after framer has had its chance to resolve the play.
  useEffect(() => {
    const clear = () => window.setTimeout(() => setDrag(null), 120);
    window.addEventListener('pointerup', clear, true);
    window.addEventListener('pointercancel', clear, true);
    return () => {
      window.removeEventListener('pointerup', clear, true);
      window.removeEventListener('pointercancel', clear, true);
    };
  }, []);

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
          {enemies.map((e) => (
            <EnemyView
              key={e.uid}
              bs={bs}
              e={e}
              targeting={targetingActive}
              hovered={drag?.hoverUid === e.uid}
              previewAmount={targetingActive ? previewDmg?.amount ?? null : null}
              previewTimes={previewDmg?.times ?? 1}
              onPick={() => playSelected(e.uid)}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* player strip — block + statuses (the portrait lives bottom-left now) */}
      <div className="flex items-center justify-center gap-2 px-3 py-1">
        {bs.player.block > 0 && (
          <span className="chip !text-sm font-black" style={{ color: 'var(--color-shield)', borderColor: 'rgba(95,185,255,0.5)' }}>
            <Shield size={13} /> {bs.player.block}
          </span>
        )}
        <StatusChips creature={bs.player} />
      </div>

      {/* selected card panel — when targeting it moves aside and lets clicks
          pass through so no enemy is ever blocked by the preview */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className={`absolute z-40 flex items-end ${needsTarget ? 'left-2 gap-2 pointer-events-none' : 'left-1/2 -translate-x-1/2 gap-3'}`}
            style={{ bottom: 'calc(var(--card-h) + 64px)' }}
          >
            <CardView card={selected} battle={bs} scale={needsTarget ? undefined : 'lg'} ariaLabel="selected card preview" />
            <div className="flex flex-col gap-2 max-w-[180px] pb-1">
              {selectedKeywords.map((k) => (
                <div key={k.id} className="text-[10px] leading-tight text-(--color-mist)">
                  <span className="kw font-bold">{k.name}</span> — {k.text}
                </div>
              ))}
              <div className="flex gap-2 mt-1 pointer-events-auto">
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
          {/* hero portrait + energy gem + health */}
          <div className="flex flex-col items-center gap-1 pb-3 shrink-0 z-20">
            <div ref={fxTargetRef('player')} className="relative mb-2">
              <div
                className="hero-portrait w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 overflow-hidden flex items-center justify-center"
                style={{
                  borderColor: ch.color,
                  color: ch.color,
                  background: 'rgba(8,17,32,0.85)',
                  boxShadow: '0 6px 18px rgba(2,6,14,0.6)',
                }}
                aria-hidden
              >
                <ArtImage kind="characters" id={ch.id} icon={ch.icon} className="w-full h-full object-cover object-top" iconSize={34} />
              </div>
              <div
                className="absolute -top-1 -right-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px]"
                style={{
                  color: '#06222a',
                  background: 'radial-gradient(circle at 35% 30%, #b8fff5, var(--color-glow) 60%, #0f8d84)',
                  border: '2px solid rgba(4,9,19,0.85)',
                  boxShadow: bs.energy > 0 ? '0 0 16px rgba(56,225,211,0.6)' : 'none',
                  opacity: bs.energy > 0 ? 1 : 0.55,
                }}
                role="status"
                aria-label={`${bs.energy} of ${bs.maxEnergy} energy`}
              >
                {bs.energy}/{bs.maxEnergy}
              </div>
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-2 py-0.5 font-black text-[12px] whitespace-nowrap"
                style={{
                  background: 'rgba(8,17,32,0.95)',
                  border: '1.5px solid rgba(255,111,111,0.55)',
                  color: bs.player.hp / bs.player.maxHp < 0.3 ? 'var(--color-danger)' : 'var(--color-foam)',
                  boxShadow: '0 2px 10px rgba(2,6,14,0.6)',
                }}
                role="status"
                aria-label={`${bs.player.hp} of ${bs.player.maxHp} HP`}
              >
                <Heart size={11} style={{ color: 'var(--color-danger)' }} fill="currentColor" />
                {bs.player.hp}/{bs.player.maxHp}
              </div>
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
                return (
                  <HandCard
                    key={c.uid}
                    c={c}
                    i={i}
                    n={bs.hand.length}
                    bs={bs}
                    reduced={reduced}
                    isSelected={selectedCard === c.uid}
                    affordable={affordable}
                    canDrag={affordable && bs.phase === 'player' && !enemyTurnRunning}
                    dragging={drag?.uid === c.uid}
                    armed={drag?.uid === c.uid && drag.armed}
                    onSelect={() => selectCard(selectedCard === c.uid ? null : c.uid)}
                    onDragStartCard={onDragStartCard}
                    onDragMoveCard={onDragMoveCard}
                    onDragEndCard={onDragEndCard}
                  />
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

// ─────────────────────────────────────────────────────────────────────────────
// One card in the hand fan. Handles both play methods: tap-to-select (click)
// and Hearthstone-style drag-to-play (drag past a threshold for skills, or
// drop directly onto an enemy for targeted cards; snaps back otherwise).
// ─────────────────────────────────────────────────────────────────────────────

interface HandCardProps {
  c: CardInstance;
  i: number;
  n: number;
  bs: BattleState;
  reduced: boolean;
  isSelected: boolean;
  affordable: boolean;
  canDrag: boolean;
  dragging: boolean;
  armed: boolean;
  onSelect: () => void;
  onDragStartCard: (c: CardInstance, needsTarget: boolean) => void;
  onDragMoveCard: (needsTarget: boolean, info: PanInfo) => void;
  onDragEndCard: (c: CardInstance, needsTarget: boolean, info: PanInfo) => void;
}

function HandCard({
  c, i, n, bs, reduced, isSelected, affordable, canDrag, dragging, armed,
  onSelect, onDragStartCard, onDragMoveCard, onDragEndCard,
}: HandCardProps) {
  // a completed drag fires a click on release — swallow it so the card
  // doesn't also get tap-selected
  const suppressClick = useRef(false);
  // a played card's exit "ghost" lingers ~300ms — it must not eat taps/drags
  // aimed at the live cards reflowing underneath it
  const isPresent = useIsPresent();
  const needsTarget = CARDS[c.defId].target === 'enemy';
  const rot = reduced || dragging ? 0 : (i - (n - 1) / 2) * Math.min(4, 26 / n);
  const lift = reduced ? 0 : Math.abs(i - (n - 1) / 2) * Math.min(3.4, 18 / n);

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { y: 110, opacity: 0, scale: 0.6 }}
      animate={{ y: lift, opacity: 1, scale: 1, rotate: rot }}
      exit={reduced ? { opacity: 0 } : { y: -70, x: 120, opacity: 0, scale: 0.5, transition: { duration: 0.28 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      drag={canDrag}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={1}
      /* no nested draggables here, so skip framer's global drag lock — a lost
         end event must never be able to wedge all future drags */
      dragPropagation
      whileDrag={reduced ? undefined : { scale: 1.06 }}
      onPointerDown={() => {
        // every new press starts clean — a stale suppress flag (e.g. from a
        // drag whose end event got lost) must never eat future taps
        suppressClick.current = false;
      }}
      onDragStart={() => {
        suppressClick.current = true;
        onDragStartCard(c, needsTarget);
      }}
      onDrag={(_, info) => onDragMoveCard(needsTarget, info)}
      onDragEnd={(_, info) => {
        onDragEndCard(c, needsTarget, info);
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 150);
      }}
      className={`hand-card ${dragging ? 'dragging' : ''}`}
      style={{
        ['--z' as string]: 10 + i,
        zIndex: dragging ? 60 : isSelected ? 45 : undefined,
        touchAction: 'none',
        pointerEvents: isPresent ? undefined : 'none',
      }}
    >
      <CardView
        card={c}
        battle={bs}
        inHand
        selected={isSelected}
        armed={armed}
        affordable={affordable}
        onClick={() => {
          if (suppressClick.current) return;
          onSelect();
        }}
        ariaLabel={`hand card ${i + 1}: ${CARDS[c.defId].name}`}
      />
    </motion.div>
  );
}
