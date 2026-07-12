// localStorage persistence. The full game state — meta progression, settings,
// and the run in progress (including a battle mid-fight) — is plain JSON,
// saved debounced on every commit, so a page refresh resumes seamlessly.

import type { MetaState, RunState, Settings } from '../engine/types';

const KEY = 'undertow_save_v1';

export interface SaveBlob {
  version: number;
  meta: MetaState;
  settings: Settings;
  run: RunState | null;
  savedAt: string;
}

interface PersistShape {
  meta: MetaState;
  settings: Settings;
  run: RunState | null;
}

let timer: number | null = null;

export function persist(state: PersistShape) {
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    try {
      const blob: SaveBlob = {
        version: 1,
        meta: state.meta,
        settings: state.settings,
        run: state.run && !state.run.result ? state.run : null,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(KEY, JSON.stringify(blob));
    } catch {
      // storage full/denied — the game keeps playing, it just won't persist
    }
  }, 120);
}

export function loadSave(): SaveBlob | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const blob = JSON.parse(raw) as SaveBlob;
    if (!blob || blob.version !== 1 || !blob.meta) return null;
    if (blob.run && blob.run.loop === undefined) blob.run.loop = 0; // pre-endless saves
    return blob;
  } catch {
    return null;
  }
}

export function wipeSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function hasSavedRun(): boolean {
  return !!loadSave()?.run;
}
