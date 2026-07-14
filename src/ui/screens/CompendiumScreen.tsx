// The Compendium — a collection browser for characters, enemies, and cards.
// Entries stay silhouetted until discovered (meta.seenEnemies / seenCards,
// recorded in state/seen.ts); unlocked characters' starter decks always count
// as known. Tapping a discovered entry opens a full-screen viewer — enemies
// reuse the battle dossier, cards and characters get their own overlays here.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Lock } from 'lucide-react';
import { useGame } from '../../state/store';
import { CHARACTERS } from '../../content/characters';
import { ENEMIES } from '../../content/enemies';
import { ALL_CARDS, CARDS } from '../../content/cards';
import { RELICS } from '../../content/relics';
import { KEYWORDS, KEYWORD_PATTERN, keywordIdFor } from '../../content/keywords';
import { describeCard } from '../../engine/describe';
import type { CardDef, CharacterId } from '../../engine/types';
import { ArtImage } from '../components/Art';
import { CardView } from '../components/CardView';
import { EnemyDossier, ART_ALIAS } from '../components/EnemyDossier';
import { GameIcon } from '../icons';
import { Shell } from './MetaScreens';

type Tab = 'characters' | 'enemies' | 'cards';

const ACT_LABEL: Record<number, string> = {
  1: 'Act I — The Sunlit Shallows',
  2: 'Act II — The Twilight Trench',
  3: 'Act III — The Hadal Deep',
  0: 'Summoned',
};
const TIER_ORDER: Record<string, number> = { normal: 0, elite: 1, boss: 2, minion: 3 };
const TIER_LABEL: Record<string, string> = { normal: 'Denizen', elite: 'Elite', boss: 'Boss', minion: 'Minion' };
const RARITY_ORDER: Record<string, number> = { starter: 0, common: 1, uncommon: 2, rare: 3, curse: 4 };
const CARD_SECTIONS: { id: CharacterId | 'neutral'; name: string }[] = [
  { id: 'tidecaller', name: 'The Tidecaller' },
  { id: 'voltaic', name: 'The Voltaic' },
  { id: 'drowned', name: 'The Drowned' },
  { id: 'weaver', name: 'The Wakeweaver' },
  { id: 'neutral', name: 'Neutral & Curses' },
];

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

export function CompendiumScreen() {
  const meta = useGame((s) => s.meta);
  const [tab, setTab] = useState<Tab>('characters');
  const [enemyOpen, setEnemyOpen] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState<string | null>(null);
  const [charOpen, setCharOpen] = useState<CharacterId | null>(null);

  const counts: Record<Tab, string> = {
    characters: `${meta.unlockedChars.length}/${Object.keys(CHARACTERS).length}`,
    enemies: `${Object.keys(ENEMIES).filter((id) => meta.seenEnemies?.[id]).length}/${Object.keys(ENEMIES).length}`,
    cards: `${ALL_CARDS.filter((c) => meta.seenCards?.[c.id]).length}/${ALL_CARDS.length}`,
  };

  return (
    <Shell title="Compendium">
      <div className="grid grid-cols-3 gap-2">
        {(['characters', 'enemies', 'cards'] as const).map((t) => (
          <button key={t} className={`btn text-sm !flex-col !gap-0 ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
            <span className="capitalize">{t}</span>
            <span className="text-[10px] opacity-70">{counts[t]}</span>
          </button>
        ))}
      </div>

      {tab === 'characters' && <CharactersTab onOpen={setCharOpen} />}
      {tab === 'enemies' && <EnemiesTab onOpen={setEnemyOpen} />}
      {tab === 'cards' && <CardsTab onOpen={setCardOpen} />}

      <AnimatePresence>
        {enemyOpen && <EnemyDossier key={enemyOpen} defId={enemyOpen} onClose={() => setEnemyOpen(null)} />}
        {cardOpen && <CardZoom key={cardOpen} defId={cardOpen} onClose={() => setCardOpen(null)} />}
        {charOpen && <CharacterDossier key={charOpen} charId={charOpen} onClose={() => setCharOpen(null)} />}
      </AnimatePresence>
    </Shell>
  );
}

// ── Characters ───────────────────────────────────────────────────────────────

function CharactersTab({ onOpen }: { onOpen: (id: CharacterId) => void }) {
  const meta = useGame((s) => s.meta);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.values(CHARACTERS).map((ch) => {
        const locked = !meta.unlockedChars.includes(ch.id);
        return (
          <button
            key={ch.id}
            disabled={locked}
            onClick={() => onOpen(ch.id)}
            className={`panel overflow-hidden text-left flex items-stretch ${locked ? 'opacity-55' : 'hover:scale-[1.015] transition-all'}`}
            aria-label={locked ? `${ch.name}, locked — ${ch.lockText ?? 'keep diving to unlock'}` : `${ch.name}, view dossier`}
          >
            <div className="w-24 shrink-0 bg-(--color-abyss-800) flex items-center justify-center min-h-24">
              {locked
                ? <Lock size={26} />
                : <ArtImage kind="characters" id={ch.id} icon={ch.icon} className="w-full h-full object-cover object-top" iconSize={40} alt={ch.name} />}
            </div>
            <div className="p-3 flex flex-col gap-1 min-w-0">
              <div className="font-display font-bold">{ch.name}</div>
              <div className="text-[11px] italic text-(--color-mist)">{ch.title}</div>
              <div className="text-xs text-(--color-mist)">{locked ? ch.lockText ?? 'Keep diving to unlock.' : ch.blurb}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CharacterDossier({ charId, onClose }: { charId: CharacterId; onClose: () => void }) {
  const ch = CHARACTERS[charId];
  const relic = RELICS[ch.starterRelic];
  useEscape(onClose);
  if (!ch) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[88] bg-black/75 backdrop-blur-md flex items-center justify-center"
      style={{ padding: 'max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))' }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label={`${ch.name} dossier`}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="panel relative w-[min(94vw,420px)] max-h-full overflow-y-auto overflow-x-hidden"
        onClick={(ev) => ev.stopPropagation()}
      >
        <ArtImage kind="characters" id={ch.id} icon={ch.icon} className="w-full aspect-[4/3] object-cover object-top" iconSize={64} alt={ch.name} />
        <div className="p-4 flex flex-col gap-2">
          <div>
            <h2 className="font-display text-xl font-bold">{ch.name}</h2>
            <p className="text-xs italic text-(--color-mist)">{ch.title}</p>
          </div>
          <p className="text-sm text-(--color-mist)">{ch.blurb}</p>
          <p className="text-xs rounded-lg bg-(--color-abyss-800) p-2 text-(--color-glow)">{ch.mechanic}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><Heart size={12} /> {ch.maxHp} HP</span>
            {relic && (
              <span className="flex items-center gap-1.5 min-w-0">
                <GameIcon id={relic.icon} size={14} />
                <span className="truncate"><b>{relic.name}</b> — {relic.text}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-(--color-dim)">
            Starts with: {ch.starterDeck.map((s) => `${s.count}× ${CARDS[s.card]?.name ?? s.card}`).join(', ')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Enemies ──────────────────────────────────────────────────────────────────

function EnemiesTab({ onOpen }: { onOpen: (id: string) => void }) {
  const meta = useGame((s) => s.meta);
  const groups = [1, 2, 3, 0]
    .map((act) => ({
      act,
      defs: Object.values(ENEMIES)
        .filter((e) => e.act === act)
        .sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.defs.length > 0);

  return (
    <>
      {groups.map((g) => (
        <section key={g.act}>
          <h2 className="font-bold text-sm text-(--color-mist) mb-2">{ACT_LABEL[g.act]}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {g.defs.map((def) => {
              const seen = !!meta.seenEnemies?.[def.id];
              return (
                <button
                  key={def.id}
                  disabled={!seen}
                  onClick={() => onOpen(def.id)}
                  className={`panel p-2 flex flex-col items-center gap-1 ${seen ? 'hover:scale-[1.03] transition-all' : ''}`}
                  aria-label={seen ? `${def.name}, view dossier` : 'Undiscovered enemy'}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-(--color-abyss-800) flex items-center justify-center">
                    <ArtImage
                      kind="enemies" id={ART_ALIAS[def.id] ?? def.id} icon={def.icon}
                      className={`w-full h-full object-cover ${seen ? '' : 'grayscale brightness-[0.22]'}`}
                      iconSize={30} iconClassName={seen ? '' : 'opacity-25'} alt=""
                    />
                  </div>
                  <div className="text-[11px] font-bold truncate w-full text-center">{seen ? def.name : '???'}</div>
                  <div
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: def.tier === 'boss' ? 'var(--color-lure)' : def.tier === 'elite' ? 'var(--color-gold)' : 'var(--color-mist)' }}
                  >
                    {TIER_LABEL[def.tier]}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────

function CardsTab({ onOpen }: { onOpen: (id: string) => void }) {
  const meta = useGame((s) => s.meta);
  return (
    <>
      {CARD_SECTIONS.map((sec) => {
        const cards = ALL_CARDS
          .filter((c) => c.char === sec.id)
          .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9) || a.name.localeCompare(b.name));
        if (!cards.length) return null;
        const found = cards.filter((c) => meta.seenCards?.[c.id]).length;
        return (
          <section key={sec.id}>
            <h2 className="font-bold text-sm text-(--color-mist) mb-2">
              {sec.name} <span className="text-(--color-dim) font-normal">{found}/{cards.length}</span>
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {cards.map((def) =>
                meta.seenCards?.[def.id] ? (
                  <CardView key={def.id} card={{ uid: 0, defId: def.id, upgraded: false }} onClick={() => onOpen(def.id)} ariaLabel={`${def.name}, view card`} />
                ) : (
                  <div
                    key={def.id}
                    className="border border-(--color-abyss-600) bg-(--color-abyss-800) flex items-center justify-center opacity-50"
                    style={{ width: 'var(--card-w)', height: 'var(--card-h)', borderRadius: 'var(--radius-card)' }}
                    aria-label="Undiscovered card"
                  >
                    <span className="font-display text-2xl text-(--color-dim)">?</span>
                  </div>
                ),
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

function upgradable(def: CardDef): boolean {
  return def.opsUp !== undefined || def.costUp !== undefined || def.exhaustUp !== undefined || def.powerHookUp !== undefined;
}

function CardZoom({ defId, onClose }: { defId: string; onClose: () => void }) {
  const def = CARDS[defId];
  const [upgraded, setUpgraded] = useState(false);
  useEscape(onClose);
  if (!def) return null;
  const text = describeCard(def, upgraded);
  const keywordIds = [...new Set(
    [...text.matchAll(new RegExp(KEYWORD_PATTERN.source, 'g'))].map((m) => keywordIdFor(m[0])).filter((k): k is string => !!k),
  )];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[88] bg-black/75 backdrop-blur-md flex items-center justify-center"
      style={{ padding: 'max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))' }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label={`${def.name} card`}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="flex flex-col items-center gap-3 max-h-full overflow-y-auto"
        onClick={(ev) => ev.stopPropagation()}
      >
        <CardView card={{ uid: 0, defId, upgraded }} scale="lg" />
        {upgradable(def) && (
          <div className="flex gap-2">
            <button className={`btn text-xs ${!upgraded ? 'btn-primary' : ''}`} onClick={() => setUpgraded(false)}>Base</button>
            <button className={`btn text-xs ${upgraded ? 'btn-primary' : ''}`} onClick={() => setUpgraded(true)}>Upgraded</button>
          </div>
        )}
        <div className="text-[11px] text-(--color-mist) capitalize">{def.rarity} {def.type}</div>
        {def.flavor && <p className="text-xs italic text-(--color-mist) text-center max-w-64">“{def.flavor}”</p>}
        {keywordIds.length > 0 && (
          <div className="panel p-3 flex flex-col gap-1 w-[min(94vw,340px)]">
            {keywordIds.map((k) => (
              <p key={k} className="text-[11px] text-(--color-mist)">
                <b className="text-(--color-foam)">{KEYWORDS[k].name}</b> — {KEYWORDS[k].text}
              </p>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
