// Random "?" node events. Choices are resolved in engine/run.ts by effect tag.

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  /** interpreted by applyEventChoice in engine/run.ts */
  effect:
    | { kind: 'gold'; amount: number }
    | { kind: 'heal'; amount: number }
    | { kind: 'healFrac'; frac: number }
    | { kind: 'damage'; amount: number }
    | { kind: 'maxHp'; amount: number }
    | { kind: 'card'; id: string }
    | { kind: 'curse'; id: string }
    | { kind: 'randomRelic' }
    | { kind: 'removeCard' }
    | { kind: 'upgradeCard' }
    | { kind: 'upgradeRandom'; count: number }
    | { kind: 'duplicateCard' }
    | { kind: 'transformCard' }
    | { kind: 'randomCardReward' }
    | { kind: 'nothing' }
    | { kind: 'combo'; effects: EventChoice['effect'][] };
}

export interface EventDef {
  id: string;
  name: string;
  icon: string;
  act?: 1 | 2 | 3;
  text: string;
  choices: EventChoice[];
}

export const EVENTS: Record<string, EventDef> = Object.fromEntries(
  (
    [
      {
        id: 'bottledMessage',
        name: 'A Bottled Message',
        icon: 'GiBrandyBottle',
        text: 'Wedged in the coral: a sealed bottle, paper curled inside. The wax bears a crest no kingdom above water remembers.',
        choices: [
          { id: 'read', label: 'Read it', detail: 'Gain a Message in a Bottle card and 15 gold.', effect: { kind: 'combo', effects: [{ kind: 'card', id: 'messageInABottle' }, { kind: 'gold', amount: 15 }] } },
          { id: 'sell', label: 'Pocket the wax seal', detail: 'Gain 30 gold.', effect: { kind: 'gold', amount: 30 } },
          { id: 'leave', label: 'Let it drift', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
      {
        id: 'cleanerStation',
        name: 'Cleaner Shrimp Station',
        icon: 'GiShrimp',
        text: 'A fastidious colony of cleaner shrimp beckons. They will groom anything — scales, wounds, bad habits.',
        choices: [
          { id: 'clean', label: 'Be cleaned', detail: 'Remove a card from your deck.', effect: { kind: 'removeCard' } },
          { id: 'mend', label: 'Have wounds tended', detail: 'Heal 12 HP.', effect: { kind: 'heal', amount: 12 } },
          { id: 'rob', label: 'Shake them down', detail: 'Gain 40 gold. Gain a Barnacle.', effect: { kind: 'combo', effects: [{ kind: 'gold', amount: 40 }, { kind: 'curse', id: 'barnacle' }] } },
        ],
      },
      {
        id: 'sunkenChest',
        name: 'The Sunken Chest',
        icon: 'GiLockedChest',
        text: 'A strongbox half-swallowed by the reef. The lock is rusted to lace. Something inside knocks — once.',
        choices: [
          { id: 'open', label: 'Force it open', detail: 'Gain a relic, but take 8 damage.', effect: { kind: 'combo', effects: [{ kind: 'damage', amount: 8 }, { kind: 'randomRelic' }] } },
          { id: 'pry', label: 'Pry off the fittings', detail: 'Gain 45 gold.', effect: { kind: 'gold', amount: 45 } },
          { id: 'leave', label: 'Leave it knocking', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
      {
        id: 'sirensSong',
        name: "The Siren's Song",
        icon: 'GiHarp',
        text: 'A voice threads through the water — your name, sung in a key you almost remember. It offers to change you.',
        choices: [
          { id: 'listen', label: 'Listen', detail: 'Transform a card into a random card.', effect: { kind: 'transformCard' } },
          { id: 'singAlong', label: 'Sing along', detail: "Gain a random card reward… and a Siren's Debt.", effect: { kind: 'combo', effects: [{ kind: 'randomCardReward' }, { kind: 'curse', id: 'sirensDebt' }] } },
          { id: 'cover', label: 'Cover your ears', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
      {
        id: 'whaleFall',
        name: 'Whale Fall',
        icon: 'GiSpermWhale',
        text: 'A leviathan lies on the trench floor, becoming a city. An entire ecosystem feasts in reverent silence.',
        choices: [
          { id: 'feast', label: 'Join the feast', detail: 'Heal 40% of your Max HP.', effect: { kind: 'healFrac', frac: 0.4 } },
          { id: 'harvest', label: 'Harvest ambergris', detail: 'Gain 60 gold.', effect: { kind: 'gold', amount: 60 } },
          { id: 'commune', label: 'Commune with what remains', detail: 'Gain a relic. Lose 6 Max HP.', effect: { kind: 'combo', effects: [{ kind: 'maxHp', amount: -6 }, { kind: 'randomRelic' }] } },
        ],
      },
      {
        id: 'airPocketCave',
        name: 'The Air Pocket',
        icon: 'GiCaveEntrance',
        text: 'A silver ceiling of trapped air inside a basalt cave. You surface. You breathe. You had forgotten breathing.',
        choices: [
          { id: 'rest', label: 'Float and breathe', detail: 'Heal 15 HP.', effect: { kind: 'heal', amount: 15 } },
          { id: 'train', label: 'Practice forms', detail: 'Upgrade a card.', effect: { kind: 'upgradeCard' } },
          { id: 'dive', label: 'Dive for the glinting thing', detail: 'Gain 35 gold, take 6 damage.', effect: { kind: 'combo', effects: [{ kind: 'damage', amount: 6 }, { kind: 'gold', amount: 35 }] } },
        ],
      },
      {
        id: 'hermitTrade',
        name: 'The Hermit',
        icon: 'GiSpiralShell',
        text: 'An impossibly old hermit crab wears a ship\'s bell for a shell. It collects. It trades. It does not haggle.',
        choices: [
          { id: 'flesh', label: 'Trade flesh', detail: 'Lose 8 Max HP. Gain a relic.', effect: { kind: 'combo', effects: [{ kind: 'maxHp', amount: -8 }, { kind: 'randomRelic' }] } },
          { id: 'gold', label: 'Trade coin', detail: 'Lose 55 gold. Gain a random card reward.', effect: { kind: 'combo', effects: [{ kind: 'gold', amount: -55 }, { kind: 'randomCardReward' }] } },
          { id: 'leave', label: 'Keep everything', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
      {
        id: 'grotto',
        name: 'Bioluminescent Grotto',
        icon: 'GiSparkles',
        text: 'A cavern lit by ten thousand patient lights. Things dipped in this glow come out… more themselves.',
        choices: [
          { id: 'bathe', label: 'Bathe your deck', detail: 'Upgrade 2 random cards.', effect: { kind: 'upgradeRandom', count: 2 } },
          { id: 'meditate', label: 'Meditate in the glow', detail: 'Heal 12 HP.', effect: { kind: 'heal', amount: 12 } },
          { id: 'bottle', label: 'Bottle the light', detail: 'Gain 40 gold.', effect: { kind: 'gold', amount: 40 } },
        ],
      },
      {
        id: 'ghostShip',
        name: 'The Ghost Ship',
        icon: 'GiShipWreck',
        text: 'A galleon sails the trench floor under full canvas, crewed by absences. Its hold is open. Its crew does not mind. Probably.',
        choices: [
          { id: 'plunder', label: 'Plunder the hold', detail: 'Gain 90 gold and a Dread of the Deep.', effect: { kind: 'combo', effects: [{ kind: 'gold', amount: 90 }, { kind: 'curse', id: 'dreadOfTheDeep' }] } },
          { id: 'salvage', label: 'Salvage the armory', detail: 'Gain a random card reward.', effect: { kind: 'randomCardReward' } },
          { id: 'salute', label: 'Salute and pass', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
      {
        id: 'mirrorSchool',
        name: 'School of Mirrors',
        icon: 'GiMirrorMirror',
        text: 'A school of silver fish holds formation as a perfect mirror. Your reflection swims a half-second early.',
        choices: [
          { id: 'copy', label: 'Reach toward it', detail: 'Duplicate a card in your deck.', effect: { kind: 'duplicateCard' } },
          { id: 'shatter', label: 'Scatter the school', detail: 'Remove a card from your deck.', effect: { kind: 'removeCard' } },
          { id: 'leave', label: 'Swim on', detail: 'Nothing happens.', effect: { kind: 'nothing' } },
        ],
      },
    ] as EventDef[]
  ).map((e) => [e.id, e]),
);
