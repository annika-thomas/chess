import type { LineText, Side } from '../types';

/**
 * Classic games for "Guess the Move". You play one side's moves; the other side is played for you.
 * Every move is checked legal in tests, and every game marked mate really ends in checkmate.
 */
export interface MasterGame {
  id: string;
  title: string;
  white: string;
  black: string;
  year: number;
  event: string;
  opening: string;
  /** The side you guess (the winner). */
  side: Side;
  /** What to watch for: shown before you start. */
  intro: string;
  /** Annotated moves; notes explain the key moments. */
  line: LineText;
  /** Other moves that earn full credit at a given ply (0-based), e.g. a second mate. */
  alts?: Record<number, string[]>;
  outro: string;
  /** Games that end in mate are checked by the tests. */
  mate: boolean;
  difficulty: 1 | 2 | 3;
}

export const MASTER_GAMES: MasterGame[] = [
  {
    id: 'reti-tartakower',
    title: 'The Queen Sacrifice',
    white: 'Richard Réti',
    black: 'Savielly Tartakower',
    year: 1910,
    event: 'Vienna',
    opening: 'Caro-Kann',
    side: 'w',
    difficulty: 1,
    mate: true,
    intro:
      'Black opens the d-file toward their own king, and White castles **queenside**, which puts a rook on that file. Watch for what happens when a king is stuck in the middle facing an open file.',
    line: `1.e4 c6 {The Caro-Kann. You’ll answer it with the Advance in your repertoire; Réti plays 3.Nc3.}
2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nf6
5.Qd3 {An unusual move: the queen lines up on the d-file, where Black’s king and queen live.}
e5?! {Black strikes back in the center, but this opens the d-file.}
6.dxe5 Qa5+ 7.Bd2 Qxe5
8.O-O-O! {Castling queenside: king safe, rook straight onto the open d-file. The e4 knight is left hanging as bait.}
Nxe4?? {Greed: it walks straight into a queen sacrifice.}
9.Qd8+!! {A queen sacrifice! Black must take: the king is forced onto the d-file.}
Kxd8
10.Bg5+ {Double check: the bishop AND the d1 rook both give check, so the king must move. (10...Ke8 11.Rd8#.)}
Kc7
11.Bd8# {Checkmate by two minor pieces and a rook, after giving away the queen.}`,
    outro:
      'Lesson: a king stuck in the center + an open file = danger. Castling queenside brought a rook to the d-file *with tempo*. And look for **double checks**: they force the king to move.',
  },
  {
    id: 'opera',
    title: 'The Opera Game',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    year: 1858,
    event: 'Paris Opera House',
    opening: 'Philidor Defense',
    side: 'w',
    difficulty: 1,
    mate: true,
    intro:
      'The most famous teaching game ever played, during an opera performance. Morphy shows what **development** is worth: every move brings a new piece into the attack while his opponents fall behind.',
    line: `1.e4 e5 2.Nf3 d6 {The Philidor Defense: you met it in "Punish Mistakes".}
3.d4 {Strike the center, exactly as in your repertoire.}
Bg4 {Pins the knight, but Black will have to give up this bishop.}
4.dxe5 Bxf3 {If 4...dxe5, then 5.Qxd8+ Kxd8 6.Nxe5 simply wins a pawn.}
5.Qxf3 dxe5
6.Bc4 {Develop with a threat: Qxf7 is checkmate.}
Nf6 {Blocks the queen’s path to f7.}
7.Qb3 {A double attack: f7 and b7.}
Qe7 {Defends f7.}
8.Nc3 {Morphy could grab b7, but after 8.Qxb7 Qb4+ the queens come off. He prefers to bring out another piece.}
c6 9.Bg5 {Pins the f6 knight. Every White piece is active; Black’s kingside pieces are still at home.}
b5?! 10.Nxb5! {A sacrifice to tear open lines while Black is undeveloped.}
cxb5 11.Bxb5+ Nbd7
12.O-O-O {Castle and put a rook on the d-file, hitting the pinned d7 knight.}
Rd8 13.Rxd7! {Give the rook to keep the attack going.}
Rxd7 14.Rd1 {The other rook joins: the d7 rook is pinned to the king.}
Qe6 15.Bxd7+ Nxd7
16.Qb8+!! {The queen sacrifice: deflect the knight away from d8.}
Nxb8
17.Rd8# {Checkmate. Morphy gave up a queen, a rook and a knight, and mated with his last two pieces.}`,
    outro:
      'Lesson: Morphy never moved a piece twice when he could develop a new one, and opened lines toward the enemy king. By the end, every White piece had joined the attack while Black’s kingside bishop and rook never moved. **Development + open lines** beat material.',
  },
  {
    id: 'lasker-thomas',
    title: 'The King Hunt',
    white: 'Edward Lasker',
    black: 'George Thomas',
    year: 1912,
    event: 'London',
    opening: 'Dutch Defense',
    side: 'w',
    difficulty: 2,
    mate: true,
    intro:
      'One of the most famous king hunts ever. A queen sacrifice drags Black’s king out of its castle, and White chases it across the whole board, all the way to the first rank.',
    line: `1.d4 e6 2.Nf3 f5 {The Dutch Defense.}
3.Nc3 Nf6 4.Bg5 Be7 5.Bxf6 Bxf6
6.e4 {Break open the center.}
fxe4 7.Nxe4 b6 8.Ne5 O-O
9.Bd3 {The bishop aims at h7, the square in front of Black’s king.}
Bb7 10.Qh5 {Queen, bishop and knights all point at Black’s king.}
Qe7? {Natural, but it misses White’s idea.}
11.Qxh7+!! {Queen sacrifice!}
Kxh7
12.Nxf6+ {Double check from the knight and the d3 bishop: the king must move.}
Kh6 13.Neg4+ Kg5
14.h4+ {Each check pushes the king further from home.}
Kf4 15.g3+ Kf3 16.Be2+ Kg2 17.Rh2+ Kg1
18.Kd2# {Checkmate by a king move! (18.O-O-O is mate too.)}`,
    alts: { 34: ['O-O-O#'] },
    outro:
      'Lesson: when you sacrifice to expose a king, keep giving **checks**: they leave the opponent no time to defend. Count the checks: 8 in a row.',
  },
  {
    id: 'evergreen',
    title: 'The Evergreen Game',
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    year: 1852,
    event: 'Berlin',
    opening: 'Italian Game · Evans Gambit',
    side: 'w',
    difficulty: 3,
    mate: true,
    intro:
      'Your Italian Game, played 170 years ago! Anderssen gives a pawn for a lead in development (the Evans Gambit), puts every piece on an open line, and finishes with a famous combination.',
    line: `1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 {Your Giuoco Piano position.}
4.b4 {The Evans Gambit: a pawn for time to build the center with c3 and d4.}
Bxb4 5.c3 Ba5
6.d4 {The full center, with tempo.}
exd4
7.O-O {Development before material.}
d3 8.Qb3 {Pressure on f7 again.}
Qf6 9.e5 {Kick the queen.}
Qg6 10.Re1 {Every piece heads for the center.}
Nge7 11.Ba3 {This bishop eyes e7 and makes it hard for Black to castle.}
b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5
17.Nf6+!? {A knight sacrifice to open the e-file.}
gxf6 18.exf6 Rg8
19.Rad1!! {A quiet move in the middle of a fight: both rooks are on open files. White ignores the threat to his king.}
Qxf3
20.Rxe7+! Nxe7
21.Qxd7+!! {The queen sacrifice: drag the king to d7.}
Kxd7
22.Bf5+ {Double check from the bishop and the d1 rook. (22...Kc6 23.Bd7#.)}
Ke8 23.Bd7+ Kf8
24.Bxe7# {Checkmate.}`,
    outro:
      'Lesson: Anderssen spent a pawn to get **every piece active**, and put his rooks on open files. When the moment came, the combination worked because everything was already in place.',
  },
  {
    id: 'immortal',
    title: 'The Immortal Game',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    year: 1851,
    event: 'London',
    opening: 'King’s Gambit',
    side: 'w',
    difficulty: 3,
    mate: true,
    intro:
      'The most famous attacking game of all. White gives up a bishop, both rooks and the queen, then mates with three minor pieces. Ask yourself on every move: **which piece isn’t helping yet?**',
    line: `1.e4 e5 2.f4 {The King’s Gambit.}
exf4 3.Bc4 Qh4+ 4.Kf1 {White loses the right to castle, but Black’s queen is out early and can be chased.}
b5 5.Bxb5 Nf6
6.Nf3 {Develop with tempo: attack the queen.}
Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6
10.g4 {Kick the knight and gain space.}
Nf6
11.Rg1! {White gives up the b5 bishop to bring the rook into play.}
cxb5 12.h4 Qg6 13.h5 Qg5
14.Qf3 {Threatens Bxf4, hunting Black’s queen.}
Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2
18.Bd6!! {Offers both rooks! White’s pieces are all aimed at Black’s king.}
Bxg1
19.e5! {Shuts Black’s queen off from the kingside.}
Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8
22.Qf6+!! {And the queen too.}
Nxf6
23.Be7# {Checkmate by a bishop and two knights.}`,
    outro:
      'Lesson: material only matters if it’s doing something. Black ended up a queen and two rooks ahead, and none of those pieces could defend the king. **Activity beats material.**',
  },
  {
    id: 'gold-coins',
    title: 'The Gold Coins Game',
    white: 'Stefan Levitsky',
    black: 'Frank Marshall',
    year: 1912,
    event: 'Breslau',
    opening: 'French Defense',
    side: 'b',
    difficulty: 3,
    mate: false,
    intro:
      'You play **Black** this time. Marshall gets an isolated queen pawn, keeps his pieces active (as your IQP lessons say), and ends with one of the most beautiful moves ever played. Legend says the spectators showered the board with gold coins.',
    line: `1.d4 e6 2.e4 d5 {The French Defense.}
3.Nc3 c5 4.Nf3 Nc6 5.exd5 exd5 6.Be2 Nf6 7.O-O Be7 8.Bg5 O-O 9.dxc5 Be6
10.Nd4 Bxc5 11.Nxe6 fxe6 {Recapturing toward the center opens the f-file for Black’s rook.}
12.Bg4 Qd6 13.Bh3 Rae8 14.Qd2
Bb4 {Black’s pieces keep finding active squares.}
15.Bxf6 Rxf6 16.Rad1 Qc5 17.Qe2 Bxc3 18.bxc3 Qxc3 19.Rxd5
Nd4 {The knight jumps into the heart of White’s position.}
20.Qh5 Ref8 {Both rooks on the f-file, aimed at f2.}
21.Re5 Rh6 22.Qg5
Rxh3! {Giving the exchange to remove a defender.}
23.Rc5
Qg3!! {The queen goes where three White pieces can take her, and every capture loses: 24.hxg3 Ne2#; 24.fxg3 Ne2+ 25.Kh1 Rxf1#; 24.Qxg3 Ne2+ 25.Kh1 Nxg3+ and White is a queen down. White resigned.}`,
    outro:
      'Lesson: with an isolated pawn, play **actively**: rooks on open files, knights on strong squares, threats against the king. Marshall never gave White a moment to attack his pawn.',
  },
];
