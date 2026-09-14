/**
 * A colonist or a ship standing on the board.
 *
 * Movement is animated by Framer Motion along the *actual* curve of the route
 * the rules allowed — the piece can never visually cut a corner the engine
 * would have refused.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ColonistIcon, ShipIcon } from '../ui/Icons';
import type { ColonistType, PlayerColorId } from '../../game/engine/types';

export interface ColonistPieceProps {
  id: string;
  type: ColonistType;
  color: PlayerColorId;
  x: number;
  y: number;
  /** Sea pieces are rotated to sit along their lane. */
  angle?: number;
  state: 'normal' | 'movable' | 'selected';
  dimmed: boolean;
  duration: number;
  onEnter(): void;
  onLeave(): void;
  onClick(): void;
}

export const ColonistPiece = memo(function ColonistPiece({
  id,
  type,
  color,
  x,
  y,
  angle = 0,
  state,
  dimmed,
  duration,
  onEnter,
  onLeave,
  onClick,
}: ColonistPieceProps) {
  const size = type === 'sea' ? 30 : 26;
  return (
    <motion.g
      data-colonist={id}
      data-colonist-state={state}
      initial={false}
      animate={{ x, y }}
      transition={{ type: 'tween', ease: [0.34, 0.9, 0.3, 1], duration: duration / 1000 }}
      style={{ cursor: 'pointer' }}
      opacity={dimmed ? 0.45 : 1}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {state === 'movable' && (
        <circle r="17" fill="url(#cityGlow)" className="legal-glow" pointerEvents="none" />
      )}
      {state === 'selected' && (
        <>
          <circle r="18" fill="none" stroke="#ffe9a8" strokeWidth="2.4" filter="url(#legalGlow)" />
          <circle r="21" fill="none" stroke="#ffe9a8" strokeWidth="1" opacity="0.5" />
        </>
      )}
      <circle r="14" fill="transparent" />
      <g
        transform={`rotate(${type === 'sea' ? angle : 0}) translate(${-size / 2} ${-size / 2})`}
        filter="url(#pieceShadow)"
      >
        {type === 'sea' ? <ShipIcon color={color} size={size} /> : <ColonistIcon color={color} size={size} />}
      </g>
    </motion.g>
  );
});
