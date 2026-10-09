# Chess Mentor ♞

A chess coach for your phone, Duolingo-style but structured the way strong players train: fundamentals first (tactics, checkmates, basic endgames), with homework, puzzle sets you must pass before moving on, and a beginner-friendly opening repertoire once the basics are solid. Spaced repetition drills the moves *and the reasons* until you recognize the patterns on sight.

**Live app:** https://annika-thomas.github.io/chess/
On iPhone: open it in Safari → Share → **Add to Home Screen**. It runs full screen and works offline.

## Levels and homework

The course is split into levels, like the Steps Method used in Dutch chess schools:

| Level | Contents | Gate |
|---|---|---|
| 1 · Foundations | Board basics, piece safety, checkmate patterns (mate in one, back rank, queen mate), opening principles, double attacks | 80% on the Level 1 test |
| 2 · Tactics & Endgames | Pins, skewers, discovered and double check, removing the defender, mate in two, f7 attacks, rook mate, the square, opposition | 80% on the Level 2 test |
| 3 · Your Repertoire | The openings below | |

- **Mastery gates**: lessons open strictly in order. Most come with a 25-puzzle **practice set**, and you need 80% to move on (mastery learning). Missed puzzles can be retried straight away.
- **Fluency**: once you've passed a set, reruns are timed. The target is 85% at 15 s or less per puzzle (the Woodpecker Method idea: the same puzzles, faster, until they're automatic).
- **Endgame drills** against Stockfish: mate with the queen or rook within a move limit, promote a pawn, or hold a draw.
- **Today's homework** (~30 min): a plan fixed each morning with reviews, the current lesson or set, a speed run of a mastered set, an endgame drill, and mixed or daily puzzles.
- **Weekly slow game + self-annotation** (Botvinnik school): play a game with no clock, then mark the moments you think mattered and what you were thinking, *before* the engine looks. The engine then flags your real mistakes, shows which ones you spotted, and asks why each happened. Your answers set the next homework and feed your weak spots.
- **Blunder guard** (optional): warns when your move drops material, without saying why, so you do the safety check yourself.

Puzzles come from the [Lichess puzzle database](https://database.lichess.org/#puzzles) (CC0) via `scripts/puzzles/build-sets.mjs`.

## What it teaches

| | Repertoire | Why |
|---|---|---|
| White | **1.e4, Italian Game** (Giuoco Piano setup: c3, d3, O-O, Re1, Bb3, h3, Nbd2–f1–g3) plus the Alapin vs the Sicilian and the Advance vs the French/Caro-Kann | Classical, principled, and one plan that works against almost anything |
| Black vs 1.e4 | **1...e5**, 3...Bc5 against the Italian, the Closed Ruy Lopez, the Scotch, and answers to the gambits | The Italian in the mirror: you reuse what you learned as White |
| Black vs 1.d4 | **Queen's Gambit Declined**, with the same setup against the London, Colle, English and Réti | One structure against everything |

It starts with **Board Basics**: coordinate fluency (tap-the-square and name-the-square drills from both sides) and reading notation (piece letters, `x`, `+`, `#`, `O-O`, move numbers). Practice has a 30-second **Coordinate Sprint**. Moves are shown with piece icons (♞f3) by default, and there's an optional "label every square" setting.

Then Foundations (opening principles, Scholar's Mate, f7, the blunder check) and a **Pattern Gym**: flashed pawn skeletons, "which opening is this?", opening tactics, and "the usual move is wrong here" drills.

## How it teaches (and why)

Based on research into how chess skill is acquired and how memory works:

- **Chunking and templates** (de Groot; Chase & Simon; Gobet): strong players recognize pawn structures and piece patterns as single units, each tied to a plan. Lessons link every line to its structure, and the Pattern Gym flashes positions so you learn to read them at a glance.
- **Worked examples, then recall** (Chernev's *Logical Chess* format; the expertise-reversal effect): "Play along" walkthroughs explain every move with arrows. "From memory" drills then remove the arrows.
- **Spaced repetition**: every recall, find-the-move, and question becomes a card scheduled with **FSRS-4.5**, so each one comes back right before you'd forget it.
- **Interleaving**: reviews mix openings, so you first have to recognize *which* pattern applies, as in a real game.
- **Ideas over moves** (Fine, Seirawan, Watson & Burgess): "why" questions are spaced too, not just the moves.
- **Einstellung**: pattern-matchers sometimes play the familiar move without checking. Dedicated drills train the blunder check.

## Play the computer

The **Play** tab runs [Stockfish 19](https://github.com/nmrugg/stockfish.js) (lite, single-threaded WASM) on the phone, offline. There are 10 levels from ~400 to full strength. Levels 6–9 use Stockfish's calibrated `UCI_Elo` limiter. Levels 1–5 add a handicap (shallow search, choosing among decent moves, occasional blunders), so their ratings are approximate.

- **Opening practice**: the computer steers into your repertoire, and a coach line says when you are in book and when either side leaves it. Your slips become drills.
- **Rating estimate**: Glicko-1 over your results against the levels, shown with a 95% range. Ratings found in imported Lichess or Chess.com games are shown alongside it.

## Think like a master

- **Guess the Move** (Play tab): six classic games (Réti–Tartakower, Morphy's Opera Game, Lasker–Thomas, the Evergreen, the Immortal, Marshall's "gold coins" game). You play the winner's moves: 3 points for the master's move, 2 or 1 for alternatives the engine rates as nearly as good, and an annotation for every key moment. Every move is checked legal in tests, and the five mating games are checked to end in mate.
- **Boss battles**: each repertoire unit ends in a 🏰 castle. Play on from the unit's main-line position against the level closest to your rating. Win, or still be standing after 20 moves (engine eval no worse than −1.5), to earn the unit's 👑 crown.

## Made for you

- **Coach card**: picks your best next step: due reviews, then your weakest concept, then your next lesson.
- **Weak spots**: every exercise is tagged by concept (pins, tempo, Carlsbad, …). Recent mistakes, with older ones decaying, drive targeted drills.
- **Your games**: enter a Lichess or Chess.com username. The app checks your recent games against your repertoire (by position, so transpositions count). Every place you deviated becomes a drill, and the openings you actually face reorder your next lessons.
- Daily XP goal, streaks, unit strength meters, and a weekly chart.

Progress lives on your device (localStorage). Use **Me → Export backup** occasionally.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # validates every line and exercise (legal moves, real mates, one right answer) + engine tests
npm run build    # production build in dist/
```

- `src/data/lines.ts`: annotated repertoire lines in PGN-like notation: `1.e4 {why} e5 2.Nf3 {why} …`
- `src/data/*.ts`: units and lessons (exercise types: `info`, `walk`, `recall`, `find`, `choice`, `square`, `endgame`)
- `scripts/puzzles/`: builds `public/puzzles/sets.json` from the Lichess puzzle file (`--lichess <file.csv.zst>`)
- `src/engine/`: FSRS scheduler, store, coach/personalization, levels and gates, homework plan, game importer
- `src/ui/`: screens; the board is [chessground](https://github.com/lichess-org/chessground) and the rules are [chess.js](https://github.com/jhlywa/chess.js)

Pushing to `main` runs the tests and deploys to GitHub Pages.

Licensed GPL-3.0-or-later (chessground and the cburnett pieces are GPL). Icons are drawn from [Lucide](https://lucide.dev) (ISC), restyled in brass and cream, plus the cburnett rook for boss battles.
