import type { SquareExercise, Unit } from '../types';
import { arrow, choice, find, info, no, walk, yes } from './build';

const square = (mode: SquareExercise['mode'], o: Partial<SquareExercise> = {}): SquareExercise => ({ type: 'square', mode, ...o });

const FILE_E = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'];
const RANK_4 = ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'];

/** Coordinate and notation fluency, so the rest of the course reads at a glance. */
export const basics: Unit = {
  id: 'basics',
  title: 'Board Basics',
  subtitle: 'Read squares and moves without decoding',
  section: 'Start here',
  color: '#7a6a4f',
  icon: 'a1',
  lessons: [
    {
      id: 'basics-grid',
      title: 'Files and ranks',
      goal: 'Every square has a name: letter + number',
      tags: ['coordinates'],
      exercises: [
        info(
          'Columns are called **files**. They are lettered **a to h**, left to right as White sees the board. This is the **e-file**.',
          { title: 'Files: the letters', setup: '', side: 'w', highlights: FILE_E },
        ),
        info('Rows are called **ranks**. They are numbered **1 to 8**, starting from White’s side. This is the **4th rank**.', {
          title: 'Ranks: the numbers',
          setup: '',
          side: 'w',
          highlights: RANK_4,
        }),
        info('A square’s name is its file plus its rank. Where the e-file meets the 4th rank is **e4**. Always letter first, then number.', {
          title: 'File + rank = square',
          setup: '',
          side: 'w',
          highlights: ['e4'],
        }),
        square('name', { squares: ['e4', 'd5', 'a1', 'h8', 'c3', 'f6'], prompt: 'Name the highlighted square' }),
        info(
          'Some anchors make everything faster:\n\n**White** starts on ranks 1–2 and **Black** on ranks 7–8.\n\n**a1** is White’s bottom-left corner and is always a dark square.\n\n**Kings** start on the e-file (e1, e8), **queens** on the d-file (d1, d8).\n\nThe four **center** squares are d4, e4, d5 and e5.',
          { title: 'Landmarks', setup: '', side: 'w', highlights: ['a1', 'd4', 'e4', 'd5', 'e5'] },
        ),
        square('tap', { count: 8, files: 'abcdefgh', ranks: '1234', prompt: 'Tap the square (White’s half first)' }),
        choice('Where does White’s king start?', [yes('e1', 'Kings start on the e-file; White’s on rank 1.'), no('d1', 'That’s the queen’s square.'), no('e8', 'That’s Black’s king.')], {
          setup: '',
          side: 'w',
        }),
      ],
    },
    {
      id: 'basics-speed',
      title: 'Find squares fast',
      goal: 'From White’s side and from Black’s side',
      tags: ['coordinates'],
      exercises: [
        info('Tip: find the **file** first (the letter), then the **rank**. At first you’ll count. After a few hundred taps you won’t need to: that’s the goal.', {
          title: 'Letter, then number',
          setup: '',
          side: 'w',
        }),
        square('tap', { count: 10 }),
        square('name', { count: 6 }),
        info(
          'When you play **Black** the board is flipped: **a1 is top-right**, the letters run **h to a**, and rank 8 is at the bottom. Square names never change, only your view does. Some questions in this course show this view.',
          { title: 'The view from Black', setup: '', side: 'b', highlights: ['a1', 'e4'] },
        ),
        square('tap', { count: 8, side: 'b' }),
        square('name', { count: 6, side: 'b' }),
      ],
    },
    {
      id: 'basics-pieces',
      title: 'Piece letters',
      goal: 'K Q R B N, and pawns have no letter',
      tags: ['notation'],
      exercises: [
        info(
          'Each piece has a capital letter: **K** king, **Q** queen, **R** rook, **B** bishop, **N** knight (K was taken by the king). **Pawns have no letter**: a pawn move is just the square.\n\nSo **`Nf3`** means *knight to f3*, and **`e4`** means *pawn to e4*.',
          { title: 'The letters' },
        ),
        choice('What does **N** stand for?', [yes('Knight'), no('King', 'The king is K.'), no('A pawn', 'Pawns have no letter.')]),
        choice('What does the move **e4** mean?', [
          yes('A pawn moves to e4', 'No capital letter means a pawn.'),
          no('The king moves to e4', 'That would be Ke4.'),
          no('Something is captured on e4', 'Captures use an x, like Nxe4.'),
        ]),
        find('w', '', ['e4'], 'You are White. Play **e4**.', 'A pawn move: just the square.'),
        find('w', '1.e4 e5', ['Nf3'], 'Play **`Nf3`**: a knight to f3.', 'N is the knight. It jumps to f3.'),
        find('b', '1.e4 e5 2.Nf3', ['Nc6'], 'You are Black (the board is flipped). Play **`Nc6`**.', 'Knight to c6. From Black’s side, c6 is on the right half of the board.'),
        find('w', '1.e4 e5 2.Nf3 Nc6', ['Bc4'], 'Play **`Bc4`**.', 'Bishop to c4.'),
        choice('Which move does the arrow show?', [yes('`Bb5`'), no('`Nb5`', 'It’s the bishop moving, not a knight.'), no('`b5`', 'That would be a pawn move.'), no('`Bc4`', 'Look again at where the arrow ends.')], {
          setup: '1.e4 e5 2.Nf3 Nc6',
          side: 'w',
          arrows: [arrow('f1', 'b5')],
        }),
        info(
          'Most of this app shows pieces as **icons** instead of letters, which many people read faster: `K` = ♚, `Q` = ♛, `R` = ♜, `B` = ♝, `N` = ♞. So `Nf3` is shown as Nf3. (Prefer letters? Switch it off in **Me → Settings**.)',
          { title: 'Letters and icons' },
        ),
        choice('Which piece is **♝**?', [yes('Bishop (`B`)'), no('Knight (`N`)', 'The knight is ♞: the horse head.'), no('King (`K`)', 'The king is ♚, with the cross.')]),
        choice('How is `Qxf7#` shown with icons?', [yes('Qxf7#'), no('Kxf7#', 'That’s the king.'), no('Bxf7#', 'That’s a bishop.')]),
      ],
    },
    {
      id: 'basics-symbols',
      title: 'Captures, checks, castling',
      goal: 'x, +, #, O-O and O-O-O',
      tags: ['notation'],
      exercises: [
        info(
          '**x** means *captures*. **`Bxf7`** = bishop captures on f7. Pawn captures name the file the pawn came from: **`exd5`** = the e-pawn captures on d5.\n\n**+** means check. **#** means checkmate.\n\n**`O-O`** = castle kingside (short). **`O-O-O`** = castle queenside (long).',
          { title: 'The symbols' },
        ),
        find('w', '1.e4 d5', ['exd5'], 'Play **exd5**: your e-pawn captures on d5.', 'The pawn came from the e-file, so it’s written exd5.'),
        choice('What does **`Bxf7+`** mean?', [
          yes('Bishop captures on f7, giving check'),
          no('Bishop moves to f7, checkmate', 'Checkmate is #. The x means a capture.'),
          no('Something captures the bishop on f7', 'The letter in front is the piece that moves.'),
        ]),
        find('w', '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6', ['O-O'], 'Play **O-O**: castle kingside. Tip: tap your king, then g1.', 'Castling kingside: the king goes to g1 and the rook jumps to f1.'),
        find('w', '1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6', ['Qxf7#'], 'Play **`Qxf7#`**.', 'Queen captures on f7, and it’s checkmate (#). You’ve just read and played Scholar’s Mate.'),
        choice('What’s the difference between **+** and **#**?', [
          yes('+ is check; # is checkmate'),
          no('+ is a capture; # is check', 'Captures are x.'),
          no('They mean the same thing', '# ends the game; + doesn’t.'),
        ]),
      ],
    },
    {
      id: 'basics-reading',
      title: 'Reading a game',
      goal: 'Move numbers and the “...” for Black',
      tags: ['notation'],
      exercises: [
        info(
          'Moves are numbered in pairs: **1.e4 e5** means *on move 1, White played e4 and Black answered e5*.\n\nWhen Black’s move is written on its own, it gets **three dots**: **`3...Bc5`** means *Black’s 3rd move, bishop to c5*.',
          { title: 'Move numbers' },
        ),
        walk(
          'w',
          `1.e4 {Move 1, White: pawn to e4.}
e5 {Black’s reply. On its own it’s written 1...e5.}
2.Nf3 {Move 2, White: knight (N) to f3.}
Nc6 {2...Nc6: Black’s knight to c6.}
3.Bc4 {3.Bc4: bishop (B) to c4.}
Bc5 {3...Bc5: Black’s bishop to c5. The three dots mean "Black’s move."}`,
          { title: 'Read along as you play' },
        ),
        choice('In **`1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5`**, what is Black’s 2nd move?', [
          yes('`Nc6`'),
          no('`Nf3`', 'That’s White’s 2nd move.'),
          no('`e5`', 'That’s Black’s 1st move.'),
          no('`Bc5`', 'That’s Black’s 3rd move.'),
        ]),
        choice('What does **`4...Nf6`** mean?', [
          yes('Black’s 4th move: knight to f6'),
          no('White’s 4th move: knight to f6', 'The three dots mean it’s Black’s move.'),
          no('Black’s knight captures on f6', 'A capture would have an x: Nxf6.'),
        ]),
        find('w', '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', ['c3'], 'The line continues **4.c3**. Play it.', 'Move 4 for White: the c-pawn to c3.'),
      ],
    },
  ],
};
