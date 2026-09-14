/**
 * Map registry. Adding a map is adding one entry here — nothing else in the
 * codebase knows how many maps exist.
 */

import type { MapDefinition } from '../../engine/types';
import { mareNostrum } from './mareNostrum';
import { italiaAntiqua } from './italiaAntiqua';

export const MAPS: readonly MapDefinition[] = [mareNostrum, italiaAntiqua];

const BY_ID: Readonly<Record<string, MapDefinition>> = Object.fromEntries(
  MAPS.map((m) => [m.id, m]),
);

export function getMap(id: string): MapDefinition {
  const m = BY_ID[id];
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export function mapsForPlayerCount(n: number): readonly MapDefinition[] {
  return MAPS.filter((m) => n >= m.minPlayers && n <= m.maxPlayers);
}

export const DEFAULT_MAP_ID = mareNostrum.id;

export { mareNostrum, italiaAntiqua };
