/**
 * The build confirmation.
 *
 * A compact plate showing exactly what the house costs, what the player holds,
 * and why the price is what it is (RULES 8.2–8.4).
 */

import { mapIndex, buildCost, getPlayer } from '../../game/engine/rules';
import { goodMeta } from '../../game/data/goods';
import { useGame } from '../../store/game';
import { GoodIcon } from '../Goods/GoodIcon';
import { CoinIcon, HouseIcon, PLAYER_PALETTE } from '../ui/Icons';
import { Modal } from './Modal';
import type { PlayerColorId } from '../../game/engine/types';

export function BuildConfirm() {
  const game = useGame((s) => s.game);
  const cityId = useGame((s) => s.interaction.pendingBuild);
  const setInteraction = useGame((s) => s.setInteraction);
  const dispatch = useGame((s) => s.dispatch);

  if (!game || !cityId) return <Modal open={false} title="" onClose={() => undefined} children={null} />;

  const idx = mapIndex(game.mapId);
  const city = idx.cityById[cityId];
  const good = game.cityGoods[cityId];
  const me = game.currentPlayer;
  const player = getPlayer(game, me);
  const existing = game.houses[cityId] ?? [];

  if (!city || !good) return null;
  const cost = buildCost(good, existing.length);
  const province = idx.map.provinces.find((p) => p.id === city.provinceId);
  const affordable =
    player.money >= cost.coins &&
    cost.goods.every((g) => player.goods[g] >= cost.goods.filter((x) => x === g).length);

  const close = () => setInteraction({ pendingBuild: null });

  return (
    <Modal
      open
      title={`Raise a house in ${city.name}`}
      subtitle={`${province?.name ?? ''} · produces ${goodMeta(good).name.toLowerCase()}`}
      width={440}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={close}>
            Not yet
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!affordable}
            onClick={() => {
              dispatch({ type: 'BUILD_HOUSE', cityId });
              close();
            }}
          >
            Build
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3 py-1">
          <HouseIcon color={player.color as PlayerColorId} size={44} />
          {existing.length > 0 && (
            <div className="text-[12px] text-ink-600">
              <div>
                {existing.length} house{existing.length === 1 ? '' : 's'} already stand{existing.length === 1 ? 's' : ''} here
              </div>
              <div className="flex gap-1 pt-1">
                {existing.map((id, i) => (
                  <span
                    key={i}
                    className="inline-block h-3.5 w-3.5 rounded-[2px]"
                    style={{
                      background: PLAYER_PALETTE[game.players[id]!.color as PlayerColorId].base,
                      boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / .5)',
                    }}
                    title={game.players[id]!.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <CostRow
          label="Goods"
          detail={good === 'brick' ? 'A brick city is paid for in food' : `1 brick plus the city’s own ${good}`}
        >
          {cost.goods.map((g, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <GoodIcon good={g} size={22} />
              <span
                className="text-[12px] tabular-nums"
                style={{ color: player.goods[g] > 0 ? 'var(--color-ink-700)' : '#a63a2f' }}
              >
                you hold {player.goods[g]}
              </span>
            </span>
          ))}
        </CostRow>

        <CostRow
          label="Sestertii"
          detail={
            cost.multiplier > 1
              ? `${cost.baseCoins}₴ base × ${cost.multiplier} (this will be the ${ordinal(cost.multiplier)} house here)`
              : `${cost.baseCoins}₴ for a ${good} city`
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <CoinIcon size={22} />
            <span className="t-display text-[20px] tabular-nums text-ink-800">{cost.coins}</span>
            <span
              className="text-[12px] tabular-nums"
              style={{ color: player.money >= cost.coins ? 'var(--color-ink-600)' : '#a63a2f' }}
            >
              of your {player.money}
            </span>
          </span>
        </CostRow>

        {!affordable && (
          <p className="rounded border border-terracotta-500/40 bg-terracotta-500/10 px-3 py-2 text-[12px] text-ink-700">
            You cannot pay for this house yet.
          </p>
        )}
      </div>
    </Modal>
  );
}

function CostRow({
  label,
  detail,
  children,
}: {
  label: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[4px] px-3 py-2"
      style={{ background: 'rgb(90 68 38 / .09)', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .45)' }}
    >
      <div className="t-label mb-1">{label}</div>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
      <div className="mt-1 text-[11.5px] italic text-ink-500">{detail}</div>
    </div>
  );
}

function ordinal(n: number): string {
  const names = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  return names[n] ?? `${n}th`;
}
