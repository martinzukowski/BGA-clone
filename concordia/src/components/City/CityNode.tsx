/**
 * A city on the board: a walled settlement, its goods token, the houses built
 * in it and — when the rules allow it — a highlight inviting a click.
 */

import { memo } from 'react';
import { GoodIcon } from '../Goods/GoodIcon';
import { HouseIcon } from '../ui/Icons';
import { housePositions } from '../Map/geometry';
import type { CityVariant } from '../Map/terrain';
import type { CityDefinition, Good, PlayerColorId } from '../../game/engine/types';

export interface CityNodeProps {
  city: CityDefinition;
  good: Good | undefined;
  houses: readonly PlayerColorId[];
  highlight: 'none' | 'legal' | 'selected' | 'producing';
  dimmed: boolean;
  /** Which settlement glyph to draw — see `cityVariant()` in terrain.ts. */
  variant: CityVariant;
  onEnter(): void;
  onLeave(): void;
  onClick(): void;
}

const LABEL_OFFSET: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
  n: { dx: 0, dy: -28, anchor: 'middle' },
  s: { dx: 0, dy: 34, anchor: 'middle' },
  e: { dx: 22, dy: 5, anchor: 'start' },
  w: { dx: -22, dy: 5, anchor: 'end' },
  ne: { dx: 17, dy: -18, anchor: 'start' },
  nw: { dx: -17, dy: -18, anchor: 'end' },
  se: { dx: 17, dy: 24, anchor: 'start' },
  sw: { dx: -17, dy: 24, anchor: 'end' },
};

const MARKS: Record<Exclude<CityVariant, 'capital'>, () => JSX.Element> = {
  town: TownMark,
  village: VillageMark,
  port: PortMark,
  hillfort: HillFortMark,
  oasis: OasisMark,
};

export const CityNode = memo(function CityNode({
  city,
  good,
  houses,
  highlight,
  dimmed,
  variant,
  onEnter,
  onLeave,
  onClick,
}: CityNodeProps) {
  const label = LABEL_OFFSET[city.labelAnchor ?? 's']!;
  const isCapital = !!city.isCapital;
  const seats = housePositions(houses.length, isCapital ? 26 : 21);
  const Mark = isCapital ? CapitalMark : MARKS[variant as Exclude<CityVariant, 'capital'>];

  return (
    <g
      data-city={city.id}
      transform={`translate(${city.x} ${city.y})`}
      className="city-hit"
      opacity={dimmed ? 0.42 : 1}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ transition: 'opacity 180ms ease' }}
    >
      {/* Generous invisible hit area — the visible marker is small. */}
      <circle r={isCapital ? 30 : 22} fill="transparent" />

      {highlight === 'producing' && <circle r="46" fill="url(#produceGlow)" className="legal-glow" />}
      {highlight === 'legal' && (
        <circle r="27" fill="url(#cityGlow)" className="legal-glow" pointerEvents="none" />
      )}
      {highlight === 'selected' && (
        <circle r="25" fill="none" stroke="#f0d98a" strokeWidth="2.6" filter="url(#legalGlow)" />
      )}

      <Mark />

      {/* Goods token, tucked beside the walls. */}
      {good && (
        <g transform="translate(13 -13)" filter="url(#pieceShadow)">
          <circle r="10.5" fill="#efe2c4" stroke="#7a5f3b" strokeWidth="1.2" />
          <circle r="8.6" fill="none" stroke="#b8912f" strokeWidth="0.7" opacity="0.7" />
          <g transform="translate(-7.5 -7.5)">
            <GoodIcon good={good} size={15} />
          </g>
        </g>
      )}

      {/* Houses, fanned so several players never overlap (RULES 8.4). */}
      {houses.map((color, i) => {
        const seat = seats[i]!;
        return (
          <g key={`${color}-${i}`} transform={`translate(${seat.x - 8} ${seat.y - 9})`} filter="url(#pieceShadow)">
            <HouseIcon color={color} size={17} />
          </g>
        );
      })}

      {/* Name, with a soft parchment halo so it reads over any terrain. */}
      <text
        x={label.dx}
        y={label.dy}
        textAnchor={label.anchor}
        className="no-select"
        style={{
          fontFamily: "'Cormorant SC', Georgia, serif",
          fontSize: isCapital ? 19 : 13.5,
          letterSpacing: isCapital ? '0.16em' : '0.08em',
          fill: '#3b2c19',
          paintOrder: 'stroke',
          stroke: 'rgba(247,239,220,0.88)',
          strokeWidth: 3.4,
          strokeLinejoin: 'round',
          fontWeight: isCapital ? 700 : 600,
        }}
      >
        {city.name}
      </text>
    </g>
  );
});

/** A small walled town: ring wall with battlements and a gate tower. */
function TownMark() {
  return (
    <g filter="url(#pieceShadow)">
      <circle r="9.2" fill="#8d7148" />
      <circle r="8" fill="#cbb488" />
      <circle r="8" fill="none" stroke="#6b5330" strokeWidth="1.1" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        return (
          <rect
            key={i}
            x={Math.cos(a) * 8 - 1.5}
            y={Math.sin(a) * 8 - 1.5}
            width="3"
            height="3"
            fill="#8d7148"
            transform={`rotate(${(i / 8) * 360} ${Math.cos(a) * 8} ${Math.sin(a) * 8})`}
          />
        );
      })}
      <rect x="-2.2" y="-0.6" width="4.4" height="6.4" rx="2.2" fill="#6b5330" />
      <circle r="3.2" cx="0" cy="-3" fill="#a68a5c" />
    </g>
  );
}

/** A loose village: a couple of thatched huts with no walls at all. */
function VillageMark() {
  return (
    <g filter="url(#pieceShadow)">
      {[
        { x: -4.6, y: 1.6, s: 1 },
        { x: 3.6, y: 2.6, s: 0.82 },
        { x: 0.2, y: -1.8, s: 0.9 },
      ].map((hut, i) => (
        <g key={i} transform={`translate(${hut.x} ${hut.y}) scale(${hut.s})`}>
          <path d="M-4 3.4V0.4L0-3l4 3.4v3z" fill="#8a6a44" />
          <path d="M-4.6 0.6 0-3.6l4.6 4.2-1 1.1L0-2 -3.6 1.7z" fill="#6b5330" />
          <rect x="-1.1" y="0.6" width="2.2" height="2.8" fill="#4a3a22" />
        </g>
      ))}
    </g>
  );
}

/** A small port: a short pier and a moored skiff beside a couple of houses. */
function PortMark() {
  return (
    <g filter="url(#pieceShadow)">
      <circle r="8.4" fill="#8d7148" />
      <circle r="7.2" fill="#cbb488" />
      <circle r="7.2" fill="none" stroke="#6b5330" strokeWidth="1" />
      <path d="M-3 -3h6l-1.4 2h-3.2z" fill="#8d7148" />
      <rect x="-2.2" y="-1.4" width="4.4" height="3.6" fill="#6b5330" />
      {/* the pier, reaching out over the water */}
      <path d="M2 6h9v1.8H2z" fill="#7d6237" />
      <path d="M2 5.6h9v1H2z" fill="#a4855a" />
      {/* a small moored boat */}
      <g transform="translate(13 8.4)">
        <path d="M-4 0h8l-1.3 2.2h-5.4z" fill="#6b4a2c" />
        <path d="M0 -3.4v3.4" stroke="#5a3f24" strokeWidth="0.8" />
        <path d="M0.3 -3 4 -0.4H0.3z" fill="#e6d6ae" opacity="0.9" />
      </g>
    </g>
  );
}

/** A hill fort: a walled town raised on a rocky outcrop. */
function HillFortMark() {
  return (
    <g filter="url(#pieceShadow)">
      <path d="M-9 8 -5 -1 0 3 5 -2 9 8z" fill="#7a7264" />
      <path d="M-7 8 -4.4 1.4 0 4.8 4.4 0.6 7 8z" fill="#8f8878" />
      <circle cy="-3" r="7.6" fill="#8d7148" />
      <circle cy="-3" r="6.5" fill="#c2ad86" />
      <circle cy="-3" r="6.5" fill="none" stroke="#6b5330" strokeWidth="1" />
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        return (
          <rect
            key={i}
            x={Math.cos(a) * 6.5 - 1.3}
            y={Math.sin(a) * 6.5 - 3 - 1.3}
            width="2.6"
            height="2.6"
            fill="#8d7148"
            transform={`rotate(${(i / 7) * 360} ${Math.cos(a) * 6.5} ${Math.sin(a) * 6.5 - 3})`}
          />
        );
      })}
      <rect x="-1.9" y="-4.4" width="3.8" height="5.4" rx="1.8" fill="#6b5330" />
    </g>
  );
}

/** An oasis town: a walled settlement beside a pair of palms and a well. */
function OasisMark() {
  return (
    <g filter="url(#pieceShadow)">
      <circle r="8.2" fill="#8d7148" />
      <circle r="7" fill="#d8c398" />
      <circle r="7" fill="none" stroke="#6b5330" strokeWidth="1" />
      <rect x="-1.8" y="-1.8" width="3.6" height="3.6" rx="0.6" fill="#4c6b7a" opacity="0.8" />
      {[
        { x: -8.4, y: -2, flip: -1 },
        { x: 8.4, y: 1, flip: 1 },
      ].map((palm, i) => (
        <g key={i} transform={`translate(${palm.x} ${palm.y})`}>
          <path d={`M0 6 Q${1.4 * palm.flip} 0 0 -5`} stroke="#6b5330" strokeWidth="1.3" fill="none" />
          {[-1, -0.4, 0.3, 0.9].map((f, j) => (
            <path
              key={j}
              d={`M0 -5 Q${5 * f} ${-7 - j} ${7 * f} ${-3 - j * 1.4}`}
              stroke="#5c7a4e"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/** Roma: a laurel-ringed capital with a temple front. */
function CapitalMark() {
  return (
    <g>
      <circle r="34" fill="url(#capitalHalo)" />
      <g filter="url(#pieceShadow)">
        <circle r="14" fill="#8d7148" />
        <circle r="12.4" fill="#e4d6b4" />
        <circle r="12.4" fill="none" stroke="#6b5330" strokeWidth="1.3" />
        <circle r="10.2" fill="none" stroke="#b8912f" strokeWidth="0.9" opacity="0.85" />
        {/* Temple: pediment over four columns. */}
        <path d="M-7.6 -1.4 0 -7 7.6 -1.4z" fill="#8d7148" />
        <path d="M-6.6 -1.9 0 -6 6.6 -1.9z" fill="#f2ead6" />
        <rect x="-7.6" y="-1.2" width="15.2" height="1.6" fill="#8d7148" />
        {[-5.2, -1.8, 1.8, 5.2].map((x) => (
          <rect key={x} x={x - 0.9} y="0.6" width="1.8" height="5.4" fill="#f2ead6" stroke="#8d7148" strokeWidth="0.4" />
        ))}
        <rect x="-7.8" y="5.8" width="15.6" height="1.8" rx="0.5" fill="#8d7148" />
      </g>
    </g>
  );
}
