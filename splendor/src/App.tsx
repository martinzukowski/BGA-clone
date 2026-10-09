import { useEffect } from 'react'
import { playerBonuses } from '@/game/engine/rules'
import { useBotTurns } from '@/hooks/useBotTurns'
import { useFlashCards } from '@/hooks/useFlashCards'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'
import { Market, PatronColumn } from '@/components/Board/Board'
import { BankColumn } from '@/components/GemBank/GemBank'
import { GemFlights } from '@/components/GemBank/GemFlights'
import { MyGems } from '@/components/PlayerArea/MyGems'
import { MyPatrons, MyReserved } from '@/components/PlayerArea/MyTableau'
import { PlayerBoards } from '@/components/PlayerArea/PlayerBoards'
import { ActionLog } from '@/components/GameControls/ActionLog'
import { DebugPanel } from '@/components/GameControls/DebugPanel'
import { SetupScreen } from '@/components/GameControls/SetupScreen'
import { StatusBanner } from '@/components/GameControls/StatusBanner'
import { TopBar } from '@/components/GameControls/TopBar'
import { GameOverModal } from '@/components/Modals/GameOverModal'
import { PatronChoiceModal } from '@/components/Modals/PatronChoiceModal'
import { RulesModal } from '@/components/Modals/RulesModal'
import { TokenReturnModal } from '@/components/Modals/TokenReturnModal'

export default function App() {
  const init = useGameStore((s) => s.init)
  const screen = useGameStore((s) => s.screen)
  const game = useGameStore((s) => s.game)

  useEffect(() => {
    init()
  }, [init])

  useBotTurns()

  return (
    <>
      {screen === 'setup' || !game ? <SetupScreen /> : <GameScreen />}
      <RulesModal />
    </>
  )
}

function GameScreen() {
  const state = useGameStore((s) => s.game)!
  const error = useGameStore((s) => s.error)
  const dismissError = useGameStore((s) => s.dismissError)
  const flashCardIds = useFlashCards(state)

  const human = state.players.find((p) => p.id === HUMAN_ID)!
  const bonuses = playerBonuses(human)

  // The table only accepts input on the human's turn, in a main-action phase.
  const interactive =
    state.players[state.currentPlayerIndex]?.id === HUMAN_ID &&
    (state.phase === 'playing' || state.phase === 'final-round')

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar and turn banner stick together, so neither can overlap the other. */}
      <div className="sticky top-0 z-30">
        <TopBar state={state} />
        <StatusBanner state={state} />
      </div>

      <main className="mx-auto grid w-full max-w-[100rem] flex-1 grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col items-center gap-6">
          {/*
            The table: decks and market, then the bank, then the patrons, side
            by side on wide screens. Below xl the bank and patron columns turn
            into rows under the market.
          */}
          <div className="flex max-w-full flex-col items-center gap-5 overflow-x-auto pb-1 xl:flex-row xl:items-start">
            <Market
              state={state}
              player={human}
              interactive={interactive}
              flashCardIds={flashCardIds}
            />
            <BankColumn state={state} interactive={interactive} />
            <PatronColumn state={state} bonuses={bonuses} />
          </div>

          <MyGems state={state} />

          <div className="flex w-full max-w-[60rem] flex-col gap-5 md:flex-row">
            <MyReserved state={state} interactive={interactive} flashCardIds={flashCardIds} />
            <MyPatrons state={state} />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 xl:sticky xl:top-28 xl:max-h-[calc(100dvh-8rem)]">
          <PlayerBoards state={state} />
          <div className="flex min-h-48 flex-1 flex-col">
            <ActionLog state={state} />
          </div>
        </aside>
      </main>

      {error && (
        <div
          role="alert"
          className="anim-rise fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gem-red/60 bg-felt-800 px-4 py-2.5 text-sm text-parchment shadow-2xl"
        >
          {error}
          <button
            type="button"
            onClick={dismissError}
            className="ml-4 text-muted transition hover:text-parchment"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <GemFlights />

      <TokenReturnModal state={state} />
      <PatronChoiceModal state={state} />
      <GameOverModal state={state} />
      <DebugPanel state={state} />
    </div>
  )
}
