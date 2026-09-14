/**
 * Screen routing and app-level chrome.
 */

import { useEffect, useState } from 'react';
import { GameScreen } from './components/Screens/GameScreen';
import { MainMenu } from './components/Screens/MainMenu';
import { SetupScreen } from './components/Screens/SetupScreen';
import { HowToPlay } from './components/Modals/HowToPlay';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ScoreScreen } from './components/Modals/ScoreScreen';
import { useGame } from './store/game';
import { useSettings } from './store/settings';
import { sound } from './utils/sound';

export default function App() {
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const soundEffects = useSettings((s) => s.soundEffects);
  const music = useSettings((s) => s.music);
  const volume = useSettings((s) => s.volume);

  useEffect(() => {
    sound.configure({ effects: soundEffects, music, volume });
  }, [soundEffects, music, volume]);

  if (screen === 'game' && game) return <GameScreen />;
  if (screen === 'over' && game) return <ScoreScreen state={game} />;
  if (screen === 'setup') return <SetupScreen />;

  return (
    <>
      <MainMenu onRules={() => setRulesOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <HowToPlay open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
