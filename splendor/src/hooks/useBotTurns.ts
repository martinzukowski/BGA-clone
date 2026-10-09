import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Hands control to the bots whenever the seat to move is one of them.
 *
 * The pacing lives entirely here and in the store; the engine resolves a bot
 * turn instantly. `advanceBots` is idempotent and guards against re-entry, so
 * running this effect more often than strictly necessary is harmless.
 */
export function useBotTurns(): void {
  const game = useGameStore((s) => s.game)
  const advanceBots = useGameStore((s) => s.advanceBots)

  const currentIsBot =
    game !== null &&
    game.phase !== 'finished' &&
    (game.players[game.currentPlayerIndex]?.isBot ?? false)

  useEffect(() => {
    if (!currentIsBot) return
    void advanceBots()
  }, [currentIsBot, game?.currentPlayerIndex, game?.turnCount, game?.phase, advanceBots])
}
