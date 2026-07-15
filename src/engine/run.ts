// Run layer: map generation, node flow, rewards, shops, rest sites, events,
// deck manipulation, act transitions, scoring. Battle combat lives in battle.ts.

import type {
  Act, CardInstance, CharacterId, GameMap, MapNode, NodeType, RewardState, RunState, ShopState,
} from './types';
import { hashSeed, makeRng, type Rng } from '../lib/rng';
import { CARDS, RARITY_WEIGHTS, rewardableCards } from '../content/cards';
import { CHARACTERS } from '../content/characters';
import { DEFANGABLE, RELICS, relicPool } from '../content/relics';
import { BOONS } from '../content/boons';
import { generateBattleSpec, generateBossSpec, generateEliteSpec } from './endless';
import { EVENTS } from '../content/events';
import { encounterPool } from '../content/enemies';
import { lockedContent } from '../content/meta';
import { startBattle, healPlayer, newEmit, type Emit } from './battle';

export const ACT_ROWS = 12;
export const MAP_COLS = 6;

// ── Map generation ───────────────────────────────────────────────────────────

export function generateMap(rng: Rng, act: Act, loop = 0): GameMap {
  const rows: MapNode[][] = [];

  for (let r = 0; r < ACT_ROWS; r++) {
    const isBoss = r === ACT_ROWS - 1;
    const count = isBoss ? 1 : r === 0 ? 3 : rng.int(2, 4);
    const cols: number[] = [];
    if (isBoss) cols.push(Math.floor(MAP_COLS / 2));
    else {
      const available = [0, 1, 2, 3, 4, 5];
      rng.shuffle(available);
      cols.push(...available.slice(0, count).sort((a, b) => a - b));
    }
    rows.push(cols.map((col) => ({ row: r, col, type: 'battle' as NodeType, next: [] })));
  }

  // edges: monotone mapping keeps the graph readable (no wild crossings)
  for (let r = 0; r < ACT_ROWS - 1; r++) {
    const a = rows[r];
    const b = rows[r + 1];
    for (let i = 0; i < a.length; i++) {
      const j = a.length === 1 ? 0 : Math.round((i * (b.length - 1)) / (a.length - 1));
      a[i].next.push(b[j].col);
      if (j + 1 < b.length && rng.chance(0.42)) a[i].next.push(b[j + 1].col);
      else if (j - 1 >= 0 && rng.chance(0.22)) a[i].next.push(b[j - 1].col);
    }
    // every next-row node needs at least one parent
    for (let j = 0; j < b.length; j++) {
      if (!a.some((n) => n.next.includes(b[j].col))) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < a.length; i++) {
          const d = Math.abs(a[i].col - b[j].col);
          if (d < bestDist) { bestDist = d; best = i; }
        }
        a[best].next.push(b[j].col);
      }
    }
    for (const n of a) n.next = [...new Set(n.next)].sort((x, y) => x - y);
  }

  // node types
  const bossRow = ACT_ROWS - 1;
  const restRow = ACT_ROWS - 2;
  const treasureRow = 5;
  rows[bossRow][0].type = 'boss';
  for (const n of rows[restRow]) n.type = 'rest';
  const treasureIdx = rng.int(0, rows[treasureRow].length - 1);
  rows[treasureRow][treasureIdx].type = 'treasure';

  // one or two shops in rows 3–9
  const shopRows = rng.shuffle([3, 4, 6, 7, 8, 9]).slice(0, rng.chance(0.5) ? 2 : 1);
  for (const sr of shopRows) {
    const candidates = rows[sr].filter((n) => n.type === 'battle');
    if (candidates.length) rng.pick(candidates).type = 'shop';
  }

  // elites rows 4–9 (cap 3)
  let elites = 0;
  for (let r = 4; r <= 9 && elites < 3; r++) {
    for (const n of rows[r]) {
      if (n.type === 'battle' && rng.chance(0.16) && elites < 3) {
        n.type = 'elite';
        elites += 1;
      }
    }
  }
  if (elites === 0) {
    // guarantee at least one elite per act
    const r = rng.int(4, 9);
    const candidates = rows[r].filter((n) => n.type === 'battle');
    if (candidates.length) rng.pick(candidates).type = 'elite';
  }

  // events rows 1–9, occasional extra rest row 6–9
  let extraRest = 0;
  for (let r = 1; r <= 9; r++) {
    for (const n of rows[r]) {
      if (n.type !== 'battle') continue;
      if (rng.chance(0.2)) n.type = 'event';
      else if (extraRest < 1 && r >= 6 && rng.chance(0.07)) { n.type = 'rest'; extraRest += 1; }
    }
  }

  // encounter payloads (avoid repeating the previous pick within the act)
  const easy = encounterPool(act, 'easy');
  const hard = encounterPool(act, 'hard');
  const elitePool = encounterPool(act, 'elite');
  let lastId = '';
  const pickEnc = (pool: typeof easy) => {
    const options = pool.filter((e) => e.id !== lastId);
    const enc = rng.pick(options.length ? options : pool);
    lastId = enc.id;
    return enc.id;
  };
  const eventIds = rng.shuffle(Object.keys(EVENTS));
  let eventCursor = 0;
  for (let r = 0; r < ACT_ROWS; r++) {
    for (const n of rows[r]) {
      // endless loops: battles and elites are procedural (bosses stay authored)
      if (n.type === 'battle' && loop > 0) {
        n.encounter = generateBattleSpec(rng, act, r <= 2 ? 'easy' : 'hard', loop, `endless-L${loop}-a${act}-${r}.${n.col}`);
      } else if (n.type === 'elite' && loop > 0) {
        n.encounter = generateEliteSpec(rng, act, loop, `endless-L${loop}-a${act}-${r}.${n.col}e`);
      } else if (n.type === 'boss' && loop > 0) {
        n.encounter = generateBossSpec(rng, act, loop, `endless-L${loop}-a${act}-boss`);
        // keep the authored payload too — consumers that only know payload
        // (map boss icon, achievements-by-groupId) must never find a hole
        n.payload = encounterPool(act, 'boss')[0].id;
      } else if (n.type === 'battle') n.payload = pickEnc(r <= 2 ? easy : hard);
      else if (n.type === 'elite') n.payload = rng.pick(elitePool).id;
      else if (n.type === 'boss') n.payload = encounterPool(act, 'boss')[0].id;
      else if (n.type === 'event') {
        n.payload = eventIds[eventCursor % eventIds.length];
        eventCursor += 1;
      }
    }
  }

  return { act, rows };
}

// ── Run creation ─────────────────────────────────────────────────────────────

export function newRun(opts: {
  charId: CharacterId;
  ascension: number;
  seed?: string;
  daily?: { date: string; mods: string[] } | null;
  unlockedPacks: readonly string[];
}): RunState {
  const seed = opts.seed ?? `undertow-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const rng = makeRng(hashSeed(seed));
  const ch = CHARACTERS[opts.charId];

  let maxHp = ch.maxHp;
  if (opts.ascension >= 7) maxHp -= 8;
  let hp = maxHp;
  if (opts.daily?.mods.includes('glassCannon')) hp = Math.floor(maxHp * 0.6);

  let nextUid = 1;
  const deck: CardInstance[] = [];
  for (const { card, count } of ch.starterDeck) {
    for (let i = 0; i < count; i++) deck.push({ uid: nextUid++, defId: card, upgraded: false });
  }
  if (opts.ascension >= 5) deck.push({ uid: nextUid++, defId: 'barnacle', upgraded: false });
  if (opts.daily?.mods.includes('barnacled')) {
    deck.push({ uid: nextUid++, defId: 'barnacle', upgraded: false });
    deck.push({ uid: nextUid++, defId: 'barnacle', upgraded: false });
  }

  const run: RunState = {
    seed,
    rng: rng.state(),
    charId: opts.charId,
    ascension: opts.ascension,
    unlockedPacks: [...opts.unlockedPacks],
    daily: opts.daily ?? null,
    act: 1,
    loop: 0,
    map: { act: 1, rows: [] },
    pos: null,
    floor: 0,
    hp,
    maxHp,
    gold: opts.ascension >= 4 ? 40 : 50,
    deck,
    nextUid,
    relics: [ch.starterRelic],
    battle: null,
    reward: null,
    shop: null,
    eventId: null,
    removalsBought: 0,
    whetstonesBought: 0,
    defanged: [],
    stats: {
      floorsClimbed: 0, kills: 0, elitesKilled: 0, bossesKilled: 0, damageDealt: 0,
      damageTaken: 0, goldEarned: 0, cardsPlayed: 0, maxToxinApplied: 0, maxCharge: 0,
      maxBlock: 0, maxMight: 0, restsUsed: 0, battlesFlawless: 0, turnsPlayed: 0,
    },
    result: null,
  };

  const mapRng = makeRng(rng.state());
  run.map = generateMap(mapRng, 1);
  run.rng = mapRng.state();
  return run;
}

function runRng(run: RunState) {
  const r = makeRng(run.rng);
  return { r, done: () => { run.rng = r.state(); } };
}

// ── Node flow ────────────────────────────────────────────────────────────────

export function reachableNodes(run: RunState): MapNode[] {
  if (run.pos === null) return run.map.rows[0];
  const cur = run.map.rows[run.pos.row]?.find((n) => n.col === run.pos!.col);
  if (!cur || run.pos.row + 1 >= run.map.rows.length) return [];
  return run.map.rows[run.pos.row + 1].filter((n) => cur.next.includes(n.col));
}

export type NodeOutcome = 'battle' | 'shop' | 'rest' | 'event' | 'reward';

/** Move to a node and enter it. Returns the screen the UI should show. */
export function enterNode(run: RunState, row: number, col: number, emit: Emit): NodeOutcome {
  const node = run.map.rows[row].find((n) => n.col === col);
  if (!node) throw new Error('bad node');
  node.visited = true;
  run.pos = { row, col };
  run.floor += 1;
  run.stats.floorsClimbed += 1;

  switch (node.type) {
    case 'battle':
    case 'elite':
    case 'boss':
      startBattle(run, node.encounter ?? node.payload!, emit);
      return 'battle';
    case 'shop':
      run.shop = generateShop(run);
      return 'shop';
    case 'rest':
      return 'rest';
    case 'event':
      run.eventId = node.payload!;
      return 'event';
    case 'treasure': {
      const { r, done } = runRng(run);
      const locked = lockedContent(run.unlockedPacks).relics;
      // chests hold cursed salvage: power with a drawback. Once every treasure
      // relic is claimed, fall back to the ordinary pools.
      let pool = relicPool('treasure', run.charId, run.relics, locked);
      if (!pool.length) {
        const tier = r.weighted([['common', 50], ['uncommon', 35], ['rare', 15]] as const);
        pool = relicPool(tier, run.charId, run.relics, locked);
      }
      const relic = pool.length ? r.pick(pool).id : null;
      done();
      run.reward = {
        // every relic in the sea claimed: the chest still pays out
        gold: relic ? 0 : 60, cards: [], relics: relic ? [relic] : [], bossRelics: [], taken: {}, source: 'treasure',
      };
      if (!relic) {
        run.gold += 60;
        run.stats.goldEarned += 60;
      }
      return 'reward';
    }
  }
}

// ── Rewards ──────────────────────────────────────────────────────────────────

function pickRewardCards(run: RunState, source: 'battle' | 'elite' | 'boss'): CardInstance[] {
  const { cards: lockedCards } = lockedContent(run.unlockedPacks);
  const pool = rewardableCards(run.charId, lockedCards);
  const { r, done } = runRng(run);
  const picks: CardInstance[] = [];
  const chosen = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const rarity = r.weighted(RARITY_WEIGHTS[source]);
    let candidates = pool.filter((c) => c.rarity === rarity && !chosen.has(c.id));
    if (!candidates.length) candidates = pool.filter((c) => !chosen.has(c.id));
    if (!candidates.length) break;
    const def = r.pick(candidates);
    chosen.add(def.id);
    picks.push({ uid: run.nextUid++, defId: def.id, upgraded: false });
  }
  done();
  return picks;
}

export function generateBattleReward(run: RunState): RewardState {
  const bs = run.battle!;
  const source = bs.isBoss ? 'boss' : bs.isElite ? 'elite' : 'battle';
  const { r, done } = runRng(run);

  let gold =
    source === 'boss' ? r.int(75, 90) :
    source === 'elite' ? r.int(28, 40) :
    r.int(12, 18) + run.act * 2;
  gold += run.loop * 4; // endless: the economy keeps partial pace with the scaling
  if (run.relics.includes('ledgerOfTheDrowned')) gold += 8;
  if (run.relics.includes('merchantsDebt')) gold = Math.max(0, gold - 10);
  if (run.daily?.mods.includes('richWaters')) gold = Math.round(gold * 1.5);

  const relics: string[] = [];
  const bossRelics: string[] = [];
  let bossBoons: string[] | undefined;
  const locked = lockedContent(run.unlockedPacks).relics;
  if (source === 'elite') {
    const n = run.relics.includes('abyssalFigurehead') ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const tier = r.weighted([['common', 45], ['uncommon', 40], ['rare', 15]] as const);
      // fall through the remaining tiers before giving up — drained pools
      // (deep endless, or figurehead runs) must not silently whiff
      const order = [tier, ...(['rare', 'uncommon', 'common'] as const).filter((t) => t !== tier)];
      let picked = false;
      for (const t of order) {
        const pool = relicPool(t, run.charId, [...run.relics, ...relics], locked);
        if (pool.length) {
          relics.push(r.pick(pool).id);
          picked = true;
          break;
        }
      }
      if (!picked) gold += 40; // every relic claimed: the elite pays in coin
    }
    run.stats.elitesKilled += 1;
  }
  if (source === 'boss') {
    const pool = relicPool('boss', run.charId, run.relics, new Set());
    r.shuffle(pool);
    bossRelics.push(...pool.slice(0, 3).map((x) => x.id));
    // the pool ran dry (deep endless): offer one-shot boons instead
    if (!bossRelics.length) bossBoons = Object.keys(BOONS);
    run.stats.bossesKilled += 1;
  }
  done();

  const cards = pickRewardCards(run, source);
  return { gold, cards, relics, bossRelics, ...(bossBoons ? { bossBoons } : {}), taken: {}, source };
}

/** apply a picked boss boon (offered once the boss relic pool is empty) */
export function applyBoon(run: RunState, boonId: string, emit: Emit): string {
  switch (boonId) {
    case 'leviathansFeast':
      run.maxHp += 8;
      healPlayer(run, null, run.maxHp, emit);
      return 'The feast restores you — +8 Max HP, fully healed.';
    case 'sunkenHoard':
      run.gold += 100;
      run.stats.goldEarned += 100;
      return 'You pry loose 100 gold.';
    case 'deepTempering': {
      const { r, done } = runRng(run);
      const cand = run.deck.filter((c) => !c.upgraded && CARDS[c.defId].type !== 'curse');
      const picks = r.shuffle([...cand]).slice(0, 2);
      for (const c of picks) c.upgraded = true;
      done();
      return picks.length
        ? `Tempered: ${picks.map((c) => CARDS[c.defId].name).join(', ')}.`
        : 'Nothing left to temper — the deep shrugs.';
    }
  }
  return '';
}

export function addRelic(run: RunState, relicId: string) {
  if (run.relics.includes(relicId)) return;
  run.relics.push(relicId);
  if (relicId === 'deepstoneIdol') {
    run.maxHp += 8;
    run.hp += 8;
  }
  if (relicId === 'leadenIdol') {
    run.maxHp += 12;
    run.hp += 12;
  }
  if (relicId === 'merchantsDebt') {
    run.gold += 60;
    run.stats.goldEarned += 60;
  }
}

export function addCardToDeck(run: RunState, defId: string, upgraded = false): CardInstance {
  const inst: CardInstance = { uid: run.nextUid++, defId, upgraded };
  run.deck.push(inst);
  return inst;
}

// ── Shop ─────────────────────────────────────────────────────────────────────

function shopPriceScale(run: RunState): number {
  return run.ascension >= 8 ? 1.2 : 1;
}

export function generateShop(run: RunState): ShopState {
  const { r, done } = runRng(run);
  const scale = shopPriceScale(run);
  const items: ShopState['items'] = [];
  const locked = lockedContent(run.unlockedPacks);

  // 3 cards — fewer, better: slot 0 is a guaranteed rare, the rest roll the weights
  const pool = rewardableCards(run.charId, locked.cards);
  const chosen = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const rarity = i === 0 ? 'rare' : r.weighted(RARITY_WEIGHTS.shop);
    let candidates = pool.filter((c) => c.rarity === rarity && !chosen.has(c.id));
    if (!candidates.length) candidates = pool.filter((c) => !chosen.has(c.id));
    if (!candidates.length) break;
    const def = r.pick(candidates);
    chosen.add(def.id);
    const base = def.rarity === 'rare' ? r.int(135, 155) : def.rarity === 'uncommon' ? r.int(70, 85) : r.int(45, 55);
    items.push({ kind: 'card', card: { uid: run.nextUid++, defId: def.id, upgraded: false }, price: Math.round(base * scale) });
  }
  // one card on sale
  const cardItems = items.filter((i) => i.kind === 'card');
  if (cardItems.length) {
    const sale = r.pick(cardItems);
    sale.price = Math.max(15, Math.round(sale.price / 2));
  }

  // 2 relics — fall back through tiers if a pool is empty (early unlocks)
  for (let i = 0; i < 2; i++) {
    const rolled = r.weighted([['common', 40], ['uncommon', 40], ['rare', 20]] as const);
    const tiers: ('common' | 'uncommon' | 'rare')[] = [rolled, 'uncommon', 'common'];
    for (const tier of tiers) {
      const rp = relicPool(tier, run.charId, [
        ...run.relics,
        ...items.filter((x): x is Extract<typeof x, { kind: 'relic' }> => x.kind === 'relic').map((x) => x.relicId),
      ], locked.relics);
      if (!rp.length) continue;
      const def = r.pick(rp);
      const base = tier === 'rare' ? r.int(230, 260) : tier === 'uncommon' ? r.int(145, 170) : r.int(95, 115);
      items.push({ kind: 'relic', relicId: def.id, price: Math.round(base * scale) });
      break;
    }
  }
  // salvage crate — a mystery relic rolled here on the seeded stream so the
  // Daily Dive stays identical for everyone; skipped when the pool is dry
  let crateRelicId: string | undefined;
  {
    const offered = items.filter((x): x is Extract<typeof x, { kind: 'relic' }> => x.kind === 'relic').map((x) => x.relicId);
    const rolled = r.weighted([['common', 50], ['uncommon', 35], ['rare', 15]] as const);
    const tiers: ('common' | 'uncommon' | 'rare')[] = [rolled, 'uncommon', 'common'];
    for (const tier of tiers) {
      const rp = relicPool(tier, run.charId, [...run.relics, ...offered], locked.relics);
      if (!rp.length) continue;
      crateRelicId = r.pick(rp).id;
      break;
    }
  }
  done();

  let removalPrice = 75 + run.removalsBought * 25;
  if (run.relics.includes('deepSextant')) removalPrice = Math.floor(removalPrice / 2);
  // whetstone escalates like removal so it relieves the rest-site trade-off
  // without replacing it; deliberately not discounted by the Sextant
  const whetstonePrice = 90 + (run.whetstonesBought ?? 0) * 30;
  return {
    items,
    removalPrice: Math.round(removalPrice * scale),
    removalsLeft: 1,
    whetstonePrice: Math.round(whetstonePrice * scale),
    whetstonesLeft: 1,
    defangPrice: Math.round(140 * scale),
    defangsLeft: 1,
    ...(crateRelicId ? { crateRelicId, cratePrice: Math.round(85 * scale) } : {}),
  };
}

/** two-edged relics the player owns whose teeth are still attached */
export function defangEligible(run: RunState): string[] {
  return run.relics.filter((id) => DEFANGABLE.includes(id) && !(run.defanged ?? []).includes(id));
}

export function buyWhetstone(run: RunState, cardUid: number): ShopError | null {
  const shop = run.shop;
  if (!shop || (shop.whetstonesLeft ?? 0) <= 0 || shop.whetstonePrice == null) return 'none';
  if (run.gold < shop.whetstonePrice) return 'gold';
  const card = run.deck.find((c) => c.uid === cardUid);
  if (!card || card.upgraded || CARDS[card.defId].type === 'curse') return 'none';
  run.gold -= shop.whetstonePrice;
  card.upgraded = true;
  run.whetstonesBought = (run.whetstonesBought ?? 0) + 1;
  shop.whetstonesLeft = (shop.whetstonesLeft ?? 1) - 1;
  return null;
}

export function buyCrate(run: RunState): ShopError | null {
  const shop = run.shop;
  if (!shop || !shop.crateRelicId || shop.crateSold || shop.cratePrice == null) return 'none';
  if (run.gold < shop.cratePrice) return 'gold';
  run.gold -= shop.cratePrice;
  shop.crateSold = true;
  addRelic(run, shop.crateRelicId);
  return null;
}

/** what the pawn counter pays — flat ~40% of tier value, never ascension-scaled */
export function sellPrice(relicId: string): number {
  switch (RELICS[relicId]?.tier) {
    case 'starter': return 25;
    case 'common': return 40;
    case 'uncommon': return 60;
    case 'rare': return 95;
    case 'treasure': return 55;
    case 'boss': return 110;
    default: return 0;
  }
}

export function pawnRelic(run: RunState, relicId: string): ShopError | null {
  if (!run.shop) return 'none';
  const idx = run.relics.indexOf(relicId);
  if (idx < 0) return 'none';
  run.relics.splice(idx, 1);
  if (run.defanged?.includes(relicId)) run.defanged = run.defanged.filter((id) => id !== relicId);
  run.gold += sellPrice(relicId);
  run.stats.goldEarned += sellPrice(relicId);
  return null;
}

export function buyDefang(run: RunState, relicId: string): ShopError | null {
  const shop = run.shop;
  if (!shop || (shop.defangsLeft ?? 0) <= 0 || shop.defangPrice == null) return 'none';
  if (!defangEligible(run).includes(relicId)) return 'none';
  if (run.gold < shop.defangPrice) return 'gold';
  run.gold -= shop.defangPrice;
  run.defanged = [...(run.defanged ?? []), relicId];
  shop.defangsLeft = (shop.defangsLeft ?? 1) - 1;
  return null;
}

export type ShopError = 'gold' | 'sold' | 'none';

export function buyShopItem(run: RunState, index: number): ShopError | null {
  const shop = run.shop;
  if (!shop) return 'none';
  const item = shop.items[index];
  if (!item || item.sold) return 'sold';
  if (run.gold < item.price) return 'gold';
  run.gold -= item.price;
  item.sold = true;
  if (item.kind === 'card') run.deck.push(item.card);
  else addRelic(run, item.relicId);
  return null;
}

export function buyRemoval(run: RunState, cardUid: number): ShopError | null {
  const shop = run.shop;
  if (!shop || shop.removalsLeft <= 0) return 'none';
  if (run.gold < shop.removalPrice) return 'gold';
  const idx = run.deck.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return 'none';
  run.gold -= shop.removalPrice;
  run.deck.splice(idx, 1);
  run.removalsBought += 1;
  shop.removalsLeft -= 1;
  return null;
}

// ── Rest ─────────────────────────────────────────────────────────────────────

export function restHealAmount(run: RunState): number {
  // endless: fights hit harder and run longer each loop — vents warm up too
  const frac = Math.min(0.5, (run.ascension >= 3 ? 0.25 : 0.3) + 0.04 * run.loop);
  let heal = Math.round(run.maxHp * frac);
  if (run.relics.includes('whaleOilFlask')) heal += 15;
  return heal;
}

export function doRestHeal(run: RunState, emit: Emit) {
  healPlayer(run, null, restHealAmount(run), emit);
  run.stats.restsUsed += 1;
}

// ── Events ───────────────────────────────────────────────────────────────────

export type PendingPick = { kind: 'remove' | 'upgrade' | 'duplicate' | 'transform'; from: 'event' | 'shop' | 'rest' } | null;

export interface EventResult {
  log: string[];
  pendingPick: PendingPick;
}

export function applyEventEffect(
  run: RunState,
  effect: import('../content/events').EventChoice['effect'],
  emit: Emit,
): EventResult {
  const log: string[] = [];
  let pendingPick: PendingPick = null;

  const apply = (eff: typeof effect) => {
    switch (eff.kind) {
      case 'gold':
        run.gold = Math.max(0, run.gold + eff.amount);
        if (eff.amount > 0) run.stats.goldEarned += eff.amount;
        log.push(eff.amount >= 0 ? `Gained ${eff.amount} gold.` : `Paid ${-eff.amount} gold.`);
        break;
      case 'heal': {
        const h = healPlayer(run, null, eff.amount, emit);
        log.push(`Healed ${h} HP.`);
        break;
      }
      case 'healFrac': {
        const h = healPlayer(run, null, Math.round(run.maxHp * eff.frac), emit);
        log.push(`Healed ${h} HP.`);
        break;
      }
      case 'damage':
        run.hp = Math.max(1, run.hp - eff.amount); // events never kill — they scar
        run.stats.damageTaken += eff.amount;
        log.push(`Took ${eff.amount} damage.`);
        break;
      case 'maxHp':
        run.maxHp = Math.max(10, run.maxHp + eff.amount);
        run.hp = Math.min(run.hp + Math.max(0, eff.amount), run.maxHp);
        log.push(eff.amount >= 0 ? `Gained ${eff.amount} Max HP.` : `Lost ${-eff.amount} Max HP.`);
        break;
      case 'card':
        addCardToDeck(run, eff.id);
        log.push(`Added ${CARDS[eff.id].name} to your deck.`);
        break;
      case 'curse':
        addCardToDeck(run, eff.id);
        log.push(`Cursed: ${CARDS[eff.id].name} added to your deck.`);
        break;
      case 'randomRelic': {
        const { r, done } = runRng(run);
        const tier = r.weighted([['common', 45], ['uncommon', 40], ['rare', 15]] as const);
        const pool = relicPool(tier, run.charId, run.relics, lockedContent(run.unlockedPacks).relics);
        if (pool.length) {
          const relic = r.pick(pool);
          addRelic(run, relic.id);
          log.push(`Found ${relic.name}!`);
        } else {
          run.gold += 50;
          log.push('Found 50 gold instead.');
        }
        done();
        break;
      }
      case 'removeCard': pendingPick = { kind: 'remove', from: 'event' }; break;
      case 'upgradeCard': pendingPick = { kind: 'upgrade', from: 'event' }; break;
      case 'duplicateCard': pendingPick = { kind: 'duplicate', from: 'event' }; break;
      case 'transformCard': pendingPick = { kind: 'transform', from: 'event' }; break;
      case 'upgradeRandom': {
        const { r, done } = runRng(run);
        const candidates = run.deck.filter((c) => !c.upgraded && CARDS[c.defId].type !== 'curse');
        r.shuffle(candidates);
        const targets = candidates.slice(0, eff.count);
        for (const t of targets) t.upgraded = true;
        done();
        log.push(targets.length ? `Upgraded ${targets.map((t) => CARDS[t.defId].name).join(', ')}.` : 'Nothing left to upgrade.');
        break;
      }
      case 'randomCardReward': {
        const { cards: lockedCards } = lockedContent(run.unlockedPacks);
        const pool = rewardableCards(run.charId, lockedCards);
        const { r, done } = runRng(run);
        const rarity = r.weighted([['common', 45], ['uncommon', 40], ['rare', 15]] as const);
        const candidates = pool.filter((c) => c.rarity === rarity);
        const def = r.pick(candidates.length ? candidates : pool);
        done();
        addCardToDeck(run, def.id);
        log.push(`Gained ${def.name}.`);
        break;
      }
      case 'nothing':
        log.push('You move on.');
        break;
      case 'combo':
        for (const sub of eff.effects) apply(sub);
        break;
    }
  };
  apply(effect);
  return { log, pendingPick };
}

export function completePick(run: RunState, kind: NonNullable<PendingPick>['kind'], cardUid: number): string {
  const idx = run.deck.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return '';
  const card = run.deck[idx];
  const name = CARDS[card.defId].name;
  switch (kind) {
    case 'remove':
      run.deck.splice(idx, 1);
      return `Removed ${name}.`;
    case 'upgrade':
      card.upgraded = true;
      return `Upgraded ${name}.`;
    case 'duplicate':
      run.deck.push({ uid: run.nextUid++, defId: card.defId, upgraded: card.upgraded });
      return `Duplicated ${name}.`;
    case 'transform': {
      const { r, done } = runRng(run);
      const def = CARDS[card.defId];
      const pool = rewardableCards(run.charId, new Set()).filter((c) => c.id !== def.id && c.rarity === (def.rarity === 'starter' ? 'common' : def.rarity));
      const fallback = rewardableCards(run.charId, new Set()).filter((c) => c.id !== def.id);
      const next = r.pick(pool.length ? pool : fallback);
      done();
      run.deck.splice(idx, 1);
      addCardToDeck(run, next.id);
      return `${name} became ${next.name}.`;
    }
  }
}

// ── Act transitions / scoring ────────────────────────────────────────────────

/** After the boss reward is resolved: descend to the next act or win. */
export function descend(run: RunState, emit: Emit): 'nextAct' | 'victory' {
  if (run.act >= 4) {
    run.result = 'win';
    return 'victory';
  }
  run.act = (run.act + 1) as 2 | 3 | 4;
  const { r, done } = runRng(run);
  run.map = generateMap(r, run.act, run.loop);
  done();
  run.pos = null;
  healPlayer(run, null, Math.round(run.maxHp * 0.25), emit);
  return 'nextAct';
}

/** Endless: descend past the Drowned God — acts cycle, the deep compounds. */
export function beginLoop(run: RunState, emit: Emit) {
  run.loop += 1;
  run.act = 1;
  run.result = null;
  const { r, done } = runRng(run);
  run.map = generateMap(r, 1, run.loop);
  done();
  run.pos = null;
  healPlayer(run, null, Math.round(run.maxHp * 0.25), emit);
}

export function scoreRun(run: RunState): number {
  const s = run.stats;
  let score =
    s.floorsClimbed * 8 +
    s.kills * 3 +
    s.elitesKilled * 20 +
    s.bossesKilled * 60 +
    Math.round(run.gold / 5) +
    s.battlesFlawless * 10 +
    run.ascension * 15 +
    run.loop * 100;
  if (run.result === 'win') score += 150 + run.hp;
  return Math.max(0, score);
}
