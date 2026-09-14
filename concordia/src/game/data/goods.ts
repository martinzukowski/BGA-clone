/**
 * Goods presentation metadata. Values and rules live in `ruleConstants.ts`;
 * this file is purely how a good is *named and drawn*.
 */

import type { Good } from '../engine/types';
import { GOOD_VALUES, GOODS } from './ruleConstants';

export interface GoodMeta {
  readonly id: Good;
  readonly name: string;
  /** Latin flavour label used on the storehouse. */
  readonly latin: string;
  readonly value: number;
  /** Core fill for the original engraved icon. */
  readonly color: string;
  /** Darker edge/shadow tone. */
  readonly shade: string;
  /** Lighter highlight tone. */
  readonly light: string;
}

export const GOOD_META: Readonly<Record<Good, GoodMeta>> = {
  brick: { id: 'brick', name: 'Brick', latin: 'Later', value: GOOD_VALUES.brick, color: '#b4552f', shade: '#79331a', light: '#dd8259' },
  food:  { id: 'food',  name: 'Food',  latin: 'Frumentum', value: GOOD_VALUES.food, color: '#cfa23c', shade: '#8f6b1c', light: '#eecd7c' },
  tool:  { id: 'tool',  name: 'Tool',  latin: 'Ferramentum', value: GOOD_VALUES.tool, color: '#7d8792', shade: '#4c545d', light: '#b3bcc6' },
  wine:  { id: 'wine',  name: 'Wine',  latin: 'Vinum', value: GOOD_VALUES.wine, color: '#7d2340', shade: '#4d1226', light: '#b4526f' },
  cloth: { id: 'cloth', name: 'Cloth', latin: 'Textile', value: GOOD_VALUES.cloth, color: '#4a5d8f', shade: '#2b3860', light: '#8296c4' },
};

/** Cheapest first — the canonical display order everywhere in the UI. */
export const GOODS_ORDER: readonly Good[] = GOODS;

export function goodMeta(g: Good): GoodMeta {
  return GOOD_META[g];
}
