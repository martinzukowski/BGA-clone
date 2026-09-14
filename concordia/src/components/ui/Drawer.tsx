/**
 * An edge drawer.
 *
 * The board is the game; everything else is a tray that slides out over it when
 * you want it and gets out of the way when you don't. Each drawer keeps a
 * always-visible **handle** carrying the one or two numbers worth glancing at,
 * so closing a drawer never costs you information you need every turn.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

export type DrawerEdge = 'bottom' | 'right';

export interface DrawerProps {
  edge: DrawerEdge;
  open: boolean;
  onToggle(open: boolean): void;
  /** Contents of the always-visible handle. */
  handle: React.ReactNode;
  /** Size along the drawer's axis: height for `bottom`, width for `right`. */
  size: number;
  children: React.ReactNode;
  /** Distance from the far edge, so drawers can avoid each other. */
  inset?: number;
  className?: string;
  /** Opens the drawer whenever this flips true — used when the rules need it. */
  demand?: boolean;
}

export function Drawer({
  edge,
  open,
  onToggle,
  handle,
  size,
  children,
  inset = 0,
  className,
  demand = false,
}: DrawerProps) {
  // When the engine asks for something that lives in this drawer — a trade, a
  // purchase — it opens itself rather than making the player hunt for it.
  useEffect(() => {
    if (demand && !open) onToggle(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand]);

  const isBottom = edge === 'bottom';

  return (
    <div
      className={`pointer-events-none absolute z-30 flex ${
        isBottom ? 'bottom-0 left-0 flex-col justify-end' : 'right-0 top-0 h-full flex-row justify-end'
      } ${className ?? ''}`}
      style={isBottom ? { right: inset } : { bottom: inset }}
    >
      {/* ── handle ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className={`pointer-events-auto frame-stone group relative flex items-center gap-2 ${
          isBottom
            ? 'mx-3 self-start rounded-t-md px-4 py-1.5'
            : 'my-3 self-center rounded-l-md px-1.5 py-4'
        }`}
        style={{
          background: 'linear-gradient(180deg,#3a352d,#262220)',
          order: isBottom ? 0 : 1,
          writingMode: isBottom ? undefined : 'vertical-rl',
        }}
      >
        {handle}
        <span
          className="text-[10px] leading-none text-gold-500 transition-transform group-hover:text-gold-300"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          {isBottom ? '▲' : '◀'}
        </span>
      </button>

      {/* ── tray ────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={isBottom ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
            animate={isBottom ? { height: size, opacity: 1 } : { width: size, opacity: 1 }}
            exit={isBottom ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="pointer-events-auto overflow-hidden"
            style={{
              order: isBottom ? 1 : 0,
              background: 'linear-gradient(180deg, rgb(28 25 21 / .93), rgb(20 18 15 / .97))',
              backdropFilter: 'blur(6px)',
              borderTop: isBottom ? '1px solid rgb(184 145 47 / .4)' : undefined,
              borderLeft: isBottom ? undefined : '1px solid rgb(184 145 47 / .4)',
              boxShadow: isBottom ? '0 -18px 40px -20px #000' : '-18px 0 40px -20px #000',
            }}
          >
            <div style={isBottom ? { height: size } : { width: size, height: '100%' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A small numeric badge for drawer handles. */
export function HandleStat({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label?: string;
}) {
  return (
    <span className="flex items-center gap-1.5" title={label}>
      {icon}
      <span className="text-[13px] font-semibold tabular-nums leading-none text-parch-100">{value}</span>
      {label && (
        <span className="t-label text-[7.5px] leading-none text-parch-500">{label}</span>
      )}
    </span>
  );
}
