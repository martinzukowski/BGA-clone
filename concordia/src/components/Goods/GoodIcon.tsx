/**
 * Original engraved-style goods icons.
 *
 * Each is drawn on a 24 × 24 grid with a raised-relief treatment: a dark base
 * shape, a mid-tone body and a light highlight, so the pieces read as carved
 * wood rather than flat vector clip-art. No third-party icon set is used
 * anywhere in this project.
 */

import { memo } from 'react';
import { goodMeta } from '../../game/data/goods';
import type { Good } from '../../game/engine/types';

export interface GoodIconProps {
  good: Good;
  size?: number;
  className?: string;
  /** Draws the piece on a recessed slot, as it sits in the storehouse. */
  inSlot?: boolean;
  title?: string;
}

function Brick({ c, s, l }: Tones) {
  return (
    <g>
      <rect x="2.5" y="13.5" width="19" height="5" rx="0.9" fill={s} />
      <rect x="2.5" y="12.8" width="19" height="4.6" rx="0.9" fill={c} />
      <rect x="3.4" y="13.4" width="17.2" height="1.3" rx="0.6" fill={l} opacity="0.55" />
      <rect x="5" y="8.2" width="14" height="4.6" rx="0.9" fill={s} />
      <rect x="5" y="7.6" width="14" height="4.4" rx="0.9" fill={c} />
      <rect x="5.9" y="8.2" width="12.2" height="1.2" rx="0.6" fill={l} opacity="0.5" />
      <path d="M12 12.9v4.7M8 12.9v4.7M16 12.9v4.7" stroke={s} strokeWidth="0.7" opacity="0.7" />
      <path d="M12 8v4M9 8v4M15 8v4" stroke={s} strokeWidth="0.6" opacity="0.6" />
    </g>
  );
}

function Food({ c, s, l }: Tones) {
  // A sheaf of wheat: central stalk, paired grains, a tie at the waist.
  const grain = (x: number, y: number, flip: number) => (
    <path
      d={`M12 ${y} q${3.1 * flip} -0.9 ${3.4 * flip} -3 q${-2.5 * flip} 0.1 ${-3.4 * flip} 3z`}
      fill={x % 2 ? c : l}
      stroke={s}
      strokeWidth="0.45"
      strokeLinejoin="round"
    />
  );
  return (
    <g>
      <path d="M12 21V7.4" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 20.4V8" stroke={c} strokeWidth="0.8" strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          {grain(i, 9.6 + i * 3.1, 1)}
          {grain(i + 1, 9.6 + i * 3.1, -1)}
        </g>
      ))}
      <path d="M12 4.6q1.5 1.5 0 3.6-1.5-2.1 0-3.6z" fill={l} stroke={s} strokeWidth="0.45" />
      <path d="M8.6 17.6h6.8" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8.8 17.4h6.4" stroke={l} strokeWidth="0.5" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

function Tool({ c, s, l }: Tones) {
  // Smith's hammer crossed with a pair of tongs.
  return (
    <g>
      <g transform="rotate(-22 12 12)">
        <rect x="11.2" y="6" width="1.9" height="14" rx="0.85" fill={s} />
        <rect x="11.4" y="6.3" width="1.4" height="13.4" rx="0.7" fill="#8a6a44" />
        <rect x="11.6" y="6.5" width="0.5" height="13" rx="0.25" fill="#b58c5c" opacity="0.75" />
        <path d="M6.6 4.2h10.9a1 1 0 0 1 1 1v2.6a1 1 0 0 1-1 1H6.6a1 1 0 0 1-1-1V5.2a1 1 0 0 1 1-1z" fill={s} />
        <path d="M6.9 4.5h10.3a0.8 0.8 0 0 1 .8.8v2a0.8 0.8 0 0 1-.8.8H6.9a0.8 0.8 0 0 1-.8-.8v-2a0.8 0.8 0 0 1 .8-.8z" fill={c} />
        <path d="M7.2 5h9.8v0.9H7.2z" fill={l} opacity="0.6" />
      </g>
      <g transform="rotate(24 12 12)">
        <path d="M12 20.4V12" stroke={s} strokeWidth="1.9" strokeLinecap="round" />
        <path d="M12 20V12.4" stroke={c} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M12 12.6 8.4 6.6M12 12.6l3.6-6" stroke={s} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12 12.2 8.7 6.9M12 12.2l3.3-5.3" stroke={l} strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
      </g>
    </g>
  );
}

function Wine({ c, s, l }: Tones) {
  // An amphora: pointed foot, swollen belly, two looping handles.
  return (
    <g>
      <path
        d="M12 3.2c1.5 0 2.4.7 2.4 1.6 0 .7-.5 1.1-.9 1.5 2.3 1.4 3.8 3.7 3.8 6.6 0 3.6-2.1 6.4-3.4 8.1-.7.9-.9 1.4-1.9 1.4s-1.2-.5-1.9-1.4C8.8 19.3 6.7 16.5 6.7 12.9c0-2.9 1.5-5.2 3.8-6.6-.4-.4-.9-.8-.9-1.5 0-.9.9-1.6 2.4-1.6z"
        fill={s}
      />
      <path
        d="M12 4.1c1 0 1.6.4 1.6 1 0 .5-.4.8-.8 1.1 2.3 1.2 3.8 3.4 3.8 6.2 0 3.3-2 5.9-3.2 7.5-.5.7-.8 1.1-1.4 1.1s-.9-.4-1.4-1.1c-1.2-1.6-3.2-4.2-3.2-7.5 0-2.8 1.5-5 3.8-6.2-.4-.3-.8-.6-.8-1.1 0-.6.6-1 1.6-1z"
        fill={c}
      />
      <path d="M10.1 8.4c-1.3 1-2.1 2.5-2.2 4.3-.1 1.6.4 3 1 4.1" stroke={l} strokeWidth="0.85" strokeLinecap="round" fill="none" opacity="0.65" />
      <path d="M9.9 6.8C8.2 7.3 7 8.3 6.5 9.6c-.3.8.4 1.2.9.6.6-.8 1.5-1.5 2.7-1.9z" fill={s} />
      <path d="M14.1 6.8c1.7.5 2.9 1.5 3.4 2.8.3.8-.4 1.2-.9.6-.6-.8-1.5-1.5-2.7-1.9z" fill={s} />
      <ellipse cx="12" cy="4.6" rx="2.1" ry="0.7" fill={l} opacity="0.45" />
    </g>
  );
}

function Cloth({ c, s, l }: Tones) {
  // A bolt of folded cloth with a draped end.
  return (
    <g>
      <path d="M3.6 7.4 12 4.4l8.4 3v3.1L12 13.6 3.6 10.5z" fill={s} />
      <path d="M4.6 7.6 12 5.1l7.4 2.5v2L12 12.2 4.6 9.6z" fill={c} />
      <path d="M5.6 7.7 12 5.6l6.4 2.1L12 9.9z" fill={l} opacity="0.55" />
      <path d="M3.6 11.4 12 14.5l8.4-3.1v3L12 17.6l-8.4-3.2z" fill={s} />
      <path d="M4.6 11.9 12 14.6l7.4-2.7v1.9L12 16.5l-7.4-2.7z" fill={c} />
      <path
        d="M15.4 16.6c1.6.9 2.8 2.1 3.2 3.6.1.5-.4.8-.8.5-1-.8-2.2-1.4-3.6-1.8z"
        fill={c}
        stroke={s}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path d="M8.6 16.6c-1.6.9-2.8 2.1-3.2 3.6-.1.5.4.8.8.5 1-.8 2.2-1.4 3.6-1.8z" fill={s} />
    </g>
  );
}

interface Tones {
  c: string;
  s: string;
  l: string;
}

const SHAPES: Record<Good, (t: Tones) => JSX.Element> = {
  brick: Brick,
  food: Food,
  tool: Tool,
  wine: Wine,
  cloth: Cloth,
};

export const GoodIcon = memo(function GoodIcon({
  good,
  size = 24,
  className,
  inSlot = false,
  title,
}: GoodIconProps) {
  const meta = goodMeta(good);
  const Shape = SHAPES[good];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      style={inSlot ? { filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.45))' } : undefined}
    >
      {title ? <title>{title}</title> : null}
      <Shape c={meta.color} s={meta.shade} l={meta.light} />
    </svg>
  );
});

/** A good sitting in one recessed storehouse slot. */
export function GoodSlot({
  good,
  size = 34,
  dim = false,
}: {
  good: Good | null;
  size?: number;
  dim?: boolean;
}) {
  return (
    <div
      className="relative grid place-items-center rounded-[3px]"
      style={{
        width: size,
        height: size,
        background: good
          ? 'linear-gradient(180deg, rgb(255 250 235 / 0.5), rgb(150 118 70 / 0.16))'
          : 'linear-gradient(180deg, rgb(120 96 58 / 0.24), rgb(80 62 36 / 0.14))',
        boxShadow: good
          ? 'inset 0 1px 0 rgb(255 255 255 / 0.5), inset 0 -1px 2px rgb(90 68 38 / 0.35)'
          : 'inset 0 2px 4px rgb(60 44 22 / 0.5), inset 0 -1px 0 rgb(255 255 255 / 0.25)',
        opacity: dim ? 0.45 : 1,
      }}
    >
      {good ? <GoodIcon good={good} size={size - 10} inSlot title={goodMeta(good).name} /> : null}
    </div>
  );
}
