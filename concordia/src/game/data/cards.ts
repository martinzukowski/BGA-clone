/**
 * The card definitions: 7 starting cards + 30 cards for sale (decks I–V).
 *
 * Deck composition, printed costs and god assignments follow docs/RULES.md §6
 * and §4.5. Titles, summaries and art keys are original to this project.
 */

import type { CardDefinition, CardRole, DeckNumeral, God, Good } from '../engine/types';
import {
  MERCATOR_MONEY_PURCHASED_CARD,
  MERCATOR_MONEY_STARTING_CARD,
  MINERVA_VP,
} from './ruleConstants';

/** RULES §6 — one god per role. */
export const ROLE_GOD: Readonly<Record<CardRole, God>> = {
  architect: 'jupiter',
  prefect: 'saturnus',
  mercator: 'mercurius',
  colonist: 'mars',
  diplomat: 'jupiter',
  senator: 'vesta',
  consul: 'jupiter',
  tribune: 'mars',
  mason: 'minerva',
  farmer: 'minerva',
  smith: 'minerva',
  vintner: 'minerva',
  weaver: 'minerva',
};

export const SPECIALIST_GOOD: Readonly<Record<string, Good>> = {
  mason: 'brick',
  farmer: 'food',
  smith: 'tool',
  vintner: 'wine',
  weaver: 'cloth',
};

/** Latin display titles — original to this project. */
export const ROLE_TITLE: Readonly<Record<CardRole, string>> = {
  architect: 'Architectus',
  prefect: 'Praefectus',
  mercator: 'Mercator',
  colonist: 'Colonus',
  diplomat: 'Legatus',
  senator: 'Senator',
  consul: 'Consul',
  tribune: 'Tribunus',
  mason: 'Structor',
  farmer: 'Agricola',
  smith: 'Faber',
  vintner: 'Vinitor',
  weaver: 'Textor',
};

/** English role label shown under the Latin title. */
export const ROLE_LABEL: Readonly<Record<CardRole, string>> = {
  architect: 'Architect',
  prefect: 'Prefect',
  mercator: 'Merchant',
  colonist: 'Colonist',
  diplomat: 'Diplomat',
  senator: 'Senator',
  consul: 'Consul',
  tribune: 'Tribune',
  mason: 'Mason',
  farmer: 'Farmer',
  smith: 'Smith',
  vintner: 'Vintner',
  weaver: 'Weaver',
};

const SUMMARY: Readonly<Record<CardRole, string>> = {
  architect: 'Move your colonists, then build houses in cities beside them.',
  prefect: 'Let one province produce and take its bonus — or reactivate every province for coin.',
  mercator: 'Take sestertii, then trade in up to two kinds of goods.',
  colonist: 'Raise new colonists in your cities — or take 5₴ plus 1₴ per colonist.',
  diplomat: "Repeat the personality card showing on an opponent's discard pile.",
  senator: 'Purchase up to two personality cards from the forum.',
  consul: 'Purchase one personality card, ignoring its position surcharge.',
  tribune: 'Take back every card you have played, gain coin, and raise a colonist in Roma.',
  mason: 'Every brick city you hold produces one brick.',
  farmer: 'Every food city you hold produces one food.',
  smith: 'Every tool city you hold produces one tool.',
  vintner: 'Every wine city you hold produces one wine.',
  weaver: 'Every cloth city you hold produces one cloth.',
};

function make(
  defId: string,
  role: CardRole,
  opts: { deck?: DeckNumeral; cost?: readonly (Good | 'any')[]; mercatorMoney?: number } = {},
): CardDefinition {
  const specialistGood = SPECIALIST_GOOD[role];
  return {
    defId,
    role,
    god: ROLE_GOD[role],
    ...(opts.deck !== undefined ? { deck: opts.deck } : {}),
    cost: opts.cost ?? [],
    ...(opts.mercatorMoney !== undefined ? { mercatorMoney: opts.mercatorMoney } : {}),
    ...(specialistGood ? { specialistGood, minervaValue: MINERVA_VP[specialistGood] } : {}),
    title: ROLE_TITLE[role],
    summary: SUMMARY[role],
  };
}

/* ───────────────────────────────── starting cards (RULES 4.10) ── */

export const STARTING_CARD_DEFS: readonly CardDefinition[] = [
  make('start-architect', 'architect'),
  make('start-diplomat', 'diplomat'),
  make('start-mercator', 'mercator', { mercatorMoney: MERCATOR_MONEY_STARTING_CARD }),
  make('start-prefect-a', 'prefect'),
  make('start-prefect-b', 'prefect'),
  make('start-senator', 'senator'),
  make('start-tribune', 'tribune'),
];

/* ───────────────────────────────── cards for sale (RULES 4.5) ── */

const M5 = { mercatorMoney: MERCATOR_MONEY_PURCHASED_CARD } as const;

/**
 * Deck sizes: I = 8, II = 7, III = 6, IV = 5, V = 4 (30 total).
 * Cards whose numeral exceeds the player count are removed at setup.
 */
export const FOR_SALE_CARD_DEFS: readonly CardDefinition[] = [
  // ── Deck I (8) ────────────────────────────────────────────────
  make('I-architect', 'architect', { deck: 1, cost: ['tool'] }),
  make('I-prefect', 'prefect', { deck: 1, cost: ['wine'] }),
  make('I-mercator', 'mercator', { deck: 1, cost: ['wine'], ...M5 }),
  make('I-colonist', 'colonist', { deck: 1, cost: ['food'] }),
  make('I-diplomat', 'diplomat', { deck: 1, cost: ['tool'] }),
  make('I-mason', 'mason', { deck: 1, cost: ['food'] }),
  make('I-farmer', 'farmer', { deck: 1, cost: ['brick', 'food'] }),
  make('I-smith', 'smith', { deck: 1, cost: ['brick', 'tool'] }),

  // ── Deck II (7) ───────────────────────────────────────────────
  make('II-architect', 'architect', { deck: 2, cost: ['tool'] }),
  make('II-prefect', 'prefect', { deck: 2, cost: ['wine'] }),
  make('II-mercator', 'mercator', { deck: 2, cost: ['wine'], ...M5 }),
  make('II-colonist', 'colonist', { deck: 2, cost: ['food'] }),
  make('II-consul', 'consul', { deck: 2, cost: ['cloth'] }),
  make('II-vintner', 'vintner', { deck: 2, cost: ['brick', 'wine'] }),
  make('II-weaver', 'weaver', { deck: 2, cost: ['brick', 'cloth'] }),

  // ── Deck III (6) ──────────────────────────────────────────────
  make('III-architect', 'architect', { deck: 3, cost: ['tool'] }),
  make('III-prefect', 'prefect', { deck: 3, cost: ['wine'] }),
  make('III-mercator', 'mercator', { deck: 3, cost: ['wine'], ...M5 }),
  make('III-colonist', 'colonist', { deck: 3, cost: ['food'] }),
  make('III-diplomat', 'diplomat', { deck: 3, cost: ['food'] }),
  make('III-consul', 'consul', { deck: 3, cost: ['cloth'] }),

  // ── Deck IV (5) ───────────────────────────────────────────────
  make('IV-architect', 'architect', { deck: 4, cost: ['tool'] }),
  make('IV-prefect', 'prefect', { deck: 4, cost: ['wine'] }),
  make('IV-colonist', 'colonist', { deck: 4, cost: ['food'] }),
  make('IV-diplomat', 'diplomat', { deck: 4, cost: ['tool'] }),
  make('IV-consul', 'consul', { deck: 4, cost: ['cloth'] }),

  // ── Deck V (4) ────────────────────────────────────────────────
  make('V-prefect', 'prefect', { deck: 5, cost: ['wine'] }),
  make('V-mercator', 'mercator', { deck: 5, cost: ['wine'], ...M5 }),
  make('V-diplomat', 'diplomat', { deck: 5, cost: ['food'] }),
  make('V-consul', 'consul', { deck: 5, cost: ['cloth'] }),
];

export const ALL_CARD_DEFS: readonly CardDefinition[] = [
  ...STARTING_CARD_DEFS,
  ...FOR_SALE_CARD_DEFS,
];

const BY_ID: Readonly<Record<string, CardDefinition>> = Object.fromEntries(
  ALL_CARD_DEFS.map((d) => [d.defId, d]),
);

export function getCardDef(defId: string): CardDefinition {
  const def = BY_ID[defId];
  if (!def) throw new Error(`Unknown card definition: ${defId}`);
  return def;
}

/** Human-readable god names for the UI. */
export const GOD_NAME: Readonly<Record<God, string>> = {
  vesta: 'Vesta',
  jupiter: 'Iuppiter',
  saturnus: 'Saturnus',
  mercurius: 'Mercurius',
  mars: 'Mars',
  minerva: 'Minerva',
};

export const GOD_DOMAIN: Readonly<Record<God, string>> = {
  vesta: 'Hearth & wealth',
  jupiter: 'Cities beyond the clay',
  saturnus: 'Provinces settled',
  mercurius: 'Variety of trade',
  mars: 'Colonists afield',
  minerva: 'Mastery of a craft',
};
