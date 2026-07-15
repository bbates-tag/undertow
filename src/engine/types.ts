// ─────────────────────────────────────────────────────────────────────────────
// UNDERTOW — shared engine types.
// Everything in Run/Battle state is plain JSON data so the whole game
// (including a battle in progress) serializes to localStorage and survives
// a page refresh. Content defs (cards/enemies/relics) are looked up by id.
// ─────────────────────────────────────────────────────────────────────────────

export type CharacterId = 'tidecaller' | 'voltaic' | 'drowned' | 'weaver';
export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'special';
export type Act = 1 | 2 | 3 | 4;

/** Tide phases cycle Low → Rising → High → Falling → Low… advancing each turn. */
export type Tide = 0 | 1 | 2 | 3;
export const TIDE_NAMES = ['Low', 'Rising', 'High', 'Falling'] as const;

export type StatusId =
  | 'toxin' // take N at start of your action phase, then reduce by 1
  | 'weakened' // deal 25% less attack damage (turns)
  | 'exposed' // take 50% more attack damage (turns)
  | 'brittle' // gain 25% less block (turns)
  | 'might' // +N attack damage (battle)
  | 'finesse' // +N block from cards (battle)
  | 'spines' // melee attackers take N (battle)
  | 'regen' // heal N at end of turn, then reduce by 1
  | 'anchor' // block is not removed at the start of your next turn (consumed)
  | 'charge' // Voltaic resource; spent by Discharge cards
  | 'descent' // Drowned resource; grows when the player loses HP on their own turn
  | 'marked' // Weaver's Called Shot: if the bearer dies this turn, the player profits
  | 'perfectRead'; // Weaver: next N Reads that would miss, hit instead (one charge per rescue)

export const DEBUFFS: StatusId[] = ['toxin', 'weakened', 'exposed', 'brittle'];

// ── Effect DSL ───────────────────────────────────────────────────────────────

/** A scalable quantity. Resolved against live battle state for previews & play. */
export interface Amount {
  base: number;
  /** + n × Toxin currently on the target */
  perToxinOnTarget?: number;
  /** + n × player Charge (does not spend it) */
  perCharge?: number;
  /** + n × player Descent (does not spend it) */
  perDescent?: number;
  /** + n × other cards played this turn */
  perCardPlayed?: number;
  /** + n × current player block */
  perBlock?: number;
  /** flat bonus while the tide is High */
  flood?: number;
  /** flat bonus while the tide is Low */
  ebb?: number;
  /** + n × the target's telegraphed attack total (amount × hits, pre-buff);
      0 against non-attackers. The contribution is capped at 40 so ascension
      damage inflation can't run away with it. */
  perTelegraph?: number;
}

export type OpTarget = 'target' | 'all' | 'self' | 'random';

/** Weaver Read classes — intent kinds grouped for card conditions. */
export type ReadClass = 'attacker' | 'schemer' | 'guarded' | 'dormant';

export type Cond =
  | 'flood' // tide is High
  | 'ebb' // tide is Low
  | 'floodSoon' // tide is High now OR will be next turn
  | 'ebbSoon' // tide is Low now OR will be next turn
  | 'targetToxined'
  | 'targetBelowHalf'
  | { chargeAtLeast: number }
  | { descentAtLeast: number }
  /** Weaver Read riders: what the telegraphs say. who 'target' reads the
      card's target, 'anyOnYou' any living enemy, 'none' no living enemy. */
  | { intends: ReadClass | ReadClass[]; who: 'target' | 'anyOnYou' | 'none' };

export type Op =
  | { op: 'damage'; amount: Amount; times?: number | 'charge'; target?: 'target' | 'all' | 'random'; pierce?: boolean }
  | { op: 'loseHp'; amount: number } // self-damage cost; ignores Block
  | { op: 'block'; amount: Amount }
  | { op: 'status'; status: StatusId; amount: Amount; target: OpTarget }
  | { op: 'draw'; amount: number }
  | { op: 'energy'; amount: number }
  | { op: 'heal'; amount: Amount }
  | { op: 'shift'; amount: number }
  | { op: 'gold'; amount: number }
  | { op: 'doubleStatus'; status: StatusId; target: 'all' | 'self' }
  | { op: 'cleanse'; target: 'self'; all?: boolean } // remove debuffs from self
  | { op: 'addCard'; card: string; pile: 'hand' | 'drawPile' | 'discardPile'; count?: number; upgraded?: boolean }
  | { op: 'if'; cond: Cond; then: Op[]; else?: Op[] };

// ── Cards ────────────────────────────────────────────────────────────────────

export interface CardDef {
  id: string;
  name: string;
  char: CharacterId | 'neutral';
  type: CardType;
  rarity: Rarity;
  cost: number; // energy
  costUp?: number; // upgraded cost, defaults to cost
  /** whether playing requires picking an enemy */
  target: 'enemy' | 'none';
  icon: string; // key into ui/icons registry
  ops: Op[];
  opsUp?: Op[]; // upgraded ops; defaults to ops
  exhaust?: boolean;
  exhaustUp?: boolean; // defaults to exhaust
  /** Discharge: after resolving, all Charge is spent */
  discharge?: boolean;
  /** Surface: after resolving, ALL Descent is lost */
  surface?: boolean;
  unplayable?: boolean;
  /** curse hooks: ops run if this is in hand when the turn ends */
  endTurnInHand?: Op[];
  /** power text override for odd persistent effects handled in engine */
  powerHook?: PowerHookId;
  powerHookUp?: PowerHookId;
  text?: string; // override auto-generated rules text
  textUp?: string;
  flavor?: string;
  /** CSS object-position for the art crop — for arts whose subject isn't
      centered (e.g. 'center 30%' keeps a high face in frame) */
  artFocus?: string;
}

/** Persistent effects installed by Power cards; interpreted by the engine. */
export type PowerHookId =
  | 'miasma1' | 'miasma2' // turn start: N toxin to all enemies
  | 'carapace3' | 'carapace5' // turn end: gain N block
  | 'lunarPull' // tide advances an extra step each turn
  | 'predatorsEye1' | 'predatorsEye2' // draw +N each turn
  | 'bloodInWater1' | 'bloodInWater2' // on attack played: N dmg to random enemy
  | 'kingTide' // tide locked to High
  | 'leviathan1' | 'leviathan2' // turn start: gain N Might
  | 'perpetual' // turn start: Shift +1, draw 1
  | 'hunger2' | 'hunger3' // on enemy death: gain N might, heal N+3
  | 'eelCoil1' | 'eelCoil2' // turn start: Conduct N
  | 'teslaScales1' | 'teslaScales2' // on conduct: N dmg to all enemies
  | 'dynamo2' | 'dynamo3' // turn start: Conduct N (rare version)
  | 'lightningRod3' | 'lightningRod4' // after a Discharge card: Conduct N
  | 'supercell' // turn start: dmg = Charge to all enemies
  | 'weepingHull4' | 'weepingHull6' // turn start: lose 1 HP, gain N block
  | 'marrowBloom2' | 'marrowBloom3' // on Descent gain: gain N block
  | 'communion2' | 'communion3' // turn start: lose 2 HP, gain N Might
  | 'echoPain' // on Descent gain: deal that much dmg to a random enemy
  | 'weatherEye3' | 'weatherEye4' // turn start: if any enemy intends an attack, gain N block
  | 'apexEscort4' | 'apexEscort5' // turn start: deal N to every enemy intending an attack
  | 'grace3' | 'grace4' // the first enemy attack hit each turn deals N less
  | 'perfectRead'; // LEGACY (pre-charge saves): Read riders always count as met

export interface CardInstance {
  uid: number;
  defId: string;
  upgraded: boolean;
}

// ── Enemies ──────────────────────────────────────────────────────────────────

export type IntentKind = 'attack' | 'block' | 'buff' | 'debuff' | 'attackBlock' | 'attackDebuff' | 'summon' | 'sleep' | 'unknown';

export interface MoveDef {
  id: string;
  name: string;
  intent: IntentKind;
  attack?: { amount: number; times?: number };
  block?: number;
  toPlayer?: [StatusId, number][]; // statuses applied to the player
  toSelf?: [StatusId, number][];
  toAllies?: [StatusId, number][]; // all living enemies incl self
  heal?: number;
  summon?: string[]; // enemy def ids
  addCardToPlayer?: { card: string; pile: 'discardPile' | 'drawPile'; count: number };
  shift?: number;
  removeSelfBlock?: boolean;
  /** the enemy dies after executing this move (bombs) */
  selfDestruct?: boolean;
}

export interface EnemyAiCtx {
  turn: number;
  hpFrac: number;
  history: string[]; // move ids, most recent last
  roll: number; // stable random [0,1) for this decision
  tide: Tide;
  allyCount: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  title?: string; // shown for bosses
  icon: string;
  hp: [number, number];
  tier: 'normal' | 'elite' | 'boss' | 'minion';
  act: 0 | 1 | 2 | 3 | 4;
  moves: Record<string, MoveDef>;
  ai: (ctx: EnemyAiCtx) => string; // returns move id
  startStatuses?: Partial<Record<StatusId, number>>;
  /** revives once at 50% hp when killed */
  reanimates?: boolean;
  /** gains might when the tide turns High */
  tideTouched?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 3-4 sentences for the tap-to-open dossier: origin + how it fights */
  lore?: string;
}

// ── Battle ───────────────────────────────────────────────────────────────────

export interface CreatureState {
  hp: number;
  maxHp: number;
  block: number;
  statuses: Partial<Record<StatusId, number>>;
}

export interface EnemyState extends CreatureState {
  uid: number;
  defId: string;
  moveId: string; // current telegraphed intent
  /** Weaver Foresight: best-effort forecast of the move after this one —
      recomputed at each intent roll; a forecast, not a promise */
  nextMoveId?: string;
  history: string[];
  /** endless affixes on this instance (see content/affixes.ts) */
  affixes?: string[];
  /** summoned this enemy phase — telegraphs but doesn't act until next turn */
  surfacing?: boolean;
  reanimated?: boolean;
  dead?: boolean; // kept in array for stable layout; filtered for logic
}

export type BattlePhase = 'player' | 'enemy' | 'won' | 'lost';

export interface BattleState {
  groupId: string;
  isElite: boolean;
  isBoss: boolean;
  phase: BattlePhase;
  turn: number;
  tide: Tide;
  energy: number;
  maxEnergy: number;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  player: CreatureState;
  enemies: EnemyState[];
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  /** power hooks currently installed (from played Power cards) */
  powers: PowerHookId[];
  /** index into living-enemy action order during the enemy phase (resume-safe) */
  enemyActIdx: number;
  rng: number;
  /** per-battle relic bookkeeping (first-attack fired, shields used, …) */
  counters: Record<string, number>;
  battleDamageTaken: number;
  nextUid: number;
}

// ── Map / Run ────────────────────────────────────────────────────────────────

export type NodeType = 'battle' | 'elite' | 'shop' | 'rest' | 'event' | 'treasure' | 'boss';

/** procedurally generated encounter — endless loops only, attached at map-gen time */
export interface EncounterSpec {
  id: string;
  enemies: { defId: string; affixes?: string[] }[];
  pool: 'easy' | 'hard' | 'elite' | 'boss';
}

export interface MapNode {
  row: number;
  col: number;
  type: NodeType;
  /** columns reachable in the next row */
  next: number[];
  /** battle nodes: encounter group id; event nodes: event id */
  payload?: string;
  /** endless loops: procedural encounter (takes precedence over payload) */
  encounter?: EncounterSpec;
  visited?: boolean;
}

export interface GameMap {
  act: Act;
  rows: MapNode[][]; // row 0 = surface-most; boss at last row
}

export interface ShopItemCard { kind: 'card'; card: CardInstance; price: number; sold?: boolean }
export interface ShopItemRelic { kind: 'relic'; relicId: string; price: number; sold?: boolean }
export type ShopItem = ShopItemCard | ShopItemRelic;

export interface ShopState {
  items: ShopItem[];
  removalPrice: number;
  removalsLeft: number;
  /** services below are absent on saves from before the Bazaar rework */
  whetstonePrice?: number;
  whetstonesLeft?: number;
  defangPrice?: number;
  defangsLeft?: number;
  /** salvage crate: a mystery relic rolled at generation, hidden until bought;
      absent when the relic pool is dry */
  crateRelicId?: string;
  cratePrice?: number;
  crateSold?: boolean;
}

export interface RewardState {
  gold: number;
  /** card choices; empty array = already taken/skipped */
  cards: CardInstance[];
  relics: string[]; // pending relic pickups (elite/treasure)
  bossRelics: string[]; // pick-one-of-N after boss
  /** deep endless: offered when the boss relic pool has run dry */
  bossBoons?: string[];
  taken: { gold?: boolean; card?: boolean; bossRelic?: boolean };
  source: 'battle' | 'elite' | 'boss' | 'treasure';
}

export interface RunStats {
  floorsClimbed: number;
  kills: number;
  elitesKilled: number;
  bossesKilled: number;
  damageDealt: number;
  damageTaken: number;
  goldEarned: number;
  cardsPlayed: number;
  maxToxinApplied: number;
  maxCharge: number;
  /** optional: absent on saves from before The Drowned existed */
  maxDescent?: number;
  maxBlock: number;
  maxMight: number;
  restsUsed: number;
  battlesFlawless: number;
  turnsPlayed: number;
}

export interface RunState {
  seed: string;
  rng: number; // run-level stream (map gen, rewards, shops, events)
  charId: CharacterId;
  ascension: number;
  /** snapshot of meta unlocks at run start — gates reward/shop/event pools */
  unlockedPacks: string[];
  daily: { date: string; mods: string[] } | null;
  act: Act;
  /** endless descents completed: 0 = the normal four acts, 1+ = loops past What Dreams Beneath */
  loop: number;
  map: GameMap;
  /** current position; null until the first node of the act is chosen */
  pos: { row: number; col: number } | null;
  floor: number; // global depth counter across acts
  hp: number;
  maxHp: number;
  gold: number;
  deck: CardInstance[];
  nextUid: number;
  relics: string[];
  battle: BattleState | null;
  reward: RewardState | null;
  shop: ShopState | null;
  eventId: string | null;
  removalsBought: number;
  /** whetstone (shop upgrade) escalation — absent on pre-rework saves */
  whetstonesBought?: number;
  /** two-edged relics whose downside has been removed at the Bazaar */
  defanged?: string[];
  stats: RunStats;
  result: 'win' | 'loss' | null;
  killedBy?: string;
  /** score already paid out as fathoms at first victory — endless deaths award only the delta */
  endlessBanked?: number;
}

// ── Meta / persistence ───────────────────────────────────────────────────────

export interface RunSummary {
  date: string;
  charId: CharacterId;
  result: 'win' | 'loss';
  floor: number;
  act: number;
  score: number;
  ascension: number;
  daily: boolean;
  killedBy?: string;
  fathoms: number;
  /** deepest endless loop reached (absent for ordinary runs) */
  loop?: number;
}

export interface DailyResult {
  date: string;
  score: number;
  result: 'win' | 'loss';
  floor: number;
}

export interface MetaState {
  version: number;
  fathoms: number;
  unlockedChars: CharacterId[];
  unlockedPacks: string[];
  /** highest unlocked ascension per character */
  ascension: Record<string, number>;
  wins: Record<string, number>;
  runsPlayed: number;
  achievements: Record<string, string>; // id -> ISO date earned
  /** compendium discovery — def ids the player has actually encountered */
  seenEnemies: Record<string, true>;
  seenCards: Record<string, true>;
  seenRelics: Record<string, true>;
  runHistory: RunSummary[];
  dailyHistory: DailyResult[];
  bestScore: number;
  tutorialSeen: boolean;
}

export interface Settings {
  volume: number; // 0..1 master
  sfx: boolean;
  music: boolean;
  reducedMotion: 'auto' | 'on' | 'off';
  fastMode: boolean;
}

// ── Transient UI fx events ───────────────────────────────────────────────────

export type FxTargetKey = 'player' | `e${number}` | 'screen';

export type Fx =
  | { id: number; kind: 'dmg'; target: FxTargetKey; amount: number; pierce?: boolean }
  | { id: number; kind: 'blocked'; target: FxTargetKey; amount: number }
  | { id: number; kind: 'block'; target: FxTargetKey; amount: number }
  | { id: number; kind: 'heal'; target: FxTargetKey; amount: number }
  | { id: number; kind: 'status'; target: FxTargetKey; status: StatusId; amount: number }
  | { id: number; kind: 'shake'; strength: number }
  | { id: number; kind: 'burst'; target: FxTargetKey; color: string; n?: number; shape?: 'spark' | 'bubble' | 'ring' }
  | { id: number; kind: 'gold'; target: FxTargetKey; amount: number }
  | { id: number; kind: 'tide'; tide: Tide; sweep?: boolean }
  | { id: number; kind: 'bolt'; from: FxTargetKey; to: FxTargetKey };

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  icon: string;
  color: string;
  maxHp: number;
  starterRelic: string;
  starterDeck: { card: string; count: number }[];
  blurb: string;
  mechanic: string;
  /** shown on the character-select card while this character is locked */
  lockText?: string;
}
