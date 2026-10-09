import type { Unit } from '../types';
import { arrow, choice, find, info, no, yes } from './build';

/**
 * The basic tactics, one idea per lesson, each shown first on a nearly empty board.
 * Later lessons use these words, so they are taught here before any opening needs them.
 */
export const tactics: Unit = {
  id: 'tactics',
  title: 'Tactics Toolkit',
  subtitle: 'Forks, pins and other tricks, one at a time',
  section: 'Foundations',
  color: '#5b6f4a',
  icon: 'icon:target',
  lessons: [
    {
      id: 'tactics-values',
      title: 'What pieces are worth',
      goal: 'Piece values, and spotting free pieces',
      tags: ['tactics', 'hanging'],
      exercises: [
        info(
          'Pieces have rough values. Count them before you trade:\n\n**Pawn = 1** · **Knight = 3** · **Bishop = 3** · **Rook = 5** · **Queen = 9**\n\nThe king is priceless: lose it and you lose the game.',
          { title: 'Piece values' },
        ),
        choice('You can take a **rook** (5) with your **knight** (3), but then they take your knight back. Is that a good trade?', [
          yes('Yes: I gain 5 and lose 3', 'You come out 2 points ahead. This is called “winning the exchange”.'),
          no('No: I lose my knight', 'You lose the knight, but you got a rook for it, which is worth more.'),
        ]),
        info(
          'A piece is **hanging** when it’s attacked and nobody defends it. You can take it for free. Black’s knight on **e5** is hanging: your knight attacks it and no Black piece protects it.',
          { title: 'Hanging pieces', fen: 'r3k3/8/8/4n3/8/5N2/8/6K1 w - - 0 1', side: 'w', arrows: [arrow('f3', 'e5', 'red')], highlights: ['e5'] },
        ),
        find('w', '', ['Nxe5'], 'Take the hanging piece.', 'Free material. Always check: is anything of theirs hanging? Is anything of mine?', {
          fen: 'r3k3/8/8/4n3/8/5N2/8/6K1 w - - 0 1',
        }),
        choice('Which Black piece is hanging here?', [yes('The knight on e5', 'Attacked by your knight, defended by nothing.'), no('The rook on a8', 'Nothing of yours attacks it.'), no('The king', 'Kings can’t be captured. Attacking the king is called **check**.')], {
          fen: 'r3k3/8/8/4n3/8/5N2/8/6K1 w - - 0 1',
          side: 'w',
        }),
      ],
    },
    {
      id: 'tactics-fork',
      title: 'The fork',
      goal: 'One piece attacks two at once',
      tags: ['tactics', 'fork'],
      exercises: [
        info(
          'A **fork** is one piece attacking two enemy pieces at the same time. Your opponent can only save one of them. Here the White knight checks the king AND attacks the rook. The king must move, and then the knight takes the rook.',
          { title: 'The fork', fen: 'r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1', side: 'w', arrows: [arrow('c7', 'e8', 'red'), arrow('c7', 'a8', 'red')] },
        ),
        find('w', '', ['Nc7+', 'Kd7', 'Nxa8'], 'Find the knight move that attacks the king and the rook at once.', '**Nc7+** forks king and rook. The king has to move out of check, and the rook falls. Knights are the best forkers: they jump, and nothing can block them.', {
          fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
        }),
        find('w', '', ['e4'], 'Pawns fork too. Push one pawn so it attacks both Black pieces.', '**e4** attacks the knight on d5 and the rook on f5 at once. A pawn (1) wins a piece worth 3 or 5.', {
          fen: '4k3/8/8/3n1r2/8/8/4P3/4K3 w - - 0 1',
        }),
        choice('Why are knights so good at forks?', [
          yes('They jump in an L, so their attacks can’t be blocked', 'And their L-shape hits squares other pieces don’t, so forks are easy to miss.'),
          no('They are the most valuable piece', 'A knight is worth about 3. The queen is the most valuable.'),
          no('They can move twice', 'Every piece moves once per turn.'),
        ]),
      ],
    },
    {
      id: 'tactics-pin',
      title: 'The pin',
      goal: 'A piece that can’t safely move',
      tags: ['tactics', 'pin'],
      exercises: [
        info(
          'A **pin** is when a piece can’t move without exposing a more valuable piece behind it. Here the bishop pins Black’s knight to the king. Moving the knight would put the king in check, which is illegal, so the knight is stuck.',
          { title: 'The pin', fen: '4k3/8/2n5/1B6/8/8/8/4K3 b - - 0 1', side: 'w', arrows: [arrow('b5', 'e8', 'red')], highlights: ['c6'] },
        ),
        choice('Black wants to move the knight on c6. Can it?', [
          yes('No: it would expose the king to check', 'A pinned piece in front of the king can’t legally move.'),
          no('Yes: knights can always move', 'Not if moving it leaves its own king in check.'),
        ], { fen: '4k3/8/2n5/1B6/8/8/8/4K3 b - - 0 1', side: 'b', arrows: [arrow('b5', 'e8', 'red')] }),
        find('w', '', ['d5'], 'Black’s knight is pinned. Attack it with a pawn: it can’t run away.', '**d5** attacks the pinned knight. It can’t move, so you win it next move. Pins plus a pawn attack win pieces all the time.', {
          fen: '4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1',
        }),
        info(
          'Pins against the **queen** are common too. Here White’s bishop pins the f6 knight to the queen on d8. The knight *can* move, but then the queen would be captured. You’ll meet this in the Queen’s Gambit.',
          { title: 'Pinned to the queen', setup: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5', side: 'b', arrows: [arrow('g5', 'd8', 'red')], highlights: ['f6'] },
        ),
      ],
    },
    {
      id: 'tactics-discovery',
      title: 'Discovered attacks',
      goal: 'Move one piece, unleash another',
      tags: ['tactics', 'discovery'],
      exercises: [
        info(
          'A **discovered attack**: move one piece out of the way, and the piece behind it suddenly attacks. Here White’s knight blocks the rook. If the knight moves with a threat of its own, you get two attacks at once.',
          { title: 'Discovered attack', fen: '4k3/8/8/4N3/1q6/8/4R3/6K1 w - - 0 1', side: 'w', arrows: [arrow('e2', 'e8', 'yellow')] },
        ),
        find('w', '', ['Nc6+', 'Kd7', 'Nxb4'], 'Move the knight so the rook gives check, and the knight attacks Black’s queen.', '**Nc6+** uncovers check from the rook on e2, and the knight also attacks the queen. Black must deal with the check, so the queen is lost.', {
          fen: '4k3/8/8/4N3/1q6/8/4R3/6K1 w - - 0 1',
        }),
        info(
          'The strongest version is a **double check**: both the moving piece and the uncovered piece give check. Blocking or capturing can only stop one of them, so **the king must move**. Several famous games in this app end that way.',
          { title: 'Double check' },
        ),
        choice('In a double check, what can the defender do?', [
          yes('Only move the king', 'Two checks at once: a single block or capture can’t stop both.'),
          no('Block one of the checks', 'The other check would still be there.'),
          no('Capture one of the checking pieces', 'The other piece would still give check (unless the king itself captures and escapes both).'),
        ]),
      ],
    },
  ],
};
