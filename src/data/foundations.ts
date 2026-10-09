import type { Unit } from '../types';
import { arrow, choice, find, info, no, recall, walk, yes } from './build';

const SECTION = 'Foundations';

export const principles: Unit = {
  id: 'principles',
  title: 'Opening Principles',
  subtitle: 'The three jobs of every opening',
  section: SECTION,
  color: '#6f8f4e',
  icon: '♙',
  lessons: [
    {
      id: 'principles-center',
      title: 'Own the center',
      goal: 'Why the four middle squares matter',
      tags: ['center'],
      exercises: [
        info(
          'Every opening has three jobs: **take the center**, **get your pieces out**, and **make your king safe**. Every opening you will learn is a different recipe for these three jobs. Learn the jobs and the moves start to make sense.',
          { title: 'The three jobs', highlights: ['d4', 'e4', 'd5', 'e5'] },
        ),
        info(
          'Pieces in the center reach more squares. This knight on **e4** attacks 8 squares. The one in the corner on **h1** attacks only 2. More squares means more threats and more defense.',
          {
            title: 'Why the center?',
            fen: '4k3/8/8/8/4N3/8/8/4K2N w - - 0 1',
            highlights: ['c3', 'c5', 'd2', 'd6', 'f2', 'f6', 'g3', 'g5'],
          },
        ),
        find(
          'w',
          '',
          ['e4'],
          'You are White. Claim a center square with a pawn.',
          '1.e4 and 1.d4 both put a pawn in the center and open lines for your bishop and queen. In this course you play **1.e4**.',
          { accept: ['d4'] },
        ),
        choice(
          'White played 1.e4. Which squares does this pawn attack?',
          [
            yes('d5 and f5', 'Pawns capture diagonally forward, so e4 attacks d5 and f5, keeping Black pieces off them.'),
            no('e5', 'Pawns move straight but capture diagonally. The e4 pawn does not attack e5.'),
            no('d4 and f4', 'Those are behind the pawn. Pawns only attack forward.'),
          ],
          { setup: '1.e4', side: 'w', highlights: ['e4'] },
        ),
        find(
          'b',
          '1.e4',
          ['e5'],
          'Now you are Black. Fight for the center the same way.',
          '1...e5 stakes an equal claim to the center. In your repertoire you play **1...e5**. (1...c5 and 1...d5 also fight for the center, from different angles.)',
          { accept: ['d5', 'c5'] },
        ),
        choice(
          'Which White move develops a piece AND attacks a center pawn?',
          [
            yes('Nf3', 'The knight comes out toward the center and hits e5 straight away. Two jobs in one move.'),
            no('Nh3', 'A knight on the edge controls fewer squares and attacks nothing.'),
            no('Qh5', 'It does attack e5, but the queen comes out too early. Black can chase it around and gain time.'),
            no('a3', 'This does nothing for the center or development.'),
          ],
          { setup: '1.e4 e5', side: 'w' },
        ),
      ],
    },
    {
      id: 'principles-develop',
      title: 'Develop your pieces',
      goal: 'Knights first, then bishops, toward the center',
      tags: ['development'],
      exercises: [
        info(
          '**Development** means moving pieces off the back rank to useful squares. Knights usually come first, because they have one obviously good square each. Then bishops. Try to move a **new** piece each turn.',
          { title: 'Development', setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', side: 'w', highlights: ['f3', 'c4', 'c6', 'c5'] },
        ),
        choice(
          'Which knight move is best for White here?',
          [
            yes('Nf3', 'Toward the center, attacking e5. Knights love f3 and c3.'),
            no('Nh3', '"A knight on the rim is dim." From h3 it reaches only 4 squares and does nothing in the center.'),
            no('Ne2', 'It blocks your own f1 bishop and your queen.'),
          ],
          { setup: '1.e4 e5', side: 'w' },
        ),
        choice(
          'Why is 2...Nc6 a great reply to 2.Nf3?',
          [
            yes('It develops a piece AND defends the e5 pawn', 'Two jobs in one move: that is the efficiency good openings are built on.'),
            no("It attacks White's knight", 'A knight on c6 does not attack f3.'),
            no('It prepares to castle queenside', 'Not mainly. It is about development and defending e5.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6', side: 'b', arrows: [arrow('c6', 'e5')] },
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nc6',
          ['Bc4'],
          'Develop a new piece to a good square.',
          'Several moves work here. In your repertoire you play **3.Bc4**: the bishop aims straight at f7, the weakest square in Black\'s position.',
          { accept: ['Bb5', 'Nc3', 'd4'] },
        ),
        choice(
          'Look closely: how many minor pieces (knights and bishops) has White developed?',
          [no('2'), yes('3', 'Nf3, Bc4 and Nc3. Counting development quickly is a real skill: it tells you who is ahead in the race.'), no('4')],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Nc3 Bc5', side: 'w', flash: 4000 },
        ),
      ],
    },
    {
      id: 'principles-king',
      title: 'King safety',
      goal: 'Castle early and keep your king covered',
      tags: ['king-safety'],
      exercises: [
        info(
          'A king left in the middle gets hit when the center opens. **Castling** tucks it away AND brings a rook toward the center. Two jobs in one move. Aim to castle within the first 7 to 10 moves.',
          { title: 'Castle early', setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O', side: 'w', highlights: ['g1', 'f1'] },
        ),
        choice(
          'What does White need to do before castling kingside?',
          [
            yes('Nothing. White can castle right now', 'Nf3 and Bc4 already cleared f1 and g1. That is one reason those moves come first.'),
            no('Move the queen', 'The queen is not in the way for kingside castling.'),
            no('Play d3 first', 'Not needed. Only the squares between king and rook must be empty.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', side: 'w' },
        ),
        find(
          'w',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6',
          ['O-O'],
          'Your king is still in the center. Make it safe in one move.',
          'Castle! Tip: drag your king two squares toward the rook.',
        ),
        info(
          "Moving the f- and g-pawns early opens lines to your own king. The fastest checkmate in chess shows it: **1.f3 e5 2.g4??** and Black's queen mates on h4.",
          { title: "Don't open your king", setup: '1.f3 e5 2.g4', side: 'b', arrows: [arrow('d8', 'h4', 'red')] },
        ),
        find(
          'b',
          '1.f3 e5 2.g4',
          ['Qh4#'],
          'White has opened up their king badly. Find checkmate.',
          "Fool's Mate. The e1–h4 diagonal was wide open because White moved the f- and g-pawns. Remember the pattern so it never happens to you.",
          { tags: ['king-safety', 'mate'] },
        ),
        info(
          'The opening is over when your minor pieces are out, your king is castled, and your rooks **connect** (nothing between them on the back rank). Then it is time for a plan.',
          { title: 'Connect your rooks', setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O O-O 7.Re1 a6 8.Bb3 Ba7 9.h3 h6 10.Nbd2', side: 'w' },
        ),
      ],
    },
    {
      id: 'principles-tempo',
      title: "Don't waste time",
      goal: 'Tempo: why early queen moves backfire',
      tags: ['tempo'],
      exercises: [
        info(
          'Every move is a unit of time, called a **tempo**. Moving the same piece twice, or bringing out your queen where it can be chased, hands your opponent free moves.',
          { title: 'Tempo' },
        ),
        walk(
          'w',
          `1.e4 d5 {Black challenges your e4 pawn.}
2.exd5 {Take it.} Qxd5 {Black's queen recaptures, but now it sits in the middle of the board.}
3.Nc3 {Develop AND attack the queen. Black must spend a move on her again.}
Qa5 4.d4 {Grab the center.} Nf6 5.Nf3 {You have developed 2 pieces plus a center pawn. Black has moved the queen twice and has only 1 piece out.}`,
          { tags: ['tempo', 'development'] },
        ),
        find(
          'w',
          '1.e4 d5 2.exd5 Qxd5',
          ['Nc3'],
          "Black's queen came out on move 2. Develop a piece AND attack the queen.",
          '3.Nc3 gains a tempo: you develop and Black has to move the queen again.',
          { tags: ['tempo'] },
        ),
        choice(
          'Which White move here breaks an opening principle?',
          [
            no('Nbd2', 'This develops your last minor piece. It is part of the plan.'),
            no('Re1', 'This puts a rook on a central file. Useful.'),
            yes('Ng5', 'It moves a piece that is already developed, to attack f7 alone. f7 is well defended, and after ...h6 your knight just has to go back. That wastes two tempi.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O O-O', side: 'w' },
        ),
      ],
    },
  ],
};

export const survive: Unit = {
  id: 'survive',
  title: 'Survive the Opening',
  subtitle: 'Beginner traps and the blunder check',
  section: SECTION,
  color: '#a8642c',
  icon: 'icon:shield',
  lessons: [
    {
      id: 'survive-scholar',
      title: "Scholar's Mate",
      goal: 'Spot and stop the queen + bishop attack on f7',
      tags: ['f7', 'blunder-check'],
      exercises: [
        info(
          "The most common beginner trap. White's queen and bishop team up on **f7**, a square only the king defends. If Black doesn't notice, **Qxf7** is checkmate.",
          {
            title: 'The f7 weakness',
            setup: '1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#',
            side: 'b',
            highlights: ['f7'],
            arrows: [arrow('c4', 'f7', 'red')],
          },
        ),
        find(
          'b',
          '1.e4 e5 2.Bc4 Nc6 3.Qh5',
          ['g6'],
          'White threatens Qxf7#. Stop it.',
          "3...g6 blocks the queen's path to f7 and attacks the queen. 3...Qe7 also works by defending f7.",
          { accept: ['Qe7', 'Qf6'] },
        ),
        choice(
          'Your instincts say "develop a knight toward the center." Is 3...Nf6 good here?',
          [
            yes('No: it allows Qxf7#', 'Right. Principles are guides, but checks and threats come first. This is the **blunder check**: before every move, ask what the opponent is threatening.'),
            no('Yes: it develops and attacks the queen', 'It does attack the queen, but White simply plays Qxf7 and it is checkmate. Always look at checks and threats first.'),
          ],
          { setup: '1.e4 e5 2.Bc4 Nc6 3.Qh5', side: 'b', tags: ['blunder-check'] },
        ),
        walk(
          'b',
          `1.e4 e5 2.Qh5 {The queen comes out on move 2, attacking e5 and eyeing f7.}
Nc6 {Defend e5 with a developing move.}
3.Bc4 {Now Qxf7# is threatened.}
g6 {Block! And attack the queen.}
4.Qf3 {She aims at f7 again from a different angle.}
Nf6 {Block again, and develop. Two knights out; White's queen has made 3 moves and will be chased again.}`,
          { tags: ['f7', 'tempo'] },
        ),
        recall('b', '1.e4 e5 2.Qh5 Nc6 3.Bc4 g6 4.Qf3 Nf6', { prompt: 'Defend against the early queen from memory.' }),
        find(
          'b',
          '1.e4 e5 2.Qh5 Nc6 3.Bc4',
          ['g6'],
          'Same pattern, different move order. Defend f7.',
          'The pattern is identical: queen plus bishop against f7. Spot the pattern and the move order stops mattering.',
          { accept: ['Qe7', 'Qf6'] },
        ),
      ],
    },
    {
      id: 'survive-f7',
      title: 'The f7 square',
      goal: 'Why f7 is a target, and the Fried Liver attack',
      tags: ['f7'],
      exercises: [
        info(
          "At the start, **f7** (and f2 for White) is the only square defended by the king alone. Most early attacks aim there. Here is the famous **Fried Liver Attack**: play White's moves and watch it happen.",
          { title: 'Target: f7', side: 'b', highlights: ['f7', 'f2'] },
        ),
        walk(
          'w',
          `1.e4 e5 2.Nf3 Nc6 3.Bc4 {Bishop at f7.}
Nf6 {The Two Knights. It looks natural, but it allows the next move.}
4.Ng5 {Now knight AND bishop hit f7.}
d5 {Black blocks the bishop. Correct!}
5.exd5 Nxd5? {But this natural recapture is a mistake. (5...Na5! is the correct defense.)}
6.Nxf7 {The sacrifice! It forks queen and rook.}
Kxf7 7.Qf3+ {Black's king is dragged into the open.}
Ke6 8.Nc3 {Everything piles on the pinned d5 knight. White's attack is very dangerous.}`,
          { title: 'The Fried Liver', tags: ['f7', 'king-safety'] },
        ),
        choice(
          'This is why, as Black, you play 3...Bc5 instead of 3...Nf6. After 3...Bc5, what is White threatening with 4.Ng5?',
          [
            yes('Nxf7, forking the queen and rook', 'Yes. But here White has blundered: there is a simple punishment.'),
            no('Qh5 checkmate', 'Not immediately.'),
            no('Nothing at all', 'Look at f7: the knight attacks it, and so does the bishop.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Ng5', side: 'b', tags: ['blunder-check'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Ng5',
          ['Qxg5'],
          "White's knight jumped forward too early. Punish it.",
          "The g5 knight is undefended, and your queen sees it along the d8–g5 diagonal. You win a whole piece. Always check: is the attacking piece itself protected?",
          { tags: ['f7', 'punish'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5',
          ['d5'],
          'You played 3...Nf6 and White went for f7. Find the only good defense.',
          '4...d5! blocks the bishop. The knight alone can\'t do much. After 5.exd5, play **5...Na5!**, not 5...Nxd5?, which allows the Fried Liver.',
          { tags: ['f7'] },
        ),
      ],
    },
    {
      id: 'survive-blunder',
      title: 'The blunder check',
      goal: 'Ask "what did their move threaten?" before every move',
      tags: ['blunder-check'],
      exercises: [
        info(
          'Strong players run a quick checklist before every move: **1. What did their last move threaten? 2. Checks, captures, and threats, for both sides.** It takes seconds and saves games.',
          { title: 'The habit' },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4',
          ['exd4'],
          'White just pushed 5.d4. What does it attack? Respond.',
          'The d4 pawn attacks BOTH your c5 bishop and your e5 pawn. Capture: 5...exd4.',
        ),
        choice(
          "Black just played 3...Nd4, leaving e5 unprotected. Should you grab it with 4.Nxe5?",
          [
            yes('No: 4...Qg5! hits the knight and g2', 'Right. This is the **Blackburne Shilling trap**. After 4.Nxe5? Qg5! 5.Nxf7?? Qxg2 6.Rf1 Qxe4+ 7.Be2 Nf3#, White is mated.'),
            no('Yes: it wins a free pawn', 'It looks free, but 4...Qg5! attacks your knight and the g2 pawn at the same time. A "free" pawn is a reason to look twice.'),
          ],
          { setup: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4', side: 'w', tags: ['blunder-check', 'italian'] },
        ),
        find(
          'b',
          '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4 4.Nxe5 Qg5 5.Nxf7 Qxg2 6.Rf1 Qxe4+ 7.Be2',
          ['Nf3#'],
          'White fell for the trap. Finish it.',
          'Nf3 is checkmate: a smothered king with its own pieces in the way. Know the trap so you never fall for it as White.',
          { tags: ['mate'] },
        ),
      ],
    },
  ],
};
