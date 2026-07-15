// Export/import save-blob round-trip and validation. Only the pure helpers
// are tested here — persist()/loadSave() touch localStorage, which the node
// test environment doesn't have.

import { describe, expect, it } from 'vitest';
import { buildSaveBlob, parseSaveBlob } from './persist';
import { newRun } from '../engine/run';
import type { MetaState, Settings } from '../engine/types';

const meta = {
  version: 1, fathoms: 0, unlockedChars: ['tidecaller'], unlockedPacks: ['pack1'],
  ascension: {}, wins: {}, runsPlayed: 0, achievements: { firstBlood: '2026-07-14' },
  runHistory: [], dailyHistory: [], bestScore: 0,
} as unknown as MetaState;
const settings = { volume: 0.5, sfx: true, music: true, fastMode: false, reducedMotion: 'auto' } as unknown as Settings;

const freshRun = () => newRun({ charId: 'tidecaller', ascension: 0, seed: 'persist-test', unlockedPacks: ['pack1'] });

describe('save export/import', () => {
  it('round-trips through JSON', () => {
    const blob = buildSaveBlob({ meta, settings, run: freshRun() });
    const parsed = parseSaveBlob(JSON.stringify(blob));
    expect(parsed).not.toBeNull();
    expect(parsed!.version).toBe(1);
    expect(parsed!.run!.seed).toBe('persist-test');
    expect(parsed!.meta.unlockedPacks).toEqual(['pack1']);
    expect(parsed!.settings.volume).toBe(0.5);
  });

  it('a finished run is not exported', () => {
    const r = freshRun();
    r.result = 'win';
    expect(buildSaveBlob({ meta, settings, run: r }).run).toBeNull();
  });

  it('rejects garbage, wrong versions, and missing meta', () => {
    expect(parseSaveBlob('not json at all')).toBeNull();
    expect(parseSaveBlob('"just a string"')).toBeNull();
    expect(parseSaveBlob('null')).toBeNull();
    expect(parseSaveBlob(JSON.stringify({ version: 2, meta }))).toBeNull();
    expect(parseSaveBlob(JSON.stringify({ version: 1, settings }))).toBeNull();
  });

  it('migrates pre-endless and pre-snapshot saves on import', () => {
    const old = JSON.parse(JSON.stringify(buildSaveBlob({ meta, settings, run: freshRun() })));
    delete old.run.loop;
    delete old.run.unlockedPacks;
    const parsed = parseSaveBlob(JSON.stringify(old));
    expect(parsed!.run!.loop).toBe(0);
    expect(parsed!.run!.unlockedPacks).toEqual(['pack1']);
  });

  it('migrates pre-Pressures saves on import', () => {
    const old = JSON.parse(JSON.stringify(buildSaveBlob({ meta, settings, run: freshRun() })));
    delete old.run.pressures;
    const parsed = parseSaveBlob(JSON.stringify(old));
    expect(parsed!.run!.pressures).toEqual([]);
  });
});
