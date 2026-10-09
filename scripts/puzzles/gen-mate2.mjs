// Find positions with a unique forced mate in 2 (and no mate in 1), for lesson examples.
import { Chess } from 'chess.js';

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const sq = (f, r) => 'abcdefgh'[f] + (r + 1);

function position() {
  const board = new Map();
  const put = (s, p) => (board.has(s) ? false : (board.set(s, p), true));
  const bk = sq(Math.floor(rand() * 8), 7);
  put(bk, 'k');
  const bf = bk.charCodeAt(0) - 97;
  for (let df = -1; df <= 1; df++) if (rand() < 0.7 && bf + df >= 0 && bf + df < 8) put(sq(bf + df, 6), 'p');
  for (const p of ['r', 'n', 'b', 'q']) if (rand() < 0.35) put(sq(Math.floor(rand() * 8), 4 + Math.floor(rand() * 4)), p);
  put(sq(Math.floor(rand() * 8), 0), 'K');
  for (const p of ['P', 'P', 'P']) put(sq(Math.floor(rand() * 8), 1), p);
  for (const p of [['Q', 'R'], ['R', 'R'], ['Q', 'B'], ['Q', 'N'], ['R', 'B', 'N']][Math.floor(rand() * 5)]) {
    for (let t = 0; t < 10 && !put(sq(Math.floor(rand() * 8), 1 + Math.floor(rand() * 6)), p); t++);
  }
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', e = 0;
    for (let f = 0; f < 8; f++) { const p = board.get(sq(f, r)); if (!p) e++; else { if (e) row += e; e = 0; row += p; } }
    rows.push(row + (e || ''));
  }
  return rows.join('/') + ' w - - 0 1';
}

const mates1 = (c) => c.moves().filter((m) => { const x = new Chess(c.fen()); x.move(m); return x.isCheckmate(); });

function mateIn2(fen) {
  let c;
  try { c = new Chess(fen); new Chess(fen.replace(' w ', ' b ')); } catch { return null; }
  if (c.inCheck() || new Chess(fen.replace(' w ', ' b ')).inCheck() || c.isGameOver()) return null;
  if (mates1(c).length) return null;
  const keys = [];
  for (const m of c.moves()) {
    const a = new Chess(fen); a.move(m);
    if (a.isGameOver()) continue;
    let all = true, line = null;
    for (const r of a.moves()) {
      const b = new Chess(a.fen()); b.move(r);
      const ms = mates1(b);
      if (!ms.length) { all = false; break; }
      line ??= [m, r, ms[0]];
    }
    if (all) { keys.push(line); if (keys.length > 1) return null; }
  }
  return keys.length === 1 ? keys[0] : null;
}

const found = [];
for (let i = 0; i < 20000 && found.length < 6; i++) {
  const f = position();
  const line = mateIn2(f);
  if (line) found.push({ fen: f, line });
}
for (const x of found) console.log(x.line.join(' ').padEnd(24), x.fen);
