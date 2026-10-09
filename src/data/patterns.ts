import type { ChoiceOption, Unit } from '../types';
import { choice, find, info, no, upTo, yes } from './build';
import {
  ALAPIN_D5,
  CARO_ADVANCE,
  FRENCH_ADVANCE,
  ITALIAN_MAIN,
  QGD_EXCHANGE,
  QGD_MAIN,
  RUY_CLOSED,
  SCANDI,
  VS_LONDON,
} from './lines';

const SECTION = 'Pattern Gym';

const STRUCTURES = ['Italian center', 'Advance pawn chain', 'Carlsbad', 'Isolated queen pawn (IQP)', 'London triangle'];

/** Options listing every structure name, with `answer` marked correct. */
function structureOptions(answer: string, why: string): ChoiceOption[] {
  return STRUCTURES.map((s) => (s === answer ? yes(s, why) : no(s)));
}


function openingOptions(answer: string, why: string, distractors: string[]): ChoiceOption[] {
  const opts = [answer, ...distractors].sort();
  return opts.map((o) => (o === answer ? yes(o, why) : no(o)));
}

export const patternGym: Unit = {
  id: 'patterns',
  title: 'Pattern Gym',
  subtitle: 'Train your eye: structures, openings, tactics',
  section: SECTION,
  color: '#7d4a63',
  icon: '👁',
  lessons: [
    {
      id: 'pat-structures',
      title: 'Name that structure',
      goal: 'Recognize pawn skeletons in 3 seconds',
      tags: ['structure'],
      exercises: [
        info(
          "Strong players see a position in **chunks**: pawn shapes they recognize instantly, each tied to a plan. These drills flash only the pawns and kings. Name the skeleton and you'll know the plan. There are 5 shapes in your repertoire.",
          { title: 'Chunking', setup: QGD_EXCHANGE, side: 'b' },
        ),
        choice(
          'Name the structure.',
          structureOptions('Italian center', 'White c3–d3–e4 against Black d6–e5. A slow, flexible center. The plan is d3–d4 at the right moment, or piece play on the kingside.'),
          { setup: upTo(ITALIAN_MAIN, 18), side: 'w', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          'Name the structure.',
          structureOptions('Advance pawn chain', 'd4–e5 against d5–e6. Black attacks the base (d4) with ...c5; White grabs kingside space.'),
          { setup: FRENCH_ADVANCE, side: 'w', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          'Name the structure.',
          structureOptions('Isolated queen pawn (IQP)', 'White has a d-pawn with no c- or e-pawn beside it. It gives space and active pieces, but the pawn itself can be a target.'),
          { setup: ALAPIN_D5, side: 'w', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          'Name the structure.',
          structureOptions('Carlsbad', 'c6–d5 against d4–e3 after the exchange on d5. White: minority attack. Black: kingside play and a knight on e4.'),
          { setup: QGD_EXCHANGE, side: 'b', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          'Name the structure.',
          structureOptions('London triangle', 'White c3–d4–e3: a solid triangle. You hit it with ...c5 and trade off the f4 bishop.'),
          { setup: VS_LONDON, side: 'b', pawnsOnly: true, flash: 3000 },
        ),
        choice(
          'Name the structure. (Hint: you met it in a different opening.)',
          structureOptions('Advance pawn chain', 'The Caro-Kann Advance has the same chain as the French: d4–e5 against d5–e6, and the same ...c5 plan. Two openings, one pattern.'),
          { setup: CARO_ADVANCE, side: 'w', pawnsOnly: true, flash: 3000, tags: ['structure', 'pawn-chain'] },
        ),
      ],
    },
    {
      id: 'pat-plans',
      title: 'Structure → plan',
      goal: 'Each skeleton tells you what to do',
      tags: ['structure', 'plan'],
      exercises: [
        choice(
          'In an advance pawn chain, where should Black attack it?',
          [
            yes('At the base, d4, with ...c5', 'Undermine the foundation and the whole chain wobbles. (...f6 hitting the head is the second idea.)'),
            no('At the head, e5, with ...d6', 'The d-pawn is blocked on d5, so ...d6 is impossible here.'),
            no('Nowhere: chains are permanent', 'Chains get attacked all the time.'),
          ],
          { setup: FRENCH_ADVANCE, side: 'w', pawnsOnly: true },
        ),
        choice(
          'In the Carlsbad structure, what is the minority attack?',
          [
            yes("White pushes b4–b5 to attack Black's c6 pawn", 'Two pawns (a and b) attack three (a, b, c). The goal is a weak, backward c-pawn.'),
            no('Black pushes ...f5–f4', 'That is a kingside idea, not the minority attack.'),
            no('White trades all the minor pieces', 'Not the definition.'),
          ],
          { setup: QGD_EXCHANGE, side: 'b', pawnsOnly: true },
        ),
        choice(
          'You have an isolated d-pawn (IQP). What should you aim for?',
          [
            yes('Active pieces and attack. Avoid trading pieces', 'An IQP gives space and open lines. In the endgame it is just a weak pawn, so keep pieces on and play actively.'),
            no('Trade everything and head for the endgame', 'That favors the side playing against the IQP.'),
            no('Push it to d5 immediately no matter what', 'The d5 push is a key idea, but only when it works tactically.'),
          ],
          { setup: ALAPIN_D5, side: 'w', pawnsOnly: true },
        ),
        choice(
          'In the Italian center (c3–d3–e4), which pawn break is White preparing?',
          [
            yes('d3–d4', 'c3 and Re1 support d4, so White pushes it when ready to open the center.'),
            no('f2–f4', 'Possible later, but the thematic break is d4.'),
            no('b2–b4', 'A side idea for space, not the main break.'),
          ],
          { setup: upTo(ITALIAN_MAIN, 18), side: 'w', pawnsOnly: true },
        ),
      ],
    },
    {
      id: 'pat-openings',
      title: 'Which opening?',
      goal: 'Identify openings at a glance',
      tags: ['recognition'],
      exercises: [
        choice('Which opening is this?', openingOptions('Italian Game', 'Bishop on c4 aiming at f7, with c3 and d3. Your White main line.', ['Ruy Lopez', 'Scandinavian', 'London System']), {
          setup: upTo(ITALIAN_MAIN, 12),
          side: 'w',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('Ruy Lopez', 'White bishop retreated to c2 via b5, a4 and b3; Black played ...a6, ...b5, ...Na5.', ['Italian Game', "Queen's Gambit Declined", 'French Advance']), {
          setup: RUY_CLOSED,
          side: 'b',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions("Queen's Gambit Declined", 'd5 and e6 against d4 and c4, with Bg5 pinning: the classical QGD.', ['London System', 'Caro-Kann Advance', 'Sicilian Alapin']), {
          setup: upTo(QGD_MAIN, 12),
          side: 'b',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('London System', "White's bishop on f4 with pawns on c3–d4–e3.", ["Queen's Gambit Declined", 'Italian Game', 'French Advance']), {
          setup: VS_LONDON,
          side: 'b',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('Caro-Kann Advance', "The chain d4–e5 against d5–e6, and Black's light-squared bishop sits OUTSIDE the chain on f5.", ['French Advance', 'Scandinavian', 'Sicilian Alapin']), {
          setup: CARO_ADVANCE,
          side: 'w',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('French Advance', "Same chain as the Caro, but Black's light-squared bishop is stuck INSIDE on c8, behind e6.", ['Caro-Kann Advance', 'Ruy Lopez', 'London System']), {
          setup: FRENCH_ADVANCE,
          side: 'w',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('Scandinavian', "Black's queen came out early to a5.", ['Sicilian Alapin', 'Italian Game', 'Caro-Kann Advance']), {
          setup: SCANDI,
          side: 'w',
          flash: 2500,
        }),
        choice('Which opening is this?', openingOptions('Sicilian Alapin', 'c3 supporting d4 against a Sicilian. Now White has an isolated d-pawn.', ['Scandinavian', 'French Advance', 'London System']), {
          setup: ALAPIN_D5,
          side: 'w',
          flash: 2500,
        }),
      ],
    },
    {
      id: 'pat-tactics',
      title: 'Opening tactics',
      goal: 'Forks, pins, discoveries, smothered mate',
      tags: ['tactics'],
      exercises: [
        find(
          'w',
          '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7 5.Qe2 Ngf6',
          ['Nd6#'],
          "Black's king is boxed in by its own pieces. One move.",
          "Nd6#! A **smothered mate**: the e7 pawn and the queen and bishop on d8 and f8 block the king's escape. Your queen on e2 pins the e7 pawn, so it can't capture the knight.",
          { tags: ['mate'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.Bc4',
          ['Nxe4', 'Nxe4', 'd5'],
          'The fork trick. Take, then fork.',
          '4...Nxe4 5.Nxe4 d5: the pawn forks bishop and knight, and you get the piece back.',
          { tags: ['fork'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.O-O Ng4 5.h3 h5 6.hxg4 hxg4 7.Ne1',
          ['Qh4', 'f3', 'g3'],
          'The Fishing Pole trap: White took your knight and opened the h-file. Go for mate.',
          "...Qh4 threatens ...Qh1#. After f3, ...g3 threatens ...Qh2# and nothing stops it. Open files toward the king are deadly.",
          { tags: ['mate', 'king-safety'] },
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nxe4 4.Qe2 Nf6',
          ['Nc6+'],
          'Discovered attack. Find it.',
          "Nc6+: discovered check from the queen, and the knight attacks Black's queen. You win the queen.",
          { tags: ['discovery'] },
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1',
          ['Bxf7+', 'Ke7', 'Nd5#'],
          'Mate in 2.',
          "Légal's mate: Bxf7+ Ke7 Nd5#.",
          { tags: ['mate', 'pin'] },
        ),
      ],
    },
    {
      id: 'pat-einstellung',
      title: 'When the pattern lies',
      goal: 'Spot when the "normal" move is wrong',
      tags: ['blunder-check'],
      exercises: [
        info(
          'Good pattern-matchers have one weakness: when a position *looks* familiar, they play the familiar move without checking. Psychologists call this the **Einstellung effect**. In these drills the natural move is wrong. Run your blunder check.',
          { title: 'The Einstellung effect' },
        ),
        choice(
          'Develop a knight toward the center with 3...Nf6. Good idea?',
          [
            yes('No: Qxf7 is checkmate', 'The "develop knights" pattern loses to a threat. Threats first, principles second.'),
            no('Yes: knights before bishops', 'Not here. Qxf7#.'),
          ],
          { setup: '1.e4 e5 2.Bc4 Nc6 3.Qh5', side: 'b' },
        ),
        choice(
          'Black left e5 hanging. Take it with 4.Nxe5?',
          [
            yes('No: 4...Qg5 hits the knight and g2', 'The Blackburne Shilling trap. Free pawns deserve suspicion.'),
            no('Yes: free pawn', '4...Qg5! and White is in trouble.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4', side: 'w' },
        ),
        choice(
          'Copy White with 3...Nxe4, winning the pawn back?',
          [
            yes('No: 4.Qe2 pins the knight and sets up Nc6+', 'Copying moves can walk into tactics. The right move is 3...d6 first.'),
            no('Yes: symmetry is safe', '4.Qe2! and the knight is in trouble.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nf6 3.Nxe5', side: 'b', tags: ['petrov', 'blunder-check'] },
        ),
        choice(
          "The f6 knight is pinned. Is ...Nxd5 impossible?",
          [
            yes('No: Nxd5! Bxd8 Bb4+ wins a piece', 'The Elephant Trap. "Pinned" is a pattern, not a law.'),
            no('Yes: the queen would hang', 'You win it back with Bb4+ and come out a piece ahead.'),
          ],
          { setup: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5', side: 'b', tags: ['pin', 'blunder-check'] },
        ),
        choice(
          'The g5 knight is attacking f7. Defend f7 with 4...Qe7?',
          [
            yes('No: just take it with 4...Qxg5', 'When something attacks you, check first: can you capture the attacker?'),
            no('Yes: f7 needs defending', 'The attacking knight is undefended. Take it!'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Ng5', side: 'b', tags: ['punish', 'blunder-check'] },
        ),
      ],
    },
  ],
};

