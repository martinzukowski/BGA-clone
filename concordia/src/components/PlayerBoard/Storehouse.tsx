/**
 * The storehouse — twelve slots, each holding one unit of goods or one colonist
 * still waiting to be sent out (RULES §10).
 *
 * The price list is printed along the roof, exactly where a player would look
 * for it, and the slot grid is the honest picture of the capacity limit: when
 * it is full, it visibly *is* full.
 */

import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GOODS_ORDER, goodMeta } from '../../game/data/goods';
import { STOREHOUSE_CAPACITY } from '../../game/data/ruleConstants';
import { freeStorage } from '../../game/engine/rules';
import type { Good, PlayerColorId, PlayerState } from '../../game/engine/types';
import { GoodIcon } from '../Goods/GoodIcon';
import { ColonistIcon, ShipIcon } from '../ui/Icons';

type Slot =
  | { kind: 'good'; good: Good; key: string }
  | { kind: 'colonist'; type: 'land' | 'sea'; key: string }
  | { kind: 'empty'; key: string };

export const Storehouse = memo(function Storehouse({
  player,
  compact = false,
}: {
  player: PlayerState;
  compact?: boolean;
}) {
  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = [];
    for (const good of GOODS_ORDER) {
      for (let i = 0; i < player.goods[good]; i++) {
        out.push({ kind: 'good', good, key: `${good}-${i}` });
      }
    }
    for (let i = 0; i < player.reserveColonists.land; i++) {
      out.push({ kind: 'colonist', type: 'land', key: `res-land-${i}` });
    }
    for (let i = 0; i < player.reserveColonists.sea; i++) {
      out.push({ kind: 'colonist', type: 'sea', key: `res-sea-${i}` });
    }
    while (out.length < STOREHOUSE_CAPACITY) out.push({ kind: 'empty', key: `empty-${out.length}` });
    return out.slice(0, STOREHOUSE_CAPACITY);
  }, [player.goods, player.reserveColonists]);

  const room = freeStorage(player);
  const cell = compact ? 29 : 38;

  return (
    <div className="select-none">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="t-label">Storehouse</span>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: room === 0 ? '#a63a2f' : 'var(--color-ink-500)' }}
        >
          {room === 0 ? 'FULL' : `${room} free`}
        </span>
      </div>

      {/* Price list along the roof — kept at every size, because it is what a
          player looks at before deciding whether to build or to sell. */}
      <div
        className={`flex items-center justify-between rounded-t-[4px] px-2 ${compact ? 'mb-1 py-0.5' : 'mb-1.5 py-1'}`}
        style={{
          background: 'linear-gradient(180deg, rgb(90 68 38 / .18), rgb(90 68 38 / .06))',
          borderBottom: '1px solid rgb(184 145 47 / .4)',
        }}
      >
        {GOODS_ORDER.map((g) => (
          <span key={g} className="flex items-center gap-1" title={`${goodMeta(g).name} — ${goodMeta(g).value}₴`}>
            <GoodIcon good={g} size={compact ? 13 : 15} />
            <span className="text-[11px] font-semibold tabular-nums text-ink-600">
              {goodMeta(g).value}
            </span>
          </span>
        ))}
      </div>

      <div
        className="grid gap-[3px] rounded-[4px] p-[4px]"
        style={{
          gridTemplateColumns: `repeat(6, ${cell}px)`,
          background: 'linear-gradient(180deg, rgb(70 52 28 / .22), rgb(70 52 28 / .1))',
          boxShadow: 'inset 0 1px 3px rgb(50 36 18 / .45)',
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {slots.map((slot) => (
            <motion.div
              key={slot.key}
              layout
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              className="grid place-items-center rounded-[3px]"
              style={{
                width: cell,
                height: cell,
                background:
                  slot.kind === 'empty'
                    ? 'linear-gradient(180deg, rgb(110 86 50 / .3), rgb(80 62 36 / .16))'
                    : 'linear-gradient(180deg, rgb(255 250 235 / .55), rgb(160 128 78 / .18))',
                boxShadow:
                  slot.kind === 'empty'
                    ? 'inset 0 2px 4px rgb(60 44 22 / .5), inset 0 -1px 0 rgb(255 255 255 / .22)'
                    : 'inset 0 1px 0 rgb(255 255 255 / .55), inset 0 -1px 2px rgb(90 68 38 / .3)',
              }}
              title={
                slot.kind === 'good'
                  ? goodMeta(slot.good).name
                  : slot.kind === 'colonist'
                    ? `${slot.type === 'sea' ? 'Ship' : 'Colonist'} awaiting orders`
                    : 'Empty'
              }
            >
              {slot.kind === 'good' && <GoodIcon good={slot.good} size={cell - 11} inSlot />}
              {slot.kind === 'colonist' && (
                <span style={{ opacity: 0.62 }}>
                  {slot.type === 'sea' ? (
                    <ShipIcon color={player.color as PlayerColorId} size={cell - 8} />
                  ) : (
                    <ColonistIcon color={player.color as PlayerColorId} size={cell - 11} />
                  )}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
