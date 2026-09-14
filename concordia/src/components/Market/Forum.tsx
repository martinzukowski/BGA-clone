/**
 * The forum — the seven cards on offer (RULES §12).
 *
 * Positions are fixed and their surcharges printed beneath, so the price
 * gradient from left to right is visible at a glance. Buying slides the row
 * left and a fresh card turns in from the deck, driven by Framer's layout
 * animation rather than any hand-written tweening.
 *
 * `bare` drops the frame and heading for use inside the card tray, which
 * supplies its own.
 */

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DISPLAY_SIZE } from '../../game/data/ruleConstants';
import { positionSurcharge, priceAtPosition, purchaseOptions } from '../../game/engine/rules';
import type { GameState, PlayerId } from '../../game/engine/types';
import { GoodIcon } from '../Goods/GoodIcon';
import { CardBack, PersonalityCard } from '../PersonalityCard/PersonalityCard';
import { useGame } from '../../store/game';

const CARD_W = 116;
const CARD_H = 168;

export const Forum = memo(function Forum({
  state,
  playerId,
  bare = false,
}: {
  state: GameState;
  playerId: PlayerId;
  bare?: boolean;
}) {
  const dispatch = useGame((s) => s.dispatch);
  const setInteraction = useGame((s) => s.setInteraction);
  const busy = useGame((s) => s.busy);

  const step = state.pending?.step;
  const buying = step === 'senator:buy' ? 'senator' : step === 'consul:buy' ? 'consul' : null;
  const human = state.players[state.currentPlayer]?.isHuman && !busy;
  const options = buying && human ? purchaseOptions(state, playerId, buying) : [];
  const affordable = new Set(options.filter((o) => o.affordable).map((o) => o.position));
  const shopping = !!buying && !!human;

  const body = (
    <div className="flex items-start gap-2">
      <div className="scroll-slim flex flex-1 items-start gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: DISPLAY_SIZE }, (_, i) => i + 1).map((position) => {
          const cardId = state.display[position - 1];
          const surcharge = positionSurcharge(position);
          const canBuy = affordable.has(position);

          return (
            <div key={position} className="flex shrink-0 flex-col items-center gap-1">
              <div className="relative" style={{ width: CARD_W, height: CARD_H }}>
                <AnimatePresence mode="popLayout">
                  {cardId ? (
                    <motion.div
                      key={cardId}
                      layoutId={`card-${cardId}`}
                      initial={{ opacity: 0, x: 40, rotateY: 80 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                      className="absolute inset-0"
                    >
                      <PersonalityCard
                        defId={state.cards[cardId]!.defId}
                        size="small"
                        surcharge={buying === 'consul' ? undefined : surcharge}
                        disabled={shopping && !canBuy}
                        muted={!shopping}
                        onClick={canBuy ? () => dispatch({ type: 'BUY_CARD', position }) : undefined}
                        onHoverStart={() => setInteraction({ inspectingCard: state.cards[cardId]!.defId })}
                        onHoverEnd={() => setInteraction({ inspectingCard: null })}
                      />
                    </motion.div>
                  ) : (
                    <div
                      className="grid h-full w-full place-items-center rounded-[10px] border border-dashed border-parch-500/25"
                      style={{ background: 'rgb(0 0 0 / .18)' }}
                    >
                      <span className="text-[9px] uppercase tracking-[0.2em] text-parch-500">empty</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* position surcharge plate */}
              <div
                className="flex h-[24px] min-w-[54px] items-center justify-center gap-1 rounded-[3px] px-1.5"
                style={{
                  background: canBuy
                    ? 'linear-gradient(180deg, rgb(201 165 60 / .4), rgb(201 165 60 / .14))'
                    : 'linear-gradient(180deg, rgb(255 255 255 / .07), rgb(0 0 0 / .18))',
                  boxShadow: canBuy ? 'inset 0 0 0 1px rgb(230 205 134 / .5)' : 'inset 0 1px 0 rgb(255 255 255 / .1)',
                }}
                title={
                  surcharge.length
                    ? `Position ${position}: the Senator pays ${surcharge.length} extra good${surcharge.length === 1 ? '' : 's'}`
                    : `Position ${position}: no surcharge`
                }
              >
                <span className="text-[9px] tabular-nums text-parch-500">{position}</span>
                {surcharge.length === 0 ? (
                  <span className="text-[9px] uppercase tracking-[0.14em] text-parch-400">free</span>
                ) : (
                  surcharge.map((c, i) =>
                    c === 'any' ? (
                      <span
                        key={i}
                        className="grid h-[15px] w-[15px] place-items-center rounded-full bg-parch-100/85 text-[10px] font-bold leading-none text-wine-600"
                      >
                        ?
                      </span>
                    ) : (
                      <GoodIcon key={i} good={c} size={15} />
                    ),
                  )
                )}
              </div>

              {shopping && cardId && (
                <span
                  className="text-[8.5px] uppercase tracking-[0.12em]"
                  style={{ color: canBuy ? 'var(--color-gold-300)' : 'rgb(201 97 79 / .8)' }}
                >
                  {canBuy
                    ? `pay ${(priceAtPosition(state, position, buying) ?? []).length} goods`
                    : 'cannot pay'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* the deck */}
      <div className="relative shrink-0 pl-1" style={{ width: CARD_W + 18 }}>
        <div className="t-label mb-1 text-center text-parch-500">Deck</div>
        {state.stack.length === 0 ? (
          <div
            className="grid place-items-center rounded-[10px] border border-dashed border-parch-500/25 text-center text-[9px] uppercase leading-relaxed tracking-[0.15em] text-parch-500"
            style={{ width: CARD_W, height: CARD_H }}
          >
            exhausted
          </div>
        ) : (
          <div className="relative" style={{ width: CARD_W, height: CARD_H }}>
            {Array.from({ length: Math.min(4, Math.ceil(state.stack.length / 4)) }, (_, i) => (
              <div key={i} className="absolute" style={{ left: i * 2, top: -i * 2 }}>
                <CardBack size="small" />
              </div>
            ))}
            <div className="absolute -bottom-1 left-0 right-0 text-center text-[10px] tabular-nums text-parch-300">
              {state.stack.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (bare) {
    return (
      <div className="scroll-slim h-full overflow-y-auto">
        {shopping && (
          <div className="mb-1 text-[11px] text-gold-300">
            {buying === 'consul'
              ? 'The Consul ignores the position surcharge — click a card to buy it.'
              : `${state.pending?.purchasesRemaining ?? 0} purchase${(state.pending?.purchasesRemaining ?? 0) === 1 ? '' : 's'} remaining — click a card to buy it.`}
          </div>
        )}
        {body}
      </div>
    );
  }

  return (
    <div className="surface-slate frame-stone rounded-md p-2.5">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="t-caps text-[11px] tracking-[0.2em] text-gold-400">Forum</span>
        <span className="text-[10.5px] text-parch-500">
          cheapest on the left · {state.stack.length} card{state.stack.length === 1 ? '' : 's'} still in the deck
        </span>
      </div>
      {body}
    </div>
  );
});
