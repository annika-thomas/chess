import type { GradeExercise, Lesson, TapExercise, Unit } from '../types';
import { arrow, choice, info, no, yes } from './build';

/**
 * Piece placement: where pieces belong when there's no tactic. Order follows Yusupov's Build Up Your Chess 1
 * and the Steps Method (activity first, then files, outposts, pawn weaknesses, bishops, space). Exercises ask for
 * an idea, not one exact move: `good` lists every move that carries out the idea AND is within ~5% win chance of
 * Stockfish's best (depth 18, all moves scored); tap answers are curated and checked against piece mobility.
 */
const tap = (o: Omit<TapExercise, 'type'>): TapExercise => ({ type: 'tap', ...o });
const grade = (o: Omit<GradeExercise, 'type'>): GradeExercise => ({ type: 'grade', ...o });

const ACTIVITY = 'r1r3k1/pp2qppp/2n1pn2/3p4/3P4/N1PBPN2/PPQ2PPP/R4RK1 w - - 0 1';
const FILES = '2r2rk1/pp3ppp/2n1pn2/q7/3P4/P1N1PN2/1PQ2PPP/R4RK1 w - - 0 1';
const SEVENTH = '6k1/pp3pp1/7p/8/8/8/PP3PPP/3R2K1 w - - 0 1';
const OUTPOST = 'r1bq1rk1/pp2bppp/3p1n2/4p3/4P3/2N5/PPP1BPPP/R1BQ1RK1 w - - 0 1';
const IQP = 'r1bq1rk1/pp2bppp/2n2n2/3p4/8/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 1';
const PASSED = '8/5pk1/6p1/1P5p/8/6P1/5PKP/8 w - - 0 1';
const BISHOPS = 'r2q1rk1/pp3ppp/2n1pn2/2Pp4/1P1P4/P2BPN2/5PPP/R1BQ1RK1 w - - 0 1';
const SPACE = 'rnbqkbnr/pp3ppp/4p3/2ppP3/3P4/2P5/PP3PPP/RNBQKBNR b KQkq - 0 4';

export const activity: Lesson = {
  id: 'place-activity',
  title: 'Active pieces',
  goal: 'Count squares, and improve your worst piece',
  tags: ['activity'],
  exercises: [
    info(
      'When there’s no tactic, ask: **which of my pieces is worst, and where would it be better?** A piece is only as strong as the squares it reaches. A knight in the centre reaches 8 squares; in the corner, 2. “A knight on the rim is dim.”',
      { title: 'Where pieces belong', fen: '7k/8/8/8/3N4/8/8/N6K w - - 0 1', side: 'w', arrows: [arrow('d4', 'e6', 'green'), arrow('d4', 'b5', 'green'), arrow('a1', 'b3', 'red'), arrow('a1', 'c2', 'red')] },
    ),
    choice('How many squares can a knight in the corner reach?', [yes('2', 'Right: from a1 only b3 and c2. In the centre it reaches 8.'), no('4', 'Count again from a1: only b3 and c2.'), no('8', 'That’s a knight in the centre. In the corner it has just 2.')]),
    tap({
      prompt: 'No tactics here. Tap White’s worst piece.',
      fen: ACTIVITY,
      side: 'w',
      answers: ['a3'],
      explain: 'The **a3 knight**: on the rim it has only two safe squares (b1 and b5), while every other piece has more. Improve it first.',
    }),
    grade({
      prompt: 'Improve your worst piece: the knight on a3.',
      fen: ACTIVITY,
      side: 'w',
      good: ['Nb1', 'Nb5'],
      explain: '**Nb5** jumps to an active square right away; **Nb1** heads for d2 and f1 or e5 later. **Nc4?** looks active but the d5 pawn just takes it.',
      tags: ['activity'],
    }),
    choice('In a quiet position with no tactics, what’s a good first question?', [
      yes('Which of my pieces is worst, and where would it be better?', 'Yes. Improving your worst piece is the simplest plan there is.'),
      no('Which pawn can I push?', 'Pawn moves can’t be taken back. Improve a piece first.'),
      no('How can I bring my queen out?', 'An early queen gets chased around. Look at your worst piece instead.'),
    ]),
  ],
};

export const files: Lesson = {
  id: 'place-files',
  title: 'Open files and the 7th rank',
  goal: 'Where rooks belong',
  tags: ['files'],
  exercises: [
    info(
      'Rooks need open lines. An **open file** has no pawns on it; a rook there can reach the other side. From there the target is the **7th rank** (your opponent’s second rank), where it attacks pawns from the side and traps the king.',
      { title: 'Rooks on open files', fen: FILES, side: 'w', arrows: [arrow('a1', 'c1', 'green'), arrow('c1', 'c7', 'green')] },
    ),
    tap({
      prompt: 'Tap any square on the open file.',
      fen: FILES,
      side: 'w',
      answers: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
      explain: 'The **c-file** has no pawns at all. Black’s rook is already on it; White should contest it.',
    }),
    grade({
      prompt: 'Put a rook on the open file.',
      fen: FILES,
      side: 'w',
      good: ['Rac1', 'Rfc1'],
      explain: 'Either rook to c1 contests the file. If you don’t, Black’s c8 rook will own it.',
      tags: ['files'],
    }),
    choice(
      'Which plan fits this position?',
      [
        yes('Bring the rooks to the open c-file', 'Right. The open file is the highway into Black’s position. The engine’s top moves are exactly this.'),
        no('Storm the kingside with g4', 'With no targets there, g4 just weakens your king. The engine rates it far worse.'),
        no('Wait with Kh1', 'Waiting lets Black take the only open file. Use your rooks.'),
      ],
      { fen: FILES, side: 'w' },
    ),
    grade({
      prompt: 'Your rook has the open d-file. Where does it belong now?',
      fen: SEVENTH,
      side: 'w',
      good: ['Rd7'],
      explain: '**Rd7**: the 7th rank. It attacks b7 and f7 from the side and keeps Black’s king boxed in.',
      tags: ['files'],
    }),
    choice('What do players call two rooks on the 7th rank?', [
      yes('“Pigs”: they eat everything', 'That’s the nickname. Two rooks on the 7th usually win pawns or give mate.'),
      no('A battery', 'A battery is two pieces lined up on the same line, like queen behind bishop.'),
      no('A fork', 'A fork is one piece attacking two things.'),
    ]),
  ],
};

export const outposts: Lesson = {
  id: 'place-outposts',
  title: 'Outposts',
  goal: 'Squares your knights can own',
  tags: ['outpost'],
  exercises: [
    info(
      'An **outpost** is a square in or near the enemy camp that **your pawn defends** and **no enemy pawn can ever attack**. A knight there can’t be chased away, and it reaches deep into the enemy position.',
      { title: 'Outposts', fen: OUTPOST, side: 'w', arrows: [arrow('e4', 'd5', 'green')], highlights: ['d5'] },
    ),
    tap({
      prompt: 'Tap White’s best outpost.',
      fen: OUTPOST,
      side: 'w',
      answers: ['d5'],
      explain: '**d5**: your e4 pawn defends it, and Black has no c- or e-pawn that can ever attack it (the e-pawn has passed it).',
    }),
    grade({
      prompt: 'Add more control of d5 before you plant a knight there.',
      fen: OUTPOST,
      side: 'w',
      good: ['Qd3', 'Bc4', 'Qd2'],
      explain: 'More pieces aiming at d5 means a knight there can’t simply be traded off. **Qd3** and **Bc4** are the engine’s top choices.',
      tags: ['outpost'],
    }),
    choice(
      'Why not jump in with Nd5 right away?',
      [
        yes('Black’s f6 knight would trade it off; first build more control', 'Right. Win control of the square first (or remove the f6 knight with Bg5 and Bxf6), then plant the knight.'),
        no('Knights don’t belong on outposts', 'They do: an outpost is the perfect home for a knight.'),
        no('It loses the knight', 'It doesn’t lose material, but after Nxd5 exd5 the outpost is gone.'),
      ],
      { fen: OUTPOST, side: 'w' },
    ),
  ],
};

export const pawnWeaknesses: Lesson = {
  id: 'place-pawns',
  title: 'Weak pawns and passed pawns',
  goal: 'Targets to attack, and pawns to push',
  tags: ['pawns'],
  exercises: [
    info(
      'An **isolated pawn** has no pawns beside it, so only pieces can defend it, and the square in front of it is a perfect home for your pieces. A **passed pawn** has no enemy pawns in front of it or beside it: “passed pawns must be pushed.”',
      { title: 'Pawn weaknesses', fen: IQP, side: 'w', highlights: ['d5', 'd4'] },
    ),
    tap({
      prompt: 'Tap Black’s weakest pawn.',
      fen: IQP,
      side: 'w',
      answers: ['d5'],
      explain: 'The **d5 pawn** is isolated: no black c- or e-pawn can ever defend it.',
    }),
    grade({
      prompt: 'Blockade the square in front of the isolated pawn, or attack the pawn.',
      fen: IQP,
      side: 'w',
      good: ['Nd4', 'Qd3', 'Qb3', 'Qd2'],
      explain: '**Nd4** blockades: a knight in front of an isolated pawn can’t be chased by pawns. The queen moves add pressure on d5.',
      tags: ['pawns'],
    }),
    tap({
      prompt: 'Tap White’s passed pawn.',
      fen: PASSED,
      side: 'w',
      answers: ['b5'],
      explain: 'The **b5 pawn**: no black pawn on the a-, b- or c-files can stop it.',
    }),
    grade({
      prompt: 'What does White do with the passed pawn?',
      fen: PASSED,
      side: 'w',
      good: ['b6'],
      explain: '**b6**: push it. Black’s king is far away and can’t catch it, so Black has to give up everything to stop it.',
      tags: ['pawns'],
    }),
  ],
};

export const bishops: Lesson = {
  id: 'place-bishops',
  title: 'Good and bad bishops',
  goal: 'Bishops and their own pawns',
  tags: ['bishops'],
  exercises: [
    info(
      'A bishop moves on one colour. If your pawns sit on that colour, they block it: a **bad bishop**. The other bishop, moving on squares your pawns don’t occupy, is your **good bishop**. Fix a bad bishop by bringing it outside the pawn chain, or by trading it.',
      { title: 'Good and bad bishops', fen: BISHOPS, side: 'w', highlights: ['a3', 'b4', 'c5', 'd4', 'e3'] },
    ),
    tap({
      prompt: 'White’s pawns sit on dark squares. Tap White’s bad bishop.',
      fen: BISHOPS,
      side: 'w',
      answers: ['c1'],
      explain: 'The **c1 bishop** moves on dark squares, the same colour as your a3, b4, c5, d4 and e3 pawns, so it’s hemmed in. The d3 bishop is the good one.',
    }),
    grade({
      prompt: 'Start activating the bad bishop.',
      fen: BISHOPS,
      side: 'w',
      good: ['Bb2', 'Bd2'],
      explain: 'Both get it moving; next it can come to c3 or swing out on the long diagonal. A bad bishop is still a piece: activate it or trade it.',
      tags: ['bishops'],
    }),
    choice('Your pawns are on light squares. Which is your good bishop?', [
      yes('The dark-squared bishop', 'Right: it moves on the squares your pawns don’t block.'),
      no('The light-squared bishop', 'That one is stuck behind your own light-square pawns. It’s the bad one.'),
      no('Neither: bishops are equal', 'Their pawns decide it. A bishop on the same colour as its pawns has less room.'),
    ]),
    choice('If you can trade one bishop for one of theirs, which trade is usually best?', [
      yes('Your bad bishop for their good bishop', 'Yes: you get rid of your worst piece and remove their best.'),
      no('Your good bishop for their bad bishop', 'That leaves you with the bad one and them with the good one.'),
      no('Never trade bishops', 'Trades are fine when they improve your position.'),
    ]),
  ],
};

export const space: Lesson = {
  id: 'place-space',
  title: 'Space',
  goal: 'Room to move, and what to do without it',
  tags: ['space'],
  exercises: [
    info(
      '**Space** is the room behind your pawns. Advanced pawns (like White’s e5 here) give your pieces more squares and take squares from your opponent. The side with **more space** keeps pieces on; the side with **less space** wants to **trade pieces** to breathe.',
      { title: 'Space', fen: SPACE, side: 'w', highlights: ['e5', 'd4'] },
    ),
    choice(
      'Who has more space on the kingside here?',
      [
        yes('White: the e5 pawn takes f6 and d6 from Black', 'Right. Black’s knight can’t use f6, and Black’s pieces are more cramped on that side.'),
        no('Black: more pawns on the kingside', 'Pawn count doesn’t matter for space; how far they’ve advanced does.'),
        no('Equal', 'White’s e5 pawn grabs squares deep in Black’s half.'),
      ],
      { fen: SPACE, side: 'w' },
    ),
    choice('You have less space. What helps most?', [
      yes('Trading pieces', 'Yes. Fewer pieces need fewer squares.'),
      no('Keeping every piece on', 'More pieces in less space means they get in each other’s way.'),
      no('Pushing all your pawns', 'Sometimes a pawn break helps, but pushing everything creates weaknesses.'),
    ]),
  ],
};

export const placement: Omit<Unit, 'section'> = {
  id: 'placement',
  title: 'Piece Placement',
  subtitle: 'Where pieces belong when there’s no tactic',
  color: '#3f6e7b',
  icon: 'icon:target',
  lessons: [activity, files, outposts, pawnWeaknesses, bishops, space],
};
