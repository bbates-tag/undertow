// Seeded, serializable RNG (mulberry32 + xmur3 string hash).
// State is a single 32-bit int so it can live inside saved game state,
// which is what makes Daily Challenge runs reproducible.

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  /** in-place Fisher-Yates */
  shuffle<T>(arr: T[]): T[];
  /** weighted pick from [item, weight] pairs */
  weighted<T>(pairs: readonly (readonly [T, number])[]): T;
  chance(p: number): boolean;
  state(): number;
}

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    weighted: (pairs) => {
      const total = pairs.reduce((a, [, w]) => a + w, 0);
      let roll = next() * total;
      for (const [item, w] of pairs) {
        roll -= w;
        if (roll <= 0) return item;
      }
      return pairs[pairs.length - 1][0];
    },
    chance: (p) => next() < p,
    state: () => s,
  };
}
