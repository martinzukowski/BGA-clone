/**
 * The two panels that float over the board: the chronicle and the rivals.
 *
 * Both collapse to a single line, because the map underneath them is the point.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { citiesOf, colonistsOf, provincesOf } from '../../game/engine/rules';
import { HOUSES_PER_PLAYER } from '../../game/data/ruleConstants';
import { GOODS_ORDER } from '../../game/data/goods';
import type { GameState, PlayerColorId, PlayerId } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { GoodIcon } from '../Goods/GoodIcon';
import { DiscardPeek } from '../Hand/DiscardPeek';
import { CoinIcon, PLAYER_PALETTE } from '../ui/Icons';

/* ═════════════════════════════════════════════════ chronicle ═════ */

export function ChroniclePanel() {
  const game = useGame((s) => s.game);
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);
  const entries = game?.log ?? [];

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length, open]);

  if (!game) return null;
  const last = entries[entries.length - 1];

  return (
    <FloatingShell
      title="Chronicle"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      summary={last ? last.text : '—'}
      width={318}
    >
      <div ref={ref} className="scroll-slim max-h-[210px] space-y-[3px] overflow-y-auto pr-1">
        {entries.slice(-80).map((entry) => {
          const color =
            entry.playerId !== null
              ? PLAYER_PALETTE[game.players[entry.playerId]!.color as PlayerColorId].light
              : '#b9ad95';
          return (
            <div
              key={entry.id}
              className="flex gap-1.5 text-[11.5px] leading-snug"
              style={{ opacity: entry.kind === 'turn-start' ? 0.5 : 1 }}
            >
              <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
              <span className="text-parch-300">{entry.text}</span>
            </div>
          );
        })}
      </div>
    </FloatingShell>
  );
}

/* ═══════════════════════════════════════════════════ rivals ══════ */

export function RivalsPanel({
  state,
  humanId,
  copyTargets,
}: {
  state: GameState;
  humanId: PlayerId;
  copyTargets: readonly PlayerId[];
}) {
  const dispatch = useGame((s) => s.dispatch);
  const [open, setOpen] = useState(true);
  const rivals = state.players.filter((p) => p.id !== humanId);

  // While a Legatus is choosing, the panel must be open — it is the chooser.
  useEffect(() => {
    if (copyTargets.length > 0) setOpen(true);
  }, [copyTargets.length]);

  return (
    <FloatingShell
      title="Rivals"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      summary={rivals.map((p) => p.name.split(' ')[0]).join(' · ')}
      width={318}
    >
      <div className="space-y-1.5">
        {rivals.map((p) => {
          const palette = PLAYER_PALETTE[p.color as PlayerColorId];
          const isTurn = state.currentPlayer === p.id;
          const target = copyTargets.includes(p.id);
          return (
            <motion.button
              key={p.id}
              type="button"
              disabled={!target}
              onClick={() => dispatch({ type: 'DIPLOMAT_COPY', targetPlayerId: p.id })}
              animate={target ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={target ? { repeat: Infinity, duration: 2 } : undefined}
              className="flex w-full gap-2 rounded-[4px] p-1.5 text-left disabled:cursor-default"
              style={{
                background: 'rgb(255 255 255 / .05)',
                boxShadow: target
                  ? 'inset 0 0 0 1px #e6cd86'
                  : isTurn
                    ? `inset 0 0 0 1px ${palette.base}`
                    : undefined,
                cursor: target ? 'pointer' : 'default',
              }}
            >
              <span
                className="mt-[3px] h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 34% 30%, ${palette.light}, ${palette.base} 60%, ${palette.dark})`,
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="t-display truncate text-[13px] text-parch-100">{p.name}</span>
                  {p.difficulty && <span className="t-label text-[7px] text-parch-500">{p.difficulty}</span>}
                  {state.praefectusMagnus === p.id && (
                    <span className="text-[10px] text-gold-500" title="Holds the Praefectus Magnus">✦</span>
                  )}
                </span>
                <span className="mt-[2px] flex flex-wrap items-center gap-x-2.5 gap-y-[2px] text-[10.5px] text-parch-400">
                  <span className="inline-flex items-center gap-1">
                    <CoinIcon size={12} />
                    <b className="tabular-nums text-parch-200">{p.money}</b>
                  </span>
                  <Stat label="cit" value={citiesOf(state, p.id).length} />
                  <Stat label="prov" value={provincesOf(state, p.id).length} />
                  <Stat label="col" value={colonistsOf(state, p.id).length} />
                  <Stat label="hou" value={HOUSES_PER_PLAYER - p.housesRemaining} />
                </span>
                <span className="mt-[3px] flex items-center gap-1.5">
                  {GOODS_ORDER.map((g) => (
                    <span key={g} className="inline-flex items-center gap-[2px]" style={{ opacity: p.goods[g] ? 1 : 0.28 }}>
                      <GoodIcon good={g} size={12} />
                      <span className="text-[9.5px] tabular-nums text-parch-300">{p.goods[g]}</span>
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0">
                <DiscardPeek state={state} playerId={p.id} />
                {target && (
                  <span className="mt-1 block rounded bg-gold-500 px-1 py-[1px] text-center text-[8px] font-semibold uppercase tracking-[0.14em] text-ink-900">
                    copy
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </FloatingShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="text-[9px] uppercase tracking-[0.08em] text-parch-500">{label} </span>
      <b className="tabular-nums text-parch-200">{value}</b>
    </span>
  );
}

/* ═════════════════════════════════════════════════ the shell ═════ */

function FloatingShell({
  title,
  open,
  onToggle,
  summary,
  width,
  children,
}: {
  title: string;
  open: boolean;
  onToggle(): void;
  summary: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="frame-stone overflow-hidden rounded-md"
      style={{
        width,
        background: 'linear-gradient(180deg, rgb(28 25 21 / .9), rgb(20 18 15 / .95))',
        backdropFilter: 'blur(6px)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <span className="t-caps shrink-0 text-[10px] tracking-[0.2em] text-gold-400">{title}</span>
        {!open && <span className="min-w-0 flex-1 truncate text-[11px] text-parch-400">{summary}</span>}
        <span
          className="ml-auto text-[9px] text-gold-500 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          ▲
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 40 }}
          >
            <div className="px-2.5 pb-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
