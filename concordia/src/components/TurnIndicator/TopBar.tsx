/**
 * The bar across the top: whose turn it is, where the game stands, and the way
 * out to the menu.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { finalTurnsRemaining } from '../../game/engine/rules';
import type { GameState, PlayerColorId } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { useSettings, type AnimationSpeed } from '../../store/settings';
import { PLAYER_PALETTE } from '../ui/Icons';

export const TopBar = memo(function TopBar({
  state,
  onOpenRules,
  onOpenSettings,
  onOpenMenu,
}: {
  state: GameState;
  onOpenRules(): void;
  onOpenSettings(): void;
  onOpenMenu(): void;
}) {
  const aiTurn = useGame((s) => s.aiTurn);
  const speed = useSettings((s) => s.animationSpeed);
  const setSetting = useSettings((s) => s.set);

  const current = state.players[state.currentPlayer]!;
  const palette = PLAYER_PALETTE[current.color as PlayerColorId];
  const finalTurns = finalTurnsRemaining(state);

  return (
    <header
      className="frame-stone relative z-20 flex h-[54px] shrink-0 items-center gap-4 px-4"
      style={{ background: 'linear-gradient(180deg,#2f2a23,#211d18)' }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="t-display text-[17px] tracking-[0.16em] text-gold-400">
          IMPERIVM
        </span>
        <span className="t-caps text-[9px] tracking-[0.3em] text-parch-500">Mercatorum</span>
      </div>

      <div className="h-6 w-px bg-gold-600/30" />

      {/* whose turn */}
      <motion.div
        key={state.currentPlayer}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2.5"
      >
        <span
          className="h-6 w-6 rounded-full"
          style={{
            background: `radial-gradient(circle at 34% 30%, ${palette.light}, ${palette.base} 60%, ${palette.dark})`,
            boxShadow: `0 0 12px ${palette.base}80, inset 0 1px 0 rgb(255 255 255 / .35)`,
          }}
        />
        <div className="leading-none">
          <div className="t-label text-[7.5px] text-parch-500">
            {current.isHuman ? 'Your turn' : 'Now playing'}
          </div>
          <div className="t-display text-[15px] text-parch-100">{current.name}</div>
        </div>
      </motion.div>

      {aiTurn?.label && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-gold-600/40 bg-black/35 px-3 py-1 text-[11.5px] text-parch-200"
        >
          {aiTurn.label}
        </motion.div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <Stat label="Round" value={String(state.roundNumber)} />
        <Stat label="Turn" value={String(state.turnNumber)} />
        <Stat label="Deck" value={String(state.stack.length)} />

        {finalTurns > 0 && (
          <motion.div
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="rounded border border-terracotta-500/60 bg-terracotta-500/15 px-2.5 py-1"
          >
            <div className="t-caps text-[9px] tracking-[0.18em] text-terracotta-500">
              Final turns — {finalTurns} left
            </div>
          </motion.div>
        )}

        <div className="h-6 w-px bg-gold-600/30" />

        {/* animation speed */}
        <div className="flex items-center gap-1">
          <span className="t-label text-[7px] text-parch-500">Speed</span>
          {(['normal', 'fast', 'instant'] as AnimationSpeed[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSetting('animationSpeed', s)}
              className="rounded-[2px] px-1.5 py-[2px] text-[9px] uppercase tracking-[0.1em] transition"
              style={{
                background: speed === s ? 'rgb(201 165 60 / .35)' : 'rgb(255 255 255 / .05)',
                color: speed === s ? '#f0dfa4' : 'var(--color-parch-500)',
              }}
            >
              {s === 'normal' ? 'Nor' : s === 'fast' ? 'Fast' : 'Inst'}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-ghost !px-2.5 !py-1" onClick={onOpenRules}>
          Rules
        </button>
        <button type="button" className="btn btn-ghost !px-2.5 !py-1" onClick={onOpenSettings}>
          Settings
        </button>
        <button type="button" className="btn btn-secondary !px-2.5 !py-1" onClick={onOpenMenu}>
          Menu
        </button>
      </div>
    </header>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center leading-none">
      <div className="t-label text-[7px] text-parch-500">{label}</div>
      <div className="mt-[2px] text-[14px] tabular-nums text-parch-200">{value}</div>
    </div>
  );
}
