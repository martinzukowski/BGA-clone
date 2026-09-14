/**
 * MARE NOSTRVM — the large map. 30 cities, 12 provinces, 2–5 players.
 *
 * An entirely original board design. City names are historical Roman
 * settlements; their placement, the province groupings, the route graph and the
 * geometry are this project's own work.
 *
 * Coordinates are in a 1600 × 1000 SVG space and are **presentation only** —
 * the rules see nothing but the adjacency graph (docs/ARCHITECTURE.md).
 */

import type { CityDefinition, MapDefinition, ProvinceDefinition, RouteDefinition } from '../../engine/types';

const C = (
  id: string,
  name: string,
  provinceId: string | null,
  tokenGroup: string | undefined,
  x: number,
  y: number,
  labelAnchor: CityDefinition['labelAnchor'] = 's',
): CityDefinition => ({
  id,
  name,
  provinceId,
  ...(tokenGroup ? { tokenGroup } : {}),
  x,
  y,
  labelAnchor,
});

const cities: CityDefinition[] = [
  // The capital — no province, no goods, never buildable (RULES 3.1, 8.7).
  { id: 'roma', name: 'Roma', provinceId: null, isCapital: true, x: 566, y: 498, labelAnchor: 'e' },

  // ── Hispania ──────────────────────────────────────────────────
  C('gades', 'Gades', 'hispania', 'A', 108, 660, 'sw'),
  C('corduba', 'Corduba', 'hispania', 'A', 168, 588, 'w'),
  C('tarraco', 'Tarraco', 'hispania', 'A', 292, 505, 'nw'),

  // ── Gallia ────────────────────────────────────────────────────
  C('narbo', 'Narbo', 'gallia', 'A', 366, 447, 's'),
  C('massilia', 'Massilia', 'gallia', 'A', 434, 468, 'se'),
  C('lugdunum', 'Lugdunum', 'gallia', 'A', 392, 348, 'nw'),

  // ── Italia ────────────────────────────────────────────────────
  C('genua', 'Genua', 'italia', 'B', 498, 434, 'sw'),
  C('mediolanum', 'Mediolanum', 'italia', 'B', 506, 356, 'nw'),
  C('ravenna', 'Ravenna', 'italia', 'B', 580, 410, 'e'),

  // ── Campania ──────────────────────────────────────────────────
  C('neapolis', 'Neapolis', 'campania', 'B', 616, 556, 'sw'),
  C('brundisium', 'Brundisium', 'campania', 'B', 712, 562, 'se'),

  // ── Insulae (islands) ─────────────────────────────────────────
  C('caralis', 'Caralis', 'insulae', 'A', 496, 578, 'sw'),
  C('syracusae', 'Syracusae', 'insulae', 'B', 636, 656, 's'),

  // ── Illyricum ─────────────────────────────────────────────────
  C('aquileia', 'Aquileia', 'illyricum', 'B', 612, 336, 'n'),
  C('salona', 'Salona', 'illyricum', 'B', 692, 424, 'e'),

  // ── Pannonia ──────────────────────────────────────────────────
  C('vindobona', 'Vindobona', 'pannonia', 'C', 640, 244, 'n'),
  C('sirmium', 'Sirmium', 'pannonia', 'C', 736, 312, 'ne'),

  // ── Macedonia ─────────────────────────────────────────────────
  C('dyrrhachium', 'Dyrrhachium', 'macedonia', 'C', 762, 466, 'sw'),
  C('thessalonica', 'Thessalonica', 'macedonia', 'C', 842, 452, 'n'),

  // ── Graecia ───────────────────────────────────────────────────
  C('corinthus', 'Corinthus', 'graecia', 'C', 812, 580, 'sw'),
  C('athenae', 'Athenae', 'graecia', 'C', 884, 566, 'se'),

  // ── Asia ──────────────────────────────────────────────────────
  C('byzantium', 'Byzantium', 'asia', 'C', 940, 418, 'n'),
  C('nicomedia', 'Nicomedia', 'asia', 'D', 1024, 430, 'ne'),
  C('ephesus', 'Ephesus', 'asia', 'D', 1000, 568, 'se'),

  // ── Syria ─────────────────────────────────────────────────────
  C('antiochia', 'Antiochia', 'syria', 'D', 1156, 540, 'ne'),
  C('tyrus', 'Tyrus', 'syria', 'D', 1170, 638, 'e'),
  C('caesarea', 'Caesarea', 'syria', 'D', 1152, 714, 'se'),

  // ── Africa ────────────────────────────────────────────────────
  C('carthago', 'Carthago', 'africa', 'A', 556, 712, 'sw'),
  C('cyrene', 'Cyrene', 'africa', 'D', 828, 756, 's'),
  C('alexandria', 'Alexandria', 'africa', 'D', 1058, 792, 'se'),
];

const provinces: ProvinceDefinition[] = [
  { id: 'hispania', name: 'Hispania', cityIds: ['gades', 'corduba', 'tarraco'], terrain: 'coast' },
  { id: 'gallia', name: 'Gallia', cityIds: ['narbo', 'massilia', 'lugdunum'], terrain: 'inland' },
  { id: 'italia', name: 'Italia', cityIds: ['genua', 'mediolanum', 'ravenna'], terrain: 'mountain' },
  { id: 'campania', name: 'Campania', cityIds: ['neapolis', 'brundisium'], terrain: 'coast' },
  { id: 'insulae', name: 'Insulae', cityIds: ['caralis', 'syracusae'], terrain: 'island' },
  { id: 'illyricum', name: 'Illyricum', cityIds: ['aquileia', 'salona'], terrain: 'mountain' },
  { id: 'pannonia', name: 'Pannonia', cityIds: ['vindobona', 'sirmium'], terrain: 'inland' },
  { id: 'macedonia', name: 'Macedonia', cityIds: ['dyrrhachium', 'thessalonica'], terrain: 'mountain' },
  { id: 'graecia', name: 'Graecia', cityIds: ['corinthus', 'athenae'], terrain: 'coast' },
  { id: 'asia', name: 'Asia', cityIds: ['byzantium', 'nicomedia', 'ephesus'], terrain: 'coast' },
  { id: 'syria', name: 'Syria', cityIds: ['antiochia', 'tyrus', 'caesarea'], terrain: 'desert' },
  { id: 'africa', name: 'Africa', cityIds: ['carthago', 'cyrene', 'alexandria'], terrain: 'desert' },
];

const L = (from: string, to: string, curve = 0): RouteDefinition => ({
  id: `L:${from}-${to}`,
  type: 'land',
  from,
  to,
  curve,
});

const S = (from: string, to: string, curve = 0): RouteDefinition => ({
  id: `S:${from}-${to}`,
  type: 'sea',
  from,
  to,
  curve,
});

/** Brown roads. Land colonists only (RULES 3.2). */
const landRoutes: RouteDefinition[] = [
  L('gades', 'corduba', 8),
  L('corduba', 'tarraco', -26),
  L('tarraco', 'narbo', -14),
  L('narbo', 'massilia', 12),
  L('narbo', 'lugdunum', -16),
  L('lugdunum', 'massilia', 18),
  L('lugdunum', 'mediolanum', -20),
  L('massilia', 'genua', 14),
  L('genua', 'mediolanum', -10),
  L('mediolanum', 'ravenna', 12),
  L('mediolanum', 'aquileia', -18),
  L('ravenna', 'aquileia', 14),
  L('ravenna', 'roma', -12),
  L('genua', 'roma', 22),
  L('roma', 'neapolis', -10),
  L('neapolis', 'brundisium', 16),
  L('ravenna', 'brundisium', 34),
  L('aquileia', 'vindobona', -12),
  L('aquileia', 'salona', 16),
  L('vindobona', 'sirmium', 10),
  L('sirmium', 'salona', -14),
  L('sirmium', 'thessalonica', 18),
  L('salona', 'dyrrhachium', 10),
  L('dyrrhachium', 'thessalonica', -12),
  L('thessalonica', 'byzantium', -14),
  L('thessalonica', 'athenae', 20),
  L('thessalonica', 'corinthus', -22),
  L('athenae', 'corinthus', 10),
  L('byzantium', 'nicomedia', -10),
  L('nicomedia', 'ephesus', 16),
  L('nicomedia', 'antiochia', -22),
  L('ephesus', 'antiochia', 18),
  L('antiochia', 'tyrus', 10),
  L('tyrus', 'caesarea', -8),
  L('caesarea', 'alexandria', 22),
  L('alexandria', 'cyrene', 18),
  L('cyrene', 'carthago', -30),
];

/** Blue sea lanes. Sea colonists only (RULES 3.2). */
const seaRoutes: RouteDefinition[] = [
  S('gades', 'tarraco', 40),
  S('tarraco', 'caralis', 24),
  S('caralis', 'massilia', -26),
  S('caralis', 'roma', -18),
  S('caralis', 'carthago', 20),
  S('massilia', 'genua', -18),
  S('genua', 'roma', -26),
  S('roma', 'neapolis', 18),
  S('neapolis', 'syracusae', 20),
  S('syracusae', 'carthago', -20),
  S('syracusae', 'cyrene', 26),
  S('neapolis', 'brundisium', -22),
  S('brundisium', 'dyrrhachium', 14),
  S('brundisium', 'salona', -18),
  S('salona', 'ravenna', 20),
  S('ravenna', 'aquileia', -18),
  S('dyrrhachium', 'corinthus', 22),
  S('corinthus', 'athenae', -16),
  S('athenae', 'thessalonica', -24),
  S('thessalonica', 'byzantium', 18),
  S('byzantium', 'nicomedia', 14),
  S('athenae', 'ephesus', 18),
  S('ephesus', 'nicomedia', -18),
  S('ephesus', 'tyrus', 30),
  S('tyrus', 'alexandria', 26),
  S('alexandria', 'cyrene', -22),
];

export const mareNostrum: MapDefinition = {
  id: 'mare-nostrum',
  name: 'Mare Nostrvm',
  blurb: 'The whole inland sea — thirty cities across twelve provinces, from Gades to Caesarea.',
  minPlayers: 2,
  maxPlayers: 5,
  capitalId: 'roma',
  cities,
  provinces,
  routes: [...landRoutes, ...seaRoutes],
  /**
   * RULES 4.2 — goods are shuffled within each token group at setup.
   * Global totals: 9 brick, 8 food, 6 tool, 4 wine, 3 cloth = 30 cities.
   */
  tokenGroups: {
    A: ['brick', 'brick', 'brick', 'food', 'food', 'tool', 'wine', 'cloth'],
    B: ['brick', 'brick', 'food', 'food', 'tool', 'tool', 'wine', 'cloth'],
    C: ['brick', 'brick', 'food', 'food', 'tool', 'tool', 'wine'],
    D: ['brick', 'brick', 'food', 'food', 'tool', 'wine', 'cloth'],
  },
  width: 1600,
  height: 1000,
};
