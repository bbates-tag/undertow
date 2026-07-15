// Central Zustand store: screens, run orchestration, meta-progression,
// persistence, fx queue, and audio triggers all flow through here.
// Engine functions are pure-ish mutators, so every action clones the run,
// mutates the clone, and commits — which also makes autosave trivial.

import { create } from 'zustand';
import type {
  CardType, CharacterId, Fx, MetaState, RunState, Settings,
} from '../engine/types';
import { CARDS } from '../content/cards';
import { deepClone, sleep, todayKey } from '../lib/util';
import { hashSeed, makeRng } from '../lib/rng';
import {
  canPlay, cardExhausts, endPlayerTurn, getStatus, newEmit, playCard, stepEnemy, type Emit,
} from '../engine/battle';
import {
  addCardToDeck, addRelic, applyBoon, applyEventEffect, beginLoop, buyCrate, buyDefang, buyRemoval, buyShopItem,
  buyWhetstone, choosePressure, completePick, descend, doRestHeal, enterNode, generateBattleReward, newRun,
  pawnRelic, scoreRun, sellPrice, type PendingPick,
} from '../engine/run';
import { PRESSURES } from '../content/pressures';
import { EVENTS } from '../content/events';
import { RELICS } from '../content/relics';
import { ACHIEVEMENTS, DAILY_MODS, UNLOCK_PACKS } from '../content/meta';
import { CHARACTERS } from '../content/characters';
import { playSfx, playSfxList, setSfxEnabled } from '../audio/sfx';
import { music } from '../audio/music';
import { setMasterVolume } from '../audio/zzfx';
import { loadSave, parseSaveBlob, persist, wipeSave, writeSaveNow } from './persist';
import { withSeen } from './seen';

export type Screen =
  | 'menu' | 'newRun' | 'map' | 'battle' | 'reward' | 'shop' | 'rest' | 'event'
  | 'gameover' | 'victory' | 'stats' | 'achievements' | 'credits' | 'settings' | 'howToPlay' | 'compendium'
  | 'pressureChoice';

export type Overlay = 'none' | 'deck' | 'drawPile' | 'discardPile' | 'exhaustPile' | 'glossary' | 'settings' | 'hold';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'achievement' | 'unlock' | 'relic';
}

/** what was just played — drives the per-category card exit animation */
export interface LastPlay {
  seq: number;
  uid: number;
  kind: CardType;
  exhaust: boolean;
  targetKey: string | null;
}

export const defaultMeta = (): MetaState => ({
  version: 1,
  fathoms: 0,
  unlockedChars: ['tidecaller'],
  unlockedPacks: [],
  ascension: { tidecaller: 0, voltaic: 0 },
  wins: { tidecaller: 0, voltaic: 0 },
  runsPlayed: 0,
  achievements: {},
  seenEnemies: {},
  seenCards: {},
  seenRelics: {},
  runHistory: [],
  dailyHistory: [],
  bestScore: 0,
  tutorialSeen: false,
});

export const defaultSettings = (): Settings => ({
  volume: 0.8,
  sfx: true,
  music: true,
  reducedMotion: 'auto',
  fastMode: false,
});

interface GameStore {
  screen: Screen;
  overlay: Overlay;
  meta: MetaState;
  settings: Settings;
  run: RunState | null;
  fx: Fx[];
  toasts: Toast[];
  eventLog: string[];
  pendingPick: PendingPick;
  enemyTurnRunning: boolean;
  /** uid of card selected in hand (targeting mode) */
  selectedCard: number | null;
  lastPlay: LastPlay | null;
  tutorialStep: number; // -1 = off
  newlyUnlocked: string[]; // labels shown on run-end screens

  boot(): void;
  go(screen: Screen): void;
  setOverlay(o: Overlay): void;
  toast(text: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;

  startRun(charId: CharacterId, ascension: number): void;
  startDaily(charId: CharacterId): void;
  abandonRun(): void;

  pickNode(row: number, col: number): void;
  selectCard(uid: number | null): void;
  playSelected(targetUid?: number): void;
  /** play a specific card directly (drag-to-play path) */
  playCardAt(uid: number, targetUid?: number): void;
  endTurn(): void;
  proceedAfterBattle(): void;

  rewardTakeCard(i: number): void;
  rewardSkipCards(): void;
  rewardTakeBossRelic(i: number): void;
  /** deep endless: take a boss boon when the relic pool has run dry */
  rewardTakeBoon(i: number): void;
  leaveReward(): void;
  /** endless: from the victory screen, dive past the Drowned God into loop 2 */
  continueEndless(): void;
  /** endless: lock in the offered Pressure for this loop */
  choosePressure(id: string): void;

  shopBuy(i: number): void;
  shopStartRemoval(): void;
  shopStartWhetstone(): void;
  shopDefang(relicId: string): void;
  shopBuyCrate(): void;
  shopPawn(relicId: string): void;
  restHeal(): void;
  restStartUpgrade(): void;
  leaveNode(): void;

  eventChoose(choiceId: string): void;

  pickDeckCard(uid: number): void;
  cancelPick(): void;

  setSettings(p: Partial<Settings>): void;
  resetSave(): void;
  /** replace all progress with an exported save; false = invalid/unwritable, nothing changed */
  importSave(raw: string): boolean;
  advanceTutorial(): void;

  clearFxBefore(id: number): void;
}

let toastId = 1;
let playSeq = 1;

function applyAudioSettings(s: Settings) {
  setMasterVolume(s.volume);
  setSfxEnabled(s.sfx);
  music.setEnabled(s.music);
  music.setVolume(s.volume);
}

export const useGame = create<GameStore>((set, get) => {
  /** commit a mutated run + emit queue */
  const commit = (run: RunState | null, emit?: Emit) => {
    if (run?.battle) {
      const might = getStatus(run.battle.player, 'might');
      if (might > run.stats.maxMight) run.stats.maxMight = might;
    }
    set((st) => ({
      run,
      fx: emit && emit.fx.length ? [...st.fx.slice(-40), ...emit.fx] : st.fx,
    }));
    if (emit?.sfx.length) playSfxList(emit.sfx);
    persist(get());
    checkAchievements();
  };

  const award = (id: string) => {
    const meta = get().meta;
    if (meta.achievements[id]) return;
    const next = { ...meta, achievements: { ...meta.achievements, [id]: new Date().toISOString() } };
    set({ meta: next });
    get().toast(`Achievement — ${ACHIEVEMENTS[id].name}`, 'achievement');
    playSfx('achievement');
    persist(get());
  };

  const checkAchievements = () => {
    const { run } = get();
    if (!run) return;
    const s = run.stats;
    if (s.kills > 0) award('firstBlood');
    if (s.maxToxinApplied >= 25) award('toxinMaster');
    if (s.maxCharge >= 20) award('fullBattery');
    if ((s.maxDescent ?? 0) >= 25) award('deepDescent');
    if (s.maxBlock >= 40) award('wallOfNacre');
    if (s.maxMight >= 10) award('mightyOne');
    if (run.gold >= 250) award('hoarder');
    if (run.relics.length >= 8) award('collector');
  };

  const finishRun = (result: 'win' | 'loss') => {
    const run = get().run;
    if (!run) return;
    run.result = result;
    const score = scoreRun(run);
    // an endless death ends a run whose victory was already banked — award
    // only the fathoms earned since, and don't re-count the run itself
    const endlessDeath = result === 'loss' && run.loop > 0;
    const meta = deepClone(get().meta);
    if (!endlessDeath) meta.runsPlayed += 1;
    meta.fathoms += endlessDeath ? Math.max(0, score - (run.endlessBanked ?? 0)) : score;
    meta.bestScore = Math.max(meta.bestScore, score);
    if (result === 'win') {
      run.endlessBanked = score; // continueEndless pays out deltas from here
      meta.wins[run.charId] = (meta.wins[run.charId] ?? 0) + 1;
      const cur = meta.ascension[run.charId] ?? 0;
      meta.ascension[run.charId] = Math.min(10, Math.max(cur, run.ascension + 1));
    }
    // character unlocks: Voltaic after any boss kill, the Drowned after two in one run
    const unlocked: string[] = [];
    if (run.stats.bossesKilled >= 1 && !meta.unlockedChars.includes('voltaic')) {
      meta.unlockedChars.push('voltaic');
      unlocked.push('New character — The Voltaic');
    }
    if (run.stats.bossesKilled >= 2 && !meta.unlockedChars.includes('drowned')) {
      meta.unlockedChars.push('drowned');
      unlocked.push('New character — The Drowned');
    }
    if (run.stats.battlesFlawless >= 3 && !meta.unlockedChars.includes('weaver')) {
      meta.unlockedChars.push('weaver');
      unlocked.push('New character — The Wakeweaver');
    }
    for (const pack of UNLOCK_PACKS) {
      if (meta.fathoms >= pack.atFathoms && !meta.unlockedPacks.includes(pack.id)) {
        meta.unlockedPacks.push(pack.id);
        unlocked.push(`New cards & relics — ${pack.name}`);
      }
    }
    meta.runHistory.unshift({
      date: new Date().toISOString(),
      charId: run.charId,
      result,
      floor: run.floor,
      act: run.act,
      score,
      ascension: run.ascension,
      daily: !!run.daily,
      killedBy: run.killedBy,
      fathoms: score,
      loop: run.loop > 0 ? run.loop : undefined,
    });
    meta.runHistory = meta.runHistory.slice(0, 40);
    if (run.daily) {
      meta.dailyHistory.unshift({ date: run.daily.date, score, result, floor: run.floor });
      meta.dailyHistory = meta.dailyHistory.slice(0, 60);
      award('dailyDiver');
    }
    set({ meta, newlyUnlocked: unlocked });

    // result achievements
    if (result === 'win') {
      if (run.charId === 'voltaic') award('voltVictor');
      if (run.charId === 'drowned') award('drownedVictor');
      award('godDrowner');
      if (run.deck.length <= 15) award('minimalist');
      if (run.ascension >= 5) award('depth5');
      if (run.ascension >= 10) award('depth10');
    }
    music.setMood('calm');
    set({ screen: result === 'win' ? 'victory' : 'gameover', run: { ...run } });
    persist(get());
  };

  const runEnemyTurn = async () => {
    if (get().enemyTurnRunning) return;
    set({ enemyTurnRunning: true });
    try {
      // small beat so the player sees their turn end
      await sleep(get().settings.fastMode ? 180 : 420);
      for (let guard = 0; guard < 40; guard++) {
        const st = get();
        const run = st.run;
        if (!run?.battle || run.battle.phase !== 'enemy') break;
        const clone = deepClone(run);
        const emit = newEmit();
        const more = stepEnemy(clone, emit);
        commit(clone, emit);
        if (clone.battle?.phase === 'lost') {
          await sleep(900);
          finishRun('loss');
          return;
        }
        if (!more) break;
        await sleep(st.settings.fastMode ? 320 : 640);
      }
    } finally {
      set({ enemyTurnRunning: false });
    }
  };

  return {
    screen: 'menu',
    overlay: 'none',
    meta: defaultMeta(),
    settings: defaultSettings(),
    run: null,
    fx: [],
    toasts: [],
    eventLog: [],
    pendingPick: null,
    enemyTurnRunning: false,
    selectedCard: null,
    lastPlay: null,
    tutorialStep: -1,
    newlyUnlocked: [],

    boot() {
      const saved = loadSave();
      if (saved) {
        set({
          meta: { ...defaultMeta(), ...saved.meta },
          settings: { ...defaultSettings(), ...saved.settings },
          run: saved.run ?? null,
        });
      }
      applyAudioSettings(get().settings);
      const run = get().run;
      if (run && !run.result) {
        // resume where we left off
        if (run.battle) {
          set({ screen: 'battle' });
          music.setMood(run.battle.isBoss ? 'boss' : 'battle');
          if (run.battle.phase === 'enemy') void runEnemyTurn();
        } else if (run.shop) set({ screen: 'shop' });
        else if (run.eventId) set({ screen: 'event' });
        else if (run.reward) set({ screen: 'reward' });
        // a pending Pressure pick must survive a refresh — it can't be skipped
        else if (run.pressureOffer) set({ screen: 'pressureChoice' });
        else set({ screen: 'map' });
      }
      // seed discovery on load: covers fresh profiles (unlocked starters)
      // and profiles from before seen-tracking existed
      const seen = withSeen(get().meta, get().run);
      if (seen) {
        set({ meta: seen });
        persist(get());
      }
    },

    go(screen) {
      playSfx('click');
      set({ screen });
    },

    setOverlay(o) {
      if (o !== 'none') playSfx('click');
      set({ overlay: o });
    },

    toast(text, kind = 'info') {
      const t: Toast = { id: toastId++, text, kind };
      set((st) => ({ toasts: [...st.toasts.slice(-3), t] }));
      setTimeout(() => get().dismissToast(t.id), 3800);
    },

    dismissToast(id) {
      set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
    },

    startRun(charId, ascension) {
      const meta = get().meta;
      const run = newRun({ charId, ascension, unlockedPacks: meta.unlockedPacks });
      const tutorial = !meta.tutorialSeen;
      set({ run, screen: 'map', selectedCard: null, pendingPick: null, eventLog: [], newlyUnlocked: [], tutorialStep: tutorial ? 0 : -1 });
      music.setMood('calm');
      music.start();
      playSfx('battleStart');
      persist(get());
    },

    startDaily(charId) {
      const date = todayKey();
      const seed = `undertow-daily-${date}`;
      const modRng = makeRng(hashSeed(seed + '-mods'));
      const modIds = modRng.shuffle(Object.keys(DAILY_MODS)).slice(0, 2);
      const meta = get().meta;
      const run = newRun({
        charId, ascension: 0, seed,
        daily: { date, mods: modIds },
        unlockedPacks: meta.unlockedPacks,
      });
      set({ run, screen: 'map', selectedCard: null, pendingPick: null, eventLog: [], newlyUnlocked: [] });
      music.setMood('calm');
      music.start();
      playSfx('battleStart');
      persist(get());
    },

    abandonRun() {
      const run = get().run;
      if (run && !run.result) {
        finishRun('loss');
        return;
      }
      set({ run: null, screen: 'menu' });
      persist(get());
    },

    pickNode(row, col) {
      set({ eventLog: [] });
      const run = deepClone(get().run!);
      const emit = newEmit();
      const outcome = enterNode(run, row, col, emit);
      playSfx('mapMove');
      commit(run, emit);
      if (outcome === 'battle') {
        music.setMood(run.battle!.isBoss ? 'boss' : 'battle');
        set({ screen: 'battle', selectedCard: null });
      } else if (outcome === 'reward') {
        // treasure: auto-collect relic(s)
        const r2 = deepClone(run);
        for (const relic of r2.reward!.relics) {
          addRelic(r2, relic);
          get().toast(`Relic — ${RELICS[relic]?.name ?? relic}`, 'relic');
        }
        r2.reward!.relics = [];
        commit(r2);
        playSfx('relicGet');
        set({ screen: 'reward' });
      } else {
        set({ screen: outcome });
        if (outcome === 'rest') playSfx('rest');
      }
    },

    selectCard(uid) {
      const run = get().run;
      if (!run?.battle || run.battle.phase !== 'player') return;
      if (uid !== null) {
        const err = canPlay(run, run.battle, uid);
        if (err === 'energy') {
          get().toast('Not enough Energy');
          playSfx('error');
          return;
        }
        if (err === 'unplayable') {
          get().toast("This card can't be played");
          playSfx('error');
          return;
        }
        if (err === 'pressure') {
          get().toast('The Deep Demands — no more cards this turn');
          playSfx('error');
          return;
        }
        if (err === 'hp') {
          get().toast('Not enough HP — the cost would kill you');
          playSfx('error');
          return;
        }
        playSfx('click');
      }
      set({ selectedCard: uid });
    },

    playSelected(targetUid) {
      const uid = get().selectedCard;
      if (uid == null) return;
      get().playCardAt(uid, targetUid);
    },

    playCardAt(uid, targetUid) {
      const run = get().run;
      if (!run?.battle) return;
      // snapshot the card's identity before the engine consumes it, so the
      // exit animation knows what kind of play this was
      const inst = run.battle.hand.find((c) => c.uid === uid);
      const def = inst ? CARDS[inst.defId] : null;
      const clone = deepClone(run);
      const emit = newEmit();
      const err = playCard(clone, uid, targetUid, emit);
      if (err) {
        if (err === 'energy') get().toast('Not enough Energy');
        if (err === 'hp') get().toast('Not enough HP — the cost would kill you');
        if (err === 'pressure') get().toast('The Deep Demands — no more cards this turn');
        playSfx('error');
        return;
      }
      if (inst && def) {
        set({
          lastPlay: {
            seq: ++playSeq,
            uid,
            kind: def.type,
            exhaust: cardExhausts(inst),
            targetKey: def.target === 'enemy' && targetUid != null ? `e${targetUid}` : null,
          },
        });
      }
      set({ selectedCard: null });
      commit(clone, emit);
      if (clone.battle?.phase === 'lost') {
        void sleep(900).then(() => finishRun('loss'));
      }
      if (get().tutorialStep === 1) set({ tutorialStep: 2 });
    },

    endTurn() {
      const run = get().run;
      if (!run?.battle || run.battle.phase !== 'player' || get().enemyTurnRunning) return;
      const clone = deepClone(run);
      const emit = newEmit();
      endPlayerTurn(clone, emit);
      playSfx('click');
      set({ selectedCard: null });
      commit(clone, emit);
      void runEnemyTurn();
    },

    proceedAfterBattle() {
      const run = get().run;
      if (!run?.battle) return;
      if (run.battle.phase === 'lost') {
        finishRun('loss');
        return;
      }
      if (run.battle.phase !== 'won') return;
      const clone = deepClone(run);
      const reward = generateBattleReward(clone);
      const wasBoss = clone.battle!.isBoss;
      const groupId = clone.battle!.groupId;
      clone.battle = null;
      clone.reward = reward;
      // auto-collect gold + elite relics (fewer taps)
      clone.gold += reward.gold;
      clone.stats.goldEarned += reward.gold;
      for (const r of reward.relics) {
        addRelic(clone, r);
      }
      music.setMood('calm');
      commit(clone);
      playSfxList(['victory', 'gold']);
      if (reward.relics.length) playSfx('relicGet');
      // boss achievements (What Dreams Beneath is the act-4 finale; the Drowned God holds act 2)
      if (groupId === 'a1_boss') award('kingslayer');
      if (groupId === 'a3_boss') award('krakenslayer');
      if (groupId === 'a4_boss') award('dreamSlayer');
      if (wasBoss && get().run!.battle === null && get().run!.stats.battlesFlawless > 0) {
        // flawless tracked per battle below
      }
      set({ screen: 'reward' });
    },

    rewardTakeCard(i) {
      const run = deepClone(get().run!);
      const reward = run.reward;
      if (!reward || reward.taken.card) return;
      const card = reward.cards[i];
      if (!card) return;
      run.deck.push(card);
      reward.taken.card = true;
      playSfx('buy');
      commit(run);
    },

    rewardSkipCards() {
      const run = deepClone(get().run!);
      if (!run.reward) return;
      run.reward.taken.card = true;
      playSfx('click');
      commit(run);
    },

    rewardTakeBossRelic(i) {
      const run = deepClone(get().run!);
      const reward = run.reward;
      if (!reward || reward.taken.bossRelic) return;
      const relic = reward.bossRelics[i];
      if (!relic) return;
      addRelic(run, relic);
      reward.taken.bossRelic = true;
      playSfx('relicGet');
      commit(run);
    },

    rewardTakeBoon(i) {
      const run = deepClone(get().run!);
      const reward = run.reward;
      if (!reward || reward.taken.bossRelic) return;
      const boon = reward.bossBoons?.[i];
      if (!boon) return;
      const emit = newEmit();
      const msg = applyBoon(run, boon, emit);
      reward.taken.bossRelic = true; // boons share the one-pick-per-boss slot
      commit(run, emit);
      if (msg) get().toast(msg);
      playSfx('relicGet');
    },

    continueEndless() {
      const run = deepClone(get().run);
      if (!run || run.result !== 'win' || run.daily) return;
      const emit = newEmit();
      beginLoop(run, emit);
      commit(run, emit);
      award('noBottom');
      music.setMood('calm');
      playSfx('battleStart');
      if (run.pressureOffer) {
        get().toast(`Loop ${run.loop + 1} — the sea has no bottom`);
        set({ screen: 'pressureChoice' });
      } else {
        get().toast(`Loop ${run.loop + 1} — the deep takes its toll: −5 Max HP`);
        set({ screen: 'map' });
      }
    },

    choosePressure(id) {
      const run = deepClone(get().run!);
      if (!choosePressure(run, id)) return;
      commit(run);
      get().toast(PRESSURES[id].text);
      playSfx('relicGet');
      set({ screen: 'map' });
    },

    leaveReward() {
      const run = deepClone(get().run!);
      const wasBoss = run.reward?.source === 'boss';
      run.reward = null;
      if (wasBoss) {
        const emit = newEmit();
        // already looping: repeat What Dreams Beneath kills descend again without ceremony
        if (run.act >= 4 && run.loop > 0) {
          beginLoop(run, emit);
          commit(run, emit);
          if (run.loop >= 2) award('pressureHolds'); // entering the third full descent
          if (run.pressureOffer) {
            get().toast(`Loop ${run.loop + 1} — The Sunlit Shallows, deeper than before`);
            set({ screen: 'pressureChoice' });
          } else {
            get().toast(`Loop ${run.loop + 1} — the deep takes its toll: −5 Max HP`);
            set({ screen: 'map' });
          }
          return;
        }
        const next = descend(run, emit);
        commit(run, emit);
        if (next === 'victory') {
          finishRun('win');
        } else {
          const toasts = { 2: 'Act II — The Twilight Trench', 3: 'Act III — The Hadal Deep', 4: 'Act IV — The Dreaming Dark' };
          get().toast(toasts[run.act as 2 | 3 | 4]);
          set({ screen: 'map' });
        }
        return;
      }
      commit(run);
      set({ screen: 'map' });
    },

    shopBuy(i) {
      const run = deepClone(get().run!);
      const err = buyShopItem(run, i);
      if (err === 'gold') {
        get().toast('Not enough gold');
        playSfx('error');
        return;
      }
      if (!err) playSfx('buy');
      commit(run);
    },

    shopStartRemoval() {
      const run = get().run;
      if (!run?.shop || run.shop.removalsLeft <= 0) return;
      if (run.gold < run.shop.removalPrice) {
        get().toast('Not enough gold');
        playSfx('error');
        return;
      }
      set({ pendingPick: { kind: 'remove', from: 'shop' }, overlay: 'deck' });
    },

    shopStartWhetstone() {
      const run = get().run;
      if (!run?.shop || (run.shop.whetstonesLeft ?? 0) <= 0 || run.shop.whetstonePrice == null) return;
      if (run.gold < run.shop.whetstonePrice) {
        get().toast('Not enough gold');
        playSfx('error');
        return;
      }
      set({ pendingPick: { kind: 'upgrade', from: 'shop' }, overlay: 'deck' });
    },

    shopDefang(relicId) {
      const run = deepClone(get().run!);
      const err = buyDefang(run, relicId);
      if (err === 'gold') {
        get().toast('Not enough gold');
        playSfx('error');
        return;
      }
      if (err) return;
      playSfx('upgrade');
      commit(run);
      get().toast(`${RELICS[relicId].name} defanged. Pure upside now.`);
    },

    shopBuyCrate() {
      const run = deepClone(get().run!);
      const relicId = run.shop?.crateRelicId;
      const err = buyCrate(run);
      if (err === 'gold') {
        get().toast('Not enough gold');
        playSfx('error');
        return;
      }
      if (err) return;
      playSfx('buy');
      commit(run);
      get().toast(`Inside: ${RELICS[relicId!].name}!`, 'relic');
    },

    shopPawn(relicId) {
      const run = deepClone(get().run!);
      const err = pawnRelic(run, relicId);
      if (err) return;
      playSfx('buy');
      commit(run);
      get().toast(`Pawned ${RELICS[relicId].name} for ${sellPrice(relicId)} gold.`);
    },

    restHeal() {
      const run = deepClone(get().run!);
      const emit = newEmit();
      doRestHeal(run, emit);
      playSfx('rest');
      commit(run, emit);
      set({ screen: 'map' });
      get().toast('You breathe. You mend.');
    },

    restStartUpgrade() {
      set({ pendingPick: { kind: 'upgrade', from: 'rest' }, overlay: 'deck' });
    },

    leaveNode() {
      const run = deepClone(get().run!);
      run.shop = null;
      run.eventId = null;
      commit(run);
      set({ screen: 'map', eventLog: [] });
    },

    eventChoose(choiceId) {
      const run = deepClone(get().run!);
      if (!run.eventId) return;
      const ev = EVENTS[run.eventId];
      const choice = ev.choices.find((c) => c.id === choiceId);
      if (!choice) return;
      const emit = newEmit();
      const { log, pendingPick } = applyEventEffect(run, choice.effect, emit);
      run.eventId = pendingPick ? run.eventId : run.eventId; // stays until leave
      playSfx('click');
      commit(run, emit);
      set({ eventLog: log, pendingPick, overlay: pendingPick ? 'deck' : 'none' });
    },

    pickDeckCard(uid) {
      const st = get();
      const pick = st.pendingPick;
      if (!pick) return;
      const run = deepClone(st.run!);
      if (pick.from === 'shop') {
        const err = pick.kind === 'upgrade' ? buyWhetstone(run, uid) : buyRemoval(run, uid);
        if (err) {
          playSfx('error');
          return;
        }
        playSfx(pick.kind === 'upgrade' ? 'upgrade' : 'buy');
        commit(run);
        set({ pendingPick: null, overlay: 'none' });
        return;
      }
      const msg = completePick(run, pick.kind, uid);
      playSfx(pick.kind === 'upgrade' ? 'upgrade' : 'click');
      if (pick.from === 'rest') run.stats.restsUsed += 1;
      commit(run);
      if (pick.from === 'event') {
        set({ pendingPick: null, overlay: 'none', eventLog: [...st.eventLog, msg] });
      } else {
        set({ pendingPick: null, overlay: 'none' });
        get().toast(msg);
        if (pick.from === 'rest') set({ screen: 'map' });
      }
    },

    cancelPick() {
      set({ pendingPick: null, overlay: 'none' });
    },

    setSettings(p) {
      const settings = { ...get().settings, ...p };
      set({ settings });
      applyAudioSettings(settings);
      persist(get());
    },

    resetSave() {
      wipeSave();
      set({
        meta: defaultMeta(),
        settings: defaultSettings(),
        run: null,
        screen: 'menu',
        toasts: [],
      });
      applyAudioSettings(get().settings);
    },

    importSave(raw) {
      const blob = parseSaveBlob(raw);
      if (!blob || !writeSaveNow(blob)) return false;
      // boot() re-hydrates from storage — same migrations and screen resume
      // as a fresh page load, so a mid-battle import lands back in the fight
      set({ run: null, screen: 'menu' });
      get().boot();
      get().toast('Save imported');
      return true;
    },

    advanceTutorial() {
      const step = get().tutorialStep;
      if (step >= 3) {
        const meta = { ...get().meta, tutorialSeen: true };
        set({ tutorialStep: -1, meta });
        persist(get());
      } else {
        set({ tutorialStep: step + 1 });
      }
    },

    clearFxBefore(id) {
      set((st) => ({ fx: st.fx.filter((f) => f.id > id) }));
    },
  };
});

// Compendium discovery: whenever the run changes, union anything newly
// visible (battle enemies incl. summons, deck/reward/shop/pile cards) into
// meta.seen*. One hook site catches every code path that mutates the run;
// the setState below only touches meta, so it can't re-trigger itself.
useGame.subscribe((st, prev) => {
  if (st.run === prev.run) return;
  const next = withSeen(st.meta, st.run);
  if (next) {
    useGame.setState({ meta: next });
    persist(useGame.getState());
  }
});

/** flawless-battle achievement hook: called from BattleScreen when a battle is won */
export function checkFlawless() {
  const st = useGame.getState();
  const bs = st.run?.battle;
  if (bs?.phase === 'won' && bs.battleDamageTaken === 0) {
    if (!st.meta.achievements.flawless) {
      const meta = { ...st.meta, achievements: { ...st.meta.achievements, flawless: new Date().toISOString() } };
      useGame.setState({ meta });
      st.toast(`Achievement — ${ACHIEVEMENTS.flawless.name}`, 'achievement');
      playSfx('achievement');
      persist(useGame.getState());
    }
  }
}

export function characterList() {
  return Object.values(CHARACTERS);
}

export function newCardInstance(run: RunState, defId: string) {
  return addCardToDeck(run, defId);
}
