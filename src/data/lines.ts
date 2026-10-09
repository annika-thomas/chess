/**
 * Annotated repertoire lines. Lessons slice these; the game importer grades games against them.
 * Notes explain ideas, not just moves: the goal is to understand why so the moves stick.
 */

// ───────────────────────── White: 1.e4 and the Italian Game ─────────────────────────

export const ITALIAN_MAIN = `1.e4 {Take the center and open lines for your queen and light-squared bishop.}
e5 {Black takes their share of the center.}
2.Nf3 {Develop toward the center AND attack the e5 pawn. Every move should do something.}
Nc6 {Black defends e5 while developing.}
3.Bc4 {The Italian Game. The bishop aims at f7, the weakest square in Black's camp: only the king defends it.}
Bc5 {The Giuoco Piano ("quiet game"). Black mirrors you, aiming at f2.}
4.c3 {Prepares d4 someday, and gives your bishop a retreat square on c2 later. The b1 knight will develop via d2 instead of c3.}
Nf6 {Black develops and attacks your e4 pawn.}
5.d3 {Calmly protect e4. Solid and flexible: you keep d3–d4 in reserve.}
d6 {Black also keeps things solid.}
6.O-O {King safe, rook closer to the center. Your setup is nearly done.}
O-O {Black castles too.}
7.Re1 {The rook supports e4 and backs up a future d4 push.}
a6 {Black prepares ...b5 or ...Ba7, and makes room to tuck the bishop away.}
8.Bb3 {Step back before ...b5 or ...Na5 can hit the bishop with tempo. It still aims at f7.}
Ba7 {Black also tucks their bishop away from a future d4 or b4.}
9.h3 {A small but key move: stops ...Bg4 pinning your knight, and ...Ng4 jumping at f2.}
h6 {Black does the same thing for the same reasons.}
10.Nbd2 {The b1 knight's road: d2, then f1, then g3. It can't use c3 because your pawn lives there.}
Re8 {Black supports e5.}
11.Nf1 {The knight is on its way.}
Be6 {Black offers to trade off your strong bishop.}
12.Ng3 {Done! The knight eyes f5 and h5 near Black's king. Next ideas: d4 in the center, or Nh4–f5.}`;

export const TWO_KNIGHTS_D3 = `1.e4 e5 2.Nf3 Nc6 3.Bc4
Nf6 {The Two Knights Defense. Black attacks e4 right away.}
4.d3 {Protect e4 and keep your setup. (4.Ng5 is a famous attack, but it leads to wild positions with lots of theory.)}
Be7 {A more modest square for the bishop.}
5.O-O O-O 6.Re1 {Same rook move as always: support e4.}
d6 7.c3 {Same setup as your main line: c3, d3, Re1, and soon Bb3, h3, Nbd2.}
a6 8.Bb3 {Same retreat before ...b5, same reason.}`;

export const TWO_KNIGHTS_TRANSPO = `1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.d3
Bc5 {Black puts the bishop on c5 after all.}
5.c3 {Now it's exactly your Giuoco Piano position, reached by a different move order. That's called a transposition.}
d6 6.O-O O-O`;

export const BLACKBURNE_AVOID = `1.e4 e5 2.Nf3 Nc6 3.Bc4
Nd4 {A sneaky trap: the e5 pawn looks free. If 4.Nxe5? then 4...Qg5! attacks your knight and g2.}
4.Nxd4 {Just trade off the annoying knight.}
exd4 5.c3 {Attack the d4 pawn and build your center. White is comfortable.}`;

export const PETROV = `1.e4 e5 2.Nf3
Nf6 {The Petrov Defense. Black counterattacks your e4 pawn instead of defending e5.}
3.Nxe5 {Take the pawn.}
d6 {Correct: kick the knight first. (3...Nxe4? walks into a trap: 4.Qe2!)}
4.Nf3 {Retreat, keeping the knight on a good square.}
Nxe4 {Now Black takes back the pawn.}
5.d4 {Grab the center. You'll develop quickly with Bd3, O-O and Re1, aiming at Black's knight on e4.}
d5 6.Bd3 {Develop and challenge the e4 knight.}`;

export const PHILIDOR = `1.e4 e5 2.Nf3
d6 {The Philidor Defense: solid but passive. It blocks Black's own f8 bishop.}
3.d4 {Strike the center while Black is cramped.}
exd4 4.Nxd4 {Recapture with a centralized knight.}
Nf6 5.Nc3 {Develop and defend e4.}
Be7 6.Bc4 {Bishop to its favorite diagonal.}
O-O 7.O-O {You have more space and easy development.}`;

export const ALAPIN_D5 = `1.e4
c5 {The Sicilian Defense, Black's most popular answer. Black fights for d4 from the side.}
2.c3 {The Alapin: prepare d4 so you get a full pawn center. Low theory, clear plans.}
d5 {Black hits your center immediately.}
3.exd5 Qxd5 4.d4 {Build the center. Black's queen is out early but hard to attack right now.}
Nf6 5.Nf3 {Develop.}
Bg4 6.Be2 {Break the pin on your knight.}
e6 7.O-O Nc6 8.Be3 {Protect d4 and complete development.}
cxd4 9.cxd4 {You get an isolated d-pawn (IQP): more space and active pieces in exchange for a pawn that needs care.}`;

export const ALAPIN_NF6 = `1.e4 c5 2.c3
Nf6 {Black attacks e4 right away.}
3.e5 {Gain space with tempo by kicking the knight.}
Nd5 4.d4 {Build the center.}
cxd4 5.Nf3 {Develop first; you can recapture on d4 next move.}
Nc6 6.cxd4 {Now you have a big center.}
d6 7.Bc4 {Hit the d5 knight and develop.}`;

export const FRENCH_ADVANCE = `1.e4
e6 {The French Defense. Black prepares ...d5 with a pawn behind it.}
2.d4 {Take the full center.}
d5 3.e5 {The Advance Variation. Your e5 pawn cramps Black, who now has less space on the kingside.}
c5 {Black attacks the base of your pawn chain, d4. That's always the plan against a pawn chain: hit the base.}
4.c3 {Support d4 with another pawn.}
Nc6 5.Nf3 {More defenders for d4.}
Qb6 {Black piles up on d4 and also eyes b2.}
6.a3 {Prepares b4 to grab queenside space, and covers b4 from Black's pieces.}`;

export const CARO_ADVANCE = `1.e4
c6 {The Caro-Kann. Black prepares ...d5 without blocking the c8 bishop.}
2.d4 d5 3.e5 {The Advance: same idea as against the French. Grab space with a pawn chain.}
Bf5 {Black develops the bishop outside the chain before playing ...e6.}
4.Nf3 e6 5.Be2 {Quiet and solid: develop, castle, then expand.}
c5 {Again Black hits the base of the chain. Same pattern as the French!}
6.Be3 {Defend d4 and develop.}`;

export const SCANDI = `1.e4
d5 {The Scandinavian. Black challenges e4 immediately.}
2.exd5 Qxd5 {Black's queen comes out early.}
3.Nc3 {Develop with tempo: you attack the queen, so Black must spend a move on it again.}
Qa5 {The queen steps aside but stays active.}
4.d4 {Take the center.}
Nf6 5.Nf3 c6 6.Bc4 {Bishop to its favorite diagonal.}
Bf5 7.Bd2 {Sneaky: if your c3 knight ever moves, your bishop attacks the queen on a5. A discovered attack waiting to happen.}`;

export const PIRC_CLASSICAL = `1.e4
d6 {The Pirc. Black lets you take the center and plans to attack it later.}
2.d4 {Accept the invitation: two center pawns.}
Nf6 3.Nc3 {Defend e4 while developing.}
g6 4.Nf3 Bg7 5.Be2 {The Classical setup: simple development, no weaknesses.}
O-O 6.O-O {You have the center and a safe king. Against unusual first moves, this setup always works.}`;

// ───────────────────────── Black vs 1.e4: 1...e5 ─────────────────────────

export const BLACK_ITALIAN = `1.e4 e5 {Meet the center with the center.}
2.Nf3 Nc6 {Develop and defend e5.}
3.Bc4 Bc5 {Mirror White. Your bishop eyes f2 just as theirs eyes f7. (3...Nf6 allows the dangerous 4.Ng5.)}
4.c3 Nf6 {Develop and pressure e4.}
5.d3 d6 {Hold e5 solidly. You know this position: it's your own White setup in the mirror!}
6.O-O O-O 7.Re1 a6 {Prepare a home for the bishop on a7.}
8.Bb3 Ba7 {Tucked away from d4 and b4 attacks.}
9.h3 h6 {Stop Bg5 pinning your knight, and Ng5 jumping at f7.}`;

export const BLACK_ITALIAN_D4 = `1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6
5.d4 {White grabs the center right away, attacking your bishop and e5.}
exd4 {Capture first.}
6.cxd4 Bb4+ {Check, gaining time while your bishop escapes.}
7.Bd2 Bxd2+ 8.Nbxd2 d5 {The key freeing move! Strike the center before White's pawns roll forward.}
9.exd5 Nxd5 {You have a great knight on d5 and an easy game.}`;

export const EVANS_DECLINED = `1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5
4.b4 {The Evans Gambit: White offers a pawn to gain time with c3 and d4.}
Bb6 {Decline it calmly. No theory to learn, and your bishop sits on a great diagonal.}
5.a4 a6 {Make an escape square so a5 doesn't trap your bishop.}`;

export const RUY_CLOSED = `1.e4 e5 2.Nf3 Nc6
3.Bb5 {The Ruy Lopez (Spanish). White pressures the knight that defends e5.}
a6 {Ask the bishop a question right away.}
4.Ba4 Nf6 {Develop and hit e4.}
5.O-O Be7 {Solid: prepare to castle.}
6.Re1 b5 {Now kick the bishop away.}
7.Bb3 d6 {Firmly support e5.}
8.c3 O-O 9.h3 {White prepares d4.}
Na5 {Chase the strong bishop off the a2–g8 diagonal.}
10.Bc2 c5 {Grab queenside space. This is the Chigorin setup, played for 100+ years.}`;

export const RUY_EXCHANGE = `1.e4 e5 2.Nf3 Nc6 3.Bb5 a6
4.Bxc6 {The Exchange Variation.}
dxc6 {Recapture toward the center, opening lines for your queen and c8 bishop.}
5.O-O f6 {Solidly protect e5. (If 5.Nxe5? instead, 5...Qd4! wins the pawn back.)}
6.d4 exd4 7.Nxd4 c5 {Kick the knight. You have the two bishops for the long run.}
8.Nb3 Qxd1 9.Rxd1`;

export const SCOTCH = `1.e4 e5 2.Nf3 Nc6
3.d4 {The Scotch: White opens the center at once.}
exd4 4.Nxd4 Bc5 {Develop with an attack on the d4 knight.}
5.Be3 Qf6 {Pile up on d4. The queen also eyes f2.}
6.c3 Nge7 {The knight goes to e7 so it doesn't block the queen.}
7.Bc4 O-O 8.O-O {Both sides are developed. Your pieces are active.}`;

export const SCOTCH_NXC6 = `1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Bc5
5.Nxc6 {White trades knights.}
Qf6 {Strong: this threatens ...Qxf2 checkmate! White has no time to keep the extra piece.}
6.Qd2 dxc6 {Recapture, opening your c8 bishop.}
7.Nc3 Be6 {Quick development. You're ahead in time.}`;

export const VIENNA = `1.e4 e5
2.Nc3 {The Vienna Game.}
Nf6 3.Bc4 {Italian-style bishop.}
Nc6 4.d3 Bc5 {Same pieces, same squares as your Italian setup.}
5.f4 d6 {Hold e5 firmly.}
6.Nf3`;

export const KINGS_GAMBIT = `1.e4 e5
2.f4 {The King's Gambit: an old, aggressive pawn offer.}
Bc5 {Decline with a developing move that stops White from castling kingside. (3.fxe5?? Qh4+ is a trap.)}
3.Nf3 d6 4.c3 Nf6 {Develop with pressure on e4.}
5.d4 exd4 6.cxd4 Bb6 {The bishop keeps eyeing g1 from a safe spot.}`;

export const CENTER_GAME = `1.e4 e5
2.d4 exd4 3.Qxd4 {The Center Game: White's queen comes out early.}
Nc6 {Develop with tempo by attacking the queen.}
4.Qe3 Nf6 5.Nc3 Bb4 {Pin the knight and pressure e4.}
6.Bd2 O-O 7.O-O-O Re8 {Everything is aimed at White's e4 pawn.}`;

export const FOUR_KNIGHTS = `1.e4 e5 2.Nf3 Nc6
3.Nc3 {The Four Knights.}
Nf6 4.Bb5 Bb4 {Copy White. Symmetrical and solid.}
5.O-O O-O 6.d3 d6`;

// ───────────────────────── Black vs 1.d4: Queen's Gambit Declined ─────────────────────────

export const QGD_MAIN = `1.d4 d5 {Meet the center with the center.}
2.c4 {The Queen's Gambit: White offers the c4 pawn to lure your d5 pawn away from the center.}
e6 {Declined! The e6 pawn supports d5 like a rock. The cost: your c8 bishop is blocked for now. Solving that is the theme of the QGD.}
3.Nc3 Nf6 {Develop and protect d5.}
4.Bg5 {Pin your knight to your queen.}
Be7 {Break the pin and prepare to castle.}
5.e3 O-O 6.Nf3 Nbd7 {Support the center and get ready for ...c6 and ...dxc4.}
7.Rc1 c6 {A solid triangle: c6, d5, e6.}
8.Bd3 dxc4 {Wait until White's bishop has moved once, then take: White spends a second move recapturing.}
9.Bxc4 Nd5 {Capablanca's freeing maneuver: trade pieces to give yourself room.}
10.Bxe7 Qxe7 11.O-O Nxc3 12.Rxc3 e5 {The freeing break! Now your c8 bishop can breathe.}`;

export const QGD_NF3 = `1.d4 d5 2.c4 e6
3.Nf3 {A different move order.}
Nf6 4.Nc3 Be7 5.Bg5 O-O 6.e3 Nbd7 {Same position as your main line, reached a different way (a transposition).}`;

export const QGD_BF4 = `1.d4 d5 2.c4 e6 3.Nc3 Nf6
4.Bf4 {A modern alternative to Bg5.}
Be7 5.e3 O-O 6.Nf3 c5 {Strike the center at once. With White's bishop on f4 instead of g5, ...c5 is the right break.}`;

export const QGD_EXCHANGE = `1.d4 d5 2.c4 e6 3.Nc3 Nf6
4.cxd5 {The Exchange Variation.}
exd5 {Recapture toward the center. Bonus: your c8 bishop is free again!}
5.Bg5 c6 {This creates the Carlsbad structure: your pawns on c6–d5 against White's d4–e3.}
6.e3 Be7 7.Bd3 Nbd7 8.Qc2 O-O 9.Nf3 Re8 {Prepare ...Nf8, heading to g6 or e6.}
10.O-O Nf8 {Typical regrouping. Your plans: ...Ne4, or a kingside push. White's plan: the "minority attack" b4–b5.}`;

export const VS_LONDON = `1.d4 d5
2.Bf4 {The London System: White develops the bishop before playing e3.}
Nf6 3.e3 e6 4.Nf3 c5 {Strike the center from the side. Your same QGD pawns, plus ...c5.}
5.c3 Nc6 6.Nbd2 Bd6 {Offer to trade off White's best piece, the London bishop.}
7.Bg3 O-O 8.Bd3`;

export const VS_COLLE = `1.d4 d5
2.Nf3 Nf6 3.e3 {White plays quietly.}
e6 4.Bd3 c5 {Same plan: ...e6, then ...c5.}
5.c3 Nc6 6.Nbd2 Bd6 7.O-O O-O {Your pieces are on ideal squares.}`;

export const VS_ENGLISH = `1.c4 {The English Opening.}
Nf6 2.Nc3 e6 3.Nf3 d5 4.d4 Be7 {It's the Queen's Gambit Declined! Different start, same position.}`;

export const VS_RETI = `1.Nf3 d5 2.g3 Nf6 3.Bg2 e6 4.O-O Be7 5.d3 O-O {Your same pieces on the same squares. One setup against everything.}`;
