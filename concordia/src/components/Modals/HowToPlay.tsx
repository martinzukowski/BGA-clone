/**
 * How to Play — the in-game rules reference.
 *
 * Written so a new player can learn the whole game here, and organised the way
 * questions actually arise at the table. The numbers are pulled from the same
 * constants the engine uses, so this page cannot drift out of date.
 */

import { useState } from 'react';
import { FOR_SALE_CARD_DEFS, GOD_DOMAIN, GOD_NAME, ROLE_LABEL, STARTING_CARD_DEFS } from '../../game/data/cards';
import { goodMeta, GOODS_ORDER } from '../../game/data/goods';
import {
  BUILD_COIN_COST,
  CONCORDIA_CARD_VP,
  DISPLAY_POSITION_COSTS,
  HOUSES_PER_PLAYER,
  MARS_VP_PER_COLONIST,
  MAX_COLONISTS_ON_BOARD,
  MERCURIUS_VP_PER_GOOD_TYPE,
  MINERVA_VP,
  STOREHOUSE_CAPACITY,
  TRIBUNE_FREE_CARDS,
  VESTA_SESTERTII_PER_VP,
} from '../../game/data/ruleConstants';
import type { CardRole, God } from '../../game/engine/types';
import { GoodIcon } from '../Goods/GoodIcon';
import { PersonalityCard } from '../PersonalityCard/PersonalityCard';
import { GodIcon } from '../ui/Icons';
import { Modal } from './Modal';

type Tab = 'basics' | 'cards' | 'board' | 'scoring' | 'endgame';

const TABS: [Tab, string][] = [
  ['basics', 'The basics'],
  ['cards', 'The cards'],
  ['board', 'The board'],
  ['scoring', 'Scoring'],
  ['endgame', 'The end'],
];

export function HowToPlay({ open, onClose }: { open: boolean; onClose(): void }) {
  const [tab, setTab] = useState<Tab>('basics');

  return (
    <Modal open={open} title="How to Play" subtitle="Imperivm Mercatorvm" onClose={onClose} width={900}>
      <div className="mb-4 flex justify-center gap-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="rounded-[3px] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition"
            style={{
              background: tab === id ? 'linear-gradient(180deg,#e6cd86,#cfae52 48%,#a9862a)' : 'rgb(90 68 38 / .1)',
              color: tab === id ? '#2a2010' : 'var(--color-ink-600)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-[13.5px] leading-relaxed text-ink-700">
        {tab === 'basics' && <Basics />}
        {tab === 'cards' && <Cards />}
        {tab === 'board' && <BoardHelp />}
        {tab === 'scoring' && <Scoring />}
        {tab === 'endgame' && <EndGame />}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────── sections ── */

function Basics() {
  return (
    <div className="space-y-4">
      <P>
        You are a Roman merchant house. Over the game you will send colonists across the sea and
        along the roads, raise houses in the cities they reach, and turn the goods those cities
        produce into a trading network worth more than anyone else's.
      </P>

      <H>Your turn is one card</H>
      <P>
        That is the whole of it. Play <b>one personality card</b> from your hand, resolve it, and the
        turn passes. There is nothing else to do and nothing else you may do.
      </P>
      <P>
        Played cards do not come back on their own. They pile up in front of you until you play the{' '}
        <b>Tribune</b>, which sweeps every one of them back into your hand and pays you a sestertius
        for each card past the {ordinal(TRIBUNE_FREE_CARDS)}. Deciding <i>when</i> to spend a turn on
        that recovery is one of the real decisions in the game.
      </P>

      <H>Cards are also how you score</H>
      <P>
        Every card belongs to a god, and at the end each god turns something you have built into
        points — <i>multiplied by how many of that god's cards you own</i>. Two Saturnus cards and
        seven provinces is fourteen points; four Saturnus cards and the same seven provinces is
        twenty-eight. Buying cards is not a side activity. It is the engine.
      </P>

      <H>What you start with</H>
      <Grid>
        <Fact label="Cards">7, the same for everyone</Fact>
        <Fact label="Colonists">1 on land, 1 at sea, in Roma</Fact>
        <Fact label="In reserve">2 land, 2 sea</Fact>
        <Fact label="Houses">{HOUSES_PER_PLAYER}</Fact>
        <Fact label="Storehouse">{STOREHOUSE_CAPACITY} spaces</Fact>
        <Fact label="Sestertii">5, plus one per seat after the first</Fact>
      </Grid>

      <Note>
        Your storehouse holds {STOREHOUSE_CAPACITY} things, and a colonist waiting in reserve takes
        up a space just as a unit of goods does. Sending colonists out frees the space for good.
      </Note>
    </div>
  );
}

function Cards() {
  const roles: CardRole[] = [
    'architect',
    'prefect',
    'mercator',
    'colonist',
    'diplomat',
    'senator',
    'consul',
    'tribune',
    'mason',
  ];
  return (
    <div className="space-y-4">
      <P>
        Everyone begins with the same seven cards. The rest are bought from the forum during the
        game — that is what a Senator or a Consul is for.
      </P>

      <div className="flex flex-wrap justify-center gap-2 py-1">
        {STARTING_CARD_DEFS.map((d) => (
          <PersonalityCard key={d.defId} defId={d.defId} size="tiny" />
        ))}
      </div>

      <H>What each one does</H>
      <div className="space-y-2">
        {roles.map((role) => (
          <RoleRow key={role} role={role} />
        ))}
        <div
          className="rounded-[4px] px-3 py-2"
          style={{ background: 'rgb(90 68 38 / .08)' }}
        >
          <div className="t-caps text-[12px] text-ink-800">
            Specialists — Structor, Agricola, Faber, Vinitor, Textor
          </div>
          <div className="mt-1 text-[13px]">
            Each one makes every city you hold of its kind produce a unit of its good — and only
            yours. They are also your Minerva cards.
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3">
            {GOODS_ORDER.map((g) => (
              <span key={g} className="inline-flex items-center gap-1.5 text-[12px]">
                <GoodIcon good={g} size={16} />
                {MINERVA_VP[g]} VP per {goodMeta(g).name.toLowerCase()} city
              </span>
            ))}
          </div>
        </div>
      </div>

      <H>Buying from the forum</H>
      <P>
        Seven cards lie face up. A card's price is the goods printed on it, <i>plus</i> the goods
        shown beneath its position — so the same card is cheaper on the left. A{' '}
        <b className="text-wine-600">?</b> is a wildcard: pay any one good you like.
      </P>
      <div className="flex flex-wrap gap-1.5">
        {DISPLAY_POSITION_COSTS.slice(1).map((cost, i) => (
          <div
            key={i}
            className="flex items-center gap-1 rounded-[3px] px-2 py-1"
            style={{ background: 'rgb(90 68 38 / .1)' }}
          >
            <span className="text-[11px] tabular-nums text-ink-500">#{i + 1}</span>
            {cost.length === 0 ? (
              <span className="text-[11px] uppercase tracking-wide text-ink-500">free</span>
            ) : (
              cost.map((c, j) =>
                c === 'any' ? (
                  <span
                    key={j}
                    className="grid h-4 w-4 place-items-center rounded-full bg-wine-600 text-[10px] font-bold text-parch-50"
                  >
                    ?
                  </span>
                ) : (
                  <GoodIcon key={j} good={c} size={16} />
                ),
              )
            )}
          </div>
        ))}
      </div>
      <P>
        A <b>Senator</b> buys up to two cards and pays the position surcharge. A <b>Consul</b> buys
        just one but ignores the surcharge entirely. After buying, the row slides left and is topped
        up from the deck. Bought cards go straight into your hand.
      </P>
      <Note>
        {FOR_SALE_CARD_DEFS.length} cards exist for sale, but only those numbered up to the player
        count are used — a two-player game sees far fewer than a five-player one.
      </Note>
    </div>
  );
}

function RoleRow({ role }: { role: CardRole }) {
  const def = [...STARTING_CARD_DEFS, ...FOR_SALE_CARD_DEFS].find((d) => d.role === role)!;
  const detail: Partial<Record<CardRole, string>> = {
    architect:
      'Move your colonists — one step per colonist you have on the board, split between them however you like — then raise houses in any city one of them now stands beside.',
    prefect:
      'Either choose a province that is still ready: you take the good on its marker and every house there produces for its owner, rivals included. Or call in all the spent provinces at once and take a sestertius for every coin showing.',
    mercator: 'Take the coin printed on the card, then buy and/or sell in up to two kinds of goods at the fixed prices.',
    colonist:
      'Either raise new colonists — one food and one tool each — in Roma or any city you hold. Or take 5₴ plus one for every colonist you already have out.',
    diplomat: 'Take up the card showing on top of a rival’s played pile and use it as your own. You cannot copy another Legatus.',
    senator: 'Buy up to two cards from the forum, paying the position surcharge.',
    consul: 'Buy one card from the forum and ignore the position surcharge.',
    tribune: `Take every card you have played back into your hand, gain 1₴ for each beyond the ${ordinal(TRIBUNE_FREE_CARDS)}, and optionally raise one colonist in Roma.`,
  };
  return (
    <div className="flex gap-3 rounded-[4px] px-3 py-2" style={{ background: 'rgb(90 68 38 / .08)' }}>
      <div className="shrink-0 pt-[2px]">
        <GodIcon god={def.god} size={20} tone="#8a6a17" />
      </div>
      <div>
        <div className="t-caps text-[12px] text-ink-800">
          {def.title} <span className="text-ink-500">· {ROLE_LABEL[role]}</span>
        </div>
        <div className="mt-[2px] text-[13px]">{detail[role]}</div>
      </div>
    </div>
  );
}

function BoardHelp() {
  return (
    <div className="space-y-4">
      <H>Colonists live on the roads, not in the cities</H>
      <P>
        A colonist stands <i>on a route</i> between two cities, and it may build in either of them.
        Only when it is first placed does it sit inside a city. Brown roads carry land colonists;
        blue lanes carry ships. Neither can use the other's network.
      </P>
      <P>
        <b>Only one colonist may rest on a route</b> — anyone's. You may travel straight through an
        occupied route, paying a step for it, but you cannot stop there.
      </P>

      <H>Building</H>
      <P>Goods first, then coin:</P>
      <Grid>
        <Fact label="Brick city">1 food</Fact>
        <Fact label="Any other city">1 brick + 1 of that city's own good</Fact>
      </Grid>
      <div className="flex flex-wrap gap-2">
        {GOODS_ORDER.map((g) => (
          <span
            key={g}
            className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[12px]"
            style={{ background: 'rgb(90 68 38 / .1)' }}
          >
            <GoodIcon good={g} size={16} />
            {BUILD_COIN_COST[g]}₴
          </span>
        ))}
      </div>
      <P>
        That coin price is then <b>multiplied by how many houses will stand in the city once yours
        is up</b>. The third house in a wine city costs 4 × 3 = 12₴. The goods cost never changes.
        You may never own two houses in the same city, and never build in Roma.
      </P>

      <H>Production</H>
      <P>
        Nothing produces on its own. Goods arrive only when a Prefect activates a province, or when
        you play a specialist. Anything you cannot fit in your storehouse is simply lost.
      </P>

      <H>Trade</H>
      <P>
        Prices never move: {GOODS_ORDER.map((g) => `${goodMeta(g).name.toLowerCase()} ${goodMeta(g).value}`).join(', ')} sestertii.
        The bank buys and sells at the same price. Only a Mercator lets you trade, and only in two
        kinds of goods per turn.
      </P>
    </div>
  );
}

function Scoring() {
  const gods: God[] = ['vesta', 'jupiter', 'saturnus', 'mercurius', 'mars', 'minerva'];
  const rule: Record<God, string> = {
    vesta: `1 VP for every full ${VESTA_SESTERTII_PER_VP}₴ you hold, counting the sale value of your goods.`,
    jupiter: '1 VP for every house you own in a city that does not make brick.',
    saturnus: '1 VP for every province containing at least one of your houses.',
    mercurius: `${MERCURIUS_VP_PER_GOOD_TYPE} VP for each distinct kind of good your houses produce.`,
    mars: `${MARS_VP_PER_COLONIST} VP for every colonist you have on the board (up to ${MAX_COLONISTS_ON_BOARD}).`,
    minerva: 'Each specialist scores on its own, at the rate printed on it, for your cities of that kind.',
  };

  return (
    <div className="space-y-4">
      <P>
        Gather every card you own — hand and played pile together — and group them by god. Each god
        scores its achievement <b>once</b>, multiplied by the number of that god's cards you hold.
        Minerva is the exception: each specialist scores separately.
      </P>
      <div className="space-y-2">
        {gods.map((god) => (
          <div key={god} className="flex gap-3 rounded-[4px] px-3 py-2" style={{ background: 'rgb(90 68 38 / .08)' }}>
            <div className="shrink-0 pt-[2px]">
              <GodIcon god={god} size={22} tone="#8a6a17" />
            </div>
            <div>
              <div className="t-caps text-[12px] text-ink-800">
                {GOD_NAME[god]} <span className="text-ink-500">· {GOD_DOMAIN[god]}</span>
              </div>
              <div className="mt-[2px] text-[13px]">{rule[god]}</div>
            </div>
          </div>
        ))}
      </div>
      <Note>
        A worked example: nine houses outside brick cities and two Jupiter cards is 18 points. Seven
        provinces and four Saturnus cards is 28. The multiplier is where games are won.
      </Note>
    </div>
  );
}

function EndGame() {
  return (
    <div className="space-y-4">
      <H>What ends the game</H>
      <P>Either of two things, whichever happens first:</P>
      <ul className="ml-5 list-disc space-y-1">
        <li>somebody buys the very last card out of the forum, or</li>
        <li>somebody places their {HOUSES_PER_PLAYER}th and last house.</li>
      </ul>
      <P>
        That player takes the <b>Concordia card</b>, worth {CONCORDIA_CARD_VP} points, and no one
        else can have it. <b>Every other player then takes exactly one more turn</b> — the player who
        triggered the end does not. Then everyone scores.
      </P>
      <Note>
        Timing matters. Ending the game while you are ahead locks in your lead; ending it while a
        rival still has houses to place and colonists in reserve is a gift to them.
      </Note>
      <H>Ties</H>
      <P>
        A tie goes to whoever holds the Praefectus Magnus — and if that is nobody among the tied
        players, to whichever of them would receive it next.
      </P>
    </div>
  );
}

/* ───────────────────────────────────────────────── small bits ── */

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="t-caps mt-3 text-[13px] tracking-[0.16em] text-ink-800">{children}</h3>
);

const P = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;

const Note = ({ children }: { children: React.ReactNode }) => (
  <p
    className="rounded-[4px] border-l-[3px] px-3 py-2 text-[12.5px] italic"
    style={{ borderColor: 'var(--color-gold-500)', background: 'rgb(201 165 60 / .1)' }}
  >
    {children}
  </p>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{children}</div>
);

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[4px] px-2.5 py-1.5" style={{ background: 'rgb(90 68 38 / .1)' }}>
      <div className="t-label text-[7.5px]">{label}</div>
      <div className="text-[12.5px] text-ink-800">{children}</div>
    </div>
  );
}

function ordinal(n: number): string {
  return ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth'][n] ?? `${n}th`;
}
