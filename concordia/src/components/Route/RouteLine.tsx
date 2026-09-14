/**
 * A road or a sea lane.
 *
 * Land routes are drawn as paved Roman roads — a dark bed with a lighter
 * surface and cross-ties. Sea lanes are dashed rhumb lines, the way a chart
 * would mark a sailing course.
 */

import { memo } from 'react';
import type { RouteGeometry } from '../Map/geometry';
import type { RouteType } from '../../game/engine/types';

export interface RouteLineProps {
  id: string;
  type: RouteType;
  geometry: RouteGeometry;
  state: 'normal' | 'legal' | 'blocked' | 'hovered' | 'path';
  dimmed: boolean;
  onEnter(): void;
  onLeave(): void;
  onClick(): void;
}

export const RouteLine = memo(function RouteLine({
  id,
  type,
  geometry,
  state,
  dimmed,
  onEnter,
  onLeave,
  onClick,
}: RouteLineProps) {
  const land = type === 'land';
  const highlight = state === 'legal' || state === 'hovered' || state === 'path';

  return (
    <g
      data-route={id}
      className="route-hit"
      opacity={dimmed ? 0.3 : 1}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ transition: 'opacity 180ms ease' }}
    >
      {/* Wide invisible stroke so thin lines are still easy to hit. */}
      <path d={geometry.path} fill="none" stroke="transparent" strokeWidth="20" />

      {land ? (
        <>
          <path d={geometry.path} fill="none" stroke="#7d6237" strokeWidth="6.4" strokeLinecap="round" opacity="0.85" />
          <path d={geometry.path} fill="none" stroke="#c4a878" strokeWidth="3.8" strokeLinecap="round" />
          <path
            d={geometry.path}
            fill="none"
            stroke="#6f5530"
            strokeWidth="3.8"
            strokeLinecap="butt"
            strokeDasharray="1.4 8"
            opacity="0.5"
          />
        </>
      ) : (
        <>
          <path d={geometry.path} fill="none" stroke="#20404f" strokeWidth="4.4" strokeLinecap="round" opacity="0.3" />
          <path
            d={geometry.path}
            fill="none"
            stroke="#e6f1f4"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="9 7"
            opacity="0.75"
          />
        </>
      )}

      {highlight && (
        <path
          d={geometry.path}
          fill="none"
          stroke={state === 'path' ? '#ffe9a8' : '#f5d97a'}
          strokeWidth={state === 'path' ? 6.2 : 5}
          strokeLinecap="round"
          filter="url(#legalGlow)"
          className={state === 'legal' ? 'legal-glow' : undefined}
          opacity={state === 'hovered' ? 0.6 : 0.9}
          pointerEvents="none"
        />
      )}

      {state === 'blocked' && (
        <path
          d={geometry.path}
          fill="none"
          stroke="#9d3b32"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="3 6"
          opacity="0.65"
          pointerEvents="none"
        />
      )}
    </g>
  );
});
