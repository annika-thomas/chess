import type { Unit } from '../types';
import { arrow, choice, find, info, no, recall, upTo, walk, yes } from './build';
import {
  BLACK_ITALIAN,
  BLACK_ITALIAN_D4,
  CENTER_GAME,
  EVANS_DECLINED,
  FOUR_KNIGHTS,
  KINGS_GAMBIT,
  QGD_BF4,
  QGD_EXCHANGE,
  QGD_MAIN,
  QGD_NF3,
  RUY_CLOSED,
  RUY_EXCHANGE,
  SCOTCH,
  SCOTCH_NXC6,
  VIENNA,
  VS_COLLE,
  VS_ENGLISH,
  VS_LONDON,
  VS_RETI,
} from './lines';

const E4 = 'Black vs 1.e4 · 1...e5';
const D4 = 'Black vs 1.d4 · Queen’s Gambit Declined';

export const blackItalian: Unit = {
  id: 'black-italian',
  title: 'The Mirror',
  subtitle: 'The Italian from Black’s side',
  section: E4,
  color: '#6e4a2f',
  icon: '♝',
  side: 'b',
  lessons: [
    {
      id: 'bi-1',
      title: 'You already know this',
      goal: 'Your White setup, mirrored',
      tags: ['italian'],
      exercises: [
        info(
          "Against the Italian, play **3...Bc5** and copy White's setup: ...Nf6, ...d6, ...O-O, ...a6, ...Ba7, ...h6. It's the same pattern you learned as White, seen in a mirror. One set of ideas, two colors.",
          { title: 'Same pattern, other side', setup: BLACK_ITALIAN, side: 'b' },
        ),
        walk('b', BLACK_ITALIAN),
        recall('b', BLACK_ITALIAN),
        choice(
          'Why 3...Bc5 and not 3...Nf6?',
          [
            yes('3...Nf6 allows 4.Ng5, attacking f7', 'Right. After 3...Bc5, 4.Ng5? just loses a knight to ...Qxg5.'),
            no('Bishops are better than knights', 'Not in general. It is about avoiding the Fried Liver attack on f7.'),
            no('3...Nf6 is illegal', 'It is legal, and popular, but it leads into sharp theory.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', side: 'b', tags: ['f7'] },
        ),
      ],
    },
    {
      id: 'bi-2',
      title: 'When White plays d4',
      goal: 'Strike back with ...d5',
      tags: ['italian', 'center'],
      exercises: [
        info(
          "Sometimes White goes for the big center: **4.c3 Nf6 5.d4**. Take on d4, check on b4, trade bishops, then hit back with **...d5!** A center pawn break frees your game.",
          { title: 'The ...d5 break', setup: BLACK_ITALIAN_D4, side: 'b', arrows: [arrow('d5', 'e4', 'blue')] },
        ),
        walk('b', BLACK_ITALIAN_D4),
        recall('b', BLACK_ITALIAN_D4),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Bd2 Bxd2+ 8.Nbxd2',
          ['d5'],
          'White has two big center pawns. Break them up.',
          "8...d5! You challenge the center before White can push e5 or d5 and cramp you.",
        ),
      ],
    },
    {
      id: 'bi-3',
      title: 'Gambits and tricks',
      goal: 'Evans Gambit, early Ng5, early queen',
      tags: ['italian', 'blunder-check'],
      exercises: [
        walk('b', EVANS_DECLINED),
        recall('b', EVANS_DECLINED),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Ng5',
          ['Qxg5'],
          'White attacks f7 too early. Punish it.',
          "The g5 knight is unprotected. 4...Qxg5 wins a piece.",
          { tags: ['punish', 'f7'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Bc4 Nc6 3.Qh5',
          ['g6'],
          'Scholar’s Mate attempt. Defend!',
          '3...g6 (or 3...Qe7). Never 3...Nf6??, which allows Qxf7#.',
          { accept: ['Qe7', 'Qf6'], tags: ['f7', 'blunder-check'] },
        ),
      ],
    },
  ],
};

export const ruyScotch: Unit = {
  id: 'ruy-scotch',
  title: 'Ruy Lopez & Scotch',
  subtitle: '3.Bb5 and 3.d4',
  section: E4,
  color: '#9a7b3c',
  icon: '♜',
  side: 'b',
  lessons: [
    {
      id: 'ruy-1',
      title: 'Ruy Lopez',
      goal: 'The Spanish: a6, Nf6, Be7, b5, d6',
      tags: ['ruy'],
      exercises: [
        info(
          "The **Ruy Lopez** (3.Bb5) is the most respected answer to 1...e5. The bishop attacks the knight that defends e5. Your plan: ask the question with **...a6**, then develop, kick the bishop with **...b5**, and support e5 with **...d6**.",
          { title: 'The Spanish', setup: '1.e4 e5 2.Nf3 Nc6 3.Bb5', side: 'b', arrows: [arrow('b5', 'c6', 'red'), arrow('c6', 'e5')] },
        ),
        walk('b', upTo(RUY_CLOSED, 16)),
        recall('b', upTo(RUY_CLOSED, 16)),
        walk('b', RUY_CLOSED, { from: 16 }),
        recall('b', RUY_CLOSED, { from: 8 }),
        choice(
          "After 3...a6 4.Ba4, can White win your e5 pawn with Bxc6 and Nxe5?",
          [
            yes("Not really: ...Qd4 wins it back", "Right. After Bxc6 dxc6 Nxe5, the move ...Qd4 forks the knight and e4. That's why ...a6 is safe to play."),
            no('Yes, e5 just falls', 'Look deeper: after dxc6 your queen gets active and wins the pawn back.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4', side: 'b' },
        ),
      ],
    },
    {
      id: 'ruy-2',
      title: 'Exchange Ruy',
      goal: 'When White takes on c6',
      tags: ['ruy'],
      exercises: [
        walk('b', RUY_EXCHANGE),
        recall('b', RUY_EXCHANGE),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 5.Nxe5',
          ['Qd4'],
          'White grabbed e5. Win it back.',
          "5...Qd4! forks the knight and the e4 pawn. After 6.Nf3 Qxe4+ material is level and you have the bishop pair.",
          { tags: ['fork'] },
        ),
      ],
    },
    {
      id: 'scotch-1',
      title: 'The Scotch',
      goal: '3.d4: develop with threats',
      tags: ['scotch'],
      exercises: [
        walk('b', SCOTCH),
        recall('b', SCOTCH),
        walk('b', SCOTCH_NXC6),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Bc5 5.Nxc6',
          ['Qf6'],
          'White took your knight. Before you recapture, is there something stronger?',
          "5...Qf6! threatens ...Qxf2 checkmate, so White must defend, and you recapture on c6 next move. (5...dxc6 and 5...bxc6 are fine too.)",
          { accept: ['dxc6', 'bxc6'], tags: ['f7', 'tempo'] },
        ),
        recall('b', SCOTCH_NXC6),
      ],
    },
  ],
};

export const otherE4: Unit = {
  id: 'other-e4',
  title: 'Other 2nd Moves',
  subtitle: 'Vienna, King’s Gambit, Center Game, Four Knights',
  section: E4,
  color: '#7a5c45',
  icon: '♞',
  side: 'b',
  lessons: [
    {
      id: 'oe4-1',
      title: 'Vienna & Four Knights',
      goal: 'Familiar setups, new names',
      tags: ['development'],
      exercises: [
        walk('b', VIENNA),
        recall('b', VIENNA),
        walk('b', FOUR_KNIGHTS),
        recall('b', FOUR_KNIGHTS),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.Bc4',
          ['Nxe4'],
          'The fork trick: take the e4 pawn. If White takes back, a pawn fork regains the piece.',
          "4...Nxe4! 5.Nxe4 d5 forks the bishop and knight, and you win the piece back with a great center. A favorite pattern: give a piece, fork two.",
          { tags: ['fork'] },
        ),
      ],
    },
    {
      id: 'oe4-2',
      title: 'Gambits & early queens',
      goal: 'King’s Gambit and Center Game',
      tags: ['tempo'],
      exercises: [
        walk('b', KINGS_GAMBIT),
        recall('b', KINGS_GAMBIT),
        find(
          'b',
          '1.e4 e5 2.f4 Bc5 3.fxe5',
          ['Qh4+', 'g3', 'Qxe4+', 'Qe2', 'Qxh1'],
          "White grabbed the pawn, but the e1–h4 diagonal is open. Punish it.",
          "3...Qh4+! If 4.Ke2 Qxe4 is mate. After 4.g3 Qxe4+ 5.Qe2 Qxh1, you have won a rook. Open diagonals to the king are deadly.",
          { tags: ['king-safety', 'fork'] },
        ),
        walk('b', CENTER_GAME),
        recall('b', CENTER_GAME),
      ],
    },
  ],
};

export const qgd: Unit = {
  id: 'qgd',
  title: 'Queen’s Gambit Declined',
  subtitle: 'Your rock-solid answer to 1.d4',
  section: D4,
  color: '#44705a',
  icon: '♛',
  side: 'b',
  lessons: [
    {
      id: 'qgd-1',
      title: 'The setup',
      goal: '...d5, ...e6, ...Nf6, ...Be7, ...O-O',
      tags: ['qgd'],
      exercises: [
        info(
          "The **Queen's Gambit Declined** has been a world-championship weapon for 100+ years. You hold d5 with **...e6**, develop, and castle. The only problem piece is your **c8 bishop**, stuck behind e6. Freeing it is the story of this opening.",
          { title: 'The QGD', setup: '1.d4 d5 2.c4 e6', side: 'b', highlights: ['c8'], arrows: [arrow('e6', 'd5')] },
        ),
        walk('b', upTo(QGD_MAIN, 12)),
        recall('b', upTo(QGD_MAIN, 12)),
        choice(
          "Why not just take the pawn with 2...dxc4?",
          [
            yes('Holding it is hard, and it gives up the center', "Right. That's the Queen's Gambit Accepted: playable, but if you try to hold the extra pawn with ...b5, White breaks it up with a4 and wins material."),
            no('It is illegal', 'It is legal.'),
            no('It loses the queen', 'Not immediately. The issue is the center and the weak pawns.'),
          ],
          { setup: '1.d4 d5 2.c4', side: 'b' },
        ),
      ],
    },
    {
      id: 'qgd-2',
      title: 'Capablanca’s freeing plan',
      goal: '...dxc4, ...Nd5, trades, then ...e5',
      tags: ['qgd', 'plan'],
      exercises: [
        info(
          "Cramped? **Trade pieces.** Capablanca's recipe: ...dxc4 (once White's bishop has moved to d3), ...Nd5 to swap pieces, then **...e5**. That frees your c8 bishop.",
          { title: 'The freeing maneuver', setup: QGD_MAIN, side: 'b', highlights: ['c8'], arrows: [arrow('c8', 'g4', 'blue')] },
        ),
        walk('b', QGD_MAIN, { from: 12 }),
        recall('b', QGD_MAIN, { from: 6 }),
        choice(
          'Why wait for Bd3 before playing ...dxc4?',
          [
            yes("White's bishop has to move twice: d3, then c4", 'Exactly, you win a tempo. Timing a capture is a common opening idea.'),
            no('Because dxc4 was illegal before', 'It was legal. It is about timing.'),
            no('To open the d-file for your rook', 'Not the main idea.'),
          ],
          { setup: upTo(QGD_MAIN, 15), side: 'b', tags: ['tempo'] },
        ),
      ],
    },
    {
      id: 'qgd-3',
      title: 'Other move orders',
      goal: '3.Nf3, 4.Bf4, 1.c4, 1.Nf3',
      tags: ['qgd', 'transposition'],
      exercises: [
        walk('b', QGD_NF3),
        recall('b', QGD_NF3),
        walk('b', QGD_BF4),
        recall('b', QGD_BF4),
        walk('b', VS_ENGLISH),
        choice(
          'You reached this with 1.c4 Nf6 2.Nc3 e6 3.Nf3 d5 4.d4 Be7. Which opening is it?',
          [
            yes("Queen's Gambit Declined", 'A transposition. Your same setup reaches the same position, which means less to learn.'),
            no('English Opening, a whole new opening', 'It started as an English, but look at the position: it is your QGD.'),
            no('London System', 'No: in the London, White develops the bishop to f4 early and does not play c4.'),
          ],
          { setup: VS_ENGLISH, side: 'b', flash: 5000, tags: ['transposition'] },
        ),
      ],
    },
    {
      id: 'qgd-4',
      title: 'The Elephant Trap',
      goal: 'A pinned knight that bites',
      tags: ['qgd', 'pin'],
      exercises: [
        info(
          "With **4...Nbd7** instead of 4...Be7, you set a famous trap. Your f6 knight *looks* pinned, so White grabs on d5. But the pin is fake: ...Nxd5! Bxd8 Bb4+ wins a piece.",
          {
            title: 'The Elephant Trap',
            setup: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5',
            side: 'b',
            arrows: [arrow('g5', 'd8', 'red')],
          },
        ),
        find(
          'b',
          '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5',
          ['Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'],
          'White grabbed a pawn on d5. Your knight looks pinned. Take anyway, and play it through.',
          "6...Nxd5! 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8. You gave a queen and got back a queen plus a piece.",
        ),
        choice(
          'Your f6 knight is pinned to your queen. Can you still play ...Nxd5?',
          [
            yes('Yes: Bxd8 is met by Bb4+ and you come out a piece up', 'The **Einstellung** lesson: the pattern "pinned = can\'t move" is usually true. Check whether this is the exception.'),
            no('No: you lose your queen', 'You do give up the queen, but you win it back with interest.'),
          ],
          { setup: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5', side: 'b', tags: ['pin', 'blunder-check'] },
        ),
      ],
    },
  ],
};

export const carlsbad: Unit = {
  id: 'carlsbad',
  title: 'Exchange & Carlsbad',
  subtitle: 'When White trades on d5',
  section: D4,
  color: '#4f5d75',
  icon: '♖',
  side: 'b',
  lessons: [
    {
      id: 'carlsbad-1',
      title: 'The Exchange line',
      goal: 'cxd5 exd5: your bishop is free',
      tags: ['carlsbad', 'qgd'],
      exercises: [
        walk('b', QGD_EXCHANGE),
        recall('b', QGD_EXCHANGE),
        choice(
          "After 4.cxd5 exd5, which of your pieces suddenly has more freedom?",
          [
            yes('The c8 bishop', 'Yes. The e6 pawn moved to d5, so the c8–h3 diagonal opened. That solves the QGD\'s main problem.'),
            no('The h8 rook', 'Not really.'),
            no('The b8 knight', 'Not especially.'),
          ],
          { setup: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5', side: 'b', highlights: ['c8'] },
        ),
      ],
    },
    {
      id: 'carlsbad-2',
      title: 'The Carlsbad structure',
      goal: 'Read the pawns, know the plans',
      tags: ['carlsbad', 'structure'],
      exercises: [
        info(
          "This pawn shape is called the **Carlsbad structure**: c6–d5 for you against d4–e3 for White. It appears in many openings, so learn it once and use it everywhere. **White's plan:** the minority attack, b4–b5, to create a weak pawn on c6. **Your plans:** a knight on e4, kingside play, or ...Nf8–g6.",
          { title: 'Carlsbad', setup: QGD_EXCHANGE, side: 'b' },
        ),
        choice(
          'Name this pawn structure.',
          [
            yes('Carlsbad', 'c6–d5 against d4–e3, with an open e-file for you and a half-open c-file for White.'),
            no('Pawn chain (French)', 'In a chain the pawns are locked diagonally (d4–e5 against d5–e6).'),
            no('Isolated queen pawn', 'An IQP has no pawn on a neighboring file to support it.'),
          ],
          { setup: QGD_EXCHANGE, side: 'b', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          "What is White's typical plan in this structure?",
          [
            yes('The minority attack: push b4–b5', 'Two queenside pawns attack your three, aiming to leave you with a weak c-pawn.'),
            no('Push e4 right away', 'Possible later, but not the typical plan.'),
            no('Attack on the kingside with g4–g5', 'Sometimes, but the classic plan is the minority attack.'),
          ],
          { setup: QGD_EXCHANGE, side: 'b', pawnsOnly: true, arrows: [arrow('b2', 'b4', 'red'), arrow('b4', 'b5', 'red')] },
        ),
      ],
    },
  ],
};

export const vsSystems: Unit = {
  id: 'vs-systems',
  title: 'vs London & Systems',
  subtitle: 'One setup against everything else',
  section: D4,
  color: '#6b6660',
  icon: '♚',
  side: 'b',
  lessons: [
    {
      id: 'sys-1',
      title: 'vs the London',
      goal: '...e6, ...c5, ...Bd6',
      tags: ['london'],
      exercises: [
        info(
          "The **London System** (Bf4 before e3) is very popular in club play. Your recipe: the same ...d5/...e6/...Nf6, then strike with **...c5**, and challenge the London bishop with **...Bd6**.",
          { title: 'The London', setup: '1.d4 d5 2.Bf4', side: 'b', arrows: [arrow('c7', 'c5', 'blue'), arrow('f8', 'd6', 'blue')] },
        ),
        walk('b', VS_LONDON),
        recall('b', VS_LONDON),
        choice(
          "White's dark-squared bishop left c1 early. Which White pawn often becomes a target?",
          [
            yes('b2: ...Qb6 attacks it', 'With the bishop gone from c1, b2 is defended only by the queen. ...Qb6 is a key idea against the London.'),
            no('h2', 'Not usually.'),
            no('e3', 'It is well protected.'),
          ],
          { setup: upTo(VS_LONDON, 8), side: 'b', highlights: ['b2'] },
        ),
      ],
    },
    {
      id: 'sys-2',
      title: 'Colle, English, Réti',
      goal: 'Same pieces, same squares',
      tags: ['transposition'],
      exercises: [
        walk('b', VS_COLLE),
        recall('b', VS_COLLE),
        walk('b', VS_RETI),
        recall('b', VS_RETI),
        info(
          'Notice the pattern: against every quiet first move, your pieces land on the **same squares**: d5, e6, Nf6, Be7 or Bd6, O-O, and then ...c5. One structure, many openings. That is pattern learning at work.',
          { title: 'One setup', setup: VS_RETI, side: 'b' },
        ),
      ],
    },
  ],
};
