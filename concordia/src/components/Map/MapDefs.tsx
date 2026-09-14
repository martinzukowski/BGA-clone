/**
 * Reusable SVG paint for the board: parchment, sea, terrain washes, engraving
 * filters and drop shadows. Defined once and referenced by url(#id).
 *
 * Everything is procedural — there are no image assets in the board at all,
 * which is why it stays crisp at any zoom.
 */

import { memo } from 'react';

export const MapDefs = memo(function MapDefs() {
  return (
    <defs>
      {/* ── the sea ─────────────────────────────────────────── */}
      <linearGradient id="seaFill" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stopColor="#8fb9c4" />
        <stop offset="45%" stopColor="#6e9fb0" />
        <stop offset="100%" stopColor="#4e7f95" />
      </linearGradient>

      <filter id="seaTexture" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014 0.05" numOctaves="4" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
      </filter>

      {/* Faint concentric swell lines, like an engraved chart. */}
      <pattern id="seaSwell" width="140" height="90" patternUnits="userSpaceOnUse">
        <path
          d="M-20 30 Q35 12 90 30 T200 30 M-20 66 Q35 48 90 66 T200 66"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.14"
          strokeWidth="1.1"
        />
      </pattern>

      {/* ── parchment landmass ──────────────────────────────── */}
      <linearGradient id="landFill" x1="0.1" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#f2e6cd" />
        <stop offset="52%" stopColor="#e7d6b3" />
        <stop offset="100%" stopColor="#d8c197" />
      </linearGradient>

      {/*
        Both the coastline-tone shadow shapes and the inset parchment fill run
        through the *same* large-scale turbulence field (same baseFrequency
        and seed), so the coast wobbles as one continuous hand-inked line
        rather than the shadow and the fill drifting apart from each other.
      */}
      <filter id="landShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="21" result="wobbleField" />
        <feDisplacementMap in="SourceGraphic" in2="wobbleField" scale="18" result="wobbled" />
        <feDropShadow in="wobbled" dx="0" dy="5" stdDeviation="7" floodColor="#1b2b33" floodOpacity="0.45" />
      </filter>

      <filter id="parchGrain" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="21" result="wobbleField" />
        <feDisplacementMap in="SourceGraphic" in2="wobbleField" scale="18" result="wobbled" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="3" result="grain" />
        <feColorMatrix in="grain" type="saturate" values="0" result="gray" />
        <feComponentTransfer in="gray" result="soft">
          <feFuncA type="linear" slope="0.12" />
        </feComponentTransfer>
        <feComposite in="soft" in2="wobbled" operator="in" result="grainOnly" />
        <feBlend in="wobbled" in2="grainOnly" mode="multiply" />
      </filter>

      {/* A finer wobbling edge for province borders, so they look inked rather than plotted. */}
      <filter id="inkEdge" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="11" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
      </filter>

      {/* ── terrain washes ─────────────────────────────────── */}
      {[
        ['coast', '#cdbb90', '#b9a377'],
        ['inland', '#cfc094', '#bcab7c'],
        ['mountain', '#c5b48c', '#a89571'],
        ['desert', '#dcc79a', '#c9b184'],
        ['island', '#cfbe95', '#b7a279'],
      ].map(([id, a, b]) => (
        <linearGradient key={id} id={`terrain-${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={a} stopOpacity="0.55" />
          <stop offset="100%" stopColor={b} stopOpacity="0.72" />
        </linearGradient>
      ))}

      {/* Hatching for mountainous provinces. */}
      <pattern id="hatchMountain" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <path d="M0 0v9" stroke="#8d7a52" strokeOpacity="0.22" strokeWidth="1.1" />
      </pattern>
      <pattern id="hatchDesert" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="0.9" fill="#a8905f" fillOpacity="0.3" />
        <circle cx="10" cy="9" r="0.9" fill="#a8905f" fillOpacity="0.3" />
      </pattern>
      {/* A scatter of tiny pine ticks for wooded inland provinces. */}
      <pattern id="hatchForest" width="17" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <path d="M2 11l1.6-4.4L5.2 11z" fill="#5c6b3f" fillOpacity="0.24" />
        <path d="M11 13l1.3-3.6L13.6 13z" fill="#5c6b3f" fillOpacity="0.2" />
      </pattern>
      {/* Fine wave dashes for coast and island provinces. */}
      <pattern id="hatchCoast" width="22" height="11" patternUnits="userSpaceOnUse">
        <path d="M0 6q3-2.6 5.5 0T11 6t5.5 0T22 6" fill="none" stroke="#3d6a7e" strokeOpacity="0.2" strokeWidth="1" />
      </pattern>

      {/* ── shadows & glows ────────────────────────────────── */}
      <filter id="pieceShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.5" floodColor="#2a2115" floodOpacity="0.5" />
      </filter>

      <filter id="legalGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3.4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <radialGradient id="cityGlow">
        <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.95" />
        <stop offset="70%" stopColor="#e5b94a" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#e5b94a" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="produceGlow">
        <stop offset="0%" stopColor="#ffeec2" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#d8a63c" stopOpacity="0" />
      </radialGradient>

      {/* ── the capital's laurel ring ──────────────────────── */}
      <radialGradient id="capitalHalo">
        <stop offset="55%" stopColor="#c9a53c" stopOpacity="0" />
        <stop offset="82%" stopColor="#c9a53c" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#c9a53c" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
});
