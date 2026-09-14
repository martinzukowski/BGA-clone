/**
 * The card tray.
 *
 * Everything made of cards lives here, on three tabs: your hand, the pile you
 * have played, and the forum. It slides up from the bottom edge and switches
 * itself to the tab the rules currently care about — the forum while you are
 * buying, the discard pile while a Diplomat is choosing.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameState, PlayerId } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { Forum } from '../Market/Forum';
import { PersonalityCard } from '../PersonalityCard/PersonalityCard';
import { Drawer, HandleStat } from '../ui/Drawer';

type Tab = 'hand' | 'played' | 'forum';

export function CardsDrawer({
  state,
  playerId,
  canPlay,
  rightInset,
}: {
  state: GameState;
  playerId: PlayerId;
  canPlay: boolean;
  rightInset: number;
}) {
  const dispatch = useGame((s) => s.dispatch);
  const setInteraction = useGame((s) => s.setInteraction);
  const hintCardId = useGame((s) => s.hint?.cardId ?? null);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('hand');

  const player = state.players[playerId]!;
  const step = state.pending?.step;
  const buying = step === 'senator:buy' || step === 'consul:buy';

  // Follow the rules: show the forum while shopping, the hand the rest of the time.
  useEffect(() => {
    if (buying) setTab('forum');
    else if (canPlay) setTab('hand');
  }, [buying, canPlay]);

  return (
    <Drawer
      edge="bottom"
      open={open}
      onToggle={setOpen}
      demand={buying || canPlay}
      size={232}
      inset={rightInset}
      handle={
        <>
          <span className="t-caps text-[10px] tracking-[0.2em] text-gold-400">Cards</span>
          <HandleStat value={player.hand.length} label="hand" />
          <HandleStat value={player.discard.length} label="played" />
          <HandleStat value={state.display.filter(Boolean).length} label="forum" />
          {canPlay && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="rounded bg-gold-500 px-1.5 py-[1px] text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ink-900"
            >
              your move
            </motion.span>
          )}
        </>
      }
    >
      <div className="flex h-full flex-col px-3 pb-2 pt-2">
        {/* ── tabs ──────────────────────────────────────── */}
        <div className="mb-1.5 flex shrink-0 items-center gap-1">
          <TabButton active={tab === 'hand'} onClick={() => setTab('hand')} count={player.hand.length}>
            Your hand
          </TabButton>
          <TabButton active={tab === 'played'} onClick={() => setTab('played')} count={player.discard.length}>
            Played
          </TabButton>
          <TabButton
            active={tab === 'forum'}
            onClick={() => setTab('forum')}
            count={state.display.filter(Boolean).length}
            highlight={buying}
          >
            Forum
          </TabButton>

          <span className="ml-3 text-[11px] italic text-parch-500">
            {tab === 'hand' &&
              (canPlay ? 'Click a card to play it.' : 'One card a turn — this is your whole turn.')}
            {tab === 'played' && 'These come back when you play the Tribunus.'}
            {tab === 'forum' && `Cheapest on the left · ${state.stack.length} still in the deck.`}
          </span>
        </div>

        {/* ── contents ──────────────────────────────────── */}
        <div className="min-h-0 flex-1">
          {tab === 'forum' ? (
            <Forum state={state} playerId={playerId} bare />
          ) : (
            <div className="scroll-slim flex h-full items-start gap-2 overflow-x-auto pt-2">
              <AnimatePresence initial={false} mode="popLayout">
                {(tab === 'hand' ? player.hand : [...player.discard].reverse()).map((cardId) => (
                  <motion.div
                    key={cardId}
                    layout
                    layoutId={`card-${cardId}`}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  >
                    <PersonalityCard
                      defId={state.cards[cardId]!.defId}
                      size="small"
                      disabled={tab === 'hand' && !canPlay}
                      muted={tab === 'played'}
                      selected={tab === 'hand' && cardId === hintCardId}
                      onClick={
                        tab === 'hand' && canPlay
                          ? () => dispatch({ type: 'PLAY_CARD', cardId })
                          : undefined
                      }
                      onHoverStart={() => setInteraction({ inspectingCard: state.cards[cardId]!.defId })}
                      onHoverEnd={() => setInteraction({ inspectingCard: null })}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {tab === 'hand' && player.hand.length === 0 && (
                <EmptyNote>Your hand is empty — play the Tribunus to recall every card.</EmptyNote>
              )}
              {tab === 'played' && player.discard.length === 0 && (
                <EmptyNote>Nothing played yet this cycle.</EmptyNote>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function TabButton({
  active,
  onClick,
  count,
  highlight,
  children,
}: {
  active: boolean;
  onClick(): void;
  count: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] uppercase tracking-[0.13em] transition"
      style={{
        background: active ? 'linear-gradient(180deg,#e6cd86,#cfae52 48%,#a9862a)' : 'rgb(255 255 255 / .05)',
        color: active ? '#2a2010' : 'var(--color-parch-400)',
        boxShadow: highlight && !active ? 'inset 0 0 0 1px rgb(230 205 134 / .55)' : undefined,
      }}
    >
      {children}
      <span className="text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[168px] flex-1 place-items-center rounded border border-dashed border-parch-500/25 px-6 text-center text-[11px] uppercase tracking-[0.14em] text-parch-500">
      {children}
    </div>
  );
}
