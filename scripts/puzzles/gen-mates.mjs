// Prototype: generate Polgar-style "mate in 1" positions, each with exactly one mating move.
import { Chess } from 'chess.js';

let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rand() * a.length)];
const sq = (f, r) => 'abcdefgh'[f] + (r + 1);

/** A sparse, plausible position: Black king near its back rank behind some pawns; White has a few pieces. */
function randomPosition() {
  const board = new Map();
  const put = (s, p) => (board.has(s) ? false : (board.set(s, p), true));
  const bk = sq(Math.floor(rand() * 8), 6 + Math.floor(rand() * 2));
  put(bk, 'k');
  // Black pawns shielding the king, sometimes extra defenders.
  const bf = bk.charCodeAt(0) - 97;
  for (let df = -1; df <= 1; df++) if (rand() < 0.65 && bf + df >= 0 && bf + df < 8) put(sq(bf + df, 5 + Math.floor(rand() * 2) - (bk[1] === '7' ? 1 : 0)), 'p');
  for (const p of ['r', 'b', 'n', 'q']) if (rand() < 0.3) put(sq(Math.floor(rand() * 8), 3 + Math.floor(rand() * 5)), p);
  put(sq(Math.floor(rand() * 8), Math.floor(rand() * 2)), 'K');
  for (const p of pick([['Q'], ['R'], ['Q', 'R'], ['R', 'R'], ['Q', 'B'], ['Q', 'N'], ['R', 'B'], ['R', 'N'], ['B', 'N', 'R']])) {
    for (let t = 0; t < 10 && !put(sq(Math.floor(rand() * 8), Math.floor(rand() * 6)), p); t++);
  }
  for (let i = 0; i < 3; i++) if (rand() < 0.5) put(sq(Math.floor(rand() * 8), 1 + Math.floor(rand() * 3)), 'P');
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board.get(sq(f, r));
      if (!p) empty++;
      else { if (empty) row += empty; empty = 0; row += p; }
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/') + ' w - - 0 1';
}

function mateInOne(fen) {
  let c;
  try { c = new Chess(fen); } catch { return null; }
  if (c.inCheck() || c.isGameOver()) return null;
  // Black must not be in check either (illegal position with White to move).
  const flipped = fen.replace(' w ', ' b ');
  try { if (new Chess(flipped).inCheck()) return null; } catch { return null; }
  // No pawns on the first/last rank.
  if (/[pP]/.test(fen.split(' ')[0].split('/')[0] + fen.split(' ')[0].split('/')[7])) return null;
  const mates = c.moves().filter((m) => { const x = new Chess(fen); x.move(m); return x.isCheckmate(); });
  return mates.length === 1 ? mates[0] : null;
}

/** Generate `n` mate-in-1 puzzles (deterministic for a seed), in the app's puzzle format. */
export function generate(n, startSeed = 1) {
  seed = startSeed;
  const found = [];
  const seen = new Set();
  for (let i = 0; i < 400000 && found.length < n; i++) {
    const fen = randomPosition();
    const m = mateInOne(fen);
    if (!m || seen.has(fen)) continue;
    seen.add(fen);
    const c = new Chess(fen);
    const mv = c.move(m);
    found.push({ id: `gen${found.length + 1}`, fen, moves: [mv.from + mv.to + (mv.promotion ?? '')], rating: 600, themes: ['mateIn1'] });
  }
  return found;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t0 = Date.now();
  const found = generate(Number(process.argv[3] ?? 10), Number(process.argv[2] ?? 1));
  console.log(`found ${found.length} in ${Date.now() - t0}ms`);
  for (const f of found.slice(0, 8)) console.log(f.moves[0].padEnd(8), f.fen);
}
