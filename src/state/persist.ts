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

/** the exact blob persist() writes — also what export hands to the player */
export function buildSaveBlob(state: PersistShape): SaveBlob {
  return {
    version: 1,
    meta: state.meta,
    settings: state.settings,
    run: state.run && !state.run.result ? state.run : null,
    savedAt: new Date().toISOString(),
  };
}

export function persist(state: PersistShape) {
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(buildSaveBlob(state)));
    } catch {
      // storage full/denied — the game keeps playing, it just won't persist
    }
  }, 120);
}

/** validate + migrate raw save JSON — shared by storage load and player import,
    so an old exported file gets the same patches a stale localStorage would */
export function parseSaveBlob(raw: string): SaveBlob | null {
  try {
    const blob = JSON.parse(raw) as SaveBlob;
    if (!blob || typeof blob !== 'object' || blob.version !== 1 || !blob.meta || typeof blob.meta !== 'object') return null;
    if (blob.run) {
      if (blob.run.loop === undefined) blob.run.loop = 0; // pre-endless saves
      if (!blob.run.unlockedPacks) blob.run.unlockedPacks = blob.meta.unlockedPacks ?? []; // pre-snapshot saves
    }
    return blob;
  } catch {
    return null;
  }
}

export function loadSave(): SaveBlob | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return parseSaveBlob(raw);
  } catch {
    return null;
  }
}

/** import path: write a validated blob immediately, cancelling any queued
    debounced persist so pre-import state can't clobber it */
export function writeSaveNow(blob: SaveBlob): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(blob));
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    return true;
  } catch {
    return false;
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
