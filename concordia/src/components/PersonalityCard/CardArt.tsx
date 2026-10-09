/**
 * Original card illustrations.
 *
 * Every scene below is drawn from scratch as layered SVG: a warm Mediterranean
 * sky, architecture in the middle distance, and a figure at work in the
 * foreground. The palette and the light are shared across all thirteen so the
 * set reads as one commission rather than thirteen clip-art pulls.
 *
 * ── Asset interface ────────────────────────────────────────────────────
 * If a painted illustration is later produced, drop it in as
 *     /public/assets/cards/<role>.webp
 * and it is used automatically in place of the drawing below. Nothing else
 * needs to change. `CardArt` probes for the file once and silently falls back.
 */

import { memo, useEffect, useState } from 'react';
import type { CardRole } from '../../game/engine/types';

const ART_PATH = (role: CardRole) => `${import.meta.env.BASE_URL}assets/cards/${role}.webp`;

/** Roles whose .webp exists. Probed once per role, cached for the session. */
const probed = new Map<CardRole, boolean>();

function useArtwork(role: CardRole): string | null {
  const [src, setSrc] = useState<string | null>(probed.get(role) ? ART_PATH(role) : null);
  useEffect(() => {
    if (probed.has(role)) {
      setSrc(probed.get(role) ? ART_PATH(role) : null);
      return;
    }
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      probed.set(role, true);
      if (!cancelled) setSrc(ART_PATH(role));
    };
    img.onerror = () => {
      probed.set(role, false);
      if (!cancelled) setSrc(null);
    };
    img.src = ART_PATH(role);
    return () => {
      cancelled = true;
    };
  }, [role]);
  return src;
}

export interface CardArtProps {
  role: CardRole;
  /** Rendered width in px; the scene keeps a 4:3 aspect. */
  width: number;
  className?: string;
}

export const CardArt = memo(function CardArt({ role, width, className }: CardArtProps) {
  const painted = useArtwork(role);
  const height = Math.round((width * 3) / 4);

  if (painted) {
    return (
      <img
        src={painted}
        alt=""
        width={width}
        height={height}
        className={className}
        style={{ objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 150"
      className={className}
      style={{ display: 'block' }}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <Scene role={role} />
    </svg>
  );
});

/* ═══════════════════════════════════ shared scene furniture ═════ */

function Backdrop({ tint = 0 }: { tint?: number }) {
  // Banded sky rather than a gradient: it holds its warmth when the card is
  // scaled right down into a hand, where a soft gradient turns to mud.
  return (
    <>
      <rect width="200" height="150" fill={tint ? '#f2cfa0' : '#f8dfae'} />
      <rect width="200" height="96" fill={tint ? '#eec79a' : '#f3cd97'} />
      <rect width="200" height="62" fill={tint ? '#f4d5a4' : '#f7dba7'} />
      {/* low sun */}
      <circle cx="152" cy="46" r="17" fill="#fdeec2" opacity="0.85" />
      <circle cx="152" cy="46" r="27" fill="#fbe0a4" opacity="0.35" />
      {/* haze bands */}
      <rect y="58" width="200" height="6" fill="#e9b47c" opacity="0.45" />
      <rect y="70" width="200" height="4" fill="#e2a870" opacity="0.4" />
    </>
  );
}

function Hills() {
  return (
    <>
      <path d="M0 78 Q28 62 54 74 T104 70 T156 78 T200 68V150H0z" fill="#c69a6d" opacity="0.75" />
      <path d="M0 88 Q34 76 66 86 T130 82 T200 90V150H0z" fill="#b3855c" opacity="0.7" />
    </>
  );
}

function Ground({ tone = '#7d5638' }: { tone?: string }) {
  return (
    <>
      <path d="M0 104 Q60 96 120 104 T200 100V150H0z" fill={tone} />
      <path d="M0 118 Q70 110 140 118 T200 114V150H0z" fill="#5f3f28" />
      <path d="M0 132h200v18H0z" fill="#4b3120" />
    </>
  );
}

/** A run of columns receding to the right. */
function Colonnade({ x = 12, y = 44, n = 5, h = 54, gap = 17 }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cx = x + i * gap;
        const scale = 1 - i * 0.045;
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${scale})`}>
            <rect x="-4.6" y="0" width="9.2" height={h} fill="#e7d7b8" />
            <rect x="-4.6" y="0" width="3" height={h} fill="#f4e9d2" />
            <rect x="-6" y="-4" width="12" height="4.4" rx="1" fill="#efe1c4" />
            <rect x="-6.8" y={h} width="13.6" height="4.4" rx="1" fill="#d9c6a2" />
            {/* flutes */}
            {[-2.4, 0, 2.4].map((fx) => (
              <rect key={fx} x={fx - 0.35} y={h * 0.05} width="0.7" height={h * 0.9} fill="#d3c1a0" opacity="0.75" />
            ))}
          </g>
        );
      })}
      <rect x={x - 9} y={y - 9} width={n * gap + 4} height="6" rx="1.4" fill="#f0e2c6" />
      <path d={`M${x - 11} ${y - 9} L${x + (n * gap) / 2 - 3} ${y - 22} L${x + n * gap - 5} ${y - 9}z`} fill="#e9dab9" />
    </g>
  );
}

/** Arched aqueduct marching across the middle distance. */
function Aqueduct({ x = 4, y = 52, n = 5, w = 30, h = 44 }) {
  return (
    <g opacity="0.95">
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${x + i * w} ${y})`}>
          <rect width={w - 6} height={h} fill="#dcc9a4" />
          <path d={`M3 ${h} v-${h * 0.5} a${(w - 12) / 2} ${(w - 12) / 2} 0 0 1 ${w - 12} 0 v${h * 0.5}z`} fill="#c9a97d" />
          <path
            d={`M6 ${h} v-${h * 0.5} a${(w - 18) / 2} ${(w - 18) / 2} 0 0 1 ${w - 18} 0 v${h * 0.5}z`}
            fill="#a67f56"
          />
        </g>
      ))}
      <rect x={x - 3} y={y - 7} width={n * w + 2} height="8" fill="#e8d7b3" />
      <rect x={x - 3} y={y - 7} width={n * w + 2} height="2.6" fill="#f3e6c8" />
    </g>
  );
}

/** A robed figure. `lean` tilts the body; `cloak` sets the drapery colour. */
function Figure({
  x,
  y,
  scale = 1,
  cloak = '#8d2f34',
  under = '#efe3c8',
  lean = 0,
  arm = 'down',
  skin = '#c08a5e',
}: {
  x: number;
  y: number;
  scale?: number;
  cloak?: string;
  under?: string;
  lean?: number;
  arm?: 'down' | 'out' | 'up' | 'work';
  skin?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${lean})`}>
      {/* shadow */}
      <ellipse cx="0" cy="1.5" rx="13" ry="3.2" fill="#3a2716" opacity="0.35" />
      {/* body */}
      <path d="M-10 0 C-9 -22 -6 -34 0 -34 C6 -34 9 -22 10 0z" fill={under} />
      <path d="M-10 0 C-9 -22 -6 -34 0 -34 C4 -34 6 -26 6 -18 L2 0z" fill="#e2d3b2" />
      {/* cloak */}
      <path d="M-9 -2 C-11 -20 -7 -31 -1 -32 C-3 -22 -4 -10 -3 -1z" fill={cloak} />
      <path d="M9 -2 C11 -20 7 -31 1 -32 C3 -22 4 -10 3 -1z" fill={cloak} opacity="0.85" />
      <path d="M-6 -30 q6 -4 12 0 l-1 5 q-5 -3 -10 0z" fill={cloak} />
      {/* head */}
      <circle cx="0" cy="-39" r="5.4" fill={skin} />
      <path d="M-5.4 -40.5 a5.4 5.4 0 0 1 10.8 0 q-5.4 -3.4 -10.8 0z" fill="#3b2a1c" />
      {/* arms */}
      {arm === 'out' && <path d="M6 -28 q11 2 16 -3" stroke={skin} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {arm === 'up' && <path d="M6 -28 q9 -4 10 -13" stroke={skin} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {arm === 'work' && (
        <>
          <path d="M-6 -27 q-8 3 -10 9" stroke={skin} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M6 -27 q8 3 10 9" stroke={skin} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {arm === 'down' && <path d="M7 -28 q4 8 3 16" stroke={skin} strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>
  );
}

function Amphorae({ x, y, n = 3, scale = 1 }: { x: number; y: number; n?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${i * 11} ${i % 2 ? -1 : 0})`}>
          <path
            d="M0 0 c-4 0-6-2-6-6 0-5 2-9 4-11-1-1-2-2-2-3 0-2 2-3 4-3s4 1 4 3c0 1-1 2-2 3 2 2 4 6 4 11 0 4-2 6-6 6z"
            fill="#a4622f"
          />
          <path d="M-2 -18 c-3 1-5 3-5 5 0 1 1 1 2 0 1-2 2-3 4-4z" fill="#8b4c22" />
          <path d="M2 -18 c3 1 5 3 5 5 0 1-1 1-2 0-1-2-2-3-4-4z" fill="#8b4c22" />
          <path d="M-3 -12 q1 5 0 9" stroke="#c98a55" strokeWidth="1" fill="none" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

function DistantShip({ x, y, scale = 1, sail = '#e7d5b0' }: { x: number; y: number; scale?: number; sail?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.9">
      <path d="M-14 0 h28 l-4 5 h-20z" fill="#6b4a2c" />
      <rect x="-0.7" y="-18" width="1.4" height="18" fill="#5c3f26" />
      <path d="M1 -17 h12 l-3 5 3 5H1z" fill={sail} />
      <path d="M-1 -15 h-9 l2 4-2 4h9z" fill={sail} opacity="0.8" />
    </g>
  );
}

/* ═══════════════════════════════════════════ the thirteen scenes ═ */

function Scene({ role }: { role: CardRole }) {
  switch (role) {
    /* ─────────────────────────────────── ARCHITECT ── */
    case 'architect':
      return (
        <>
          <Backdrop />
          <Hills />
          <Aqueduct x={-4} y={44} n={6} w={34} h={52} />
          <Ground />
          {/* scaffolding */}
          <g stroke="#7a5230" strokeWidth="2.4" opacity="0.9">
            <path d="M132 104V56M158 104V56M132 70h26M132 86h26" />
          </g>
          <rect x="120" y="100" width="60" height="8" fill="#8a6039" />
          <Figure x={58} y={120} scale={1.5} cloak="#8d5a22" arm="out" />
          {/* unrolled plan */}
          <g transform="translate(84 92) rotate(-8)">
            <rect x="0" y="0" width="34" height="22" rx="1.5" fill="#f6ecd2" stroke="#b79a68" strokeWidth="1" />
            <path d="M4 6h26M4 11h18M4 16h22" stroke="#8b6f45" strokeWidth="1" opacity="0.8" />
            <circle cx="27" cy="15" r="3.5" fill="none" stroke="#8b6f45" strokeWidth="1" />
          </g>
          <path d="M22 128 l10-14 10 14z" fill="#6b4526" opacity="0.7" />
        </>
      );

    /* ───────────────────────────────────── PREFECT ── */
    case 'prefect':
      return (
        <>
          <Backdrop />
          <Hills />
          {/* the province below: fields and a walled town */}
          <g opacity="0.85">
            <path d="M0 96 Q50 88 100 96 T200 92V116H0z" fill="#c9a86e" />
            <path d="M12 100 h176" stroke="#a8874f" strokeWidth="1.2" opacity="0.6" />
            <path d="M20 108 h160" stroke="#a8874f" strokeWidth="1.2" opacity="0.5" />
            <g transform="translate(140 76)">
              <rect x="0" y="0" width="34" height="18" fill="#d8c39c" />
              <path d="M0 0h34l-4-6H4z" fill="#b7986c" />
              {[4, 12, 20, 28].map((x) => (
                <rect key={x} x={x} y="4" width="3" height="5" fill="#8f7449" />
              ))}
            </g>
          </g>
          <Ground tone="#6f4c30" />
          <Figure x={62} y={124} scale={1.65} cloak="#6d2230" arm="out" />
          {/* staff of office */}
          <path d="M40 124V72" stroke="#5c3f26" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="40" cy="69" r="4" fill="#c9a53c" />
          <ellipse cx="40" cy="69" rx="4" ry="2" fill="#e0c162" />
        </>
      );

    /* ──────────────────────────────────── MERCATOR ── */
    case 'mercator':
      return (
        <>
          <Backdrop />
          {/* harbour water */}
          <rect y="76" width="200" height="30" fill="#7ba4b0" />
          <path d="M0 80 q14 -3 28 0t28 0 28 0 28 0 28 0 28 0" stroke="#a8c9d1" strokeWidth="1.6" fill="none" opacity="0.7" />
          <path d="M0 90 q14 -3 28 0t28 0 28 0 28 0 28 0 28 0" stroke="#a8c9d1" strokeWidth="1.4" fill="none" opacity="0.5" />
          <DistantShip x={150} y={82} scale={1.5} sail="#efdcb4" />
          <DistantShip x={38} y={78} scale={0.9} sail="#e2cda4" />
          {/* quay */}
          <rect y="100" width="200" height="12" fill="#b79a6c" />
          <rect y="100" width="200" height="3" fill="#cdb287" />
          <Ground tone="#7a5638" />
          <Amphorae x={124} y={126} n={4} scale={1.5} />
          {/* market table with scales */}
          <rect x="24" y="112" width="52" height="4" fill="#7a5230" />
          <rect x="28" y="116" width="4" height="16" fill="#6b4526" />
          <rect x="68" y="116" width="4" height="16" fill="#6b4526" />
          <g transform="translate(50 96)">
            <path d="M0 0v14" stroke="#8a6a2a" strokeWidth="1.6" />
            <path d="M-12 2h24" stroke="#8a6a2a" strokeWidth="1.6" />
            <path d="M-12 2v5M12 2v5" stroke="#8a6a2a" strokeWidth="1" />
            <ellipse cx="-12" cy="8" rx="5" ry="1.8" fill="#c9a53c" />
            <ellipse cx="12" cy="8" rx="5" ry="1.8" fill="#c9a53c" />
          </g>
          <Figure x={96} y={130} scale={1.5} cloak="#7d2340" under="#f2e6cb" arm="out" />
        </>
      );

    /* ──────────────────────────────────── COLONIST ── */
    case 'colonist':
      return (
        <>
          <Backdrop />
          <Hills />
          {/* city gate they are leaving */}
          <g transform="translate(140 44)">
            <rect x="0" y="0" width="54" height="62" fill="#c7ac82" />
            <path d="M14 62V34a13 13 0 0 1 26 0v28z" fill="#5e401f" />
            <rect x="-4" y="-6" width="62" height="8" fill="#d9c39a" />
            {[0, 10, 20, 30, 40, 50].map((x) => (
              <rect key={x} x={x - 2} y="-12" width="6" height="6" fill="#d9c39a" />
            ))}
          </g>
          <Ground />
          {/* the road out */}
          <path d="M180 118 Q110 122 10 138" stroke="#a1794e" strokeWidth="14" fill="none" opacity="0.8" />
          <path d="M180 118 Q110 122 10 138" stroke="#b98f5f" strokeWidth="9" fill="none" />
          {/* handcart */}
          <g transform="translate(96 118)">
            <rect x="-16" y="-14" width="32" height="12" rx="1.5" fill="#8a6039" />
            <rect x="-16" y="-14" width="32" height="3" fill="#a57c4c" />
            <circle cx="-8" cy="2" r="6" fill="#5c3f26" />
            <circle cx="-8" cy="2" r="2.4" fill="#8a6039" />
            <circle cx="9" cy="2" r="6" fill="#5c3f26" />
            <circle cx="9" cy="2" r="2.4" fill="#8a6039" />
            <path d="M-16 -8 l-14 -4" stroke="#7a5230" strokeWidth="2.6" strokeLinecap="round" />
          </g>
          <Figure x={54} y={126} scale={1.4} cloak="#2f6b5c" arm="down" />
          <Figure x={34} y={132} scale={1.0} cloak="#8d5a22" arm="down" />
        </>
      );

    /* ──────────────────────────────────── DIPLOMAT ── */
    case 'diplomat':
      return (
        <>
          <Backdrop tint={1} />
          <Hills />
          <Colonnade x={16} y={40} n={4} h={56} gap={20} />
          <Ground tone="#6d4c32" />
          {/* two standards */}
          <g>
            <path d="M118 118V54" stroke="#5c3f26" strokeWidth="2.4" />
            <rect x="112" y="54" width="14" height="10" fill="#8d2f34" />
            <circle cx="118" cy="50" r="3.4" fill="#c9a53c" />
            <path d="M182 118V58" stroke="#5c3f26" strokeWidth="2.4" />
            <rect x="176" y="58" width="14" height="10" fill="#2f5788" />
            <circle cx="182" cy="54" r="3.4" fill="#c9a53c" />
          </g>
          <Figure x={92} y={128} scale={1.45} cloak="#8d2f34" arm="out" />
          <Figure x={144} y={128} scale={1.45} cloak="#2f5788" arm="out" lean={0} />
          {/* clasped hands */}
          <circle cx="118" cy="98" r="4.4" fill="#c08a5e" />
        </>
      );

    /* ───────────────────────────────────── SENATOR ── */
    case 'senator':
      return (
        <>
          <Backdrop tint={1} />
          {/* interior wall */}
          <rect width="200" height="150" fill="#e6d4b0" />
          <rect y="0" width="200" height="52" fill="#dcc7a0" />
          <rect y="52" width="200" height="6" fill="#c9b088" />
          <Colonnade x={18} y={20} n={6} h={72} gap={26} />
          {/* tiered benches */}
          <path d="M0 118h200v32H0z" fill="#c2a67c" />
          <path d="M0 106h200v12H0z" fill="#d2b88e" />
          <path d="M0 106h200v3H0z" fill="#e0caa4" />
          <g opacity="0.45">
            {[16, 44, 72, 168].map((x) => (
              <Figure key={x} x={x} y={106} scale={0.85} cloak="#b8a483" under="#e9dcc0" />
            ))}
          </g>
          <Figure x={116} y={132} scale={1.7} cloak="#8d2f34" under="#f6efdc" arm="up" />
          {/* scroll */}
          <g transform="translate(134 88) rotate(18)">
            <rect x="0" y="0" width="24" height="7" rx="3.5" fill="#f2e6cb" stroke="#b9a077" strokeWidth="0.9" />
          </g>
        </>
      );

    /* ────────────────────────────────────── CONSUL ── */
    case 'consul':
      return (
        <>
          <Backdrop tint={1} />
          <rect width="200" height="150" fill="#e9d8b6" />
          <Colonnade x={14} y={16} n={5} h={78} gap={24} />
          <path d="M0 112h200v38H0z" fill="#bda580" />
          <path d="M0 112h200v4H0z" fill="#d5bd97" />
          {/* curule chair */}
          <g transform="translate(104 112)">
            <path d="M-20 0 l8 -22h24l8 22z" fill="#c9a53c" opacity="0.35" />
            <path d="M-18 0 l6 -20M18 0 l-6 -20M-12 -20h24" stroke="#a4801f" strokeWidth="3" strokeLinecap="round" />
            <rect x="-15" y="-24" width="30" height="5" rx="2" fill="#8d2f34" />
          </g>
          {/* fasces */}
          <g transform="translate(48 112)">
            <rect x="-4" y="-46" width="8" height="46" fill="#a57c4c" />
            <rect x="-4" y="-46" width="3" height="46" fill="#c19a68" />
            {[-38, -30, -22, -14].map((y) => (
              <rect key={y} x="-6" y={y} width="12" height="2.6" rx="1" fill="#8d2f34" />
            ))}
            <path d="M-2 -46 l10 -12 4 4-10 12z" fill="#9aa3ac" />
          </g>
          <Figure x={140} y={130} scale={1.6} cloak="#8d2f34" under="#f7f0dd" arm="out" />
        </>
      );

    /* ───────────────────────────────────── TRIBUNE ── */
    case 'tribune':
      return (
        <>
          <Backdrop />
          <Hills />
          <Colonnade x={122} y={34} n={4} h={54} gap={22} />
          <Ground tone="#6f4c30" />
          {/* the rostra */}
          <g transform="translate(50 96)">
            <rect x="-34" y="0" width="68" height="26" fill="#c9ae83" />
            <rect x="-34" y="0" width="68" height="5" fill="#dcc49a" />
            <rect x="-38" y="26" width="76" height="6" fill="#b1946c" />
            {[-24, -8, 8, 24].map((x) => (
              <path key={x} d={`M${x} 26 l0 -14 l6 0 l0 14z`} fill="#9c8058" opacity="0.6" />
            ))}
          </g>
          <Figure x={50} y={96} scale={1.5} cloak="#8d2f34" arm="up" />
          {/* the crowd */}
          <g opacity="0.55">
            {[104, 122, 140, 158, 176, 113, 131, 149, 167].map((x, i) => (
              <g key={x} transform={`translate(${x} ${i < 5 ? 142 : 134})`}>
                <circle cy="-11" r="4.6" fill="#6b4a2c" />
                <path d="M-7 0 c0 -9 3 -13 7 -13 s7 4 7 13z" fill="#7d5a3a" />
              </g>
            ))}
          </g>
        </>
      );

    /* ─────────────────────────────────────── MASON ── */
    case 'mason':
      return (
        <>
          <Backdrop />
          <Hills />
          <Ground />
          {/* half-built wall */}
          <g transform="translate(112 56)">
            {Array.from({ length: 7 }, (_, row) =>
              Array.from({ length: 5 - (row > 4 ? row - 4 : 0) }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 17 + (row % 2 ? 8 : 0)}
                  y={row * 8}
                  width="15"
                  height="6.6"
                  rx="0.8"
                  fill={row % 2 ? '#b4552f' : '#a94c29'}
                  stroke="#7c351b"
                  strokeWidth="0.6"
                />
              )),
            )}
          </g>
          <Figure x={54} y={126} scale={1.5} cloak="#8a4a24" arm="work" />
          {/* trowel & mortar */}
          <g transform="translate(76 106) rotate(-24)">
            <path d="M0 0 l16 -4 -3 8z" fill="#9aa3ac" />
            <rect x="-8" y="-2" width="9" height="3" rx="1.4" fill="#6b4526" />
          </g>
          <ellipse cx="30" cy="132" rx="13" ry="5" fill="#8f8172" />
          <ellipse cx="30" cy="130" rx="11" ry="4" fill="#b3a897" />
        </>
      );

    /* ────────────────────────────────────── FARMER ── */
    case 'farmer':
      return (
        <>
          <Backdrop />
          <Hills />
          {/* wheat field */}
          <rect y="88" width="200" height="62" fill="#d8b25c" />
          <g opacity="0.8">
            {Array.from({ length: 42 }, (_, i) => {
              const x = (i * 5.3) % 200;
              const y = 92 + ((i * 13) % 46);
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <path d="M0 0v-11" stroke="#a9822f" strokeWidth="1.1" />
                  <ellipse cx="0" cy="-13" rx="1.9" ry="3.6" fill="#eecd7c" />
                </g>
              );
            })}
          </g>
          <path d="M0 122h200v28H0z" fill="#a97f38" opacity="0.5" />
          <Figure x={130} y={128} scale={1.55} cloak="#7e6a24" under="#efe3c8" arm="work" />
          {/* sickle */}
          <g transform="translate(150 104)">
            <path d="M0 0 a12 12 0 0 1 16 6" stroke="#9aa3ac" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <rect x="-7" y="-2" width="8" height="3.4" rx="1.6" fill="#6b4526" />
          </g>
          {/* sheaf */}
          <g transform="translate(46 130)">
            <path d="M-9 0 L-4 -26M0 0 L0 -28M9 0 L4 -26" stroke="#c9a24a" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="-11" y="-12" width="22" height="4" rx="2" fill="#8a6a2a" />
          </g>
        </>
      );

    /* ─────────────────────────────────────── SMITH ── */
    case 'smith':
      return (
        <>
          <rect width="200" height="150" fill="#3a2a1e" />
          <rect width="200" height="88" fill="#4a3325" />
          {/* forge mouth */}
          <g transform="translate(150 78)">
            <path d="M-30 24 v-26 a30 26 0 0 1 60 0 v26z" fill="#2a1c13" />
            <path d="M-22 24 v-20 a22 19 0 0 1 44 0 v20z" fill="#7d2f10" />
            <path d="M-15 24 v-14 a15 13 0 0 1 30 0 v14z" fill="#d1631a" />
            <path d="M-8 24 v-8 a8 7 0 0 1 16 0 v8z" fill="#f6b24a" />
          </g>
          <rect y="118" width="200" height="32" fill="#2b1e15" />
          {/* anvil */}
          <g transform="translate(74 118)">
            <path d="M-20 -10 h40 l-6 6 h-8 v10 h-12 v-10 h-8z" fill="#59616a" />
            <path d="M-20 -10 h40 l-2 2 h-36z" fill="#7d858f" />
            <rect x="-12" y="6" width="24" height="6" rx="1" fill="#3f454c" />
            <path d="M20 -10 l12 3 -12 3z" fill="#59616a" />
          </g>
          <Figure x={44} y={118} scale={1.55} cloak="#6a3a1c" under="#c9a882" arm="up" skin="#b07a4e" />
          {/* hammer + sparks */}
          <g transform="translate(62 66) rotate(-30)">
            <rect x="0" y="0" width="26" height="4" rx="2" fill="#6b4526" />
            <rect x="24" y="-4" width="11" height="12" rx="1.6" fill="#59616a" />
          </g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={74 + Math.cos(i * 1.1) * (10 + i * 4)}
              cy={104 - Math.abs(Math.sin(i * 1.1)) * (8 + i * 3)}
              r={1.6 - i * 0.15}
              fill="#ffd07a"
              opacity={0.9 - i * 0.12}
            />
          ))}
        </>
      );

    /* ────────────────────────────────────── VINTNER ── */
    case 'vintner':
      return (
        <>
          <Backdrop />
          <Hills />
          {/* terraced vines */}
          <g>
            {[86, 100, 114].map((y, row) => (
              <g key={y}>
                <path d={`M0 ${y}h200v12H0z`} fill={row % 2 ? '#8f9a5c' : '#7f8b50'} />
                {Array.from({ length: 9 }, (_, i) => (
                  <g key={i} transform={`translate(${10 + i * 22} ${y})`}>
                    <path d="M0 8V-6" stroke="#5c4a2a" strokeWidth="1.8" />
                    <path d="M-7 -6h14" stroke="#5c4a2a" strokeWidth="1.4" />
                    <circle cx="-4" cy="-2" r="3.2" fill="#5d2340" />
                    <circle cx="4" cy="-1" r="2.8" fill="#7d2340" />
                  </g>
                ))}
              </g>
            ))}
          </g>
          <rect y="126" width="200" height="24" fill="#6a4a2c" />
          <Amphorae x={22} y={140} n={3} scale={1.35} />
          {/* press */}
          <g transform="translate(150 126)">
            <rect x="-20" y="-14" width="40" height="14" rx="2" fill="#8a6039" />
            <rect x="-24" y="-18" width="48" height="5" rx="2" fill="#a57c4c" />
            <path d="M0 -18v-22" stroke="#6b4526" strokeWidth="4" />
            <rect x="-14" y="-46" width="28" height="6" rx="2" fill="#8a6039" />
          </g>
          <Figure x={92} y={140} scale={1.4} cloak="#5d2340" arm="work" />
        </>
      );

    /* ─────────────────────────────────────── WEAVER ── */
    case 'weaver':
      return (
        <>
          <Backdrop tint={1} />
          <rect width="200" height="150" fill="#e8d7b6" />
          <rect y="0" width="200" height="60" fill="#dfcaa4" />
          {/* window onto the sea */}
          <g transform="translate(146 16)">
            <path d="M0 54V16a20 20 0 0 1 40 0v38z" fill="#8fb9c4" />
            <path d="M0 40h40v14H0z" fill="#6e9fb0" />
            <path d="M0 54V16a20 20 0 0 1 40 0v38z" fill="none" stroke="#b79a6c" strokeWidth="3.4" />
            <DistantShip x={20} y={40} scale={0.55} />
          </g>
          <rect y="112" width="200" height="38" fill="#c2a87e" />
          {/* upright loom */}
          <g transform="translate(58 112)">
            <rect x="-34" y="-84" width="5" height="84" fill="#8a6039" />
            <rect x="29" y="-84" width="5" height="84" fill="#8a6039" />
            <rect x="-36" y="-88" width="72" height="6" rx="2" fill="#a57c4c" />
            {Array.from({ length: 15 }, (_, i) => (
              <path key={i} d={`M${-28 + i * 4} -82V-22`} stroke="#e0d0ae" strokeWidth="1.2" />
            ))}
            <rect x="-29" y="-44" width="58" height="22" fill="#4a5d8f" />
            <rect x="-29" y="-44" width="58" height="5" fill="#6e83b8" />
            <rect x="-29" y="-32" width="58" height="3" fill="#3b4c78" opacity="0.7" />
            {Array.from({ length: 15 }, (_, i) => (
              <circle key={i} cx={-28 + i * 4} cy="-18" r="2.4" fill="#b9a077" />
            ))}
          </g>
          <Figure x={128} y={136} scale={1.45} cloak="#4a5d8f" under="#f2e6cb" arm="out" />
          {/* folded bolts */}
          <g transform="translate(178 128)">
            <rect x="-14" y="-6" width="28" height="6" rx="1" fill="#7d2340" />
            <rect x="-14" y="0" width="28" height="6" rx="1" fill="#2f7a63" />
          </g>
        </>
      );

    default:
      return (
        <>
          <Backdrop />
          <Hills />
          <Ground />
        </>
      );
  }
}
