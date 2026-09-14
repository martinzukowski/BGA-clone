import { useEffect } from 'react';
import { clearSave, hasSave } from '../../utils/persistence';
import { sound } from '../../utils/sound';
import { useGame } from '../../store/game';
import { useSettings, type AnimationSpeed } from '../../store/settings';
import { Modal } from './Modal';

export function SettingsModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const s = useSettings();
  const abandon = useGame((g) => g.abandonGame);

  // Keep the audio layer in step with the preferences.
  useEffect(() => {
    sound.configure({ effects: s.soundEffects, music: s.music, volume: s.volume });
  }, [s.soundEffects, s.music, s.volume]);

  return (
    <Modal open={open} title="Settings" onClose={onClose} width={480}>
      <div className="space-y-4">
        <Group label="Animation speed" hint="How briskly the board plays out each action.">
          <Segmented
            value={s.animationSpeed}
            options={[
              ['normal', 'Normal'],
              ['fast', 'Fast'],
              ['instant', 'Instant'],
            ]}
            onChange={(v) => s.set('animationSpeed', v as AnimationSpeed)}
          />
        </Group>

        <Group
          label="Legal-move highlighting"
          hint="Glows the pieces, routes and cities you may click. Turn it off for a sterner game."
        >
          <Toggle value={s.showLegalHighlights} onChange={(v) => s.set('showLegalHighlights', v)} />
        </Group>

        <Group label="Sound effects" hint="Coins, ships, construction. Silent if no audio files are installed.">
          <Toggle value={s.soundEffects} onChange={(v) => s.set('soundEffects', v)} />
        </Group>

        <Group label="Music" hint="An ambient loop, when one is present in /assets/sounds.">
          <Toggle value={s.music} onChange={(v) => s.set('music', v)} />
        </Group>

        <Group label="Volume">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(e) => s.set('volume', Number(e.target.value))}
            className="w-44 accent-[#b8912f]"
          />
        </Group>

        <div className="divider-gold my-1" />

        <Group label="Saved game" hint="One game is kept in this browser and saved after every turn.">
          <button
            type="button"
            className="btn btn-danger"
            disabled={!hasSave()}
            onClick={() => {
              clearSave();
              abandon();
              onClose();
            }}
          >
            Delete save
          </button>
        </Group>
      </div>
    </Modal>
  );
}

function Group({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <div className="t-caps text-[12px] text-ink-700">{label}</div>
        {hint && <div className="mt-[2px] text-[12px] italic leading-snug text-ink-500">{hint}</div>}
      </div>
      <div className="shrink-0 pt-[2px]">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange(v: string): void;
}) {
  return (
    <div className="flex overflow-hidden rounded-[4px]" style={{ border: '1px solid rgb(90 68 38 / .45)' }}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition"
          style={{
            background:
              value === v ? 'linear-gradient(180deg,#e6cd86,#cfae52 48%,#a9862a)' : 'rgb(90 68 38 / .08)',
            color: value === v ? '#2a2010' : 'var(--color-ink-600)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange(v: boolean): void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative h-6 w-11 rounded-full transition"
      style={{
        background: value ? 'linear-gradient(180deg,#cfae52,#a9862a)' : 'rgb(90 68 38 / .3)',
        boxShadow: 'inset 0 1px 3px rgb(50 36 18 / .45)',
      }}
    >
      <span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all"
        style={{
          left: value ? 26 : 3,
          background: 'linear-gradient(180deg,#fdf6e6,#ddd0b4)',
          boxShadow: '0 1px 3px rgb(0 0 0 / .45)',
        }}
      />
    </button>
  );
}
