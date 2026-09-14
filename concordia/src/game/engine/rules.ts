/**
 * The engine's public façade. UI, AI and tests import from here.
 *
 * Nothing in this module (or anything it re-exports) touches React, the DOM or
 * any global — the whole engine is a pure library.
 */

export { applyAction, diplomatTargets } from './actions';
export { setupGame } from './setup';
export {
  legalActions,
  isLegal,
  illegalReason,
  currentPrompt,
  movableColonists,
  destinationsFor,
  buildOptions,
  activeProvinces,
  purchaseOptions,
  recruitCities,
  canRecruit,
  type BuildOption,
  type PurchaseOption,
} from './validation';
export { calculateScore, scoreTotal, ownedCards, countByGod } from './scoring';
export { finalStandings, winner, isGameOver, endGameTriggered, finalTurnsRemaining } from './endGame';
export {
  validateState,
  assertValidState,
  getPlayer,
  currentPlayer,
  colonistsOf,
  colonistById,
  citiesOf,
  houseCount,
  housesInCity,
  cityGood,
  provincesOf,
  producedGoodTypes,
  colonistsOnBoard,
  freeStorage,
  storageUsed,
  totalGoods,
  emptyGoods,
  stateMap,
  reserveTotal,
  nextPlayerId,
  previousPlayerId,
} from './gameState';
export {
  mapIndex,
  reachableDestinations,
  validatePath,
  adjacentCities,
  buildableCities,
  occupiedRoutes,
  routeOccupant,
  routeEndpoints,
  type MapIndex,
  type Destination,
} from './movement';
export {
  buildCost,
  canAffordBuild,
  canPayGoods,
  quoteTrade,
  maxTradeQuantity,
  receiveGoods,
  resolveCost,
  goodsValue,
  fitsInStorehouse,
  type BuildCost,
} from './economy';
export {
  cardDef,
  cardAtPosition,
  definitionAtPosition,
  priceAtPosition,
  positionSurcharge,
  displayCardCount,
  displayIsEmpty,
  occupiedPositions,
  topOfDiscard,
} from './cards';
export { createRng, RngCursor } from './rng';
export * from './types';
