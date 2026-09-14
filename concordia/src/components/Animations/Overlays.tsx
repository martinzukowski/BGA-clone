/**
 * Transient overlays: the card that rises to the centre when it is played, the
 * "N is thinking" plate, the floating log, and the error toast.
 *
 * These are pure decoration over the current state. Skipping one can never
 * desynchronise the board, because the board always draws the real state.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCardDef } from '../../game/data/cards';
import type { LogEntry } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { prefersReducedMotion, speedFactor, useSettings } from '../../store/settings';
import { PersonalityCard } from '../PersonalityCard/PersonalityCard';
import { PLAYER_PALETTE } from '../ui/Icons';

/* ─────────────────────────────────────────── card play flourish ── */

/**
 * When a card is played, it rises into the middle of the screen, holds for a
 * beat and slides away. The whole flourish is under 700 ms at normal speed.
 */
export function CardPlayFlourish() {
  const recentEvents = useGame((s) => s.recentEvents);
  const game = useGame((s) => s.game);
  const speed = useSettings((s) => s.animationSpeed);
  const [shown, setShown] = useState<{ defId: string; name: string; color: string; id: number } | null>(null);
  const lastId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Wall-clock time the current flourish is due to disappear. */
  const hideAtRef = useRef(0);

  const factor = speedFactor(speed);

  useEffect(() => {
    if (!game) return;

    // Self-heal first: a `setTimeout` queued while this tab is backgrounded
    // or unfocused can be throttled far past its delay, which is exactly what
    // left players staring at a frozen card. Rather than trust the timer
    // alone, every render this component gets — and it gets one on every
    // single dispatch, since `recentEvents` changes every turn — is a second
    // chance to notice the deadline has passed and clear it regardless of
    // whether the timer ever fired.
    if (shown && Date.now() >= hideAtRef.current) setShown(null);

    if (factor === 0 || prefersReducedMotion()) return;
    const event = [...recentEvents]
      .reverse()
      .find((e) => e.kind === 'card-played' || e.kind === 'diplomat-copy');
    // Every dispatch — a move, a build, a trade — updates `recentEvents` and
    // re-runs this effect, not just a fresh card play. Bailing out here for
    // "nothing new to show" must *not* touch the pending dismiss timer: doing
    // that (e.g. via an effect cleanup keyed to this same dependency array)
    // cancels it without ever rescheduling it, and the card freezes on screen
    // for the rest of the turn.
    if (!event || event.id === lastId.current) return;
    lastId.current = event.id;
    const defId = event.data?.['defId'] as string | undefined;
    if (!defId) return;
    const playerId = event.playerId ?? 0;
    const duration = 620 * factor;
    hideAtRef.current = Date.now() + duration;
    setShown({
      defId,
      name: game.players[playerId]?.name ?? '',
      color: PLAYER_PALETTE[(game.players[playerId]?.color ?? 'crimson') as 'crimson'].base,
      id: event.id,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShown(null), duration);
  }, [recentEvents, game, factor, shown]);

  // The only place the timer is ever cleared without replacing it.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.id}
          // Click-to-dismiss as a safety valve: the timer above is now the
          // real fix, but a stuck flourish should never be able to strand the
          // player with no way out of it.
          className="fixed inset-0 z-40 grid cursor-pointer place-items-center"
          onClick={() => setShown(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 * factor }}
        >
          <motion.div
            initial={{ y: 120, scale: 0.7, rotateX: 40, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ y: -90, scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className="rounded-full px-4 py-1 text-[12px] uppercase tracking-[0.24em]"
              style={{ background: shown.color, color: '#fff', boxShadow: '0 6px 20px -6px #000' }}
            >
              {shown.name}
            </div>
            <div style={{ filter: 'drop-shadow(0 24px 40px rgb(0 0 0 / .7))' }}>
              <PersonalityCard defId={shown.defId} size="medium" />
            </div>
            <div className="t-display text-[26px] tracking-[0.14em] text-gold-300">
              {getCardDef(shown.defId).title}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────── AI thinking plate ── */

export function AiThinkingPlate() {
  const aiTurn = useGame((s) => s.aiTurn);
  return (
    <AnimatePresence>
      {aiTurn && !aiTurn.label && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="frame-stone flex items-center gap-3 rounded-full px-5 py-2"
            style={{ background: 'linear-gradient(180deg,#332e26,#231f1a)' }}>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block h-1.5 w-1.5 rounded-full bg-gold-400"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.16 }}
                />
              ))}
            </span>
            <span className="text-[13px] text-parch-200">{aiTurn.name} is thinking…</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────── the log ── */

export function GameLog() {
  const game = useGame((s) => s.game);
  const ref = useRef<HTMLDivElement | null>(null);
  const entries: readonly LogEntry[] = game?.log ?? [];
  const tail = entries.slice(-90);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="surface-slate frame-stone flex min-h-0 flex-1 flex-col rounded-md p-2.5">
      <div className="t-caps mb-1.5 text-[10px] tracking-[0.2em] text-gold-400">Chronicle</div>
      <div ref={ref} className="scroll-slim min-h-0 flex-1 space-y-[3px] overflow-y-auto pr-1">
        {tail.map((entry) => {
          const color =
            entry.playerId !== null && game
              ? PLAYER_PALETTE[game.players[entry.playerId]!.color as 'crimson'].light
              : '#b9ad95';
          return (
            <div
              key={entry.id}
              className="flex gap-1.5 text-[11.5px] leading-snug"
              style={{ opacity: entry.kind === 'turn-start' ? 0.55 : 1 }}
            >
              <span
                className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span className="text-parch-300">{entry.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── error toast ── */

export function ErrorToast() {
  const error = useGame((s) => s.lastError);
  const dismiss = useGame((s) => s.dismissError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(dismiss, 3200);
    return () => clearTimeout(timer);
  }, [error, dismiss]);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed left-1/2 top-16 z-50 -translate-x-1/2"
          onClick={dismiss}
          role="alert"
        >
          <div
            className="frame-stone cursor-pointer rounded px-4 py-2 text-[13px] text-parch-100"
            style={{ background: 'linear-gradient(180deg,#6c2a26,#4a1c19)' }}
          >
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
