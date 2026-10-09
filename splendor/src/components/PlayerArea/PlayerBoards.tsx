import type { GameState, PlayerState } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { playerBonuses, playerScore, totalTokens } from '@/game/engine/rules'
import { tryGetCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'
import { gemTheme } from '@/utils/colors'
import { PatronTile } from '@/components/NobleTile/PatronTile'
import { DIFFICULTY_LABELS } from '@/store/settings'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'

/**
 * One compact board per seat, in turn order, with yours included so every
 * score sits in one column. The seat to move is framed in brass; a bot that is
 * deliberating shimmers, and afterwards shows what it just did.
 */
export function PlayerBoards({ state }: { state: GameState }) {
  const bot = useGameStore((s) => s.bot)
  return (
    <section aria-label="Players" className="flex flex-col gap-2">
      {state.players.map((player, index) => (
        <PlayerBoard
          key={player.id}
          state={state}
          player={player}
          isCurrent={state.currentPlayerIndex === index && state.phase !== 'finished'}
          thinking={bot.thinkingPlayerId === player.id}
          message={bot.lastMessagePlayerId === player.id ? bot.lastMessage : null}
          messageKey={bot.messageKey}
        />
      ))}
    </section>
  )
}

interface PlayerBoardProps {
  state: GameState
  player: PlayerState
  isCurrent: boolean
  thinking: boolean
  message: string | null
  messageKey: number
}

function PlayerBoard({ state, player, isCurrent, thinking, message, messageKey }: PlayerBoardProps) {
  const bonuses = playerBonuses(player)
  const score = playerScore(player)
  const held = totalTokens(player.tokens)
  const isYou = player.id === HUMAN_ID

  // Face-up reserves are public knowledge; blind ones are not, even by name.
  const publicReserves = player.reserved
    .filter((id) => isYou || !player.reservedHidden.includes(id))
    .map((id) => tryGetCard(id)?.name)
    .filter(Boolean)
  const hiddenReserves = isYou ? 0 : player.reservedHidden.length

  return (
    <article
      className={`relative overflow-hidden rounded-xl border-2 p-2.5 transition ${
        isCurrent ? 'border-brass-500 bg-felt-700/80' : 'border-felt-600 bg-felt-800/70'
      }`}
    >
      {thinking && <div className="anim-thinking pointer-events-none absolute inset-0" />}

      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm text-parchment">
            {player.name}
            {isYou && <span className="ml-1.5 text-[0.6rem] uppercase text-brass-400">you</span>}
          </h3>
          <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">
            {player.difficulty ? `${DIFFICULTY_LABELS[player.difficulty]} bot` : 'Human'}
          </p>
        </div>
        <span
          className="font-display text-2xl leading-none text-brass-400 tabular-nums"
          title={`${score} prestige`}
        >
          ★{score}
        </span>
      </header>

      {/* Per colour: card bonus on top, loose tokens underneath. */}
      <div className="mt-2 flex gap-1">
        {GEM_COLORS.map((color) => {
          const theme = gemTheme(color)
          return (
            <div
              key={color}
              className="flex flex-1 flex-col items-center gap-0.5"
              title={`${theme.label}: ${bonuses[color]} card bonus, ${player.tokens[color]} tokens`}
            >
              <span
                className="grid h-5 w-full place-items-center rounded-sm border text-[0.7rem] font-bold tabular-nums"
                style={{
                  background: theme.fill,
                  borderColor: theme.rim,
                  color: theme.ink,
                  opacity: bonuses[color] === 0 ? 0.3 : 1,
                }}
              >
                {bonuses[color]}
              </span>
              <span
                className="grid h-5 w-5 place-items-center rounded-full border text-[0.65rem] font-semibold tabular-nums"
                style={{
                  borderColor: theme.rim,
                  background: theme.tint,
                  color: player.tokens[color] === 0 ? '#5b667c' : '#e9e3d5',
                }}
              >
                {player.tokens[color]}
              </span>
            </div>
          )
        })}
        <div className="flex flex-1 flex-col items-center justify-end gap-0.5" title="Gold wilds">
          <span
            className="grid h-5 w-5 place-items-center rounded-full border text-[0.65rem] font-semibold tabular-nums"
            style={{
              borderColor: gemTheme('gold').rim,
              background: gemTheme('gold').tint,
              color: player.tokens.gold === 0 ? '#5b667c' : '#e8bf4d',
            }}
          >
            {player.tokens.gold}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-muted">
        <span className={held >= state.config.tokenLimit ? 'text-gem-red' : ''}>
          {held}/{state.config.tokenLimit} tokens
        </span>
        <span>{player.purchased.length} cards</span>
        <span
          title={
            [
              ...publicReserves,
              ...(hiddenReserves > 0 ? [`${hiddenReserves} face-down`] : []),
            ].join(', ') || 'No reserved cards'
          }
        >
          {player.reserved.length} reserved
        </span>
      </div>

      {player.patrons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {player.patrons.map((id) => (
            <PatronTile key={id} patron={getPatron(id)} size="small" />
          ))}
        </div>
      )}

      {!isYou &&
        (thinking ? (
          <p className="mt-1.5 text-[0.7rem] italic text-brass-400">Thinking…</p>
        ) : (
          message && (
            <p
              key={messageKey}
              className="anim-rise mt-1.5 truncate text-[0.7rem] text-parchment/75"
              title={message}
            >
              {message}
            </p>
          )
        ))}
    </article>
  )
}
