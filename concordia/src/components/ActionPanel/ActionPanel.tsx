/**
 * The contextual action panel.
 *
 * It shows only the controls that matter for whatever the engine is waiting
 * for, and its instruction line comes straight from `currentPrompt`, so the
 * guidance can never drift out of step with the rules.
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ROLE_LABEL, getCardDef } from '../../game/data/cards';
import { GOODS_ORDER, goodMeta } from '../../game/data/goods';
import { BONUS_MARKER_COIN_VALUES, COLONIST_MONEY_BASE } from '../../game/data/ruleConstants';
import {
  buildOptions,
  colonistsOnBoard,
  currentPrompt,
  diplomatTargets,
  getPlayer,
  maxTradeQuantity,
  quoteTrade,
  stateMap,
} from '../../game/engine/rules';
import type { ColonistType, GameState, Good, PlayerId } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { GoodIcon } from '../Goods/GoodIcon';
import { CoinIcon, GodIcon } from '../ui/Icons';

export const ActionPanel = memo(function ActionPanel({
  state,
  playerId,
}: {
  state: GameState;
  playerId: PlayerId;
}) {
  const interaction = useGame((s) => s.interaction);
  const setInteraction = useGame((s) => s.setInteraction);
  const busy = useGame((s) => s.busy);
  const historyLength = useGame((s) => s.history.length);
  const undo = useGame((s) => s.undo);
  const hint = useGame((s) => s.hint);
  const requestHint = useGame((s) => s.requestHint);
  const clearHint = useGame((s) => s.clearHint);
  const applyHint = useGame((s) => s.applyHint);

  const pending = state.pending;
  const yourTurn = state.currentPlayer === playerId && !busy;
  const def = pending ? getCardDef(pending.effectiveDefId) : null;
  const canUndo = yourTurn && historyLength > 0;

  return (
    <div className="surface-slate frame-stone flex min-h-[128px] w-[330px] shrink-0 flex-col rounded-md p-3">
      {/* ── heading ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {def ? (
          <>
            <GodIcon god={def.god} size={20} tone="#d4b558" />
            <div className="min-w-0 flex-1">
              <div className="t-display truncate text-[16px] leading-none text-parch-100">
                {def.title}
              </div>
              <div className="t-label mt-[2px] text-[7.5px] text-parch-500">
                {ROLE_LABEL[def.role]}
                {pending?.copiedFrom
                  ? ` · copied from ${state.players[pending.copiedFrom.playerId]!.name}`
                  : ''}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 t-caps text-[12px] tracking-[0.2em] text-gold-400">Your turn</div>
        )}
        {canUndo && (
          <button
            type="button"
            title="Undo your last move"
            onClick={() => undo()}
            className="flex shrink-0 items-center gap-1 rounded-[3px] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-parch-300 transition hover:bg-gold-500/15 hover:text-gold-300"
            style={{ background: 'rgb(255 255 255 / .06)' }}
          >
            <span aria-hidden>↺</span> Undo
          </button>
        )}
        {yourTurn && (
          <button
            type="button"
            title="Suggest the strongest move here"
            onClick={() => (hint ? clearHint() : requestHint())}
            className="flex shrink-0 items-center gap-1 rounded-[3px] px-2 py-1 text-[10px] uppercase tracking-[0.1em] transition hover:bg-gold-500/15"
            style={{
              background: hint ? 'rgb(201 165 60 / .25)' : 'rgb(255 255 255 / .06)',
              color: hint ? 'var(--color-gold-300)' : 'var(--color-parch-300)',
            }}
          >
            <span aria-hidden>💡</span> Hint
          </button>
        )}
      </div>

      <div className="divider-gold my-2" />

      {/* ── the instruction ─────────────────────────────── */}
      <p className="text-[13px] leading-snug text-parch-200">
        {yourTurn ? currentPrompt(state) : 'Waiting…'}
      </p>

      {/* ── the hint ─────────────────────────────────────── */}
      {yourTurn && hint && (
        <div className="mt-2 rounded-[4px] border border-gold-600/40 bg-gold-500/10 p-2">
          <div className="flex items-start gap-1.5">
            <span aria-hidden className="leading-none">💡</span>
            <p className="flex-1 text-[11.5px] leading-snug text-parch-100">{hint.label}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary mt-1.5 w-full !py-1 text-[10.5px]"
            onClick={applyHint}
          >
            Do it for me
          </button>
        </div>
      )}

      {/* ── the controls ────────────────────────────────── */}
      {yourTurn && (
        <div className="mt-2.5 flex-1">
          {/*
            Keyed on the step so React swaps the controls outright and the
            fade-in replays. Deliberately *not* wrapped in AnimatePresence with
            mode="wait": if the outgoing controls ever fail to finish exiting,
            the panel is left showing the previous step's buttons, which is a
            far worse failure than a missing crossfade.
          */}
          <motion.div
            key={pending?.step ?? 'idle'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Controls state={state} playerId={playerId} />
          </motion.div>
        </div>
      )}

      {/* ── overflow preference ─────────────────────────── */}
      {yourTurn && pending && needsOverflowChoice(state, playerId) && (
        <div className="mt-2 rounded-[4px] border border-gold-600/30 bg-black/25 p-2">
          <div className="t-label mb-1 text-[7.5px] text-parch-400">
            Storehouse nearly full — keep first
          </div>
          <div className="flex gap-1">
            {GOODS_ORDER.map((g) => {
              const rank = interaction.goodsPreference.indexOf(g);
              return (
                <button
                  key={g}
                  type="button"
                  title={`Prefer to keep ${goodMeta(g).name}`}
                  onClick={() =>
                    setInteraction({
                      goodsPreference:
                        rank >= 0
                          ? interaction.goodsPreference.filter((x) => x !== g)
                          : [...interaction.goodsPreference, g],
                    })
                  }
                  className="relative grid h-7 w-7 place-items-center rounded-[3px] transition"
                  style={{
                    background: rank >= 0 ? 'rgb(201 165 60 / .3)' : 'rgb(255 255 255 / .06)',
                    boxShadow: rank >= 0 ? 'inset 0 0 0 1px rgb(230 205 134 / .6)' : undefined,
                  }}
                >
                  <GoodIcon good={g} size={17} />
                  {rank >= 0 && (
                    <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-gold-400 text-[8px] font-bold text-ink-900">
                      {rank + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

function needsOverflowChoice(state: GameState, playerId: PlayerId): boolean {
  const step = state.pending?.step;
  if (step !== 'prefect:choose') return false;
  const p = getPlayer(state, playerId);
  const used = GOODS_ORDER.reduce((n, g) => n + p.goods[g], 0) + p.reserveColonists.land + p.reserveColonists.sea;
  return 12 - used <= 3;
}

/* ═══════════════════════════════════════════════ per-step controls ═ */

function Controls({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const step = state.pending?.step;
  switch (step) {
    case 'architect:move':
      return <ArchitectMove state={state} playerId={playerId} />;
    case 'architect:build':
      return <ArchitectBuild state={state} playerId={playerId} />;
    case 'prefect:choose':
      return <PrefectChoice state={state} />;
    case 'mercator:trade':
      return <MercatorTrade state={state} playerId={playerId} />;
    case 'colonist:choose':
    case 'colonist:recruit':
      return <ColonistChoice state={state} playerId={playerId} />;
    case 'diplomat:choose':
      return <DiplomatChoice state={state} playerId={playerId} />;
    case 'senator:buy':
    case 'consul:buy':
      return <PurchaseControls />;
    case 'tribune:colonist':
      return <TribuneControls state={state} playerId={playerId} />;
    default:
      return <IdleHint />;
  }
}

function IdleHint() {
  return (
    <p className="text-[11.5px] leading-relaxed text-parch-500">
      Every turn is one card. When your hand runs low, the Tribune brings all of them back —
      and pays you for the wait.
    </p>
  );
}

/* ── Architect ──────────────────────────────────────────── */

function ArchitectMove({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const selected = useGame((s) => s.interaction.selectedColonistId);
  const left = state.pending?.movementRemaining ?? 0;
  const total = colonistsOnBoard(state, playerId);

  return (
    <div className="space-y-2.5">
      <StepGauge used={total - left} total={total} label="Movement" />
      <p className="text-[11.5px] leading-relaxed text-parch-400">
        {selected
          ? 'Click a highlighted route to send this colonist there. Occupied routes may be crossed, but not rested on.'
          : 'Click one of your glowing colonists on the map.'}
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={() => dispatch({ type: 'END_MOVEMENT' })}>
          {left > 0 ? 'Done moving' : 'Build houses'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'END_ACTION' })}>
          End turn
        </button>
      </div>
    </div>
  );
}

function ArchitectBuild({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const options = buildOptions(state, playerId);
  const canBuild = options.filter((o) => o.affordable);

  return (
    <div className="space-y-2.5">
      {options.length === 0 ? (
        <p className="text-[11.5px] text-parch-400">
          No colonist of yours stands beside a city you could settle.
        </p>
      ) : (
        <p className="text-[11.5px] leading-relaxed text-parch-400">
          {canBuild.length} of {options.length} nearby cit{options.length === 1 ? 'y is' : 'ies are'}{' '}
          within your means. Click a glowing city to raise a house.
        </p>
      )}
      <button type="button" className="btn btn-primary w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
        Finish action
      </button>
    </div>
  );
}

/* ── Prefect ────────────────────────────────────────────── */

function PrefectChoice({ state }: { state: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const preference = useGame((s) => s.interaction.goodsPreference);
  const map = stateMap(state);
  const active = map.provinces.filter((p) => state.bonusMarkers[p.id]?.active);
  const cash = map.provinces.reduce((sum, p) => {
    const m = state.bonusMarkers[p.id];
    return m && !m.active ? sum + BONUS_MARKER_COIN_VALUES[m.good] : sum;
  }, 0);

  return (
    <div className="space-y-2">
      <p className="text-[11.5px] leading-relaxed text-parch-400">
        {active.length > 0
          ? 'Click a glowing province on the map, or choose one below. Every house there produces — including your rivals’.'
          : 'No province is ready to produce. Call them all back in for coin.'}
      </p>

      {active.length > 0 && (
        <div className="scroll-slim max-h-[104px] space-y-1 overflow-y-auto pr-1">
          {active.map((p) => {
            const marker = state.bonusMarkers[p.id]!;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => dispatch({ type: 'PREFECT_PRODUCE', provinceId: p.id, goodsPreference: preference })}
                className="flex w-full items-center gap-2 rounded-[3px] px-2 py-1 text-left transition hover:bg-gold-500/15"
                style={{ background: 'rgb(255 255 255 / .05)' }}
              >
                <GoodIcon good={marker.good} size={16} />
                <span className="text-[12px] text-parch-200">{p.name}</span>
                <span className="ml-auto text-[10px] text-parch-500">
                  +1 {goodMeta(marker.good).name.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button type="button" className="btn btn-secondary w-full" onClick={() => dispatch({ type: 'PREFECT_CASH' })}>
        <span className="inline-flex items-center gap-1.5">
          <CoinIcon size={14} /> Take the cash bonus — {cash}₴
        </span>
      </button>
    </div>
  );
}

/* ── Mercator ───────────────────────────────────────────── */

function MercatorTrade({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const player = getPlayer(state, playerId);
  const trades = state.pending?.trades ?? [];
  const usedTypes = new Set(trades.map((t) => t.good));
  const [amounts, setAmounts] = useState<Partial<Record<Good, number>>>({});

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {GOODS_ORDER.map((good) => {
          const already = trades.find((t) => t.good === good);
          const lockedOut = !usedTypes.has(good) && usedTypes.size >= 2;
          const maxBuy = maxTradeQuantity(player, good, 'buy');
          const maxSell = maxTradeQuantity(player, good, 'sell');
          const qty = amounts[good] ?? 1;

          return (
            <div
              key={good}
              className="flex items-center gap-1.5 rounded-[3px] px-1.5 py-1"
              style={{
                background: lockedOut ? 'rgb(0 0 0 / .2)' : 'rgb(255 255 255 / .05)',
                opacity: lockedOut ? 0.4 : 1,
              }}
            >
              <GoodIcon good={good} size={17} />
              <span className="w-[26px] text-[11px] tabular-nums text-parch-300">
                {player.goods[good]}
              </span>
              <span className="w-[22px] text-[10px] tabular-nums text-parch-500">
                {goodMeta(good).value}₴
              </span>

              <input
                type="number"
                min={1}
                max={Math.max(maxBuy, maxSell, 1)}
                value={qty}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, [good]: Math.max(1, Number(e.target.value) || 1) }))
                }
                disabled={lockedOut}
                className="w-11 rounded-[2px] bg-black/40 px-1 py-[1px] text-center text-[11px] tabular-nums text-parch-100 outline-none"
                style={{ border: '1px solid rgb(184 145 47 / .3)' }}
              />

              <TradeButton
                label="Buy"
                disabled={lockedOut || (already?.direction === 'sell') || !quoteTrade(player, good, 'buy', qty).ok}
                onClick={() => dispatch({ type: 'TRADE', good, direction: 'buy', quantity: qty })}
                title={`Buy ${qty} for ${qty * goodMeta(good).value}₴`}
              />
              <TradeButton
                label="Sell"
                disabled={lockedOut || (already?.direction === 'buy') || !quoteTrade(player, good, 'sell', qty).ok}
                onClick={() => dispatch({ type: 'TRADE', good, direction: 'sell', quantity: qty })}
                title={`Sell ${qty} for ${qty * goodMeta(good).value}₴`}
              />
            </div>
          );
        })}
      </div>

      <button type="button" className="btn btn-primary w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
        Finish trading
      </button>
    </div>
  );
}

function TradeButton({
  label,
  disabled,
  onClick,
  title,
}: {
  label: string;
  disabled: boolean;
  onClick(): void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-[2px] px-1.5 py-[2px] text-[9.5px] uppercase tracking-[0.1em] transition disabled:opacity-30"
      style={{
        background: disabled ? 'rgb(255 255 255 / .05)' : 'linear-gradient(180deg,#4a443a,#34302a)',
        color: disabled ? 'var(--color-parch-500)' : 'var(--color-parch-100)',
        border: '1px solid rgb(24 20 15 / .6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

/* ── Colonist ───────────────────────────────────────────── */

function ColonistChoice({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const recruitType = useGame((s) => s.interaction.recruitType);
  const setInteraction = useGame((s) => s.setInteraction);
  const started = state.pending?.step === 'colonist:recruit';
  const money = COLONIST_MONEY_BASE + colonistsOnBoard(state, playerId);
  const player = getPlayer(state, playerId);
  const canPay = player.goods.food >= 1 && player.goods.tool >= 1;

  return (
    <div className="space-y-2.5">
      <div>
        <div className="t-label mb-1 text-[7.5px] text-parch-400">Raise which kind?</div>
        <div className="flex gap-1.5">
          {(['land', 'sea'] as ColonistType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setInteraction({ recruitType: t })}
              disabled={player.reserveColonists[t] === 0}
              className="btn flex-1 disabled:opacity-35"
              style={{
                background:
                  recruitType === t
                    ? 'linear-gradient(180deg,#e6cd86,#cfae52 48%,#a9862a)'
                    : 'linear-gradient(180deg,#4a443a,#34302a)',
                color: recruitType === t ? '#2a2010' : 'var(--color-parch-100)',
              }}
            >
              {t === 'land' ? 'Colonist' : 'Ship'} ({player.reserveColonists[t]})
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-parch-400">
        {canPay ? (
          <>
            Click Roma or one of your own cities. Each costs{' '}
            <span className="inline-flex translate-y-[3px] gap-1">
              <GoodIcon good="food" size={14} />
              <GoodIcon good="tool" size={14} />
            </span>
            .
          </>
        ) : (
          'You lack the food and tools to raise anyone.'
        )}
      </p>

      {!started ? (
        <button type="button" className="btn btn-secondary w-full" onClick={() => dispatch({ type: 'COLONIST_MONEY' })}>
          <span className="inline-flex items-center gap-1.5">
            <CoinIcon size={14} /> Take {money}₴ instead
          </span>
        </button>
      ) : (
        <button type="button" className="btn btn-primary w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
          Finish action
        </button>
      )}
    </div>
  );
}

/* ── Diplomat ───────────────────────────────────────────── */

function DiplomatChoice({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const targets = diplomatTargets(state, playerId);

  return (
    <div className="space-y-2">
      {targets.length === 0 ? (
        <p className="text-[11.5px] leading-relaxed text-parch-400">
          Nothing can be copied — no rival has a card showing that a Legatus may take up.
        </p>
      ) : (
        <div className="space-y-1">
          {targets.map((id) => {
            const top = state.players[id]!.discard.at(-1)!;
            const def = getCardDef(state.cards[top]!.defId);
            return (
              <button
                key={id}
                type="button"
                onClick={() => dispatch({ type: 'DIPLOMAT_COPY', targetPlayerId: id })}
                className="flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-left transition hover:bg-gold-500/15"
                style={{ background: 'rgb(255 255 255 / .05)' }}
              >
                <GodIcon god={def.god} size={16} tone="#d4b558" />
                <span className="text-[12px] text-parch-200">{def.title}</span>
                <span className="ml-auto text-[10px] text-parch-500">{state.players[id]!.name}</span>
              </button>
            );
          })}
        </div>
      )}
      <button type="button" className="btn btn-ghost w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
        {targets.length === 0 ? 'End turn' : 'Copy nothing'}
      </button>
    </div>
  );
}

/* ── Senator / Consul ───────────────────────────────────── */

function PurchaseControls() {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-2">
      <p className="text-[11.5px] leading-relaxed text-parch-400">
        Click a card in the forum. Wildcards (<b className="text-parch-200">?</b>) are paid with the
        cheapest good you can spare.
      </p>
      <button type="button" className="btn btn-primary w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
        Finish buying
      </button>
    </div>
  );
}

/* ── Tribune ────────────────────────────────────────────── */

function TribuneControls({ state, playerId }: { state: GameState; playerId: PlayerId }) {
  const dispatch = useGame((s) => s.dispatch);
  const player = getPlayer(state, playerId);
  const canPay = player.goods.food >= 1 && player.goods.tool >= 1;

  return (
    <div className="space-y-2.5">
      <p className="text-[11.5px] leading-relaxed text-parch-400">
        Your cards are back in hand. You may also raise one colonist in Roma for{' '}
        <span className="inline-flex translate-y-[3px] gap-1">
          <GoodIcon good="food" size={14} />
          <GoodIcon good="tool" size={14} />
        </span>
        .
      </p>
      <div className="flex gap-1.5">
        {(['land', 'sea'] as ColonistType[]).map((t) => (
          <button
            key={t}
            type="button"
            className="btn btn-secondary flex-1 disabled:opacity-35"
            disabled={!canPay || player.reserveColonists[t] === 0}
            onClick={() => dispatch({ type: 'TRIBUNE_COLONIST', colonistType: t })}
          >
            {t === 'land' ? 'Colonist' : 'Ship'} ({player.reserveColonists[t]})
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={() => dispatch({ type: 'END_ACTION' })}>
        Finish action
      </button>
    </div>
  );
}

/* ── shared bits ────────────────────────────────────────── */

function StepGauge({ used, total, label }: { used: number; total: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="t-label text-[7.5px] text-parch-400">{label}</span>
        <span className="text-[11px] tabular-nums text-parch-200">
          {total - used} of {total} left
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: Math.max(total, 1) }, (_, i) => (
          <div
            key={i}
            className="h-[6px] flex-1 rounded-full"
            style={{
              background:
                i < total - used
                  ? 'linear-gradient(180deg,#e6cd86,#b8912f)'
                  : 'rgb(255 255 255 / .1)',
              boxShadow: i < total - used ? '0 0 6px rgb(212 181 88 / .5)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
