import type { EndgameExercise, Lesson, TapExercise } from '../types';
import { arrow, choice, find, info, no, yes } from './build';

/**
 * Fundamentals lessons for Levels 1–2, ordered after the Steps Method (Steps 1–2) and Polgar's mating
 * patterns. Each lesson is short: a worked example or two, then a practice set from the puzzle database
 * that must be passed at 80% (see `practice`). Positions marked with # are checked to be mate in tests.
 */
const endgame = (o: Omit<EndgameExercise, 'type'>): EndgameExercise => ({ type: 'endgame', ...o });
const tap = (o: Omit<TapExercise, 'type'>): TapExercise => ({ type: 'tap', ...o });

// ───────────── Level 1 ─────────────

export const safetyCheck: Lesson = {
  id: 'safety-check',
  title: 'The safety check',
  goal: 'Checks, captures, threats: before every move',
  tags: ['blunder-check'],
  exercises: [
    info(
      'The habit that separates improving players from everyone else: **before every move**, look at your opponent’s possible **checks**, **captures** and **threats**. If you skip it, you’re hoping they won’t see something. Coach Dan Heisman calls that “hope chess”.',
      { title: 'Checks, captures, threats' },
    ),
    info(
      'Do it in two directions. **Their** checks, captures and threats: am I safe? **Your** checks, captures and threats: can I win something? Most tactics are found by looking at every check and capture.',
      { title: 'Both sides of the board' },
    ),
    choice(
      'Black just played **3...Qh4**. Run the safety check. What is Black threatening?',
      [
        yes('Qxf2, checkmate', 'Queen and bishop both hit f2, which only your king defends. Qxf2 would be mate.'),
        no('Nothing: the queen is just developing', 'Look at f2: the queen and the c5 bishop both attack it.'),
        no('Qxh2, winning a pawn', 'Possible, but there’s something much worse: mate on f2.'),
      ],
      { setup: '1.e4 e5 2.Bc4 Bc5 3.d3 Qh4', side: 'w', arrows: [arrow('h4', 'f2', 'red'), arrow('c5', 'f2', 'red')] },
    ),
    find(
      'w',
      '1.e4 e5 2.Bc4 Bc5 3.d3 Qh4',
      ['Qf3'],
      'Black just played 3...Qh4. Run the safety check, then defend.',
      '**Qf3** guards f2. (Qe2, Nh3 and g3 also work.) Spotting the threat was the hard part. That’s why the safety check comes before every move.',
      { accept: ['Qe2', 'Nh3', 'g3', 'Qd2'] },
    ),
    choice('When should you do the safety check?', [
      yes('Before every single move', 'Every move. With practice it takes a few seconds and becomes automatic.'),
      no('Only when something looks dangerous', 'The dangerous moves are exactly the ones that don’t look dangerous.'),
      no('Only in the opening', 'Blunders happen in every phase.'),
    ]),
  ],
};

export const checkEscape: Lesson = {
  id: 'check-escape',
  title: 'Escaping check',
  goal: 'Three ways out: capture, block, move',
  tags: ['mate'],
  exercises: [
    info(
      'When your king is in **check**, you have exactly three ways out:\n\n1. **Capture** the checking piece.\n2. **Block** the check by putting a piece in between.\n3. **Move** the king to a safe square.\n\nIf none of them works, it’s **checkmate**.',
      { title: 'Three escapes' },
    ),
    find('w', '', ['Kxe2'], 'Your king is in check. The checking piece is right next to it and unprotected.', 'Capture it! **Kxe2**. Kings can capture too, as long as the piece isn’t defended.', {
      fen: '4k3/8/8/8/8/8/4q3/4K3 w - - 0 1',
    }),
    find('w', '', ['Bf1'], 'Check along the back rank. Block it.', '**Bf1** puts the bishop in between. Your king had no safe squares, so blocking was the only way.', {
      fen: '4k3/8/8/8/8/8/4BPPP/r5K1 w - - 0 1',
    }),
    find('w', '', ['Kd2'], 'Check down the e-file. You can’t capture or block it, so move the king.', 'Any king move off the e-file works: Kd1, Kd2, Kf1 or Kf2.', {
      fen: '4r1k1/8/8/8/8/8/8/4K3 w - - 0 1',
      accept: ['Kd1', 'Kf1', 'Kf2'],
    }),
    choice('What is checkmate?', [
      yes('The king is in check, and it can’t capture, block or move out of it'),
      no('Any check on the king', 'A check you can escape is just check.'),
      no('The king has no legal moves', 'If it isn’t in check, that’s stalemate: a draw!'),
    ]),
  ],
};

export const mateInOne: Lesson = {
  id: 'mate-one',
  title: 'Mate in one',
  goal: 'Find the move that ends the game',
  tags: ['mate'],
  practice: 'mate1',
  exercises: [
    info(
      'Checkmate patterns are the first thing strong players drill. Laszlo Polgar trained his daughters (one became the strongest woman player ever) on hundreds of mate-in-ones until they saw them instantly. Look at **every check** you have, and ask: can the king capture, block or escape?',
      { title: 'Drill the mates' },
    ),
    find('w', '', ['Qc8#'], 'White to move. Mate in one.', '**Qc8#**: the queen checks along the back rank, the a7 and b6 pawns box the king in, and nothing can block or capture.', {
      fen: 'k7/p7/1p6/2Q5/4P2P/8/5K2/5R2 w - - 0 1',
    }),
    find('w', '', ['Rg8#'], 'Mate in one.', '**Rg8#**: the rook checks, the h7 pawn blocks the king’s escape, and the e6 bishop protects the rook so the king can’t take it.', {
      fen: '7k/7p/2b1B3/8/8/8/P5R1/3K4 w - - 0 1',
    }),
    find('w', '', ['Qg8#'], 'Mate in one.', '**Qg8#**: the king’s own pawns on d7, e7 and f7 trap it, and the b4 bishop covers the escape square.', {
      fen: '4k3/3ppp2/8/4n3/1B3P2/4P3/7K/6Q1 w - - 0 1',
    }),
    info('Now the practice set: **25 mate-in-ones from real games**. Pass at 80% to move on. Then rerun the set until you can solve each in a few seconds.', { title: 'Your homework' }),
  ],
};

export const backRank: Lesson = {
  id: 'mate-backrank',
  title: 'Back-rank mate',
  goal: 'Kings trapped behind their own pawns',
  tags: ['mate'],
  practice: 'backrank',
  exercises: [
    info(
      'A castled king behind three unmoved pawns has no escape squares forward. A rook or queen on the back rank is then **checkmate**. It’s one of the most common ways games end below master level.',
      { title: 'The back rank', fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', side: 'w', arrows: [arrow('e1', 'e8', 'red')] },
    ),
    find('w', '', ['Re8#'], 'Mate in one.', '**Re8#**: the pawns on f7, g7 and h7 are the king’s own prison bars.', { fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1' }),
    choice(
      'Black’s pawn is on h6, not h7. Is Re8 checkmate?',
      [
        yes('No: the king escapes to h7', 'That little pawn move is called giving the king “luft” (air). A cheap insurance policy.'),
        no('Yes: same pattern', 'Look at h7: the pawn moved to h6, so h7 is now an escape square.'),
      ],
      { fen: '6k1/5pp1/7p/8/8/8/5PPP/4R1K1 w - - 0 1', side: 'w' },
    ),
    find('w', '', ['Rc8+', 'Qe8', 'Rxe8#'], 'Mate in two. Start with a check.', '**Rc8+** forces Black to block with the queen, then **Rxe8#**. A check that forces a block is the most common way to set up a back-rank mate.', {
      fen: '7k/6pp/2R5/1q4R1/8/8/2P1P1P1/4K3 w - - 0 1',
    }),
  ],
};

export const mateWithQueen: Lesson = {
  id: 'mate-queen',
  title: 'Mating with the queen',
  goal: 'King + queen vs king, without stalemate',
  tags: ['endgame', 'mate'],
  exercises: [
    info(
      'The **box method**: use the queen to cut the enemy king into a smaller and smaller box (often by staying a knight’s move away from it). When the king is on the edge, bring your own king up, then deliver mate.',
      { title: 'The box', fen: '8/8/8/3k4/8/8/8/Q3K3 w - - 0 1', side: 'w' },
    ),
    choice(
      'It’s Black’s move. What is this position?',
      [
        yes('Stalemate: a draw', 'Black isn’t in check but has no legal move. White threw away a win. Always leave the king at least one square until the mating move.'),
        no('Checkmate: White wins', 'The black king isn’t in check, so it can’t be checkmate.'),
        no('Black must pass', 'There’s no passing in chess. No legal moves and no check = stalemate.'),
      ],
      { fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1', side: 'w' },
    ),
    endgame({
      prompt: 'Guided: shrink the box. The shaded squares are where the king can still go; make them fewer each move.',
      fens: ['8/8/8/4k3/8/8/8/4K2Q w - - 0 1', '8/8/3k4/8/8/8/8/Q3K3 w - - 0 1', '8/2k5/8/8/8/8/8/3QK3 w - - 0 1'],
      side: 'w',
      goal: 'mate',
      limit: 25,
      guide: 'box',
      explain: 'Each queen move should take squares away. Once the king is on the edge with two or three squares left, walk your king up, then mate.',
    }),
    endgame({
      prompt: 'Checkmate the king with your queen. The engine defends perfectly.',
      fens: ['8/8/8/4k3/8/8/8/4K2Q w - - 0 1', '8/8/3k4/8/8/8/8/Q3K3 w - - 0 1', '8/2k5/8/8/8/8/8/3QK3 w - - 0 1'],
      side: 'w',
      goal: 'mate',
      limit: 20,
      explain: 'Box the king in with the queen, walk your king up, then mate on the edge. Watch for stalemate: give the king a square until the final check.',
    }),
  ],
};

export const forksWithCheck: Lesson = {
  id: 'fork-check',
  title: 'Forks with check',
  goal: 'The most forcing double attacks',
  tags: ['fork'],
  practice: 'fork-2',
  exercises: [
    info(
      'The strongest forks come **with check**: the king must answer the check first, so the second target falls. Queens and knights are the main forkers.',
      { title: 'Check + attack' },
    ),
    find('w', '', ['Qa4+', 'Ke7', 'Qxa8'], 'Fork the king and the rook with your queen.', '**Qa4+** checks the king on the diagonal and attacks the rook on the a-file at the same time.', {
      fen: 'r3k3/8/8/8/8/8/8/3QK3 w - - 0 1',
    }),
    find('w', '', ['Nc7+', 'Kd7', 'Nxa8'], 'Royal fork: check the king and attack the queen.', '**Nc7+** forks king and queen. Knight forks against king and queen are called “royal forks”.', {
      fen: 'q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
    }),
  ],
};

// ───────────── Level 2 ─────────────

export const skewer: Lesson = {
  id: 'skewer',
  title: 'The skewer',
  goal: 'Attack the big piece, win the one behind',
  tags: ['tactics'],
  practice: 'skewer',
  exercises: [
    info(
      'A **skewer** is a pin in reverse: you attack a valuable piece, and when it moves out of the way, you capture the piece behind it.',
      { title: 'The skewer', fen: '8/8/8/3k3r/8/8/8/R5K1 w - - 0 1', side: 'w', arrows: [arrow('a1', 'a5', 'green')] },
    ),
    find('w', '', ['Ra5+', 'Ke4', 'Rxh5'], 'Skewer the king and the rook.', '**Ra5+** checks along the 5th rank. The king must step off it, and the rook on h5 falls.', {
      fen: '8/8/8/3k3r/8/8/8/R5K1 w - - 0 1',
    }),
    choice('What’s the difference between a pin and a skewer?', [
      yes('In a pin the more valuable piece is behind; in a skewer it’s in front', 'Same line, different order.'),
      no('Pins are only done by bishops', 'Bishops, rooks and queens can all pin and skewer.'),
      no('There’s no difference', 'The order of the pieces on the line is the difference.'),
    ]),
  ],
};

export const doubleCheck: Lesson = {
  id: 'double-check',
  title: 'Double check',
  goal: 'Two checks at once: the king must run',
  tags: ['tactics', 'discovery'],
  practice: 'double-check',
  exercises: [
    info(
      'A **double check** is the strongest kind of discovered attack: the piece that moves gives check, AND the piece behind it gives check too. Two checks at once.',
      { title: 'Two checks at once' },
    ),
    find('w', '', ['Nf6+'], 'Give check with the knight AND uncover a check from the rook at the same time.', '**Nf6+** is a double check: the knight checks from f6 and the e1 rook checks down the open e-file. Black can’t block or capture both, so the king must move. (Nd6+ works the same way.)', {
      fen: '4k3/8/8/8/4N3/8/8/4R1K1 w - - 0 1',
      accept: ['Nd6+'],
    }),
    choice('After a double check, Black could capture one of the checking pieces with a pawn. Does that stop the check?', [
      yes('No: the other piece still gives check', 'Only a king move can answer a double check.'),
      no('Yes: one capture is enough', 'Two pieces are checking. Taking one leaves the other.'),
    ]),
  ],
};

export const removeDefender: Lesson = {
  id: 'remove-defender',
  title: 'Removing the defender',
  goal: 'Take away the piece that holds everything',
  tags: ['tactics'],
  practice: 'defender',
  exercises: [
    info(
      'When one enemy piece defends something important, capture it or chase it away first. Then the important thing is no longer defended.',
      { title: 'Remove the guard', fen: '4k3/8/2n5/1B2b3/8/8/8/4R1K1 w - - 0 1', side: 'w', arrows: [arrow('c6', 'e5', 'yellow')] },
    ),
    find('w', '', ['Bxc6+', 'Kd8', 'Rxe5'], 'The knight on c6 defends the bishop on e5. Remove it.', '**Bxc6+** takes the defender with check, and then **Rxe5** wins the bishop.', {
      fen: '4k3/8/2n5/1B2b3/8/8/8/4R1K1 w - - 0 1',
    }),
    choice('What should you look for first when one enemy piece is defending another?', [
      yes('Can I capture or chase away the defender?', 'Remove the guard and the guarded piece falls.'),
      no('How to defend my own pieces', 'Always worth checking, but this is about attacking the defender.'),
      no('A way to trade queens', 'Not the point here.'),
    ]),
  ],
};

export const mateInTwo: Lesson = {
  id: 'mate-two',
  title: 'Mate in two',
  goal: 'A forcing move, then mate',
  tags: ['mate'],
  practice: 'mate2',
  exercises: [
    info(
      'Mate in two almost always starts with a **forcing move**: a check, a capture, or a big threat. Look at your checks first. Then ask what each reply allows.',
      { title: 'Force, then mate' },
    ),
    find('w', '', ['Qb8+', 'Qd8', 'Qxd8#'], 'Mate in two.', '**Qb8+** forces Black to block with the queen, then **Qxd8#**. The back rank again!', {
      fen: '6k1/5pp1/8/3q4/1Q5R/8/P3PP2/K7 w - - 0 1',
    }),
    find('w', '', ['Qa8+', 'Nd8', 'Qxd8#'], 'Mate in two.', '**Qa8+**: the only block is the knight, and **Qxd8#** follows.', {
      fen: '5k2/4ppp1/4n3/7B/Q7/8/5PP1/K7 w - - 0 1',
    }),
  ],
};

export const f7Attacks: Lesson = {
  id: 'f7-attacks',
  title: 'Attacking f7 and f2',
  goal: 'The weak square next to the king, in real games',
  tags: ['f7'],
  practice: 'f7',
  exercises: [
    info(
      'You’ve seen f7 as a target in Scholar’s Mate and the Two Knights. In real games, f7 and f2 attacks often combine with what you now know: checks, forks and removing the defender. The practice set is all real games where the winning idea hit f7 or f2.',
      { title: 'f7 in real games', side: 'b', highlights: ['f7', 'f2'] },
    ),
    choice('Why is f7 weak at the start of the game?', [
      yes('Only the king defends it', 'Every other square near the king has a second defender.'),
      no('Pawns on f7 can’t move', 'They can, and moving them often weakens the king further.'),
      no('It’s a light square', 'The square color isn’t the reason.'),
    ]),
    choice('Which square is White’s version of f7?', [
      yes('f2', 'Next to White’s king, defended only by the king at the start.'),
      no('f7', 'That’s Black’s weak square.'),
      no('e2', 'e2 is defended by the king, queen, bishop and knight.'),
    ]),
  ],
};

export const rookMate: Lesson = {
  id: 'mate-rook',
  title: 'Mating with the rook',
  goal: 'King + rook vs king',
  tags: ['endgame', 'mate'],
  exercises: [
    info(
      'With a rook, the kings must work together. The rook **cuts the enemy king off** along a rank or file. Bring your king to face theirs (the **opposition**), then check with the rook to push it back a row. Repeat until it reaches the edge.',
      { title: 'Cut off, oppose, check', fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1', side: 'w' },
    ),
    choice('Why keep your rook far away from the enemy king?', [
      yes('So the king can’t attack it', 'A rook next to the enemy king can be captured, or you lose time defending it. From far away it cuts the king off just as well.'),
      no('Rooks are stronger on the edge', 'It’s about safety from the king, not the edge.'),
      no('So it can’t be stalemated', 'Stalemate is about the enemy king having no moves, not your rook.'),
    ]),
    endgame({
      prompt: 'Checkmate with king and rook. The engine defends perfectly.',
      fens: ['8/8/8/4k3/8/8/8/R3K3 w - - 0 1', '8/8/3k4/8/8/8/8/4K2R w - - 0 1', '8/8/8/8/3k4/8/8/R3K3 w - - 0 1'],
      side: 'w',
      goal: 'mate',
      limit: 30,
      explain: 'Keep the rook far from the enemy king so it can’t be attacked. Push the king back one row at a time with checks when the kings face each other.',
    }),
  ],
};

export const pawnSquare: Lesson = {
  id: 'pawn-square',
  title: 'The square of the pawn',
  goal: 'Can the king catch the pawn?',
  tags: ['endgame'],
  exercises: [
    info(
      'Imagine a square from the pawn to its promotion rank (a pawn on its starting rank counts as one rank further, because it can move two). If the defending king can step **into** the square, it catches the pawn. No counting moves needed.',
      { title: 'The square', fen: '8/8/8/2k5/8/8/7P/6K1 b - - 0 1', side: 'b', highlights: ['c3', 'h3', 'c8', 'h8'] },
    ),
    choice(
      'Black to move. Can the black king catch the pawn?',
      [yes('Yes: it’s already inside the square', 'The square runs c3–h3–h8–c8. The king on c5 is inside it.'), no('No: the pawn is too fast', 'Draw the square from h3 (the pawn can jump two). The king is inside it.')],
      { fen: '8/8/8/2k5/8/8/7P/6K1 b - - 0 1', side: 'b' },
    ),
    choice(
      'Black to move. Can the black king catch the pawn?',
      [yes('No: it can’t reach the square', 'From a5 the king can reach the b-file next move, but the square starts at c. The pawn queens.'), no('Yes', 'Draw the square from h3: c3–h8. The king on a5 can’t step into it.')],
      { fen: '8/8/8/k7/8/8/7P/6K1 b - - 0 1', side: 'b' },
    ),
    endgame({
      prompt: 'You’re Black. Catch the pawn before it promotes.',
      fens: ['8/8/8/2k5/8/8/7P/6K1 b - - 0 1'],
      side: 'b',
      goal: 'hold',
      limit: 12,
      explain: 'Head straight for the pawn’s path. Your king stays inside the square, so it arrives in time.',
    }),
  ],
};

export const opposition: Lesson = {
  id: 'opposition',
  title: 'The opposition',
  goal: 'King + pawn vs king',
  tags: ['endgame'],
  exercises: [
    info(
      'Two kings facing each other with one square between them are “in **opposition**”. Whoever is **not** to move has it: the other king must step aside. With a pawn, the attacking king wants to get **in front of its pawn** and win the opposition.',
      { title: 'The opposition', fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', side: 'w' },
    ),
    endgame({
      prompt: 'Your king is in front of your pawn on the 6th rank. Promote it.',
      fens: ['4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', '3k4/8/3K4/3P4/8/8/8/8 w - - 0 1'],
      side: 'w',
      goal: 'promote',
      limit: 15,
      explain: 'With your king on the 6th rank in front of the pawn, you win whoever is to move. Use the opposition to make the enemy king step aside, then push.',
    }),
    endgame({
      prompt: 'You’re Black. Hold the draw: keep the opposition and never let the king in front of its pawn.',
      fens: ['4k3/8/8/4K3/4P3/8/8/8 b - - 0 1'],
      side: 'b',
      goal: 'hold',
      limit: 20,
      explain: 'Stay directly in front of the pawn. When the white king comes forward, step into opposition. If you hold the opposition, it’s a draw.',
    }),
  ],
};

// ───────────── Finishing ─────────────

export const ladderMate: Lesson = {
  id: 'mate-ladder',
  title: 'The ladder mate',
  goal: 'Two heavy pieces mate without your king',
  tags: ['mate', 'endgame'],
  exercises: [
    info(
      'With **two heavy pieces** (two rooks, a rook and a queen, or two queens) you don’t need your king. One piece **cuts off a rank**, the other **checks on the next one**. The king is pushed back a rank at a time, like climbing down a ladder, until it hits the edge.',
      { title: 'The ladder', fen: '8/8/8/3k4/8/8/R7/1R4K1 w - - 0 1', side: 'w', arrows: [arrow('a2', 'a4', 'green'), arrow('b1', 'b5', 'green')] },
    ),
    find('w', '', ['Rb8#'], 'Your rook on a7 already guards the 7th rank. Mate in one.', '**Rb8#**: the a7 rook takes the 7th rank, the b8 rook checks on the 8th. That’s the last rung of the ladder.', {
      fen: '6k1/R7/8/8/8/8/8/1R4K1 w - - 0 1',
      tags: ['mate'],
    }),
    choice(
      'In a ladder mate the enemy king walks up to attack one of your rooks. What do you do?',
      [
        yes('Slide that rook to the far side of the same rank', 'Right: it keeps cutting off the rank, out of the king’s reach. Then carry on with the ladder.'),
        no('Defend it with your king', 'That works too, but it’s slow. The point of the ladder is that your king isn’t needed.'),
        no('Give a check with it straight away', 'A check that lets the king step back up undoes your work. Keep the rank cut off.'),
      ],
      { fen: '8/8/8/8/2k5/1R6/R7/6K1 w - - 0 1', side: 'w' },
    ),
    endgame({
      prompt: 'Queen and rook against a lone king. Use the ladder: no king needed.',
      fens: ['8/8/3k4/8/8/8/8/QR2K3 w - - 0 1'],
      side: 'w',
      goal: 'mate',
      limit: 10,
      explain: 'One piece cuts off a rank, the other checks on the next. If the king attacks a piece, move it to the far side and continue.',
    }),
    endgame({
      prompt: 'You’ve promoted a second queen. Two queens against a lone king: mate fast.',
      fens: ['8/8/4k3/8/8/8/8/QQ2K3 w - - 0 1'],
      side: 'w',
      goal: 'mate',
      limit: 8,
      explain: 'Two queens ladder even faster than two rooks. In your games you often made a third queen instead of mating with two: this is the shortcut.',
    }),
  ],
};

export const finishTheJob: Lesson = {
  id: 'finish-job',
  title: 'Finish the job',
  goal: 'From winning to checkmate, quickly',
  tags: ['mate', 'endgame'],
  exercises: [
    info(
      'A won position isn’t won until it’s mate. Once you’re far ahead: **1. Stop grabbing material**: look for **checks** first. **2. Bring your pieces** (and your king) to the enemy king. **3. Don’t make more queens** if the ones you have can mate. **4. Leave the king a square** until the final move, or it’s stalemate.\n\nThe drills here are positions from **your own games**, where you had a forced mate in 3–5 moves. Use the hint button if you’re stuck: the point is to see how the pieces work together.',
      { title: 'Winning isn’t won yet' },
    ),
    choice(
      'You’re a queen up and the enemy king is exposed. What do you look for first?',
      [
        yes('Checks that drive the king toward the edge', 'Yes. Forcing moves leave the opponent no time, and they usually lead to mate.'),
        no('More material to grab', 'You already have plenty. Grabbing gives the opponent time to defend or counterattack.'),
        no('A pawn to push to a new queen', 'Slow. A queen you already have can usually do the job in a few moves.'),
      ],
      { tags: ['mate'] },
    ),
    endgame({
      prompt: 'From your game: mate in 3 was available. Find it against the engine.',
      fens: ['rnQ3nr/4kppp/ppp5/8/1P1P4/2N2N2/1PP2PPP/R1BQKB1R w KQ - 0 11', 'k7/3N4/2b1R3/8/1P2B1P1/6P1/P7/6K1 w - - 11 45'],
      side: 'w',
      goal: 'mate',
      limit: 6,
      explain: 'Look for checks first, and count which squares the king can still reach.',
    }),
    endgame({
      prompt: 'From your game: two queens and a forced mate. Checks first, and use both queens.',
      fens: ['1Q3Q2/2p5/r1k1p2p/b7/8/6P1/2P2P1P/6K1 w - - 1 37'],
      side: 'w',
      goal: 'mate',
      limit: 10,
      explain: 'Mate needs your pieces near the king. Every move should check, take a square away, or bring another piece in.',
    }),
  ],
};

// ───────────── Safety ─────────────

export const captureCheck: Lesson = {
  id: 'capture-check',
  title: 'Before you capture',
  goal: 'Who takes back, and what does it leave open?',
  tags: ['blunder-check'],
  exercises: [
    info(
      'Captures feel safe because you gain something. Most game-losing blunders are captures, though. Before you take, ask: **1. Who takes back?** Count attackers and defenders. **2. What does my capture open up?** A line to your king, or a piece left undefended. **3. Is there something better?** A check that leads to mate beats a pawn.\n\nEvery position in this lesson is from **your own games**.',
      { title: 'Captures need a safety check too' },
    ),
    choice(
      'Your queen on f4 can take the knight on f5. Should it?',
      [
        yes('No: the bishop on c8 takes back, and you lose your queen for a knight', 'Right. The knight is defended by the c8 bishop along the diagonal. Always ask “who takes back?”'),
        no('Yes: a free knight', 'It isn’t free: the c8 bishop defends f5. After Qxf5 Bxf5 you’ve traded your queen (9) for a knight (3).'),
        no('Yes: queens should trade for knights when they can', 'A queen is worth about three knights. Only take if nothing can take back.'),
      ],
      { fen: 'r1b1kb1r/2q3pp/1pp5/p2pPnB1/2B2Q2/8/PPP2PPP/RN3RK1 w kq - 2 12', side: 'w', arrows: [arrow('c8', 'f5', 'red')], tags: ['blunder-check'] },
    ),
    choice(
      'Black’s bishop just jumped to h3. Should you take it with gxh3?',
      [
        yes('No: taking opens the f3 pawn and Black has ...Qxf3 mate', 'Exactly. After gxh3 the black queen on f7 takes on f3 with checkmate. In your game this capture lost on the spot.'),
        no('Yes: it’s a free bishop', 'Check what the capture changes: the g-pawn no longer guards f3, and the f7 queen is aiming at it.'),
        no('Yes, but only because the bishop attacks g2', 'Still no. Look at the queen on f7 and the f-file.'),
      ],
      { fen: 'r4rk1/5qpp/2P5/1Bb1P1B1/8/1PN2P1b/P5PP/R3RK2 w - - 3 24', side: 'w', arrows: [arrow('f7', 'f3', 'red')], tags: ['blunder-check', 'mate'] },
    ),
    find('w', '', ['Re1'], 'You’re far ahead and Black’s king is in the open. Qxe6+ grabs a pawn with check, but look at what recaptures. Find a stronger move.', '**Re1** (or Rc5+ or g3) leads to a forced mate. **Qxe6+?** loses the queen to ...Bxe6: the c8 bishop guards e6. In your game this turned a mating attack into a long fight.', {
      fen: '1rb2b1r/ppR2Q2/4p3/4k3/2B3p1/2N1n3/PPP3PP/R5K1 w - - 0 19',
      accept: ['Rc5+', 'g3'],
      tags: ['blunder-check', 'mate'],
    }),
    find('w', '', ['Rxh7'], 'Rc5+ looks forcing, but count the defenders of c5 first. Find a move that wins material safely.', '**Rxh7** takes a whole rook (Bxh7 works too). **Rc5+?** loses the rook to ...Bxc5: the f8 bishop covers c5.', {
      fen: '1r3b2/ppR4r/4b3/4k3/6p1/2NBn3/PPP3PP/R5K1 w - - 2 21',
      accept: ['Bxh7'],
      tags: ['blunder-check'],
    }),
    find('w', '', ['bxa6'], 'Before you make a plan, look at everything that’s attacked. Something big is hanging.', '**bxa6** wins the queen: your b5 pawn attacks a6. In your game you played Ne5 and missed it.', {
      fen: 'rnb1kb1r/p1p1pp2/q4npp/1P6/1P6/2N2NP1/2P1BP1P/R1BQ1RK1 w kq - 1 15',
      accept: ['Rxa6'],
      tags: ['blunder-check', 'hanging'],
    }),
  ],
};

// ───────────── Calculation ─────────────

const GUIDED = '7k/2B3pp/2b5/q7/8/1Q6/4P1PP/7K w - - 0 1';

export const thinkingAhead: Lesson = {
  id: 'calc-forcing',
  title: 'Thinking ahead: checks first',
  goal: 'How to see two moves deep',
  tags: ['mate', 'calculation'],
  exercises: [
    info(
      'Nobody sees “mate in 2” all at once. Strong players use a method: **1. List every check you have.** Checks are forcing: the opponent must answer them, so there are only a few replies to think about. **2. For each check, list every reply** (move the king, block, or capture the checker). **3. Look for a move that mates after every reply.** If no check works, try captures, then threats.',
      { title: 'Forcing moves first' },
    ),
    choice(
      'Step 1: which of these moves is a check?',
      [yes('Qb8+', 'Yes: the queen checks along the 8th rank.'), no('Qf3', 'That doesn’t attack the king.'), no('Qe6', 'That doesn’t attack the king.')],
      { fen: GUIDED, side: 'w', tags: ['calculation'] },
    ),
    choice(
      'White has two checks here: Qg8+ and Qb8+. Which one is worth looking at further?',
      [
        yes('Qb8+', 'Right. Qg8+ loses the queen: the king takes it (Kxg8). Checks are only good if the checking piece is safe or the reply is forced.'),
        no('Qg8+', 'The king captures: Kxg8. Always ask “can they take the checking piece?”'),
        no('Neither', 'Look again at Qb8+: can Black take the queen there?'),
      ],
      { fen: GUIDED, side: 'w', tags: ['calculation'] },
    ),
    tap({
      prompt: 'Step 2: after Qb8+, Black must answer the check. The king can’t move. Tap the black piece that can block it.',
      fen: '1Q5k/2B3pp/2b5/q7/8/8/4P1PP/7K b - - 1 1',
      side: 'w',
      answers: ['c6'],
      explain: 'Only the **c6 bishop** can block, on e8. Black’s king has no squares (g8 is covered by the queen, g7 and h7 are its own pawns).',
    }),
    find('w', '', ['Qb8+', 'Be8', 'Qxe8#'], 'Step 3: play it all. Mate in two.', '**Qb8+ Be8 Qxe8#**. Check, the only reply, then mate. That’s the whole method: checks, replies, mate.', {
      fen: GUIDED,
      tags: ['mate', 'calculation'],
    }),
    find('w', '', ['Qh8+', 'Bd8', 'Qxd8#'], 'Your turn without help: list the checks, then the replies. Mate in two.', '**Qh8+** leaves only **...Bd8** to block, then **Qxd8#**. Same method: the check limits Black to one reply.', {
      fen: '1k6/ppb5/8/4n3/3N3Q/8/P3PP2/1K6 w - - 0 1',
      tags: ['mate', 'calculation'],
    }),
  ],
};
