/**
 * The treasury tray — purse, storehouse, pieces and your pantheon.
 *
 * Closed, the handle still carries the two numbers you check constantly: coin
 * and how much room is left in the storehouse. It opens itself whenever the
 * rules put you in front of your own goods — a Mercator trade, or a production
 * that is about to overflow.
 */

import { useState } from 'react';
import { GOD_NAME } from '../../game/data/cards';
import { GOODS_ORDER, goodMeta } from '../../game/data/goods';
import { HOUSES_PER_PLAYER, MAX_COLONISTS_ON_BOARD } from '../../game/data/ruleConstants';
import { citiesOf, colonistsOf, countByGod, freeStorage, ownedCards, provincesOf } from '../../game/engine/rules';
import type { GameState, God, PlayerColorId, PlayerId } from '../../game/engine/types';
import { GoodIcon } from '../Goods/GoodIcon';
import { ColonistIcon, CoinIcon, GodIcon, HouseIcon, PLAYER_PALETTE, ShipIcon } from '../ui/Icons';
import { Drawer, HandleStat } from '../ui/Drawer';
import { Storehouse } from './Storehouse';

const GODS: God[] = ['vesta', 'jupiter', 'saturnus', 'mercurius', 'mars', 'minerva'];

export function TreasuryDrawer({
  state,
  playerId,
  bottomInset,
}: {
  state: GameState;
  playerId: PlayerId;
}& { bottomInset: number }) {
  const [open, setOpen] = useState(false);
  const player = state.players[playerId]!;
  const palette = PLAYER_PALETTE[player.color as PlayerColorId];
  const room = freeStorage(player);

  const step = state.pending?.step;
  const wantsStorehouse = step === 'mercator:trade' || (step === 'prefect:choose' && room <= 3);

  const colonists = colonistsOf(state, playerId);
  const land = colonists.filter((c) => c.type === 'land').length;
  const sea = colonists.filter((c) => c.type === 'sea').length;
  const gods = countByGod(ownedCards(state, playerId));

  return (
    <Drawer
      edge="right"
      open={open}
      onToggle={setOpen}
      demand={wantsStorehouse}
      size={330}
      inset={bottomInset}
      handle={
        <span className="flex flex-col items-center gap-3 py-1" style={{ writingMode: 'horizontal-tb' }}>
          <span className="t-caps text-[9px] tracking-[0.2em] text-gold-400">Store</span>
          <HandleStat icon={<CoinIcon size={16} />} value={player.money} />
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: room === 0 ? '#c9614f' : 'var(--color-parch-400)' }}
            title={`${room} free storage spaces`}
          >
            {12 - room}/12
          </span>
        </span>
      }
    >
      <div className="scroll-slim flex h-full flex-col gap-3 overflow-y-auto p-3">
        {/* ── identity ─────────────────────────────────── */}
        <div className="surface-parchment frame-stone relative rounded-md p-3">
          <div
            className="absolute inset-y-0 left-0 w-[4px] rounded-l-md"
            style={{ background: `linear-gradient(180deg, ${palette.light}, ${palette.base} 45%, ${palette.dark})` }}
          />
          <div className="ml-1.5">
            <div className="t-display text-[18px] leading-tight text-ink-800">{player.name}</div>
            <div className="t-label mt-[1px]">{palette.name} house</div>

            <div
              className="mt-2 flex items-center gap-2 rounded-[4px] px-2 py-1.5"
              style={{
                background: 'linear-gradient(180deg, rgb(201 165 60 / .22), rgb(201 165 60 / .08))',
                boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .5)',
              }}
            >
              <CoinIcon size={24} />
              <span className="t-display text-[24px] leading-none tabular-nums text-ink-800">
                {player.money}
              </span>
              <span className="t-label ml-auto">Sestertii</span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Counter icon={<ColonistIcon color={player.color as PlayerColorId} size={20} />} value={land} max={MAX_COLONISTS_ON_BOARD / 2} label="Land" />
              <Counter icon={<ShipIcon color={player.color as PlayerColorId} size={22} />} value={sea} max={MAX_COLONISTS_ON_BOARD / 2} label="Sea" />
              <Counter icon={<HouseIcon color={player.color as PlayerColorId} size={20} />} value={HOUSES_PER_PLAYER - player.housesRemaining} max={HOUSES_PER_PLAYER} label="Built" />
            </div>
          </div>
        </div>

        {/* ── storehouse ───────────────────────────────── */}
        <div className="surface-parchment frame-stone rounded-md p-3">
          <Storehouse player={player} />
        </div>

        {/* ── network ──────────────────────────────────── */}
        <div className="surface-parchment frame-stone rounded-md p-3">
          <div className="t-label mb-1.5">Your network</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-ink-700">
            <Line label="Cities" value={citiesOf(state, playerId).length} />
            <Line label="Provinces" value={provincesOf(state, playerId).length} />
            <Line label="Colonists" value={colonists.length} />
            <Line label="Houses left" value={player.housesRemaining} />
          </div>

          <div className="divider-gold my-2" />

          <div className="t-label mb-1.5">Your pantheon</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-[3px]">
            {GODS.map((god) => (
              <div
                key={god}
                className="flex items-center gap-1.5"
                style={{ opacity: gods[god] ? 1 : 0.32 }}
                title={`${gods[god]} card${gods[god] === 1 ? '' : 's'} of ${GOD_NAME[god]}`}
              >
                <GodIcon god={god} size={15} tone="#8a6a17" />
                <span className="t-caps text-[9.5px] text-ink-600">{GOD_NAME[god]}</span>
                <span className="ml-auto text-[12px] font-semibold tabular-nums text-ink-700">{gods[god]}</span>
              </div>
            ))}
          </div>

          {state.praefectusMagnus === playerId && (
            <div className="t-caps mt-2 text-[9px] text-gold-600" title="Doubles your Prefect production bonus">
              ✦ You hold the Praefectus Magnus
            </div>
          )}
        </div>

        {/* ── prices ───────────────────────────────────── */}
        <div className="surface-parchment frame-stone rounded-md p-3">
          <div className="t-label mb-1.5">Bank prices — buy and sell alike</div>
          <div className="space-y-1">
            {GOODS_ORDER.map((g) => (
              <div key={g} className="flex items-center gap-2 text-[12px]">
                <GoodIcon good={g} size={17} />
                <span className="text-ink-700">{goodMeta(g).name}</span>
                <span className="ml-auto tabular-nums text-ink-600">{goodMeta(g).value}₴</span>
                <span className="w-8 text-right tabular-nums font-semibold text-ink-800">
                  ×{player.goods[g]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-500">{label}</span>
      <b className="ml-auto tabular-nums text-ink-800">{value}</b>
    </div>
  );
}

function Counter({
  icon,
  value,
  max,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-[4px] py-1"
      style={{ background: 'rgb(90 68 38 / .09)', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .4)' }}
      title={`${label}: ${value} of ${max}`}
    >
      {icon}
      <span className="mt-[1px] text-[12px] font-semibold leading-none tabular-nums text-ink-800">
        {value}
        <span className="text-[9px] text-ink-500">/{max}</span>
      </span>
      <span className="t-label mt-[1px] text-[7.5px]">{label}</span>
    </div>
  );
}
