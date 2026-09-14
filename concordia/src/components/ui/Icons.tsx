/**
 * The rest of the original iconography: coin, house, colonist, ship, the six
 * gods, and a few small marks used around the interface.
 *
 * All drawn here, all on a 24 × 24 grid unless noted.
 */

import { memo } from 'react';
import type { God, PlayerColorId } from '../../game/engine/types';

export const PLAYER_PALETTE: Record<PlayerColorId, { base: string; dark: string; light: string; name: string }> = {
  crimson: { base: '#a02f31', dark: '#6e1c1e', light: '#cf6a63', name: 'Crimson' },
  azure: { base: '#2f5788', dark: '#1c3559', light: '#6e93c2', name: 'Azure' },
  ochre: { base: '#c08a24', dark: '#855c10', light: '#e2bb64', name: 'Ochre' },
  verdigris: { base: '#2f7a63', dark: '#1a4f3f', light: '#6cb09a', name: 'Verdigris' },
  obsidian: { base: '#3a3742', dark: '#211f27', light: '#75707f', name: 'Obsidian' },
};

/* ─────────────────────────────────────────────────────────── coin ── */

export const CoinIcon = memo(function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9.4" fill="#8a6a17" />
      <circle cx="12" cy="11.4" r="9.4" fill="#c9a53c" />
      <circle cx="12" cy="11.4" r="7.9" fill="#e0c162" />
      <circle cx="12" cy="11.4" r="7.9" fill="none" stroke="#9c7a20" strokeWidth="0.7" />
      {/* A stylised laurel wreath — original, not a copy of any coin design. */}
      <path
        d="M8.2 15.2c-1.9-1.6-2.6-4.2-1.6-6.4M15.8 15.2c1.9-1.6 2.6-4.2 1.6-6.4"
        stroke="#8a6a17"
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
      />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx={7.2 + i * 0.12} cy={13.4 - i * 1.55} rx="1.15" ry="0.6" fill="#8a6a17" transform={`rotate(${-38 - i * 6} ${7.2} ${13.4 - i * 1.55})`} />
          <ellipse cx={16.8 - i * 0.12} cy={13.4 - i * 1.55} rx="1.15" ry="0.6" fill="#8a6a17" transform={`rotate(${38 + i * 6} ${16.8} ${13.4 - i * 1.55})`} />
        </g>
      ))}
      <path d="M12 7.6v7.6M10.3 9.2h3.4M10.3 12.4h3.4" stroke="#8a6a17" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M9.4 5.6a7.9 7.9 0 0 1 6.4.6" stroke="#f2e2a6" strokeWidth="1" strokeLinecap="round" opacity="0.7" fill="none" />
    </svg>
  );
});

/** Compact money readout: coin + amount. */
export function Coins({ amount, size = 16 }: { amount: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <CoinIcon size={size} />
      <span>{amount}</span>
    </span>
  );
}

/* ────────────────────────────────────────────────────────── house ── */

/** A painted wooden house, viewed slightly from the front. */
export const HouseIcon = memo(function HouseIcon({
  color,
  size = 20,
}: {
  color: PlayerColorId;
  size?: number;
}) {
  const p = PLAYER_PALETTE[color];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M3.2 20.4V10.6L12 4l8.8 6.6v9.8z" fill={p.dark} />
      <path d="M4.6 20.4v-9.1L12 5.8l7.4 5.5v9.1z" fill={p.base} />
      <path d="M2.2 11.3 12 3.8l9.8 7.5-1.1 1.5L12 6.2l-8.7 6.6z" fill={p.dark} />
      <path d="M2.6 11.1 12 4 21.4 11.1l-.7.9L12 5.4 3.3 12z" fill={p.light} opacity="0.85" />
      <rect x="10.3" y="14.2" width="3.4" height="6.2" rx="0.4" fill={p.dark} />
      <rect x="6.4" y="13.2" width="2.6" height="2.6" rx="0.3" fill={p.dark} opacity="0.8" />
      <rect x="15" y="13.2" width="2.6" height="2.6" rx="0.3" fill={p.dark} opacity="0.8" />
      <path d="M4.6 11.6h1.2v8.8H4.6z" fill={p.light} opacity="0.35" />
    </svg>
  );
});

/* ─────────────────────────────────────────────────── the two pieces ── */

/** A land colonist: a cloaked traveller, carved as a wooden token. */
export const ColonistIcon = memo(function ColonistIcon({
  color,
  size = 22,
}: {
  color: PlayerColorId;
  size?: number;
}) {
  const p = PLAYER_PALETTE[color];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <ellipse cx="12" cy="21.2" rx="6.6" ry="1.9" fill={p.dark} />
      <path
        d="M12 3.1c1.9 0 3.3 1.5 3.3 3.3 0 1-.4 1.9-1.1 2.5 2.6 1 4.4 3.4 4.9 6.4l.5 3.2c.1.9-.5 1.7-1.4 1.7H5.8c-.9 0-1.5-.8-1.4-1.7l.5-3.2c.5-3 2.3-5.4 4.9-6.4a3.3 3.3 0 0 1-1.1-2.5C8.7 4.6 10.1 3.1 12 3.1z"
        fill={p.dark}
      />
      <path
        d="M12 4c1.4 0 2.5 1.1 2.5 2.4 0 .9-.5 1.7-1.3 2.1l-.7.4.8.2c2.4.7 4.1 2.8 4.5 5.5l.5 3.1c0 .4-.2.7-.6.7H6.3c-.4 0-.6-.3-.6-.7l.5-3.1c.4-2.7 2.1-4.8 4.5-5.5l.8-.2-.7-.4a2.4 2.4 0 0 1-1.3-2.1C9.5 5.1 10.6 4 12 4z"
        fill={p.base}
      />
      <path d="M10.2 5.3a2.3 2.3 0 0 1 2.6-.5" stroke={p.light} strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <path d="M9.4 10.4c-1.4 1-2.3 2.6-2.6 4.6" stroke={p.light} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.75" />
    </svg>
  );
});

/** A sea colonist: a small merchant galley under a square sail. */
export const ShipIcon = memo(function ShipIcon({
  color,
  size = 24,
}: {
  color: PlayerColorId;
  size?: number;
}) {
  const p = PLAYER_PALETTE[color];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M11.4 3.2h1.3v11h-1.3z" fill="#6b5330" />
      <path d="M11.6 3.4h.5v10.8h-.5z" fill="#8d7148" />
      <path
        d="M12.9 4.2h5.4c.4 0 .6.4.4.7l-1.1 1.6 1.1 1.6c.2.3 0 .7-.4.7h-5.4z"
        fill={p.base}
        stroke={p.dark}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M13.2 4.9h4.3l-.7 1.1.7 1.1h-4.3z" fill={p.light} opacity="0.45" />
      <path
        d="M4.1 14.6h15.8c.6 0 1 .6.7 1.1l-1.8 3.4c-.5 1-1.5 1.6-2.6 1.6H8c-1.1 0-2.1-.6-2.6-1.6l-1.8-3.4c-.3-.5.1-1.1.7-1.1z"
        fill="#6b5330"
      />
      <path
        d="M5.3 15.5h13.4l-1.5 2.9c-.3.6-1 1-1.7 1H8.5c-.7 0-1.4-.4-1.7-1z"
        fill="#8d7148"
      />
      <path d="M5.6 15.9h12.8l-.4.8H6z" fill="#a98a5b" opacity="0.8" />
      <path d="M3.2 13.8h17.6c.4 0 .7.3.7.7s-.3.7-.7.7H3.2a.7.7 0 0 1 0-1.4z" fill={p.dark} />
      <path d="M3.6 14.1h16.8v.4H3.6z" fill={p.base} />
    </svg>
  );
});

/* ─────────────────────────────────────────────────────────── gods ── */

/**
 * A distinct emblem for each god. Simple, symbolic, and legible at 16 px:
 * a hearth flame, a thunderbolt, a sickle, a winged caduceus, a spear-and-shield
 * and an owl.
 */
export const GodIcon = memo(function GodIcon({
  god,
  size = 18,
  tone = '#b8912f',
}: {
  god: God;
  size?: number;
  tone?: string;
}) {
  const common = { fill: 'none', stroke: tone, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {god === 'vesta' && (
        <>
          <path d="M12 3.4c2.4 3 3.7 5 3.7 7a3.7 3.7 0 0 1-7.4 0c0-2 1.3-4 3.7-7z" {...common} />
          <path d="M12 9.6c1 1.4 1.5 2.3 1.5 3.1a1.5 1.5 0 0 1-3 0c0-.8.5-1.7 1.5-3.1z" fill={tone} stroke="none" opacity="0.75" />
          <path d="M5.8 18.2h12.4M7.4 21h9.2" {...common} />
        </>
      )}
      {god === 'jupiter' && (
        <>
          <path d="M14.6 2.6 7.2 12.4h4.1L9.4 21.4l7.6-10.2h-4.2z" {...common} />
        </>
      )}
      {god === 'saturnus' && (
        <>
          <path d="M4.4 16.6c4.6-5.4 9.6-8 14.8-8.4" {...common} />
          <path d="M19.2 8.2c-1.4 2-3.4 3-5.8 3.2" {...common} />
          <path d="M4.4 16.6 3 20.8l4.2-1.4" {...common} />
          <circle cx="19.2" cy="8.2" r="1.5" fill={tone} stroke="none" />
        </>
      )}
      {god === 'mercurius' && (
        <>
          <path d="M12 6.6v13.8" {...common} />
          <path d="M8.4 8.8c1.6 1.2 5.6 1.2 7.2 0M8.4 12c1.6 1.2 5.6 1.2 7.2 0" {...common} />
          <path d="M8.6 6.6a4 4 0 0 1-4-3.4c2.6-.3 4.4.9 5.2 2.4M15.4 6.6a4 4 0 0 0 4-3.4c-2.6-.3-4.4.9-5.2 2.4" {...common} />
          <circle cx="12" cy="4.6" r="1.4" fill={tone} stroke="none" />
        </>
      )}
      {god === 'mars' && (
        <>
          <path d="M8.6 3.4h6.8l1.6 8.2c.4 2.2-.7 4.4-2.7 5.4L12 18.6l-2.3-1.6c-2-1-3.1-3.2-2.7-5.4z" {...common} />
          <path d="M12 6.4v8.4M9.4 9.4h5.2" {...common} />
        </>
      )}
      {god === 'minerva' && (
        <>
          <path d="M12 3.6c3.9 0 6.4 3 6.4 7.4 0 5-2.9 9.4-6.4 9.4s-6.4-4.4-6.4-9.4c0-4.4 2.5-7.4 6.4-7.4z" {...common} />
          <circle cx="9.6" cy="10.2" r="1.9" {...common} />
          <circle cx="14.4" cy="10.2" r="1.9" {...common} />
          <circle cx="9.6" cy="10.2" r="0.7" fill={tone} stroke="none" />
          <circle cx="14.4" cy="10.2" r="0.7" fill={tone} stroke="none" />
          <path d="M12 12.6l-1.1 1.6h2.2z" fill={tone} stroke="none" />
        </>
      )}
    </svg>
  );
});

/* ────────────────────────────────────────────────── small marks ── */

export function LaurelRule({ width = 180 }: { width?: number }) {
  return (
    <svg width={width} height="14" viewBox={`0 0 ${width} 14`} aria-hidden>
      <path d={`M8 7h${width - 16}`} stroke="#b8912f" strokeWidth="0.9" opacity="0.5" />
      <circle cx={width / 2} cy="7" r="3" fill="none" stroke="#d4b558" strokeWidth="1" />
      <circle cx={width / 2} cy="7" r="1" fill="#e6cd86" />
      <path d="M2 7 6 4.6V9.4z" fill="#b8912f" opacity="0.7" />
      <path d={`M${width - 2} 7 ${width - 6} 4.6v4.8z`} fill="#b8912f" opacity="0.7" />
    </svg>
  );
}

export function ProvinceBonusMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#3a3226" stroke="#b8912f" strokeWidth="1.2" />
      <path d="M12 5.4 13.8 9.9 18.6 10.2 14.9 13.2 16.1 17.9 12 15.3 7.9 17.9 9.1 13.2 5.4 10.2 10.2 9.9z" fill="#d4b558" />
    </svg>
  );
}
