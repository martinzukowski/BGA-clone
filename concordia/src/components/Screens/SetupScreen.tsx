/**
 * Game setup.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MAPS, mapsForPlayerCount } from '../../game/data/maps';
import { AI_NAMES } from '../../game/data/names';
import type { AiDifficulty, PlayerColorId } from '../../game/engine/types';
import { useGame } from '../../store/game';
import { useSettings, type AnimationSpeed } from '../../store/settings';
import { LaurelRule, PLAYER_PALETTE } from '../ui/Icons';

const DIFFICULTY_BLURB: Record<AiDifficulty, string> = {
  easy: 'Knows the rules, not the game. Expands slowly and often takes the second-best line.',
  medium: 'A solid club player. Reads resources, expansion and card synergy, but only one turn deep.',
  hard: 'Plays the whole game: watches the leader, looks a turn ahead, and times the ending.',
};

const COLORS: PlayerColorId[] = ['crimson', 'azure', 'ochre', 'verdigris', 'obsidian'];

export function SetupScreen() {
  const go = useGame((s) => s.go);
  const newGame = useGame((s) => s.newGame);
  const settings = useSettings();

  const [name, setName] = useState(settings.playerName || 'Martin');
  const [opponents, setOpponents] = useState(2);
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');
  const [color, setColor] = useState<PlayerColorId>('crimson');
  const [mapId, setMapId] = useState(MAPS[0]!.id);

  const playerCount = opponents + 1;
  const available = useMemo(() => mapsForPlayerCount(playerCount), [playerCount]);
  const effectiveMapId = available.some((m) => m.id === mapId) ? mapId : (available[0]?.id ?? MAPS[0]!.id);
  const chosenMap = MAPS.find((m) => m.id === effectiveMapId)!;

  const start = () => {
    settings.set('playerName', name.trim() || 'Martin');
    const usedColors = new Set<PlayerColorId>([color]);
    const aiColors = COLORS.filter((c) => !usedColors.has(c));
    newGame({
      seed: Math.floor(Math.random() * 2_000_000_000),
      mapId: effectiveMapId,
      players: [
        { name: name.trim() || 'Martin', isHuman: true, color },
        ...Array.from({ length: opponents }, (_, i) => ({
          name: AI_NAMES[(i * 3 + opponents) % AI_NAMES.length]!,
          isHuman: false,
          difficulty,
          color: aiColors[i] ?? 'obsidian',
        })),
      ],
    });
  };

  return (
    <div className="app-shell grid min-h-full place-items-center overflow-y-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-parchment frame-stone w-full max-w-[720px] rounded-lg p-7"
      >
        <div className="mb-5 text-center">
          <h1 className="t-display text-[30px] leading-tight text-ink-800">Game Setup</h1>
          <div className="mt-2 flex justify-center">
            <LaurelRule width={240} />
          </div>
        </div>

        <div className="space-y-5">
          {/* name & colour */}
          <Field label="Your name">
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={22}
                className="t-display w-52 rounded-[4px] border px-3 py-2 text-[16px] text-ink-800 outline-none"
                style={{ borderColor: 'rgb(90 68 38 / .4)', background: 'rgb(255 252 244 / .6)' }}
              />
              <div className="flex gap-1.5">
                {COLORS.map((c) => {
                  const p = PLAYER_PALETTE[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      title={p.name}
                      onClick={() => setColor(c)}
                      className="h-8 w-8 rounded-full transition"
                      style={{
                        background: `radial-gradient(circle at 34% 30%, ${p.light}, ${p.base} 60%, ${p.dark})`,
                        boxShadow:
                          color === c
                            ? '0 0 0 2px #e6cd86, 0 2px 8px -2px #000'
                            : 'inset 0 1px 0 rgb(255 255 255 / .3)',
                        transform: color === c ? 'scale(1.1)' : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </Field>

          {/* opponents */}
          <Field label="Opponents" hint={`${playerCount} players in all`}>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} active={opponents === n} onClick={() => setOpponents(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </Field>

          {/* difficulty */}
          <Field label="Difficulty" hint={DIFFICULTY_BLURB[difficulty]}>
            <div className="flex gap-1.5">
              {(['easy', 'medium', 'hard'] as AiDifficulty[]).map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d}
                </Chip>
              ))}
            </div>
          </Field>

          {/* map */}
          <Field label="Map" hint={chosenMap.blurb}>
            <div className="flex flex-wrap gap-1.5">
              {MAPS.map((m) => {
                const usable = playerCount >= m.minPlayers && playerCount <= m.maxPlayers;
                return (
                  <Chip
                    key={m.id}
                    active={effectiveMapId === m.id}
                    disabled={!usable}
                    onClick={() => setMapId(m.id)}
                    title={usable ? m.blurb : `${m.minPlayers}–${m.maxPlayers} players only`}
                  >
                    {m.name}
                  </Chip>
                );
              })}
            </div>
            <div className="mt-1.5 text-[11.5px] text-ink-500">
              {chosenMap.cities.length - 1} cities · {chosenMap.provinces.length} provinces ·{' '}
              {chosenMap.routes.filter((r) => r.type === 'land').length} roads ·{' '}
              {chosenMap.routes.filter((r) => r.type === 'sea').length} sea lanes
            </div>
          </Field>

          {/* animation speed */}
          <Field label="Animation speed">
            <div className="flex gap-1.5">
              {(['normal', 'fast', 'instant'] as AnimationSpeed[]).map((s) => (
                <Chip
                  key={s}
                  active={settings.animationSpeed === s}
                  onClick={() => settings.set('animationSpeed', s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button type="button" className="btn btn-ghost !text-ink-600" onClick={() => go('menu')}>
            ← Back
          </button>
          <button type="button" className="btn btn-primary !px-8 !py-3 !text-[14px]" onClick={start}>
            Start game
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="t-label mb-1.5">{label}</div>
      {children}
      {hint && <div className="mt-1.5 text-[12px] italic leading-snug text-ink-500">{hint}</div>}
    </div>
  );
}

function Chip({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick(): void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-[4px] px-4 py-2 text-[12px] uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        background: active
          ? 'linear-gradient(180deg,#e6cd86,#cfae52 48%,#a9862a)'
          : 'rgb(90 68 38 / .1)',
        color: active ? '#2a2010' : 'var(--color-ink-600)',
        boxShadow: active ? 'inset 0 1px 0 rgb(255 255 255 / .5), 0 2px 6px -2px rgb(0 0 0 / .4)' : undefined,
        border: '1px solid rgb(90 68 38 / .3)',
      }}
    >
      {children}
    </button>
  );
}
