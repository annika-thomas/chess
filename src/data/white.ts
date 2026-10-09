import type { Unit } from '../types';
import { arrow, choice, find, info, no, recall, upTo, walk, yes } from './build';
import {
  ALAPIN_D5,
  ALAPIN_NF6,
  BLACKBURNE_AVOID,
  CARO_ADVANCE,
  FRENCH_ADVANCE,
  ITALIAN_MAIN,
  PETROV,
  PHILIDOR,
  PIRC_CLASSICAL,
  SCANDI,
  TWO_KNIGHTS_D3,
  TWO_KNIGHTS_TRANSPO,
} from './lines';

const SECTION = 'Your White repertoire · 1.e4';

export const italian: Unit = {
  id: 'italian',
  title: 'The Italian Game',
  subtitle: 'Your main weapon as White',
  section: SECTION,
  color: '#8b5a2b',
  icon: '♗',
  side: 'w',
  lessons: [
    {
      id: 'italian-1',
      title: 'First moves',
      goal: '1.e4 e5 2.Nf3 Nc6 3.Bc4: the Italian Game',
      tags: ['italian'],
      exercises: [
        info(
          'The **Italian Game** is one of the oldest openings, played for over 400 years and still played by world champions. It follows every principle: center pawn, knight, bishop, castle. Your bishop on c4 aims at **f7**.',
          { title: 'The Italian Game', setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4', side: 'w', arrows: [arrow('c4', 'f7')] },
        ),
        walk('w', upTo(ITALIAN_MAIN, 6)),
        recall('w', upTo(ITALIAN_MAIN, 6), { prompt: 'Now from memory' }),
        walk('w', upTo(ITALIAN_MAIN, 10), { from: 6 }),
        recall('w', upTo(ITALIAN_MAIN, 10)),
        choice(
          'Why does White play 4.c3?',
          [
            yes('To prepare d4 and build a big center', 'Yes. c3 supports a future d4 and gives the bishop a retreat square on c2.'),
            no('To develop the knight to c3', 'The opposite: the pawn on c3 means your knight develops via d2.'),
            no("To attack Black's bishop", 'c3 doesn\'t attack c5. That would be b4 or d4.'),
          ],
          { setup: upTo(ITALIAN_MAIN, 7), side: 'w' },
        ),
      ],
    },
    {
      id: 'italian-2',
      title: 'Castle and connect',
      goal: 'Moves 6–9: O-O, Re1, Bb3, h3',
      tags: ['italian'],
      exercises: [
        walk('w', upTo(ITALIAN_MAIN, 18), { from: 10 }),
        recall('w', upTo(ITALIAN_MAIN, 18), { from: 6 }),
        choice(
          'Black just played ...a6. Why retreat the bishop with 8.Bb3 right now?',
          [
            yes('Before ...b5 kicks it with tempo', 'Exactly. Retreating now means Black never gets to gain time on your bishop. On b3 it still aims at f7.'),
            no('To attack the a6 pawn', 'The bishop on b3 does not attack a6.'),
            no('To make room for the queen', 'Not the point. It is about not losing time.'),
          ],
          { setup: upTo(ITALIAN_MAIN, 14), side: 'w', tags: ['italian', 'tempo'] },
        ),
        choice(
          'What does 9.h3 prevent?',
          [
            yes('...Bg4 pinning your knight, and ...Ng4 hitting f2', 'Yes. A tiny pawn move takes away g4 from Black\'s bishop and knight.'),
            no('...Qh4 attacks', 'Not really. h3 is about the g4 square.'),
            no('Nothing; it is just a waiting move', 'It does something important: it takes the g4 square away.'),
          ],
          { setup: upTo(ITALIAN_MAIN, 17), side: 'w', highlights: ['g4'] },
        ),
        recall('w', upTo(ITALIAN_MAIN, 18), { prompt: 'The whole setup, start to finish.' }),
      ],
    },
    {
      id: 'italian-3',
      title: 'The knight maneuver',
      goal: 'Nbd2–f1–g3: the plan after the opening',
      tags: ['italian', 'plan'],
      exercises: [
        info(
          "Your b1 knight can't go to c3 (your pawn is there). So it takes the scenic route: **d2 → f1 → g3**, landing near Black's king, where it eyes **f5** and **h5**. Learn plans like this and you'll know what to do when the memorized moves run out.",
          {
            title: 'Plans beat memory',
            setup: upTo(ITALIAN_MAIN, 18),
            side: 'w',
            arrows: [arrow('b1', 'd2', 'blue'), arrow('d2', 'f1', 'blue'), arrow('f1', 'g3', 'blue')],
          },
        ),
        walk('w', ITALIAN_MAIN, { from: 18 }),
        choice(
          'Why does the knight go d2–f1–g3 instead of developing to c3?',
          [
            yes('c3 is taken by a pawn, and g3 puts the knight near the enemy king', 'Right: a plan that comes straight from the pawn structure.'),
            no('Knights are stronger on the edge', 'The opposite is usually true. g3 is valuable here because it eyes f5 and h5.'),
            no('To defend the queen', 'Not the purpose.'),
          ],
          { setup: ITALIAN_MAIN, side: 'w' },
        ),
        recall('w', ITALIAN_MAIN, { from: 12, prompt: 'Play the setup and the maneuver.' }),
      ],
    },
    {
      id: 'italian-4',
      title: 'The Two Knights: 3...Nf6',
      goal: 'Same setup, different move order',
      tags: ['italian', 'transposition'],
      exercises: [
        info(
          "Black often plays 3...Nf6 instead of 3...Bc5. Good news: you don't need anything new. Protect e4 with **4.d3** and build the same setup.",
          { title: 'Same plan, new order', setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6', side: 'w', arrows: [arrow('f6', 'e4', 'red')] },
        ),
        walk('w', TWO_KNIGHTS_D3),
        recall('w', TWO_KNIGHTS_D3),
        walk('w', TWO_KNIGHTS_TRANSPO),
        choice(
          'This position came from 3...Nf6 4.d3 Bc5 5.c3. Which line have you seen it in before?',
          [
            yes('My main Giuoco Piano line', 'Exactly the same position. This is a **transposition**: different move order, same position. Pattern recognizers notice these, which means less to memorize.'),
            no('It is a brand new position', 'Look again: c3, d3, Nf3, Bc4 against Nc6, Nf6, Bc5, d6. It is your main line!'),
          ],
          { setup: TWO_KNIGHTS_TRANSPO, side: 'w', flash: 5000 },
        ),
        recall('w', TWO_KNIGHTS_TRANSPO),
      ],
    },
    {
      id: 'italian-5',
      title: 'Odd third moves',
      goal: 'Handle 3...Nd4, 3...Be7 and friends',
      tags: ['italian', 'blunder-check'],
      exercises: [
        walk('w', BLACKBURNE_AVOID),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4',
          ['Nxd4'],
          "e5 looks free. Don't take it. Find a safe, good move.",
          '4.Nxd4 trades off the annoying knight. 4.O-O and 4.c3 are also fine. Just NOT 4.Nxe5?, because of 4...Qg5!',
          { accept: ['O-O', 'c3'], tags: ['blunder-check'] },
        ),
        recall('w', BLACKBURNE_AVOID),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Be7',
          ['d4'],
          'Black plays the passive 3...Be7. You can stick to your setup, or grab the center at once. Grab it!',
          'Against passive play, take space: 4.d4. (4.c3 or 4.d3 with your normal plan is fine too.)',
          { accept: ['d3', 'c3', 'O-O', 'Nc3'], tags: ['center'] },
        ),
        info(
          'If Black plays something unusual that you have not learned, fall back on **the setup**: c3, d3, O-O, Re1, Bb3, h3, Nbd2–f1–g3. It works against almost any quiet move.',
          { title: 'When in doubt', setup: upTo(ITALIAN_MAIN, 18), side: 'w' },
        ),
      ],
    },
  ],
};

export const punish: Unit = {
  id: 'punish',
  title: 'Punish Mistakes',
  subtitle: 'Traps after 1.e4 e5 2.Nf3',
  section: SECTION,
  color: '#7b3f3f',
  icon: '⚡',
  side: 'w',
  lessons: [
    {
      id: 'punish-legal',
      title: "Légal's Mate",
      goal: 'A pinned piece is not always pinned',
      tags: ['pin', 'mate', 'f7'],
      exercises: [
        info(
          "Black's bishop pins your knight to your queen. Normally you can't move the knight, but if moving it creates a **checkmate**, the queen is bait.",
          { title: 'Breaking a pin', setup: '1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6', side: 'w', arrows: [arrow('g4', 'd1', 'red')] },
        ),
        walk(
          'w',
          `1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 {Pinning your knight.}
4.Nc3 g6? {A slow move. Black's king is still in the center.}
5.Nxe5! {Ignore the pin!}
Bxd1?? {Black grabs the queen...}
6.Bxf7+ Ke7 {The king's only square.}
7.Nd5# {Checkmate with three minor pieces. This is Légal's Mate.}`,
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6',
          ['Nxe5'],
          'Your knight is pinned... or is it?',
          '5.Nxe5! If 5...Bxd1?? then 6.Bxf7+ Ke7 7.Nd5#. If 5...dxe5, then 6.Qxg4 and you have won a pawn.',
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1',
          ['Bxf7+', 'Ke7', 'Nd5#'],
          'Black took the queen. Mate in 2.',
          'Bishop check, then the knight lands on d5. Three minor pieces deliver mate.',
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 dxe5',
          ['Qxg4'],
          "Black didn't take your queen. Collect your reward.",
          'The pin is gone, so your queen takes the g4 bishop. You are a pawn up.',
        ),
      ],
    },
    {
      id: 'punish-petrov',
      title: 'The Petrov',
      goal: '2...Nf6 and the copycat trap',
      tags: ['petrov', 'discovery'],
      exercises: [
        walk('w', PETROV),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nxe4',
          ['Qe2'],
          "Black copied you with 3...Nxe4?. Black's knight is now pinned on the e-file. Exploit it.",
          '4.Qe2! attacks the e4 knight, which is pinned against the e8 king. If Black moves it, you have a discovered attack waiting.',
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nxe4 4.Qe2 Nf6',
          ['Nc6+'],
          'Black retreated the knight. Find the winning discovered check.',
          'Nc6+! The knight moves out of the way, so your queen gives check down the e-file. At the same time the knight attacks Black\'s queen. Black must deal with check, and you win the queen.',
          { tags: ['discovery'] },
        ),
        recall('w', PETROV),
      ],
    },
    {
      id: 'punish-philidor',
      title: 'Philidor & friends',
      goal: 'Punish passive and weakening second moves',
      tags: ['center'],
      exercises: [
        walk('w', PHILIDOR),
        recall('w', PHILIDOR),
        find(
          'w',
          '1.e4 e5 2.Nf3 f6 3.Nxe5 fxe5',
          ['Qh5+', 'g6', 'Qxe5+'],
          'Black weakened the king with 2...f6. You sacrificed a knight. Now cash in.',
          "Qh5+ forces ...g6, and Qxe5+ forks the king and the h8 rook. Pawn moves in front of the king create holes like this.",
          { tags: ['king-safety', 'fork'] },
        ),
      ],
    },
  ],
};

export const beyond: Unit = {
  id: 'beyond',
  title: 'Beyond 1...e5',
  subtitle: 'Sicilian, French, Caro-Kann, and more',
  section: SECTION,
  color: '#566a80',
  icon: '♘',
  side: 'w',
  lessons: [
    {
      id: 'beyond-sicilian',
      title: 'Sicilian: the Alapin',
      goal: '1...c5 2.c3: build the center',
      tags: ['sicilian'],
      exercises: [
        info(
          'The Sicilian (1...c5) is the most popular answer to 1.e4, and its main lines are packed with theory. You will dodge all of that with **2.c3**, the Alapin, preparing d4 for a full pawn center.',
          { title: 'The Alapin', setup: '1.e4 c5 2.c3', side: 'w', arrows: [arrow('d2', 'd4', 'blue')] },
        ),
        walk('w', ALAPIN_D5),
        recall('w', ALAPIN_D5),
        walk('w', ALAPIN_NF6),
        recall('w', ALAPIN_NF6),
        choice(
          'Same idea in both lines. What is the purpose of 2.c3?',
          [
            yes('Prepare d4 so you can recapture with a pawn', 'Yes. If Black takes on d4, you take back with the c-pawn and keep two pawns in the center.'),
            no('Develop the queen via c2', 'Not the point.'),
            no('Stop ...Nc6', 'c3 does not affect the c6 square.'),
          ],
          { setup: '1.e4 c5 2.c3', side: 'w' },
        ),
      ],
    },
    {
      id: 'beyond-chains',
      title: 'French & Caro-Kann',
      goal: 'One plan for both: the advance chain',
      tags: ['pawn-chain'],
      exercises: [
        info(
          'Against both the French (1...e6) and the Caro-Kann (1...c6), you play **e5**. That builds a pawn chain, **d4–e5**, that gives you space. Black will always attack its **base** (d4) with ...c5. Your job is to keep d4 well defended.',
          {
            title: 'Pawn chains',
            setup: '1.e4 e6 2.d4 d5 3.e5 c5',
            side: 'w',
            highlights: ['d4', 'e5'],
            arrows: [arrow('c5', 'd4', 'red')],
          },
        ),
        walk('w', FRENCH_ADVANCE),
        recall('w', FRENCH_ADVANCE),
        walk('w', CARO_ADVANCE),
        recall('w', CARO_ADVANCE),
        choice(
          'Look at the pawns only. Which is the base of White\'s chain, and what does Black hit it with?',
          [
            yes('d4, with ...c5', 'Right. Attack a chain at its base. That pattern holds in every pawn chain, in every opening.'),
            no('e5, with ...f6', '...f6 is also a real idea, but the base of the chain is d4.'),
            no('c3, with ...b5', 'Not quite.'),
          ],
          { setup: '1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3', side: 'w', pawnsOnly: true, tags: ['pawn-chain', 'structure'] },
        ),
      ],
    },
    {
      id: 'beyond-other',
      title: 'Scandinavian & others',
      goal: 'Gain time on the queen; the classical setup',
      tags: ['tempo'],
      exercises: [
        walk('w', SCANDI),
        recall('w', SCANDI),
        info(
          "Against rare moves (1...d6, 1...g6, 1...Nc6, 1...b6) use the **classical setup**: d4, Nf3, Nc3, Be2 or Bc4, O-O. Two center pawns plus quick development is never wrong.",
          { title: 'The universal setup', setup: PIRC_CLASSICAL, side: 'w' },
        ),
        recall('w', PIRC_CLASSICAL),
        find(
          'w',
          '1.e4 Nc6 2.Nf3 e5',
          ['Bc4'],
          'Black started with 1...Nc6, but now look at the position. Play your repertoire move.',
          "It's the Italian! 1...Nc6 2.Nf3 e5 transposed to your main line, so play 3.Bc4.",
          { accept: ['Bb5', 'd4'], tags: ['transposition'] },
        ),
      ],
    },
  ],
};
