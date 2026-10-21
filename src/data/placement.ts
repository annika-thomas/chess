import type { ConceptExercise, Exercise, GradeExercise, Lesson, TapExercise, Unit } from '../types';
import { arrow, choice, info, no, walk, yes } from './build';

/**
 * Piece placement: where pieces belong when there's no tactic. Order follows Yusupov's Build Up Your Chess 1
 * and the Steps Method (activity first, then files, outposts, pawn weaknesses, bishops, space). Exercises ask for
 * an idea, not one exact move: `good` lists every move that carries out the idea AND is within ~5% win chance of
 * Stockfish's best (depth 18, all moves scored); tap answers are curated and checked against piece mobility.
 */
/** A mined real position: side to move, plus the tap answers or the good moves for its idea. */
export interface PoolItem {
  fen: string;
  side: 'w' | 'b';
  answers?: string[];
  good?: string[];
  ok?: string[];
  /** Plausible moves that are clearly worse, with the drop in win chance (%), for "which is best?" questions. */
  bad?: { san: string; drop: number }[];
  /** Every open file in the position (files pools). */
  open?: string[];
  /** Open files with no rook of the side to move yet (files pools), or key squares (outpost, weak pawn, worst piece). */
  files?: string[];
  squares?: string[];
  /** 'engine' (varied engine games), 'yours' (your own games) or 'lichess'. */
  src?: string;
}

const tap = (o: Omit<TapExercise, 'type'>): TapExercise => ({ type: 'tap', ...o });
const grade = (o: Omit<GradeExercise, 'type'>): GradeExercise => ({ type: 'grade', ...o });

const ACTIVITY = 'r1r3k1/pp2qppp/2n1pn2/3p4/3P4/N1PBPN2/PPQ2PPP/R4RK1 w - - 0 1';
const FILES = '2r2rk1/pp3ppp/2n1pn2/q7/3P4/P1N1PN2/1PQ2PPP/R4RK1 w - - 0 1';
const SEVENTH = '6k1/pp3pp1/7p/8/8/8/PP3PPP/3R2K1 w - - 0 1';
const OUTPOST = 'r1bq1rk1/pp2bppp/3p1n2/4p3/4P3/2N5/PPP1BPPP/R1BQ1RK1 w - - 0 1';
const IQP = 'r1bq1rk1/pp2bppp/2n2n2/3p4/8/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 1';
const PASSED = '8/5pk1/6p1/1P5p/8/6P1/5PKP/8 w - - 0 1';
const BISHOPS = 'r2q1rk1/pp3ppp/2n1pn2/2Pp4/1P1P4/P2BPN2/5PPP/R1BQ1RK1 w - - 0 1';
// Worked examples: real positions (varied engine games, Stockfish's main line).
const ACTIVITY_GAME = '2b4r/1p5p/5kp1/2R1p3/2P1P3/1rPR1P1P/4B1P1/K7 w - - 1 26';
const W_ACTIVITY = `Bd1 {White’s worst piece is the e2 bishop: its own pawns on c4, e4 and f3 sit on its colour and block it. It reroutes: from d1 it heads for b3, outside the pawn chain, and on the way it hits Black’s b3 rook.}
Rb6 {The rook has to step back.}
Rb5 {White offers a rook trade on the b-file.}
Rc6 {Black declines.}
Kb2 {In an endgame the king is a fighting piece too: it guards the c3 pawn.}
Be6 Bb3 {Arrived. Two moves ago this bishop had no future; now it owns the a2–g8 diagonal and challenges Black’s bishop.}`;
const FILES_GAME_1 = 'r1bq1rk1/pp2nppp/2p5/3n4/2B5/5NN1/PP2QPPP/R3R1K1 b - - 3 15';
const W_FILES_1 = `Re8 {Two files are open here: d and e, with no pawns on them. White’s queen and rook already sit on the e-file, so Black contests it at once. Leave it, and White owns it.}
Rad1 {White grabs the other open file, the d-file.}
Bd7 {Black develops the last piece. Now both rooks can join.}
Qd3 {White doubles up on the d-file. Now the d-file belongs to White and the e-file is shared. Count who owns which file every move.}`;
const FILES_GAME_2 = 'r4rk1/1p2q1bp/p3p1p1/2p1Pn2/5BQ1/1N6/P1P2PPP/3RR1K1 b - - 1 21';
const W_FILES_2 = `Rad8 {White’s rook sits on the open d-file. Black puts a rook on it too: contest the file instead of giving it away.}
Bg5 {White hits Black’s queen, which also stands in front of the d8 rook.}
Rxd1 {Trade on the file. After the trades, whoever still has a rook there owns it.}
Rxd1 Qc7 {The queen steps away and now aims at White’s e5 pawn.}
Qc4 Qxe5 {Because Black contested the file, White never got to use it, and the e5 pawn fell.}`;
const SEVENTH_GAME = '6k1/p4p2/6pp/8/1pRnr3/1P5P/P4PP1/5BK1 w - - 2 35';
const W_SEVENTH = `Rc7 {The c-file is open, so the rook runs straight to the 7th rank. Black’s a7 and f7 pawns are still at home and can only be guarded by pieces.}
Re1 {Black hits back on White’s first rank, attacking the f1 bishop.}
f3 {White gives the king a little room so the back rank is safe.}
Ra1 Rxa7 {The 7th-rank rook collects the a-pawn. White now has a passed b-pawn.}`;
const OUTPOST_GAME_1 = 'r5k1/2pn3p/3p1pp1/1P5P/4P3/6N1/1r3PP1/2R1R1K1 b - - 0 30';
const W_OUTPOST_1 = `Nc5 {c5 is an outpost for Black: the d6 pawn guards it, and White has no d-pawn and the b5 pawn has already gone past, so no white pawn can ever attack c5. The knight hits e4 and can’t be chased away.}
Rb1 {White tries to trade rooks on the b-file.}
Rc2 {Black keeps the rook active on White’s second rank instead. The knight on c5 is going nowhere.}`;
const OUTPOST_GAME_2 = '2bqrnk1/rp2bpp1/2p1pn1p/p1PpN3/N2P1B1P/4P1P1/PPQ1BPK1/2R1R3 w - - 6 21';
const W_OUTPOST_2 = `Nb6 {b6 is a hole in Black’s camp: White’s c5 pawn guards it, Black’s c-pawn has already passed it, and the a-pawn is on a5, too far. The knight on b6 hits c8, d7 and a8 and ties Black up.}
N6d7 {Black’s only way to fight a knight on an outpost: offer to trade it.}`;
const W_PASSED = `b6 {Push it. No black pawn on the a-, b- or c-files can stop it, and Black’s king is too far away.}
Kf6 b7 {One step from queening.}
Ke7 b8=Q {The king never got close. Passed pawns must be pushed.}`;
const SPACE = 'rnbqkbnr/pp3ppp/4p3/2ppP3/3P4/2P5/PP3PPP/RNBQKBNR b KQkq - 0 4';

/** A random real position from a mined pool each time it's shown, so practice and reviews never repeat. */
const concept = (pool: string, mode: 'tap' | 'grade', prompt: string, explain: string, more: Partial<ConceptExercise> = {}): ConceptExercise => ({
  type: 'concept',
  pool,
  mode,
  prompt,
  explain,
  ...more,
});
/** Guided steps on one position: shown in the lesson, not reviewed (the concept cards cover that). */
const guided = (ex: Exercise): Exercise => ({ ...ex, noReview: true });

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
    walk('w', W_ACTIVITY, {
      fen: ACTIVITY_GAME,
      title: 'Worked example: rerouting a bad bishop',
    }),
    guided(
      tap({
        prompt: 'No tactics here. Tap White’s worst piece.',
        fen: ACTIVITY,
        side: 'w',
        answers: ['a3'],
        explain: 'The **a3 knight**: on the rim it has only two safe squares (b1 and b5), while every other piece has more. Improve it first.',
      }),
    ),
    guided(
      grade({
        prompt: 'Improve the knight on a3.',
        fen: ACTIVITY,
        side: 'w',
        good: ['Nb1', 'Nb5'],
        explain: '**Nb5** jumps to an active square right away; **Nb1** heads for d2 and f1 or e5 later. **Nc4?** looks active but the d5 pawn takes it.',
        tags: ['activity'],
      }),
    ),
    concept('worst-tap', 'tap', 'A position from a real game. Tap {side}’s worst piece: the one with the fewest safe squares.', '{squares}: count its safe moves (squares no enemy pawn hits). It has the fewest, so it’s the piece to improve first.'),
    concept(
      'worst-grade',
      'grade',
      'Step 2: improve that piece. Where is it heading?',
      '{good}: the engine’s choice for this piece. A move that gives it more safe squares, even a step backwards to reroute, is often the best move when nothing is happening.',
      { first: { prompt: '{side} to move, no tactics. Step 1: tap {side}’s worst piece.', explain: 'The worst piece is on {squares}: it has the fewest safe squares.' } },
    ),
    concept('worst-tap', 'tap', 'Another real position. Tap {side}’s least active piece.', '{squares} has the fewest safe squares. Ask what it needs: a new square, a new diagonal, or a trade.'),
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
      'Rooks need open lines. An **open file** has no pawns on it at all, so a rook there can reach the other side of the board. Rooks stuck behind their own pawns do nothing. Every game, ask: **is there an open file, and who owns it?**',
      { title: 'Rooks on open files', fen: FILES, side: 'w', arrows: [arrow('a1', 'c1', 'green'), arrow('c1', 'c7', 'green')] },
    ),
    concept('files-tap', 'tap', 'A position from a real game. Tap any square on an open file (a file with no pawns at all).', 'Open here: {open}, with no pawns of either colour. That’s where the rooks want to be.'),
    walk('b', W_FILES_1, { fen: FILES_GAME_1, title: 'Worked example: take the open file' }),
    concept(
      'files-grade',
      'grade',
      'Step 2: put a rook on the open file that doesn’t have one yet.',
      '{good} puts a rook on {files}. Stockfish rates it among the best moves here; most other moves let your opponent take the file first.',
      { first: { prompt: '{side} to move. Step 1: find an open file. Tap any square on it.', explain: 'Open here: {open}. Your rooks aren’t on {files} yet.' } },
    ),
    walk('b', W_FILES_2, { fen: FILES_GAME_2, title: 'Worked example: contest a file your opponent owns' }),
    concept('files-grade', 'grade', '{side} to move in a quiet position. Use your rooks: play a move that puts one on an open file.', '{good}: rook to {files}. The rook that isn’t doing anything yet is usually the one to move.'),
    concept('files-tap', 'tap', 'Tap a square on an open file in this position.', 'Open here: {open}, with no pawns from either side.'),
    info(
      'Once a rook owns an open file, it goes **all the way in**: to the **7th rank** (your opponent’s second rank). From there it attacks pawns that are still on their starting squares from the side, where they’re hard to defend, and it boxes the king in.',
      { title: 'The 7th rank', fen: SEVENTH, side: 'w', arrows: [arrow('d1', 'd7', 'green')] },
    ),
    walk('w', W_SEVENTH, { fen: SEVENTH_GAME, title: 'Worked example: rook to the 7th wins a pawn' }),
    concept('seventh-grade', 'grade', '{side} to move. Get a rook to the 7th rank ({other}’s second rank) if it’s a good idea here.', '{good}: the rook reaches {other}’s second rank, hitting pawns from the side and cutting off the king.'),
    concept('seventh-grade', 'grade', 'Real endgame position. {side} to move: find the rook move to the 7th rank.', '{good}. On the 7th, a rook attacks every pawn that hasn’t moved, and they can only be defended by pieces.'),
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
      'An **outpost** is a square in or near the enemy camp that **your pawn defends** and **no enemy pawn can ever attack**. A knight there can’t be chased away, and it reaches deep into the enemy position. To spot one: look for a hole in front of an enemy pawn that’s already gone past, or on a file with no enemy pawns beside it.',
      { title: 'Outposts', fen: OUTPOST, side: 'w', arrows: [arrow('e4', 'd5', 'green')], highlights: ['d5'] },
    ),
    walk('b', W_OUTPOST_1, { fen: OUTPOST_GAME_1, title: 'Worked example: a knight on an outpost' }),
    concept('outpost-tap', 'tap', 'Real game position. Tap an outpost for {side}: a square your pawn defends that no enemy pawn can ever attack.', 'The outpost: {squares}. Your pawn guards it, and the enemy pawns that could have attacked it are gone or already past.'),
    walk('w', W_OUTPOST_2, { fen: OUTPOST_GAME_2, title: 'Worked example: the knight jumps in' }),
    concept(
      'outpost-grade',
      'grade',
      'Step 2: get a knight to that outpost.',
      '{good}: the knight lands on the outpost, where no pawn can chase it.',
      { first: { prompt: '{side} to move. Step 1: tap the outpost square (your pawn guards it; no enemy pawn can attack it).', explain: 'The outpost is {squares}.' } },
    ),
    concept('outpost-tap', 'tap', 'Find {side}’s outpost in this position.', '{squares}: guarded by your pawn, and no enemy pawn can ever kick a piece off it.'),
    concept('outpost-grade', 'grade', '{side} to move. Put a knight on its best square.', '{good}: an outpost. A knight there is often worth more than a rook.'),
    choice(
      'White’s knight could jump to d5 now, but Black’s f6 knight would trade it off. What’s the better plan?',
      [
        yes('Build more control of d5 first, then plant the knight', 'Right. Win control of the square first (or remove the f6 knight with Bg5 and Bxf6), then plant the knight.'),
        no('Forget d5: knights don’t belong on outposts', 'They do: an outpost is the perfect home for a knight.'),
        no('Jump in anyway: the trade loses Black a piece', 'It’s an even trade, and after Nxd5 exd5 the outpost is gone.'),
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
      'An **isolated pawn** has no pawns of its own colour on the files beside it, so only pieces can defend it, and the square in front of it is a perfect home for your pieces. To spot one: look at the files next to each pawn.',
      { title: 'Isolated pawns', fen: IQP, side: 'w', highlights: ['d5', 'd4'] },
    ),
    concept('isolated-tap', 'tap', 'Real game position. Tap {other}’s isolated pawn: no {other} pawn on the files beside it.', 'The isolated pawn is on {squares}. Check the files on each side: no pawns of its colour, so no pawn can ever defend it.'),
    guided(
      grade({
        prompt: 'Black’s d5 pawn is isolated. Blockade the square in front of it, or attack the pawn.',
        fen: IQP,
        side: 'w',
        good: ['Nd4', 'Qd3', 'Qb3', 'Qd2'],
        explain: '**Nd4** blockades: a knight in front of an isolated pawn can’t be chased by pawns. The queen moves add pressure on d5.',
        tags: ['pawns'],
      }),
    ),
    concept('isolated-tap', 'tap', 'Find {other}’s weak, isolated pawn.', '{squares}: nothing beside it on either file, so it can only be defended by pieces.'),
    info('A **passed pawn** has no enemy pawns in front of it or on the files beside it, so only pieces can stop it. “Passed pawns must be pushed.”', { title: 'Passed pawns', fen: PASSED, side: 'w', highlights: ['b5'] }),
    walk('w', W_PASSED, { fen: PASSED, title: 'Worked example: push the passed pawn' }),
    concept('passed-tap', 'tap', 'Real game position. Tap {side}’s passed pawn: no enemy pawn in front of it or on the files beside it.', 'The passed pawn is on {squares}. Nothing but pieces can stop it.'),
    concept(
      'passed-grade',
      'grade',
      'Step 2: make the most of that passed pawn.',
      '{good}: Stockfish’s pick here. Usually that means pushing it, or putting a piece behind it to support it.',
      { first: { prompt: '{side} to move. Step 1: tap {side}’s passed pawn.', explain: 'The passed pawn is {squares}.' } },
    ),
    concept('passed-tap', 'tap', 'Spot {side}’s passed pawn in this position.', '{squares}: no enemy pawn ahead of it or beside it.'),
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
      noReview: true,
    }),
    concept('bishop-tap', 'tap', 'Real game position. Tap {side}’s bad bishop: the one stuck on the same colour as most of {side}’s pawns.', 'The bishop on {squares} moves on the same colour as most of its own pawns, so they block it.'),
    grade({
      prompt: 'Start activating the bad bishop.',
      fen: BISHOPS,
      side: 'w',
      good: ['Bb2', 'Bd2'],
      explain: 'Both get it moving; next it can come to c3 or swing out on the long diagonal. A bad bishop is still a piece: activate it or trade it.',
      tags: ['bishops'],
      noReview: true,
    }),
    concept('bishop-tap', 'tap', 'Find {side}’s bad bishop in this position.', '{squares}: its own pawns sit on its colour. Get it outside the pawn chain, or trade it.'),
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
