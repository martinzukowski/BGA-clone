/**
 * The main menu: a title plate on a dark marble ground, with the ongoing game
 * offered first when there is one.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { loadGame } from '../../utils/persistence';
import { useGame } from '../../store/game';
import { LaurelRule, PLAYER_PALETTE } from '../ui/Icons';
import { getMap } from '../../game/data/maps';

export function MainMenu({
  onRules,
  onSettings,
}: {
  onRules(): void;
  onSettings(): void;
}) {
  const go = useGame((s) => s.go);
  const continueGame = useGame((s) => s.continueGame);
  const saveToken = useGame((s) => s.saveToken);

  // `saveToken` is bumped whenever a save is written, and is the only thing
  // that can change what localStorage holds — so it is the right cache key here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => loadGame(), [saveToken]);

  return (
    <div className="app-shell relative grid min-h-full place-items-center overflow-hidden px-6 py-10">
      {/* a faint chart in the background */}
      <BackdropChart />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="mb-8 text-center">
          <div className="t-caps text-[11px] tracking-[0.45em] text-gold-600">Anno Vrbis Conditae</div>
          <h1 className="t-display mt-2 text-[54px] leading-none tracking-[0.1em]">
            <span className="t-gilt">IMPERIVM</span>
          </h1>
          <h2 className="t-display text-[26px] leading-tight tracking-[0.3em] text-parch-300">
            MERCATORVM
          </h2>
          <div className="mt-3 flex justify-center">
            <LaurelRule width={300} />
          </div>
          <p className="mx-auto mt-3 max-w-[380px] text-[14px] italic leading-relaxed text-parch-500">
            Send colonists across the inland sea, raise houses in the cities they reach, and build
            a trade network worth more than your rivals'.
          </p>
        </div>

        <div className="space-y-2.5">
          {saved && (
            <MenuButton
              primary
              title="Continue game"
              subtitle={`${getMap(saved.summary.mapId).name} · round ${saved.summary.roundNumber} · ${saved.summary.players.map((p) => p.name).join(', ')}`}
              accent={saved.summary.players.find((p) => p.isHuman)?.color}
              onClick={() => {
                if (!continueGame()) go('setup');
              }}
            />
          )}
          <MenuButton
            primary={!saved}
            title="New game"
            subtitle="Choose your opponents, their strength and the map"
            onClick={() => go('setup')}
          />
          <MenuButton title="How to play" subtitle="Learn the whole game in ten minutes" onClick={onRules} />
          <MenuButton title="Settings" subtitle="Animation speed, sound, saved game" onClick={onSettings} />
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-parch-500/70">
          An original Roman trading game. All artwork, maps, icons and typography in this build were
          made for it; nothing is reproduced from any published edition.
        </p>
      </motion.div>
    </div>
  );
}

function MenuButton({
  title,
  subtitle,
  onClick,
  primary = false,
  accent,
}: {
  title: string;
  subtitle: string;
  onClick(): void;
  primary?: boolean;
  accent?: string;
}) {
  const palette = accent ? PLAYER_PALETTE[accent as 'crimson'] : null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="frame-stone group relative flex w-full items-center gap-4 rounded-md px-5 py-4 text-left"
      style={{
        background: primary
          ? 'linear-gradient(180deg,#463f34,#2e2922)'
          : 'linear-gradient(180deg,#332e27,#25211c)',
      }}
    >
      <span
        className="h-9 w-[3px] rounded-full transition-all group-hover:h-11"
        style={{
          background: palette
            ? `linear-gradient(180deg, ${palette.light}, ${palette.base})`
            : 'linear-gradient(180deg,#e6cd86,#a9862a)',
        }}
      />
      <span className="flex-1">
        <span className="t-display block text-[19px] leading-tight text-parch-100">{title}</span>
        <span className="mt-[2px] block text-[12px] text-parch-500">{subtitle}</span>
      </span>
      <span className="text-gold-500 opacity-60 transition group-hover:opacity-100">→</span>
    </motion.button>
  );
}

/** A very faint decorative chart behind the menu. */
function BackdropChart() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="menuRose">
          <stop offset="0%" stopColor="#e6cd86" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e6cd86" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* rhumb lines from a compass rose */}
      <g stroke="#e6cd86" strokeWidth="0.8" opacity="0.55">
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return <line key={i} x1={600} y1={400} x2={600 + Math.cos(a) * 900} y2={400 + Math.sin(a) * 900} />;
        })}
      </g>
      <circle cx="600" cy="400" r="150" fill="none" stroke="#e6cd86" strokeWidth="1.4" />
      <circle cx="600" cy="400" r="240" fill="none" stroke="#e6cd86" strokeWidth="0.9" />
      <circle cx="600" cy="400" r="60" fill="url(#menuRose)" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        return (
          <path
            key={i}
            d={`M600 400 L${600 + Math.cos(a - 0.09) * 130} ${400 + Math.sin(a - 0.09) * 130} L${600 + Math.cos(a) * 190} ${400 + Math.sin(a) * 190} L${600 + Math.cos(a + 0.09) * 130} ${400 + Math.sin(a + 0.09) * 130}z`}
            fill="#e6cd86"
            opacity={i % 2 ? 0.3 : 0.55}
          />
        );
      })}
    </svg>
  );
}
