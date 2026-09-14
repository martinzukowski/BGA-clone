/**
 * A personality card.
 *
 * Illustrated tabletop card, not an HTML panel: parchment stock, an engraved
 * gold rule, a cost cartouche in oxidised red, the illustration, the Latin
 * title, the action text, and a god band along the foot.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { GOD_DOMAIN, GOD_NAME, ROLE_LABEL, getCardDef } from '../../game/data/cards';
import { goodMeta } from '../../game/data/goods';
import type { CostItem } from '../../game/engine/types';
import { GoodIcon } from '../Goods/GoodIcon';
import { GodIcon } from '../ui/Icons';
import { CardArt } from './CardArt';

export type CardSize = 'tiny' | 'small' | 'medium' | 'large';

const DIMENSIONS: Record<CardSize, { w: number; h: number; art: number; title: number; body: number }> = {
  tiny: { w: 78, h: 112, art: 78, title: 10.5, body: 0 },
  small: { w: 116, h: 168, art: 116, title: 13.5, body: 8.5 },
  medium: { w: 150, h: 218, art: 150, title: 17, body: 10 },
  large: { w: 262, h: 380, art: 262, title: 28, body: 14.5 },
};

export interface PersonalityCardProps {
  defId: string;
  size?: CardSize;
  /** Extra goods charged for the display position (RULES 12.2). */
  surcharge?: readonly CostItem[];
  selected?: boolean;
  disabled?: boolean;
  /** Dulls the card and blocks the hover lift. */
  muted?: boolean;
  onClick?(): void;
  onHoverStart?(): void;
  onHoverEnd?(): void;
  /** Framer layout id, so a bought card can fly from the forum to the hand. */
  layoutId?: string;
  className?: string;
}

export const PersonalityCard = memo(function PersonalityCard({
  defId,
  size = 'small',
  surcharge,
  selected = false,
  disabled = false,
  muted = false,
  onClick,
  onHoverStart,
  onHoverEnd,
  layoutId,
  className,
}: PersonalityCardProps) {
  const def = getCardDef(defId);
  const dim = DIMENSIONS[size];
  const interactive = !!onClick && !disabled;

  return (
    <motion.div
      layoutId={layoutId}
      onClick={interactive ? onClick : undefined}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={interactive ? { y: -10, scale: 1.03 } : undefined}
      animate={selected ? { y: -14, scale: 1.05 } : { y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 460, damping: 32 }}
      className={`relative shrink-0 overflow-hidden ${className ?? ''}`}
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: 'var(--radius-card)',
        cursor: interactive ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : muted ? 0.72 : 1,
        filter: disabled ? 'grayscale(0.55)' : undefined,
        boxShadow: selected
          ? '0 0 0 2px #e6cd86, 0 18px 38px -12px rgb(0 0 0 / .8)'
          : '0 8px 20px -10px rgb(0 0 0 / .85), inset 0 0 0 1px rgb(60 44 22 / .5)',
        background: 'linear-gradient(178deg,#f3e7cd 0%,#e7d6b4 55%,#dcc7a0 100%)',
      }}
    >
      {/* paper grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'var(--tex-fibre)', mixBlendMode: 'multiply', opacity: 0.85 }}
      />

      {/* ── illustration ─────────────────────────────────── */}
      <div className="relative" style={{ height: Math.round((dim.art * 3) / 4) }}>
        <CardArt role={def.role} width={dim.art} />
        {/* vignette so the art sits into the card rather than on it */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 -14px 20px -10px rgb(120 92 52 / .8), inset 0 0 0 1px rgb(90 68 38 / .4)',
          }}
        />
      </div>

      {/* ── cost cartouche ───────────────────────────────── */}
      {(def.cost.length > 0 || (surcharge?.length ?? 0) > 0) && (
        <div
          className="absolute left-0 top-0 flex items-center gap-[3px] rounded-br-[8px] px-1.5 py-1"
          style={{
            background: 'linear-gradient(165deg,#8d2f34,#5f1c20)',
            boxShadow: '0 2px 8px -2px rgb(0 0 0 / .7), inset 0 1px 0 rgb(255 255 255 / .18)',
          }}
        >
          {def.cost.map((c, i) => (
            <CostChip key={`c${i}`} item={c} size={size === 'large' ? 20 : size === 'tiny' ? 12 : 15} />
          ))}
          {surcharge && surcharge.length > 0 && (
            <>
              <span className="mx-[1px] text-[10px] leading-none text-parch-300/70">+</span>
              {surcharge.map((c, i) => (
                <CostChip
                  key={`s${i}`}
                  item={c}
                  size={size === 'large' ? 20 : size === 'tiny' ? 12 : 15}
                  faded
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Minerva value badge ──────────────────────────── */}
      {def.minervaValue !== undefined && (
        <div
          className="absolute right-1.5 top-1.5 grid place-items-center rounded-full"
          style={{
            width: size === 'large' ? 40 : size === 'tiny' ? 20 : 27,
            height: size === 'large' ? 40 : size === 'tiny' ? 20 : 27,
            background: 'radial-gradient(circle at 32% 28%, #f0dfa4, #c9a53c 62%, #8a6a17)',
            boxShadow: '0 2px 8px -2px rgb(0 0 0 / .7), inset 0 1px 0 rgb(255 255 255 / .5)',
            color: '#3a2c0c',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: size === 'large' ? 19 : size === 'tiny' ? 10 : 13,
          }}
          title={`${def.minervaValue} VP per ${def.specialistGood} city`}
        >
          {def.minervaValue}
        </div>
      )}

      {/* ── text block ───────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col px-2 pt-1.5" style={{ height: `calc(100% - ${Math.round((dim.art * 3) / 4)}px)` }}>
        <div
          className="t-display leading-none text-ink-800"
          style={{ fontSize: dim.title, letterSpacing: '0.04em' }}
        >
          {def.title}
        </div>
        {size !== 'tiny' && (
          <div
            className="t-label mt-[2px] leading-none"
            style={{ fontSize: size === 'large' ? 10 : 8, letterSpacing: '0.2em' }}
          >
            {ROLE_LABEL[def.role]}
            {def.mercatorMoney ? ` · ${def.mercatorMoney}₴` : ''}
          </div>
        )}

        {dim.body > 0 && (
          <>
            <div className="divider-gold my-1.5" />
            <p
              className="flex-1 leading-snug text-ink-700"
              style={{ fontSize: dim.body, fontFamily: 'var(--font-body)' }}
            >
              {def.summary}
            </p>
          </>
        )}

        {/* god band */}
        <div
          className="-mx-2 mt-auto flex items-center gap-1.5 px-2 py-1"
          style={{
            background: 'linear-gradient(180deg, rgb(60 44 22 / .1), rgb(60 44 22 / .22))',
            borderTop: '1px solid rgb(184 145 47 / .45)',
          }}
        >
          <GodIcon god={def.god} size={size === 'large' ? 22 : size === 'tiny' ? 13 : 16} tone="#8a6a17" />
          <span
            className="t-caps text-ink-600"
            style={{ fontSize: size === 'large' ? 12 : size === 'tiny' ? 7.5 : 9 }}
          >
            {GOD_NAME[def.god]}
          </span>
          {size === 'large' && (
            <span className="ml-auto text-[11px] italic text-ink-500">{GOD_DOMAIN[def.god]}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function CostChip({ item, size, faded }: { item: CostItem; size: number; faded?: boolean }) {
  if (item === 'any') {
    return (
      <span
        className="grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: 'rgb(247 239 220 / .9)',
          color: '#5f1c20',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.7,
          lineHeight: 1,
          opacity: faded ? 0.75 : 1,
        }}
        title="Any one good of your choice"
      >
        ?
      </span>
    );
  }
  return (
    <span style={{ opacity: faded ? 0.8 : 1 }} title={goodMeta(item).name}>
      <GoodIcon good={item} size={size} />
    </span>
  );
}

/** The reverse of a card — used for the draw stack. */
export function CardBack({ size = 'small' }: { size?: CardSize }) {
  const dim = DIMENSIONS[size];
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: 'var(--radius-card)',
        background: 'linear-gradient(160deg,#5c3f26,#3c2917 60%,#2c1e11)',
        boxShadow: '0 8px 20px -10px rgb(0 0 0 / .9), inset 0 0 0 1px rgb(184 145 47 / .35)',
      }}
    >
      <svg viewBox="0 0 100 140" width={dim.w} height={dim.h} aria-hidden>
        <rect x="6" y="6" width="88" height="128" rx="5" fill="none" stroke="#b8912f" strokeWidth="1" opacity="0.6" />
        <rect x="10" y="10" width="80" height="120" rx="3" fill="none" stroke="#b8912f" strokeWidth="0.5" opacity="0.4" />
        {/* a laurel medallion */}
        <circle cx="50" cy="70" r="24" fill="none" stroke="#b8912f" strokeWidth="1.2" opacity="0.75" />
        <circle cx="50" cy="70" r="18" fill="none" stroke="#d4b558" strokeWidth="0.6" opacity="0.5" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <ellipse
              key={i}
              cx={50 + Math.cos(a) * 24}
              cy={70 + Math.sin(a) * 24}
              rx="4"
              ry="1.7"
              fill="#b8912f"
              opacity="0.55"
              transform={`rotate(${(i / 12) * 360} ${50 + Math.cos(a) * 24} ${70 + Math.sin(a) * 24})`}
            />
          );
        })}
        <text
          x="50"
          y="76"
          textAnchor="middle"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 17, fill: '#d4b558', letterSpacing: '0.1em' }}
        >
          IM
        </text>
      </svg>
    </div>
  );
}
