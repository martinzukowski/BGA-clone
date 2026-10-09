import { RESERVE_LIMIT, TAKE_TWO_MIN_BANK, TOKEN_LIMIT, WINNING_SCORE } from '@/game/engine/rules'
import { ART_CREDITS } from '@/game/data/art'
import { useGameStore } from '@/store/gameStore'
import { Modal } from './Modal'

export function RulesModal() {
  const open = useGameStore((s) => s.showRules)
  const toggle = useGameStore((s) => s.toggleRules)

  return (
    <Modal open={open} title="How to play" onClose={() => toggle(false)} width="max-w-2xl">
      <div className="space-y-4 text-sm leading-relaxed text-parchment/85">
        <p>
          Buy development cards to build an engine of permanent gem bonuses, and race to{' '}
          <strong className="text-brass-400">{WINNING_SCORE} prestige</strong>.
        </p>

        <Section title="Your turn — pick exactly one">
          <ul className="list-disc space-y-1 pl-5">
            <li>Take three gems of different colours.</li>
            <li>
              Take two gems of the same colour — only if the bank holds at least{' '}
              {TAKE_TWO_MIN_BANK} of it.
            </li>
            <li>
              Reserve a card (face up, or blind from a deck top) and take a Gold wild if one is
              left. Maximum {RESERVE_LIMIT} reserved cards.
            </li>
            <li>Purchase a face-up card, or one you have reserved.</li>
          </ul>
        </Section>

        <Section title="Paying for cards">
          <p>
            Every card you own permanently discounts that colour. A card costing 3 Pearl costs only
            2 once you own one Pearl card. Gold substitutes for any missing gem. Spent tokens go
            back to the bank; permanent bonuses never leave you.
          </p>
        </Section>

        <Section title="Tokens">
          <p>
            You may end your turn holding at most {TOKEN_LIMIT} tokens, gold included. Go over and
            you will be asked to return the excess.
          </p>
        </Section>

        <Section title="Patrons">
          <p>
            At the end of your turn, any patron whose requirement your permanent{' '}
            <em>card bonuses</em> satisfy visits you — tokens never count. You may attract at most
            one patron per turn; if several qualify, you choose.
          </p>
        </Section>

        <Section title="Ending the game">
          <p>
            When a player reaches {WINNING_SCORE} prestige, the round is played out so everyone has
            had the same number of turns. Highest prestige wins; ties go to the player who bought
            fewer cards.
          </p>
        </Section>

        <Section title="Art">
          <p className="mb-2">
            Every card and patron is a public-domain painting, courtesy of Wikimedia Commons. Cards
            of the same tier and colour share a painting, each showing a different part of it.
          </p>
          <ul className="grid gap-x-4 gap-y-0.5 text-xs text-parchment/70 sm:grid-cols-2">
            {ART_CREDITS.map((credit) => (
              <li key={credit.slot}>
                <a
                  href={credit.source}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brass-400"
                >
                  <em>{credit.title}</em>
                </a>{' '}
                — {credit.artist}, {credit.date}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-display text-base text-brass-400">{title}</h3>
      {children}
    </section>
  )
}
