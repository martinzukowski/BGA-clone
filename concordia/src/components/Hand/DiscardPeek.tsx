/**
 * The card showing on top of a player's discard pile — the thing a Legatus
 * copies (RULES 6.5), so it has to be visible at a glance for every rival.
 */

import { getCardDef } from '../../game/data/cards';
import type { GameState, PlayerId } from '../../game/engine/types';
import { PersonalityCard } from '../PersonalityCard/PersonalityCard';

export function DiscardPeek({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const player = state.players[playerId]!;
  const top = player.discard.at(-1);
  if (!top) {
    return (
      <div className="grid h-[112px] w-[78px] place-items-center rounded border border-dashed border-parch-500/25 text-center text-[8px] uppercase tracking-widest text-parch-500">
        empty
      </div>
    );
  }
  return (
    <div title={getCardDef(state.cards[top]!.defId).title}>
      <PersonalityCard defId={state.cards[top]!.defId} size="tiny" />
    </div>
  );
}
