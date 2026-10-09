import type { EndgameExercise, Lesson } from '../types';
import { arrow, choice, find, info, no, yes } from './build';

/**
 * Fundamentals lessons for Levels 1–2, ordered after the Steps Method (Steps 1–2) and Polgar's mating
 * patterns. Each lesson is short: a worked example or two, then a practice set from the puzzle database
 * that must be passed at 80% (see `practice`). Positions marked with # are checked to be mate in tests.
 */
const endgame = (o: Omit<EndgameExercise, 'type'>): EndgameExercise => ({ type: 'endgame', ...o });

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
      'Do it in two directions. **Their** checks, captures and threats: am I safe? **Your** checks, captures and threats: can I win something? Most tactics are found by simply looking at every check and capture.',
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
      'Defend against the threat.',
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
      'Black has played ...h6 earlier. Is Re8 still mate?',
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
