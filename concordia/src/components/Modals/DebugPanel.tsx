/**
 * The development debug panel.
 *
 * Compiled out of production entirely: every call site is guarded by
 * `import.meta.env.DEV`, and Vite's dead-code elimination removes the module
 * from the release bundle.
 */

import { useMemo, useState } from 'react';
import { getCardDef } from '../../game/data/cards';
import { GOODS_ORDER } from '../../game/data/goods';
import { chooseTurn, evaluatePosition, generateTurnPlans } from '../../game/ai';
import { HARD_WEIGHTS } from '../../game/ai/evaluation';
import { legalActions, validateState } from '../../game/engine/rules';
import type { GameState, Good, PlayerId } from '../../game/engine/types';
import { resumeAi, useGame } from '../../store/game';
import { GoodIcon } from '../Goods/GoodIcon';
import { Modal } from './Modal';

export function DebugPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const game = useGame((s) => s.game);
  const setState = useGame((s) => s.debugSetState);
  const dispatch = useGame((s) => s.dispatch);
  const [target, setTarget] = useState<PlayerId>(0);
  const [tab, setTab] = useState<'state' | 'ai' | 'actions'>('state');

  const problems = useMemo(() => (game ? validateState(game) : []), [game]);
  const actions = useMemo(() => (game ? legalActions(game) : []), [game]);

  if (!game) return null;
  const player = game.players[target]!;

  const patch = (fn: (s: GameState) => GameState) => setState(fn(game));

  const addGoods = (good: Good, n: number) =>
    patch((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === target ? { ...p, goods: { ...p.goods, [good]: Math.max(0, p.goods[good] + n) } } : p,
      ),
    }));

  return (
    <Modal open={open} title="Debug" subtitle="development build only" onClose={onClose} width={860}>
      <div className="mb-3 flex gap-1">
        {(['state', 'ai', 'actions'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded-[3px] px-3 py-1 text-[11px] uppercase tracking-[0.12em]"
            style={{
              background: tab === t ? '#cfae52' : 'rgb(90 68 38 / .12)',
              color: tab === t ? '#2a2010' : 'var(--color-ink-600)',
            }}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="t-label">Player</span>
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="rounded border border-ink-500/40 bg-parch-50 px-2 py-1 text-[12px]"
          >
            {game.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}: {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {problems.length > 0 && (
        <div className="mb-3 rounded border border-terracotta-500 bg-terracotta-500/15 p-2 text-[12px]">
          <b>Invariants broken:</b>
          <ul className="ml-4 list-disc">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'state' && (
        <div className="space-y-3 text-[12.5px]">
          <Row label="Money">
            <span className="tabular-nums">{player.money}₴</span>
            <Btn onClick={() => patch((s) => ({ ...s, players: s.players.map((p) => (p.id === target ? { ...p, money: p.money + 10 } : p)) }))}>
              +10
            </Btn>
            <Btn onClick={() => patch((s) => ({ ...s, players: s.players.map((p) => (p.id === target ? { ...p, money: Math.max(0, p.money - 10) } : p)) }))}>
              −10
            </Btn>
          </Row>

          <Row label="Goods">
            {GOODS_ORDER.map((g) => (
              <span key={g} className="inline-flex items-center gap-1">
                <GoodIcon good={g} size={16} />
                <span className="w-4 tabular-nums">{player.goods[g]}</span>
                <Btn onClick={() => addGoods(g, 1)}>+</Btn>
                <Btn onClick={() => addGoods(g, -1)}>−</Btn>
              </span>
            ))}
          </Row>

          <Row label="Turn">
            <span>
              current: {game.currentPlayer} ({game.players[game.currentPlayer]!.name}) · phase {game.phase}
            </span>
            <Btn
              onClick={() => {
                patch((s) => ({ ...s, currentPlayer: target, pending: null }));
                resumeAi();
              }}
            >
              make active
            </Btn>
          </Row>

          <Row label="Skip turn">
            <Btn
              onClick={() => {
                const first = legalActions(game)[0];
                if (first) dispatch(first);
              }}
            >
              play first legal action
            </Btn>
          </Row>

          <Row label="Near the end">
            <Btn
              onClick={() =>
                patch((s) => ({
                  ...s,
                  stack: [],
                  display: [s.display.find((c) => c !== null) ?? null, null, null, null, null, null, null],
                }))
              }
            >
              empty the deck
            </Btn>
            <Btn
              onClick={() =>
                patch((s) => ({
                  ...s,
                  players: s.players.map((p) => (p.id === target ? { ...p, housesRemaining: 1 } : p)),
                }))
              }
            >
              1 house left (breaks accounting)
            </Btn>
          </Row>

          <Row label="Markers">
            <Btn
              onClick={() =>
                patch((s) => ({
                  ...s,
                  bonusMarkers: Object.fromEntries(
                    Object.entries(s.bonusMarkers).map(([k, m]) => [k, { ...m, active: true }]),
                  ),
                }))
              }
            >
              reactivate all
            </Btn>
          </Row>

          <details>
            <summary className="cursor-pointer text-[12px] text-ink-600">Raw state</summary>
            <pre className="scroll-slim mt-2 max-h-64 overflow-auto rounded bg-black/80 p-2 text-[10px] leading-tight text-green-200">
              {JSON.stringify({ ...game, log: `${game.log.length} entries` }, null, 1)}
            </pre>
          </details>
        </div>
      )}

      {tab === 'ai' && <AiInspector state={game} />}

      {tab === 'actions' && (
        <div className="scroll-slim max-h-[420px] space-y-1 overflow-y-auto text-[11.5px]">
          <div className="mb-1 text-ink-600">{actions.length} legal actions</div>
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => dispatch(a)}
              className="block w-full rounded px-2 py-1 text-left font-mono hover:bg-gold-500/20"
              style={{ background: 'rgb(90 68 38 / .07)' }}
            >
              {JSON.stringify(a)}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function AiInspector({ state }: { state: GameState }) {
  const [rows, setRows] = useState<{ label: string; value: number }[] | null>(null);
  const [choice, setChoice] = useState<string | null>(null);

  const evaluate = () => {
    const me = state.currentPlayer;
    const base = evaluatePosition(state, me, HARD_WEIGHTS);
    const plans = generateTurnPlans(state)
      .map((p) => ({ label: p.label, value: evaluatePosition(p.result, me, HARD_WEIGHTS) - base }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 26);
    setRows(plans);
    setChoice(chooseTurn(state, state.players[me]!.difficulty ?? 'hard').label);
  };

  return (
    <div className="space-y-2 text-[12.5px]">
      <button type="button" className="btn btn-secondary" onClick={evaluate}>
        Evaluate this position
      </button>
      {choice && (
        <div className="rounded bg-gold-500/15 px-2 py-1">
          The AI would play: <b>{choice}</b>
        </div>
      )}
      {rows && (
        <div className="scroll-slim max-h-[380px] overflow-y-auto">
          <table className="w-full">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-ink-500/10">
                  <td className="w-16 py-[3px] text-right tabular-nums" style={{ color: r.value >= 0 ? '#2f6b5c' : '#a63a2f' }}>
                    {r.value >= 0 ? '+' : ''}
                    {r.value.toFixed(2)}
                  </td>
                  <td className="py-[3px] pl-3">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-[11px] text-ink-500">
        Cards in play:{' '}
        {[...state.display.filter(Boolean), ...state.stack]
          .map((id) => getCardDef(state.cards[id as string]!.defId).title)
          .join(', ') || 'none'}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="t-label w-[92px] shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-ink-500/40 px-1.5 py-[1px] text-[11px] hover:bg-gold-500/20"
    >
      {children}
    </button>
  );
}
