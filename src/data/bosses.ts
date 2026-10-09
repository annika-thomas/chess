import type { LineText, Side } from '../types';
import { upTo } from './build';
import {
  ALAPIN_D5,
  BLACK_ITALIAN,
  ITALIAN_MAIN,
  PHILIDOR,
  QGD_EXCHANGE,
  QGD_MAIN,
  RUY_CLOSED,
  VIENNA,
  VS_LONDON,
} from './lines';

/**
 * End-of-unit boss battles: play on from the position the unit's main line reaches.
 * Win, or still be standing after `moves` more moves of your own, to earn the unit's crown.
 */
export interface Boss {
  unitId: string;
  name: string;
  side: Side;
  start: LineText;
  /** What the position is about: shown before you start. */
  brief: string;
  moves: number;
}

const MOVES = 20;

export const BOSSES: Boss[] = [
  {
    unitId: 'italian',
    name: 'The Italian Middlegame',
    side: 'w',
    start: upTo(ITALIAN_MAIN, 18),
    brief: 'Your Giuoco Piano setup is complete. Now use the plan: **Nbd2–f1–g3**, and push **d4** when you’re ready.',
    moves: MOVES,
  },
  {
    unitId: 'punish',
    name: 'Beat the Philidor',
    side: 'w',
    start: PHILIDOR,
    brief: 'You have more space and easy development against the Philidor. Keep your pieces active and look for **f7** and loose pieces.',
    moves: MOVES,
  },
  {
    unitId: 'beyond',
    name: 'Play the IQP',
    side: 'w',
    start: ALAPIN_D5,
    brief: 'From the Alapin you have an **isolated d-pawn**. Keep pieces on, play actively, and look for the **d4–d5** break.',
    moves: MOVES,
  },
  {
    unitId: 'black-italian',
    name: 'The Mirror Match',
    side: 'b',
    start: BLACK_ITALIAN,
    brief: 'The Giuoco Piano from Black’s side. Keep **e5** solid. Typical plans: **...Ne7–g6** (your version of White’s Ng3), or **...Be6** to trade off White’s strong bishop.',
    moves: MOVES,
  },
  {
    unitId: 'ruy-scotch',
    name: 'The Closed Ruy',
    side: 'b',
    start: RUY_CLOSED,
    brief: 'Classic Chigorin structure. Hold **e5**, use your queenside space (**...c5, ...Qc7**) and don’t rush.',
    moves: MOVES,
  },
  {
    unitId: 'other-e4',
    name: 'Vienna Showdown',
    side: 'b',
    start: VIENNA,
    brief: 'White has played f4 early. Develop, castle, and remember that **f4** also loosens the squares around White’s king.',
    moves: MOVES,
  },
  {
    unitId: 'qgd',
    name: 'Capablanca’s Freedom',
    side: 'b',
    start: QGD_MAIN,
    brief: 'You’ve played the freeing **...e5** break. Now get your **c8 bishop** into the game and challenge the center.',
    moves: MOVES,
  },
  {
    unitId: 'carlsbad',
    name: 'Survive the Minority Attack',
    side: 'b',
    start: QGD_EXCHANGE,
    brief: 'The Carlsbad structure. White will push **b4–b5**. Your plans: a knight on **e4**, and kingside play with **...Ng6**.',
    moves: MOVES,
  },
  {
    unitId: 'vs-systems',
    name: 'Break the London',
    side: 'b',
    start: VS_LONDON,
    brief: 'Against the London triangle: trade off White’s dark bishop (**...Bxg3**), hit **b2** with ...Qb6, and prepare **...e5** or **...c4**.',
    moves: MOVES,
  },
];

export const bossFor = (unitId: string) => BOSSES.find((b) => b.unitId === unitId);

