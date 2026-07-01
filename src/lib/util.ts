export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function deepClone<T>(v: T): T {
  return structuredClone(v);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let fxCounter = 1;
export const nextFxId = () => fxCounter++;
