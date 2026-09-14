/**
 * The table.
 *
 * The board *is* the screen. Everything else floats over it and gets out of the
 * way: the chronicle and rivals collapse to a line, the cards slide up from the
 * bottom edge, the treasury slides in from the right, and the action panel sits
 * in the corner telling you what the rules are waiting for.
 *
 *  ┌──────────────────────── top bar ─────────────────────────┐
 *  │ ┌ chronicle ┐                            ┌ rivals ┐      │
 *  │                                                     ║ ▌  │ ← treasury
 *  │                    M A P                            ║    │
 *  │                                          ┌──────────┐    │
 *  │ ╔══ cards ══════════════════════╗        │  action  │    │
 *  └──────────────────────────────────────────────────────────┘
 */

import { useState } from 'react';
import { ActionPanel } from '../ActionPanel/ActionPanel';
import { AiThinkingPlate, CardPlayFlourish, ErrorToast } from '../Animations/Overlays';
import { ChroniclePanel, RivalsPanel } from '../Animations/FloatingPanels';
import { CardsDrawer } from '../Hand/CardsDrawer';
import { Board } from '../Map/Board';
import { BuildConfirm } from '../Modals/BuildConfirm';
import { HowToPlay } from '../Modals/HowToPlay';
import { SettingsModal } from '../Modals/SettingsModal';
import { DebugPanel } from '../Modals/DebugPanel';
import { CardInspector } from '../PersonalityCard/CardInspector';
import { TreasuryDrawer } from '../PlayerBoard/TreasuryDrawer';
import { TopBar } from '../TurnIndicator/TopBar';
import { diplomatTargets } from '../../game/engine/rules';
import { useGame } from '../../store/game';
import { Modal } from '../Modals/Modal';

/** Width of the action-panel column, which the other trays keep clear of. */
const ACTION_W = 348;

export function GameScreen() {
  const game = useGame((s) => s.game);
  const busy = useGame((s) => s.busy);
  const pendingBuild = useGame((s) => s.interaction.pendingBuild);
  const go = useGame((s) => s.go);
  const abandon = useGame((s) => s.abandonGame);

  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  if (!game) return null;

  const human = game.players.find((p) => p.isHuman) ?? game.players[0]!;
  const yourTurn = game.currentPlayer === human.id && !busy;
  const canPlayCard = yourTurn && game.pending === null;
  const copyTargets =
    yourTurn && game.pending?.step === 'diplomat:choose' ? diplomatTargets(game, human.id) : [];

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      <TopBar
        state={game}
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
      />

      {/* ── the table ─────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Board />
        <CardInspector />

        {/* chronicle, top left */}
        <div className="pointer-events-none absolute left-3 top-3 z-20">
          <div className="pointer-events-auto">
            <ChroniclePanel />
          </div>
        </div>

        {/* rivals, top right — clear of the treasury handle */}
        <div className="pointer-events-none absolute right-16 top-3 z-20">
          <div className="pointer-events-auto">
            <RivalsPanel state={game} humanId={human.id} copyTargets={copyTargets} />
          </div>
        </div>

        {/* the action panel — the one thing that never hides */}
        <div className="absolute bottom-3 z-40" style={{ right: 60, width: ACTION_W }}>
          <ActionPanel state={game} playerId={human.id} />
        </div>

        {/* trays */}
        <CardsDrawer
          state={game}
          playerId={human.id}
          canPlay={canPlayCard}
          rightInset={ACTION_W + 76}
        />
        <TreasuryDrawer state={game} playerId={human.id} bottomInset={0} />

        {/* overlays */}
        <AiThinkingPlate />
        {pendingBuild && <BuildConfirm />}
      </div>

      <CardPlayFlourish />
      <ErrorToast />

      <HowToPlay open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Modal
        open={menuOpen}
        title="Pause"
        subtitle="Your game is saved after every turn"
        width={420}
        onClose={() => setMenuOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost !text-ink-600" onClick={() => setMenuOpen(false)}>
              Resume
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMenuOpen(false);
                go('menu');
              }}
            >
              Main menu
            </button>
            <button type="button" className="btn btn-danger" onClick={abandon}>
              Abandon game
            </button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-700">
          Leaving for the main menu keeps this game — you can pick it up again from{' '}
          <b>Continue game</b>. Abandoning deletes the save.
        </p>
        {import.meta.env.DEV && (
          <button
            type="button"
            className="btn btn-ghost mt-4 !text-ink-600"
            onClick={() => {
              setMenuOpen(false);
              setDebugOpen(true);
            }}
          >
            Open debug panel
          </button>
        )}
      </Modal>

      {import.meta.env.DEV && <DebugPanel open={debugOpen} onClose={() => setDebugOpen(false)} />}
    </div>
  );
}
