/**
 * ITALIA ANTIQVA — the compact map. 24 cities, 11 provinces, 2–4 players.
 *
 * A tighter, sharper board: shorter roads, more contested cities and a much
 * faster race for provinces. Original design; the SVG space is 1200 × 1000.
 */

import type { CityDefinition, MapDefinition, ProvinceDefinition, RouteDefinition } from '../../engine/types';

const C = (
  id: string,
  name: string,
  provinceId: string,
  tokenGroup: string,
  x: number,
  y: number,
  labelAnchor: CityDefinition['labelAnchor'] = 's',
): CityDefinition => ({ id, name, provinceId, tokenGroup, x, y, labelAnchor });

const cities: CityDefinition[] = [
  { id: 'roma', name: 'Roma', provinceId: null, isCapital: true, x: 452, y: 512, labelAnchor: 'w' },

  C('nicaea', 'Nicaea', 'liguria', 'A', 178, 302, 'sw'),
  C('genua', 'Genua', 'liguria', 'A', 282, 306, 's'),

  C('mediolanum', 'Mediolanum', 'transpadana', 'A', 300, 192, 'nw'),
  C('verona', 'Verona', 'transpadana', 'A', 402, 178, 'n'),

  C('patavium', 'Patavium', 'venetia', 'A', 474, 204, 'se'),
  C('aquileia', 'Aquileia', 'venetia', 'A', 566, 176, 'ne'),

  C('bononia', 'Bononia', 'aemilia', 'A', 396, 284, 'sw'),
  C('ravenna', 'Ravenna', 'aemilia', 'A', 492, 292, 'ne'),

  C('pisae', 'Pisae', 'etruria', 'B', 330, 392, 'w'),
  C('florentia', 'Florentia', 'etruria', 'B', 404, 360, 'ne'),
  C('cosa', 'Cosa', 'etruria', 'B', 388, 456, 'w'),

  C('ariminum', 'Ariminum', 'picenum', 'B', 486, 348, 'ne'),
  C('ancona', 'Ancona', 'picenum', 'B', 566, 392, 'e'),

  C('aternum', 'Aternum', 'samnium', 'B', 594, 472, 'e'),
  C('beneventum', 'Beneventum', 'samnium', 'B', 596, 572, 'e'),

  C('capua', 'Capua', 'campania', 'B', 524, 570, 'w'),
  C('neapolis', 'Neapolis', 'campania', 'C', 540, 636, 'w'),
  C('salernum', 'Salernum', 'campania', 'C', 598, 664, 'se'),

  C('tarentum', 'Tarentum', 'apulia', 'C', 722, 640, 'n'),
  C('brundisium', 'Brundisium', 'apulia', 'C', 786, 598, 'ne'),

  C('croton', 'Croton', 'bruttium', 'C', 742, 744, 'e'),
  C('rhegium', 'Rhegium', 'bruttium', 'C', 660, 828, 'e'),

  C('panormus', 'Panormus', 'sicilia', 'C', 498, 842, 'w'),
  C('syracusae', 'Syracusae', 'sicilia', 'C', 640, 902, 'se'),
];

const provinces: ProvinceDefinition[] = [
  { id: 'liguria', name: 'Liguria', cityIds: ['nicaea', 'genua'], terrain: 'coast' },
  { id: 'transpadana', name: 'Transpadana', cityIds: ['mediolanum', 'verona'], terrain: 'inland' },
  { id: 'venetia', name: 'Venetia', cityIds: ['patavium', 'aquileia'], terrain: 'coast' },
  { id: 'aemilia', name: 'Aemilia', cityIds: ['bononia', 'ravenna'], terrain: 'inland' },
  { id: 'etruria', name: 'Etruria', cityIds: ['pisae', 'florentia', 'cosa'], terrain: 'mountain' },
  { id: 'picenum', name: 'Picenum', cityIds: ['ariminum', 'ancona'], terrain: 'coast' },
  { id: 'samnium', name: 'Samnium', cityIds: ['aternum', 'beneventum'], terrain: 'mountain' },
  { id: 'campania', name: 'Campania', cityIds: ['capua', 'neapolis', 'salernum'], terrain: 'coast' },
  { id: 'apulia', name: 'Apulia', cityIds: ['tarentum', 'brundisium'], terrain: 'coast' },
  { id: 'bruttium', name: 'Bruttium', cityIds: ['croton', 'rhegium'], terrain: 'mountain' },
  { id: 'sicilia', name: 'Sicilia', cityIds: ['panormus', 'syracusae'], terrain: 'island' },
];

const L = (from: string, to: string, curve = 0): RouteDefinition => ({ id: `L:${from}-${to}`, type: 'land', from, to, curve });
const S = (from: string, to: string, curve = 0): RouteDefinition => ({ id: `S:${from}-${to}`, type: 'sea', from, to, curve });

const landRoutes: RouteDefinition[] = [
  L('nicaea', 'genua', 12),
  L('genua', 'mediolanum', -14),
  L('mediolanum', 'verona', 10),
  L('verona', 'patavium', -8),
  L('patavium', 'aquileia', 10),
  L('verona', 'bononia', 14),
  L('bononia', 'ravenna', -10),
  L('ravenna', 'ariminum', 8),
  L('ariminum', 'ancona', -12),
  L('bononia', 'florentia', 12),
  L('florentia', 'pisae', -10),
  L('pisae', 'genua', 16),
  L('florentia', 'ariminum', -14),
  L('florentia', 'cosa', 14),
  L('cosa', 'roma', -10),
  L('roma', 'aternum', -18),
  L('ancona', 'aternum', 12),
  L('roma', 'capua', 14),
  L('capua', 'beneventum', -10),
  L('capua', 'neapolis', 12),
  L('neapolis', 'salernum', -8),
  L('beneventum', 'aternum', 10),
  L('beneventum', 'brundisium', -20),
  L('beneventum', 'tarentum', 16),
  L('salernum', 'rhegium', 34),
  L('tarentum', 'brundisium', 10),
  L('tarentum', 'croton', -14),
  L('croton', 'rhegium', 12),
  // Sicily is its own land mass — reachable only by sea (RULES 3.2).
  L('panormus', 'syracusae', 18),
];

const seaRoutes: RouteDefinition[] = [
  S('nicaea', 'genua', -14),
  S('genua', 'pisae', -18),
  S('pisae', 'cosa', -14),
  S('cosa', 'roma', 16),
  S('roma', 'neapolis', -20),
  S('neapolis', 'salernum', 14),
  S('salernum', 'panormus', -26),
  S('roma', 'panormus', 40),
  S('panormus', 'syracusae', -22),
  S('syracusae', 'rhegium', 16),
  S('neapolis', 'rhegium', 40),
  S('rhegium', 'croton', -14),
  S('croton', 'tarentum', 16),
  S('tarentum', 'brundisium', -12),
  S('brundisium', 'ancona', 26),
  S('ancona', 'ravenna', -14),
  S('ravenna', 'aquileia', 16),
  S('aquileia', 'patavium', -12),
];

export const italiaAntiqua: MapDefinition = {
  id: 'italia-antiqua',
  name: 'Italia Antiqva',
  blurb: 'A tighter peninsula — twenty-four cities in eleven provinces. Shorter roads, sharper elbows.',
  minPlayers: 2,
  maxPlayers: 4,
  capitalId: 'roma',
  cities,
  provinces,
  routes: [...landRoutes, ...seaRoutes],
  /** Global totals: 7 brick, 6 food, 5 tool, 3 wine, 3 cloth = 24 cities. */
  tokenGroups: {
    A: ['brick', 'brick', 'brick', 'food', 'food', 'tool', 'wine', 'cloth'],
    B: ['brick', 'brick', 'food', 'food', 'tool', 'tool', 'wine', 'cloth'],
    C: ['brick', 'brick', 'food', 'food', 'tool', 'tool', 'wine', 'cloth'],
  },
  width: 1200,
  height: 1000,
};
