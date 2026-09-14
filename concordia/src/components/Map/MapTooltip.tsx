/**
 * The board's hover tooltips: city, province, route, colonist and house.
 *
 * Rendered as an HTML overlay rather than SVG so the type stays crisp and
 * selectable-looking at any zoom, positioned from the same viewport transform
 * the board uses.
 */

import { useMemo } from 'react';
import { getMap } from '../../game/data/maps';
import { goodMeta } from '../../game/data/goods';
import { BONUS_MARKER_COIN_VALUES, BUILD_COIN_COST, buildGoodsCost } from '../../game/data/ruleConstants';
import { mapIndex } from '../../game/engine/rules';
import { useGame } from '../../store/game';
import { GoodIcon } from '../Goods/GoodIcon';
import { PLAYER_PALETTE } from '../ui/Icons';
import type { Viewport } from './geometry';

export function MapTooltip({ viewport }: { viewport: Viewport }) {
  const game = useGame((s) => s.game);
  const { hoveredCity, hoveredRoute, hoveredProvince } = useGame((s) => s.interaction);

  const content = useMemo(() => {
    if (!game) return null;
    const map = getMap(game.mapId);
    const idx = mapIndex(game.mapId);

    if (hoveredCity) {
      const city = idx.cityById[hoveredCity];
      if (!city) return null;
      const good = game.cityGoods[hoveredCity];
      const owners = game.houses[hoveredCity] ?? [];
      const province = map.provinces.find((p) => p.id === city.provinceId);
      const nextCost = good
        ? { coins: BUILD_COIN_COST[good] * (owners.length + 1), goods: buildGoodsCost(good) }
        : null;

      return {
        x: city.x,
        y: city.y - 34,
        node: (
          <>
            <Title>{city.name}</Title>
            <Row label="Province">{province?.name ?? 'Capital of the Republic'}</Row>
            {good ? (
              <Row label="Produces">
                <span className="inline-flex items-center gap-1.5">
                  <GoodIcon good={good} size={15} />
                  {goodMeta(good).name}
                  <span className="text-parch-400">· {goodMeta(good).value}₴</span>
                </span>
              </Row>
            ) : (
              <Row label="Produces">Nothing — no house may be raised here</Row>
            )}
            <Row label="Houses">
              {owners.length === 0 ? (
                <span className="text-parch-400">None yet</span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {owners.map((id, i) => (
                    <span
                      key={i}
                      className="inline-block h-3 w-3 rounded-[2px]"
                      style={{
                        background: PLAYER_PALETTE[game.players[id]!.color].base,
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.5)',
                      }}
                      title={game.players[id]!.name}
                    />
                  ))}
                </span>
              )}
            </Row>
            {nextCost && (
              <Row label="Next house">
                <span className="inline-flex items-center gap-1.5">
                  {nextCost.goods.map((g, i) => (
                    <GoodIcon key={i} good={g} size={14} />
                  ))}
                  <span className="text-gold-300">{nextCost.coins}₴</span>
                  {owners.length > 0 && (
                    <span className="text-parch-400">(×{owners.length + 1})</span>
                  )}
                </span>
              </Row>
            )}
          </>
        ),
      };
    }

    if (hoveredProvince) {
      const province = map.provinces.find((p) => p.id === hoveredProvince);
      if (!province) return null;
      const marker = game.bonusMarkers[province.id];
      const pts = province.cityIds.map((id) => idx.cityById[id]!);
      const x = pts.reduce((s, c) => s + c.x, 0) / pts.length;
      const y = pts.reduce((s, c) => s + c.y, 0) / pts.length;
      return {
        x,
        y: y - 70,
        node: (
          <>
            <Title>{province.name}</Title>
            <Row label="Cities">{province.cityIds.map((id) => idx.cityById[id]!.name).join(', ')}</Row>
            {marker && (
              <Row label="Bonus marker">
                {marker.active ? (
                  <span className="inline-flex items-center gap-1.5">
                    <GoodIcon good={marker.good} size={15} />
                    ready — the Prefect takes 1 {goodMeta(marker.good).name.toLowerCase()}
                  </span>
                ) : (
                  <span className="text-parch-400">
                    spent — worth {BONUS_MARKER_COIN_VALUES[marker.good]}₴ in the cash bonus
                  </span>
                )}
              </Row>
            )}
          </>
        ),
      };
    }

    if (hoveredRoute) {
      const route = idx.routeById[hoveredRoute];
      if (!route) return null;
      const a = idx.cityById[route.from]!;
      const b = idx.cityById[route.to]!;
      const occupant = game.colonists.find(
        (c) => c.location.kind === 'route' && c.location.routeId === hoveredRoute,
      );
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2 - 34,
        node: (
          <>
            <Title>
              {a.name} — {b.name}
            </Title>
            <Row label="Type">
              {route.type === 'land' ? 'Roman road · land colonists' : 'Sea lane · ships'}
            </Row>
            <Row label="Occupied">
              {occupant ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: PLAYER_PALETTE[game.players[occupant.owner]!.color].base }}
                  />
                  {game.players[occupant.owner]!.name} — no one else may rest here
                </span>
              ) : (
                <span className="text-parch-400">Clear</span>
              )}
            </Row>
          </>
        ),
      };
    }

    return null;
  }, [game, hoveredCity, hoveredProvince, hoveredRoute]);

  if (!content) return null;
  const left = viewport.x + content.x * viewport.scale;
  const top = viewport.y + content.y * viewport.scale;

  return (
    <div
      className="tooltip-panel pointer-events-none absolute z-30 min-w-[210px] max-w-[320px] px-3 py-2 text-[13px]"
      style={{ left, top, transform: 'translate(-50%, -100%)' }}
    >
      {content.node}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="t-caps mb-1 text-[13px] tracking-[0.16em] text-gold-300">{children}</div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[1px] leading-snug">
      <span className="w-[76px] shrink-0 text-[10.5px] uppercase tracking-[0.14em] text-parch-500">
        {label}
      </span>
      <span className="flex-1 text-parch-100">{children}</span>
    </div>
  );
}
