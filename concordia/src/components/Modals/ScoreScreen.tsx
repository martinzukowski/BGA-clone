/**
 * The reckoning.
 *
 * Ranked players, an animated reveal god by god, and — because "why?" is the
 * whole point of a scoring screen — the engine's own written explanation for
 * every line (RULES §16).
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GOD_DOMAIN, GOD_NAME } from '../../game/data/cards';
import { finalStandings } from '../../game/engine/rules';
import type { GameState, God, PlayerColorId, ScoreLine } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { speedFactor, useSettings } from '../../store/settings';
import { GodIcon, LaurelRule, PLAYER_PALETTE } from '../ui/Icons';

const ORDER: (God | 'concordia')[] = [
  'vesta',
  'jupiter',
  'saturnus',
  'mercurius',
  'mars',
  'minerva',
  'concordia',
];

export function ScoreScreen({ state }: { state: GameState }) {
  const go = useGame((s) => s.go);
  const abandon = useGame((s) => s.abandonGame);
  const speed = useSettings((s) => s.animationSpeed);
  const standings = finalStandings(state);
  const [revealed, setRevealed] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(standings[0]?.playerId ?? null);

  const factor = speedFactor(speed);

  useEffect(() => {
    if (factor === 0) {
      setRevealed(ORDER.length);
      return;
    }
    if (revealed >= ORDER.length) return;
    const timer = setTimeout(() => setRevealed((n) => n + 1), 380 * factor);
    return () => clearTimeout(timer);
  }, [revealed, factor]);

  const champion = standings[0]!;
  const championPlayer = state.players[champion.playerId]!;
  const palette = PLAYER_PALETTE[championPlayer.color as PlayerColorId];

  return (
    <div className="app-shell flex min-h-full flex-col items-center overflow-y-auto px-6 py-8">
      {/* ── the winner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="t-caps text-[11px] tracking-[0.35em] text-gold-500">The reckoning</div>
        <h1 className="t-display mt-1 text-[42px] leading-tight text-parch-100">
          <span className="t-gilt">{championPlayer.name}</span> prevails
        </h1>
        <div className="mt-1 text-[15px] text-parch-400">
          {champion.breakdown.total} victory points
          {champion.wonTiebreak && standings.length > 1 && standings[1]!.breakdown.total === champion.breakdown.total
            ? ' — carried on the Praefectus Magnus'
            : ''}
        </div>
        <div className="mt-3 flex justify-center">
          <LaurelRule width={280} />
        </div>
        <div
          className="mx-auto mt-3 h-1 w-40 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${palette.base}, transparent)` }}
        />
      </motion.div>

      {/* ── the table ──────────────────────────────────────── */}
      <div className="w-full max-w-[1180px] space-y-3">
        {standings.map((standing, rank) => {
          const player = state.players[standing.playerId]!;
          const p = PLAYER_PALETTE[player.color as PlayerColorId];
          const open = expanded === standing.playerId;
          const lines = ORDER.map((g) => standing.breakdown.lines.find((l) => l.god === g)).filter(
            (l): l is ScoreLine => !!l,
          );

          return (
            <motion.div
              key={standing.playerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.09 }}
              className="surface-parchment frame-stone overflow-hidden rounded-md"
            >
              <button
                type="button"
                onClick={() => setExpanded(open ? null : standing.playerId)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `radial-gradient(circle at 34% 30%, ${p.light}, ${p.base} 60%, ${p.dark})`,
                    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .4), 0 3px 10px -4px #000',
                  }}
                >
                  <span className="t-display text-[19px] text-white/95">{rank + 1}</span>
                </div>

                <div className="min-w-0">
                  <div className="t-display text-[19px] leading-tight text-ink-800">{player.name}</div>
                  <div className="t-label mt-[1px]">
                    {player.isHuman ? 'You' : `${player.difficulty} opponent`}
                  </div>
                </div>

                {/* per-god chips */}
                <div className="ml-4 hidden flex-1 items-center gap-1.5 lg:flex">
                  {lines.map((line, i) => (
                    <motion.div
                      key={line.god}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={i < revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                      className="flex min-w-[62px] flex-col items-center rounded-[4px] px-1.5 py-1"
                      style={{
                        background: line.points > 0 ? 'rgb(201 165 60 / .18)' : 'rgb(90 68 38 / .07)',
                      }}
                      title={line.explanation}
                    >
                      {line.god === 'concordia' ? (
                        <span className="text-[13px] leading-none text-gold-600">✦</span>
                      ) : (
                        <GodIcon god={line.god} size={16} tone="#8a6a17" />
                      )}
                      <span className="mt-[2px] text-[13px] font-semibold tabular-nums leading-none text-ink-800">
                        {line.points}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="ml-auto text-right">
                  <motion.div
                    key={revealed}
                    initial={{ scale: 1.12 }}
                    animate={{ scale: 1 }}
                    className="t-display text-[30px] leading-none tabular-nums text-ink-800"
                  >
                    {lines
                      .slice(0, revealed)
                      .reduce((sum, l) => sum + l.points, 0)}
                  </motion.div>
                  <div className="t-label mt-[2px]">points</div>
                </div>

                <span className="ml-2 text-ink-500">{open ? '▴' : '▾'}</span>
              </button>

              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-gold-600/25 px-4 py-3"
                >
                  <table className="w-full text-[13px]">
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.god} className="align-top">
                          <td className="w-[124px] py-1.5">
                            <span className="flex items-center gap-1.5">
                              {line.god === 'concordia' ? (
                                <span className="text-gold-600">✦</span>
                              ) : (
                                <GodIcon god={line.god} size={16} tone="#8a6a17" />
                              )}
                              <span className="t-caps text-[11px] text-ink-700">
                                {line.god === 'concordia' ? 'Concordia' : GOD_NAME[line.god]}
                              </span>
                            </span>
                            <span className="t-label ml-[22px] block text-[7.5px]">
                              {line.god === 'concordia' ? 'Ended the game' : GOD_DOMAIN[line.god]}
                            </span>
                          </td>
                          <td className="w-[76px] py-1.5 text-center tabular-nums text-ink-600">
                            {line.god === 'minerva' || line.god === 'concordia'
                              ? '—'
                              : `${line.cards} × ${line.perCard}`}
                          </td>
                          <td className="w-[54px] py-1.5 text-right">
                            <b className="t-display text-[17px] tabular-nums text-ink-800">
                              {line.points}
                            </b>
                          </td>
                          <td className="py-1.5 pl-4 text-[12px] leading-snug text-ink-600">
                            {line.explanation}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="pt-2">
                          <div className="divider-gold" />
                        </td>
                      </tr>
                      <tr>
                        <td className="t-caps pt-1.5 text-[12px] text-ink-700">Total</td>
                        <td />
                        <td className="pt-1.5 text-right">
                          <b className="t-display text-[22px] tabular-nums text-ink-800">
                            {standing.breakdown.total}
                          </b>
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => go('setup')}>
          Play again
        </button>
        <button type="button" className="btn btn-secondary" onClick={abandon}>
          Main menu
        </button>
        {revealed < ORDER.length && (
          <button type="button" className="btn btn-ghost" onClick={() => setRevealed(ORDER.length)}>
            Reveal all
          </button>
        )}
      </div>
    </div>
  );
}
