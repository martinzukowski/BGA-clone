/**
 * The board.
 *
 * One SVG in a pan/zoom viewport. Everything clickable is derived from the
 * engine's own legality queries, so the highlights can never disagree with the
 * rules; the components below only decide how that looks.
 */

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CityNode } from '../City/CityNode';
import { ColonistPiece } from '../Colonist/ColonistPiece';
import { RouteLine } from '../Route/RouteLine';
import { MapDefs } from './MapDefs';
import {
  cityMap,
  fitViewport,
  COAST_WIDTH,
  pointOnRoute,
  routeGeometry,
  tangentOnRoute,
  zoomAt,
  type Point,
  type RouteGeometry,
  type Viewport,
} from './geometry';
import { buildLandscape, type Landscape } from './landscape';
import { cityVariant, PROVINCE_PALETTE, provinceTint, type TerrainKind } from './terrain';
import { getMap } from '../../game/data/maps';
import { BONUS_MARKER_COIN_VALUES } from '../../game/data/ruleConstants';
import {
  buildOptions,
  destinationsFor,
  movableColonists,
  recruitCities,
} from '../../game/engine/rules';
import { useGame } from '../../store/game';
import { speedFactor, useSettings } from '../../store/settings';
import { GoodIcon } from '../Goods/GoodIcon';
import { CoinIcon } from '../ui/Icons';
import { MapTooltip } from './MapTooltip';
import type { MapDefinition, PlayerColorId } from '../../game/engine/types';

/** How far the province colour wash reaches from a city, and either side of a road. */
const WASH_CITY_RADIUS = 146;
const WASH_ROAD_WIDTH = 236;

export function Board() {
  const game = useGame((s) => s.game);
  const interaction = useGame((s) => s.interaction);
  const setInteraction = useGame((s) => s.setInteraction);
  const dispatch = useGame((s) => s.dispatch);
  const busy = useGame((s) => s.busy);
  const speed = useSettings((s) => s.animationSpeed);
  const showHighlights = useSettings((s) => s.showLegalHighlights);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  const mapId = game?.mapId;
  const map = useMemo(() => (mapId ? getMap(mapId) : null), [mapId]);
  const cities = useMemo(() => (map ? cityMap(map) : {}), [map]);
  const landscape = useMemo(() => (map ? buildLandscape(map) : null), [map]);
  const geometries = useMemo(() => {
    if (!map) return {} as Record<string, RouteGeometry>;
    const out: Record<string, RouteGeometry> = {};
    for (const route of map.routes) out[route.id] = routeGeometry(route, cities);
    return out;
  }, [map, cities]);

  /* ── camera ─────────────────────────────────────────────── */

  const fit = useCallback(() => {
    if (!map || !hostRef.current) return;
    const rect = hostRef.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    setViewport(fitViewport(map, rect.width, rect.height));
  }, [map]);

  useLayoutEffect(() => {
    fit();
  }, [fit]);

  /**
   * Re-fit only when the panel's size really changes. Firing on every observer
   * callback would fight the user for the camera: each fit sets state, the
   * re-render nudges layout, the observer fires again, and the map snaps back
   * to its default zoom the instant anyone tries to pan.
   */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let last = { w: 0, h: 0 };
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      if (Math.abs(rect.width - last.w) < 2 && Math.abs(rect.height - last.h) < 2) return;
      last = { w: rect.width, h: rect.height };
      fit();
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [fit]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14;
    setViewport((v) => zoomAt(v, e.clientX - rect.left, e.clientY - rect.top, factor));
  }, []);

  /**
   * Panning deliberately does *not* use `setPointerCapture`. Capturing the
   * pointer retargets the pointerup, which makes the browser fire the click on
   * the container rather than on the city, route or colonist underneath — so
   * every board click would silently do nothing. Window listeners give the same
   * drag behaviour and leave clicks alone.
   */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      if ((e.target as Element).closest?.('[data-map-ui]')) return;

      const start = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y, moved: false };
      dragRef.current = start;

      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - start.x;
        const dy = ev.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;
        if (!start.moved) return;
        setViewport((v) => ({ ...v, x: start.vx + dx, y: start.vy + dy }));
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        // Cleared after the click has been dispatched, so a click that ended a
        // drag is still ignored by the handlers that check `moved`.
        setTimeout(() => {
          dragRef.current = null;
        }, 0);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [viewport],
  );

  /* ── what is legal right now ───────────────────────────── */

  const me = game?.currentPlayer ?? 0;
  const humanTurn = !!game && game.players[me]?.isHuman && !busy;
  const step = game?.pending?.step ?? null;

  const legal = useMemo(() => {
    const empty = {
      colonists: new Set<string>(),
      routes: new Map<string, string[]>(),
      cities: new Set<string>(),
      provinces: new Set<string>(),
    };
    if (!game || !humanTurn || !showHighlights) return empty;

    if (step === 'architect:move') {
      const movable = new Set(movableColonists(game, me).map((c) => c.id));
      const routes = new Map<string, string[]>();
      if (interaction.selectedColonistId) {
        for (const d of destinationsFor(game, interaction.selectedColonistId)) {
          routes.set(d.routeId, [...d.path]);
        }
      }
      return { ...empty, colonists: movable, routes };
    }
    if (step === 'architect:build') {
      return {
        ...empty,
        cities: new Set(buildOptions(game, me).filter((o) => o.affordable).map((o) => o.cityId)),
      };
    }
    if (step === 'prefect:choose') {
      const provinces = new Set<string>();
      for (const p of getMap(game.mapId).provinces) {
        if (game.bonusMarkers[p.id]?.active) provinces.add(p.id);
      }
      return { ...empty, provinces };
    }
    if (step === 'colonist:choose' || step === 'colonist:recruit') {
      return { ...empty, cities: new Set(recruitCities(game, me)) };
    }
    return empty;
  }, [game, humanTurn, showHighlights, step, me, interaction.selectedColonistId]);

  /* ── clicks ─────────────────────────────────────────────── */

  const clickCity = useCallback(
    (cityId: string) => {
      if (dragRef.current?.moved) return;
      if (!game || !humanTurn) return;
      if (step === 'architect:build' && legal.cities.has(cityId)) {
        setInteraction({ pendingBuild: cityId });
      } else if ((step === 'colonist:choose' || step === 'colonist:recruit') && legal.cities.has(cityId)) {
        dispatch({ type: 'RECRUIT_COLONIST', colonistType: interaction.recruitType, cityId });
      }
    },
    [game, humanTurn, step, legal, setInteraction, dispatch, interaction.recruitType],
  );

  const clickRoute = useCallback(
    (routeId: string) => {
      if (dragRef.current?.moved) return;
      if (!humanTurn || step !== 'architect:move') return;
      const path = legal.routes.get(routeId);
      if (!path || !interaction.selectedColonistId) return;
      dispatch({ type: 'MOVE_COLONIST', colonistId: interaction.selectedColonistId, path });
    },
    [humanTurn, step, legal, interaction.selectedColonistId, dispatch],
  );

  const clickColonist = useCallback(
    (colonistId: string) => {
      if (dragRef.current?.moved) return;
      if (!humanTurn || step !== 'architect:move') return;
      if (!legal.colonists.has(colonistId)) return;
      setInteraction({
        selectedColonistId: interaction.selectedColonistId === colonistId ? null : colonistId,
      });
    },
    [humanTurn, step, legal, interaction.selectedColonistId, setInteraction],
  );

  const clickProvince = useCallback(
    (provinceId: string) => {
      if (dragRef.current?.moved) return;
      if (!humanTurn || step !== 'prefect:choose') return;
      if (!legal.provinces.has(provinceId)) return;
      dispatch({ type: 'PREFECT_PRODUCE', provinceId, goodsPreference: interaction.goodsPreference });
    },
    [humanTurn, step, legal, dispatch, interaction.goodsPreference],
  );

  /* ── piece placement ───────────────────────────────────── */

  const colonistLayout = useMemo(() => {
    if (!game) return [];
    // Several colonists can sit in the capital at once; fan them out so each
    // one stays clickable.
    const byCity = new Map<string, number>();
    return game.colonists.map((c) => {
      let p: Point;
      let angle = 0;
      if (c.location.kind === 'route') {
        const g = geometries[c.location.routeId];
        if (!g) return null;
        p = pointOnRoute(g, 0.5);
        const t = tangentOnRoute(g, 0.5);
        angle = (Math.atan2(t.y, t.x) * 180) / Math.PI;
        if (angle > 90 || angle < -90) angle += 180;
      } else {
        const city = cities[c.location.cityId];
        if (!city) return null;
        const n = byCity.get(city.id) ?? 0;
        byCity.set(city.id, n + 1);
        const ring = Math.floor(n / 6);
        const a = ((n % 6) / 6) * Math.PI * 2 + Math.PI / 6;
        const r = 26 + ring * 15;
        p = { x: city.x + Math.cos(a) * r, y: city.y + Math.sin(a) * r * 0.72 };
      }
      return {
        colonist: c,
        point: p,
        angle,
        color: game.players[c.owner]!.color as PlayerColorId,
      };
    }).filter((v): v is NonNullable<typeof v> => v !== null);
  }, [game, geometries, cities]);

  const moveDuration = useMemo(() => {
    const f = speedFactor(speed);
    return f === 0 ? 1 : Math.round(520 * f);
  }, [speed]);

  const highlightProducing = useMemo(() => {
    const out = new Set<string>();
    if (!game) return out;
    for (const event of useGame.getState().recentEvents) {
      if (event.kind === 'production' && Array.isArray(event.data?.['cityIds'])) {
        for (const id of event.data!['cityIds'] as string[]) out.add(id);
      }
    }
    return out;
  }, [game]);

  if (!game || !map || !landscape) return null;

  /** Cities touched by at least one sea lane — these read as ports. */
  const coastalCityIds = new Set<string>();
  for (const route of map.routes) {
    if (route.type === 'sea') {
      coastalCityIds.add(route.from);
      coastalCityIds.add(route.to);
    }
  }
  const provinceTerrainById = new Map(map.provinces.map((p) => [p.id, p.terrain]));

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: 'grab' }}
      onWheel={onWheel}
      // A card preview belongs to the card the pointer is over. Framer's
      // hover-end does not always fire when a card is re-laid-out underneath
      // the cursor, so touching the board is treated as leaving the card.
      onPointerEnter={() => setInteraction({ inspectingCard: null })}
      onPointerDown={onPointerDown}
    >
      {/* Sized by CSS, not by attributes — writing pixel dimensions back into
          the element is what makes a ResizeObserver chase its own tail. */}
      <svg className="block h-full w-full">
        <MapDefs />

        {/* The inland sea, drawn beyond the map edges so panning never
            reveals a hard border. */}
        <rect width={size.width} height={size.height} fill="url(#seaFill)" />
        <rect width={size.width} height={size.height} fill="url(#seaSwell)" opacity="0.6" />
        <rect width={size.width} height={size.height} fill="#0d2430" opacity="0.14" />

        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          <StaticLand map={map} landscape={landscape} geometries={geometries} />

          {/* ── provinces ──────────────────────────────────── */}
          <g clipPath="url(#landClip)">
            <g mask="url(#washMask)">
              {map.provinces.map((province, i) => {
                const lp = landscape.provinces[i]!;
                // A spent province reads slightly greyer, so a glance at the board
                // tells you where production is still available (RULES 6.2a).
                const active = game.bonusMarkers[province.id]?.active ?? true;
                const isLegal = legal.provinces.has(province.id);
                const hovered = interaction.hoveredProvince === province.id;
                return (
                  <g
                    key={province.id}
                    onMouseEnter={() => setInteraction({ hoveredProvince: province.id })}
                    onMouseLeave={() => setInteraction({ hoveredProvince: null })}
                    onClick={() => clickProvince(province.id)}
                    style={{ cursor: isLegal ? 'pointer' : 'inherit' }}
                  >
                    <path
                      d={lp.path}
                      fill={`url(#prov-${province.id})`}
                      opacity={hovered ? 1 : active ? 0.9 : 0.55}
                      style={{
                        transition: 'opacity 180ms ease, filter 220ms ease',
                        filter: active ? undefined : 'saturate(0.4)',
                      }}
                    />
                    {province.terrain === 'mountain' && <path d={lp.path} fill="url(#hatchMountain)" />}
                    {province.terrain === 'desert' && <path d={lp.path} fill="url(#hatchDesert)" />}
                    {province.terrain === 'inland' && <path d={lp.path} fill="url(#hatchForest)" />}
                    {(province.terrain === 'coast' || province.terrain === 'island') && (
                      <path d={lp.path} fill="url(#hatchCoast)" />
                    )}
                    {isLegal && (
                      <path d={lp.path} fill="#ffe0a0" opacity="0.32" className="legal-glow" pointerEvents="none" />
                    )}
                  </g>
                );
              })}

              {/* Roma belongs to no province; its district is left a warm parchment. */}
              <path d={landscape.capitalPath} fill="#fbf0cf" opacity="0.62" pointerEvents="none" />

              {/* Province borders: a pale halo under a dashed ink line, drawn once per border. */}
              <g fill="none" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none">
                <path d={landscape.borderPath} stroke="#fbf2d8" strokeWidth="7" strokeOpacity="0.5" />
                <path d={landscape.borderPath} stroke="#3f2e12" strokeWidth="2.6" strokeOpacity="0.85" strokeDasharray="11 5 3 5" />
              </g>

              {/* ── terrain decoration ──────────────────────────── */}
              <g pointerEvents="none">
                {landscape.decorations.map((d, i) => (
                  <TerrainGlyph key={i} terrain={d.terrain} x={d.x} y={d.y} scale={d.scale} />
                ))}
              </g>
            </g>
          </g>

          {/* Province names sit outside the coastline mask so they are never
              clipped in half by a stretch of water. */}
          {map.provinces.map((province) => {
            const c =
              province.labelX !== undefined && province.labelY !== undefined
                ? { x: province.labelX, y: province.labelY }
                : landscape.labels.get(province.id)!;
            const hovered = interaction.hoveredProvince === province.id;
            return (
              <text
                key={province.id}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                className="no-select"
                pointerEvents="none"
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 19,
                  letterSpacing: '0.34em',
                  fill: '#5c4a28',
                  opacity: hovered ? 0.85 : 0.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  paintOrder: 'stroke',
                  stroke: 'rgba(247,239,220,0.55)',
                  strokeWidth: 4,
                  strokeLinejoin: 'round',
                  transition: 'opacity 180ms ease',
                }}
              >
                {province.name}
              </text>
            );
          })}

          {/* ── province bonus markers ─────────────────────── */}
          {map.provinces.map((province) => {
            const marker = game.bonusMarkers[province.id];
            if (!marker) return null;
            const c =
              province.labelX !== undefined && province.labelY !== undefined
                ? { x: province.labelX, y: province.labelY }
                : landscape.labels.get(province.id)!;
            return (
              <BonusMarker
                key={province.id}
                x={c.x}
                y={c.y + 24}
                good={marker.good}
                active={marker.active}
              />
            );
          })}

          {/* ── routes ─────────────────────────────────────── */}
          {map.routes.map((route) => {
            const occupied = game.colonists.some(
              (c) => c.location.kind === 'route' && c.location.routeId === route.id,
            );
            const inPath = legal.routes.has(route.id);
            const hovered = interaction.hoveredRoute === route.id;
            return (
              <RouteLine
                key={route.id}
                id={route.id}
                type={route.type}
                geometry={geometries[route.id]!}
                state={
                  inPath ? 'legal' : hovered ? 'hovered' : occupied && step === 'architect:move' ? 'blocked' : 'normal'
                }
                dimmed={legal.routes.size > 0 && !inPath}
                onEnter={() => setInteraction({ hoveredRoute: route.id })}
                onLeave={() => setInteraction({ hoveredRoute: null })}
                onClick={() => clickRoute(route.id)}
              />
            );
          })}

          {/* ── cities ─────────────────────────────────────── */}
          {map.cities.map((city) => {
            const owners = (game.houses[city.id] ?? []).map(
              (id) => game.players[id]!.color as PlayerColorId,
            );
            const isLegal = legal.cities.has(city.id);
            const variant = cityVariant(
              city.id,
              !!city.isCapital,
              coastalCityIds.has(city.id),
              city.provinceId ? provinceTerrainById.get(city.provinceId) : undefined,
            );
            return (
              <CityNode
                key={city.id}
                city={city}
                good={game.cityGoods[city.id]}
                houses={owners}
                variant={variant}
                highlight={
                  highlightProducing.has(city.id)
                    ? 'producing'
                    : interaction.pendingBuild === city.id
                      ? 'selected'
                      : isLegal
                        ? 'legal'
                        : 'none'
                }
                dimmed={legal.cities.size > 0 && !isLegal}
                onEnter={() => setInteraction({ hoveredCity: city.id })}
                onLeave={() => setInteraction({ hoveredCity: null })}
                onClick={() => clickCity(city.id)}
              />
            );
          })}

          {/* ── pieces ─────────────────────────────────────── */}
          <AnimatePresence>
            {colonistLayout.map(({ colonist, point, angle, color }) => (
              <ColonistPiece
                key={colonist.id}
                id={colonist.id}
                type={colonist.type}
                color={color}
                x={point.x}
                y={point.y}
                angle={angle}
                state={
                  interaction.selectedColonistId === colonist.id
                    ? 'selected'
                    : legal.colonists.has(colonist.id)
                      ? 'movable'
                      : 'normal'
                }
                dimmed={legal.colonists.size > 0 && !legal.colonists.has(colonist.id)}
                duration={moveDuration}
                onEnter={() => undefined}
                onLeave={() => undefined}
                onClick={() => clickColonist(colonist.id)}
              />
            ))}
          </AnimatePresence>
        </g>
      </svg>

      <MapControls
        onZoom={(f) => setViewport((v) => zoomAt(v, size.width / 2, size.height / 2, f))}
        onFit={fit}
        scale={viewport.scale}
      />
      <MapTooltip viewport={viewport} />
    </div>
  );
}

/**
 * Everything under the provinces that never changes while a game is played:
 * the sea marks, the shallows, the coast and the parchment itself. Memoised so
 * that panning and zooming — which re-render the board every frame — do not
 * re-diff thousands of path points.
 */
const StaticLand = memo(function StaticLand({
  map,
  landscape,
  geometries,
}: {
  map: MapDefinition;
  landscape: Landscape;
  geometries: Record<string, RouteGeometry>;
}) {
  return (
    <>
    <defs>
      <clipPath id="landClip">
        <path d={landscape.landPath} clipRule="evenodd" />
      </clipPath>

      {/*
        The colour wash is full strength along the road network and thins
        to bare parchment further out, so provinces read as territories
        around their cities rather than as the whole continent painted
        in a dozen flat colours.
      */}
      <mask id="washMask" maskUnits="userSpaceOnUse" x={-800} y={-800} width={map.width + 1600} height={map.height + 1600}>
        <rect x={-800} y={-800} width={map.width + 1600} height={map.height + 1600} fill="black" />
        <g filter="url(#washFade)" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round">
          {map.routes
            .filter((route) => route.type === 'land')
            .map((route) => (
              <path key={route.id} d={geometries[route.id]!.path} fill="none" strokeWidth={WASH_ROAD_WIDTH} />
            ))}
          {map.cities.map((city) => (
            <circle key={city.id} cx={city.x} cy={city.y} r={WASH_CITY_RADIUS} strokeWidth={0} />
          ))}
        </g>
      </mask>

      <linearGradient id="landWash" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={map.width} y2={map.height}>
        <stop offset="0%" stopColor="#f2e6cd" />
        <stop offset="52%" stopColor="#e7d6b3" />
        <stop offset="100%" stopColor="#d8c197" />
      </linearGradient>

      {/* One gradient per province. Colours come from `assignProvinceColors`,
          which guarantees that provinces sharing a border never share a hue. */}
      {landscape.provinces.map((lp) => {
        const { light, dark } = provinceTint(PROVINCE_PALETTE[lp.colorIndex]!);
        return (
          <radialGradient
            key={lp.id}
            id={`prov-${lp.id}`}
            gradientUnits="userSpaceOnUse"
            cx={lp.centre.x}
            cy={lp.centre.y}
            r={240}
          >
            <stop offset="0%" stopColor={light} stopOpacity="0.86" />
            <stop offset="100%" stopColor={dark} stopOpacity="0.92" />
          </radialGradient>
        );
      })}
    </defs>

    {/* Small wave marks keep the open sea from reading as a flat fill. */}
    <g pointerEvents="none">
      {landscape.seaMarks.map((p, i) => (
        <WaveGlyph key={i} x={p.x} y={p.y} scale={0.9 + ((i * 29) % 5) * 0.08} />
      ))}
    </g>

    {/* Shallows: two widening, fainter bands of lighter water round the coast. */}
    <g fill="none" stroke="#c4e6df" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none">
      <path d={landscape.landPath} fillRule="evenodd" strokeOpacity="0.12" strokeWidth={COAST_WIDTH * 2 + 56} />
      <path d={landscape.landPath} fillRule="evenodd" strokeOpacity="0.18" strokeWidth={COAST_WIDTH * 2 + 22} />
    </g>

    {/* The coast: an oversized shape in the coastline tone, with the parchment
        land drawn inside it — the difference between the two is the rim. */}
    <g filter="url(#landShadow)">
      <path
        d={landscape.landPath}
        fillRule="evenodd"
        fill="#8a7448"
        stroke="#8a7448"
        strokeWidth={COAST_WIDTH * 2}
        strokeLinejoin="round"
      />
    </g>
    <g filter="url(#parchGrain)">
      <path d={landscape.landPath} fillRule="evenodd" fill="url(#landWash)" />
    </g>
    </>
  );
});

/* ────────────────────────────────────────────── bonus marker ── */

function BonusMarker({
  x,
  y,
  good,
  active: isActive,
}: {
  x: number;
  y: number;
  good: import('../../game/engine/types').Good;
  active: boolean;
}) {
  return (
    <motion.g
      transform={`translate(${x} ${y})`}
      initial={false}
      animate={{ rotateY: isActive ? 0 : 180 }}
      transition={{ duration: 0.4 }}
      style={{ transformOrigin: 'center' }}
      pointerEvents="none"
    >
      <g filter="url(#pieceShadow)">
        <circle r="15" fill={isActive ? '#efe2c4' : '#3a3226'} stroke="#7a5f3b" strokeWidth="1.4" />
        <circle r="12.4" fill="none" stroke={isActive ? '#b8912f' : '#d4b558'} strokeWidth="0.9" opacity="0.85" />
        {isActive ? (
          <g transform="translate(-9 -9)">
            <GoodIcon good={good} size={18} />
          </g>
        ) : (
          <>
            <g transform="translate(-7 -8)">
              <CoinIcon size={14} />
            </g>
            <text
              y="10.5"
              textAnchor="middle"
              style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fill: '#e6cd86', fontWeight: 700 }}
            >
              {BONUS_MARKER_COIN_VALUES[good]}
            </text>
          </>
        )}
      </g>
    </motion.g>
  );
}

/* ───────────────────────────────────────────────── controls ── */

function MapControls({
  onZoom,
  onFit,
  scale,
}: {
  onZoom(factor: number): void;
  onFit(): void;
  scale: number;
}) {
  return (
    <div data-map-ui className="absolute bottom-3 right-3 flex flex-col gap-1.5">
      <ControlButton label="+" title="Zoom in" onClick={() => onZoom(1.25)} />
      <ControlButton label="−" title="Zoom out" onClick={() => onZoom(1 / 1.25)} />
      <ControlButton label="⤢" title="Fit the board" onClick={onFit} />
      <div className="mt-0.5 rounded bg-black/45 px-1.5 py-0.5 text-center text-[10px] tabular-nums text-parch-300">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

function ControlButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="frame-stone grid h-8 w-8 place-items-center text-parch-200 transition hover:text-gold-300"
      style={{ background: 'linear-gradient(180deg,#3a352d,#282420)' }}
    >
      <span className="text-base leading-none">{label}</span>
    </button>
  );
}


/* ─────────────────────────────────────────────── terrain glyphs ── */

/** Picks the right scattered glyph for a province's terrain. */
function TerrainGlyph({
  terrain,
  x,
  y,
  scale,
}: {
  terrain: TerrainKind | undefined;
  x: number;
  y: number;
  scale: number;
}) {
  switch (terrain) {
    case 'mountain':
      return <MountainGlyph x={x} y={y} scale={scale} />;
    case 'desert':
      return <PalmGlyph x={x} y={y} scale={scale} />;
    case 'inland':
      return <PineGlyph x={x} y={y} scale={scale} />;
    default:
      return <ScrubGlyph x={x} y={y} scale={scale} />;
  }
}

interface GlyphProps {
  x: number;
  y: number;
  scale: number;
}

/** A small snow-capped peak, for mountain provinces. */
function MountainGlyph({ x, y, scale }: GlyphProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.55">
      <path d="M-9 6 -3 -7 2 -1 6 -7 10 6z" fill="#786a52" />
      <path d="M-3 -7 -0.6 -3.4 -3.6 -2z" fill="#f0ead9" opacity="0.85" />
      <path d="M6 -7 8 -3.6 5 -2.4z" fill="#f0ead9" opacity="0.75" />
    </g>
  );
}

/** A single pine, for wooded inland provinces. */
function PineGlyph({ x, y, scale }: GlyphProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.55">
      <rect x="-0.7" y="2" width="1.4" height="3" fill="#5a3f24" />
      <path d="M0 -8l4 6h-8z" fill="#4a5c34" />
      <path d="M0 -4.4l3.4 5.2h-6.8z" fill="#546a3c" />
    </g>
  );
}

/** A leaning palm, for desert provinces. */
function PalmGlyph({ x, y, scale }: GlyphProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.55">
      <path d="M0 6 Q2.4 0 0 -6" stroke="#6b5330" strokeWidth="1.3" fill="none" />
      {[-1, -0.4, 0.3, 0.9].map((f, j) => (
        <path
          key={j}
          d={`M0 -6 Q${5 * f} ${-8 - j} ${7 * f} ${-4 - j * 1.2}`}
          stroke="#a4632f"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** A gentle wave crest, for open water. */
function WaveGlyph({ x, y, scale }: GlyphProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.42">
      <path d="M-8 0q4-4 8 0t8 0" fill="none" stroke="#eef8f5" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M-6 4q4-4 8 0t8 0" fill="none" stroke="#eef8f5" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

/** A low scrub tuft, for anything without a more specific terrain. */
function ScrubGlyph({ x, y, scale }: GlyphProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.5">
      <path d="M-5 2q1-4 5-4t5 4" fill="none" stroke="#6f8f6a" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}
