// Build public/puzzles/sets.json.
//   node scripts/puzzles/build-sets.mjs --lichess path/to/lichess_db_puzzle.csv.zst
//   node scripts/puzzles/build-sets.mjs --placeholder      (generated mate-in-1 only; until the Lichess file is available)
//
// Lichess puzzles are CC0 (https://database.lichess.org/#puzzles). CSV columns:
//   PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags[,DailyDate]
// FEN is the position BEFORE the opponent's move; Moves[0] is that move and the solution starts at Moves[1].
// We apply Moves[0] here so the app stores the position you actually solve.
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { Decompress } from 'fzstd';
import { QUALITY, SETS } from './sets.config.mjs';
import { generate } from './gen-mates.mjs';

const OUT = new URL('../../public/puzzles/sets.json', import.meta.url);
const args = process.argv.slice(2);

function write(sets, source) {
  mkdirSync(new URL('.', OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ version: 1, source, sets }));
  const n = sets.reduce((a, s) => a + s.puzzles.length, 0);
  console.log(`wrote ${sets.length} sets, ${n} puzzles → ${OUT.pathname}`);
}

if (args[0] === '--placeholder') {
  const set = SETS.find((s) => s.id === 'mate1');
  write([{ id: set.id, title: set.title, about: set.about, puzzles: generate(set.size, 7) }], 'generated (placeholder)');
  process.exit(0);
}

if (args[0] !== '--lichess' || !args[1]) {
  console.error('usage: build-sets.mjs --lichess <lichess_db_puzzle.csv.zst> | --placeholder');
  process.exit(1);
}

/** Cheap deterministic hash, so the same file always yields the same sets. */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Candidates per set: a bounded, hash-ordered sample spread across the rating band. */
const BUCKETS = 10;
/** Keep a few times more candidates than needed, so sets can skip puzzles used elsewhere. */
const capacity = (size) => Math.max(80, Math.ceil((size * 3) / BUCKETS));
const pools = new Map(SETS.map((s) => [s.id, Array.from({ length: BUCKETS }, () => ({ items: [], worst: -1 }))]));
let rows = 0;
let kept = 0;

function consider(line) {
  if (!line || line.startsWith('PuzzleId')) return;
  rows++;
  const [id, fen, moves, rating, rd, popularity, plays, themes] = line.split(',');
  const r = Number(rating);
  if (Number(rd) > QUALITY.maxRd || Number(popularity) < QUALITY.minPopularity || Number(plays) < QUALITY.minPlays) return;
  const tags = themes.split(' ');
  for (const set of SETS) {
    if (r < set.rating[0] || r > set.rating[1]) continue;
    if (set.any.length && !set.any.some((t) => tags.includes(t))) continue;
    const b = Math.min(BUCKETS - 1, Math.floor(((r - set.rating[0]) / (set.rating[1] - set.rating[0] + 1)) * BUCKETS));
    const bucket = pools.get(set.id)[b];
    const entry = { key: hash(id + set.id), id, fen, moves, r, tags };
    const items = bucket.items;
    if (items.length < capacity(set.size)) {
      items.push(entry);
      bucket.worst = -1;
    } else {
      // Keep the smallest hashes: an unbiased, reproducible sample. The largest is cached until replaced.
      if (bucket.worst < 0) {
        bucket.worst = 0;
        for (let k = 1; k < items.length; k++) if (items[k].key > items[bucket.worst].key) bucket.worst = k;
      }
      if (entry.key < items[bucket.worst].key) {
        items[bucket.worst] = entry;
        bucket.worst = -1;
      }
    }
  }
}

function toPuzzle(e) {
  const c = new Chess(e.fen);
  const [first, ...solution] = e.moves.split(' ');
  c.move({ from: first.slice(0, 2), to: first.slice(2, 4), promotion: first[4] });
  // Keep only meaningful tags for display/filters.
  const themes = e.tags.filter((t) => !['short', 'long', 'veryLong', 'oneMove', 'crushing', 'advantage', 'equality', 'middlegame', 'master', 'masterVsMaster', 'superGM'].includes(t));
  return { id: e.id, fen: c.fen(), last: first, moves: solution, rating: e.r, themes };
}

const t0 = Date.now();
let rest = '';
const dec = new Decompress((chunk, final) => {
  const text = rest + Buffer.from(chunk).toString('utf8');
  const lines = text.split('\n');
  rest = final ? '' : lines.pop();
  for (const l of lines) consider(l.trim());
  if (final && rest) consider(rest);
});

const stream = createReadStream(args[1], { highWaterMark: 1 << 20 });
stream.on('data', (buf) => dec.push(new Uint8Array(buf)));
stream.on('end', () => {
  dec.push(new Uint8Array(0), true);
  const used = new Set();
  const sets = [];
  for (const def of SETS) {
    const buckets = pools.get(def.id);
    // Take evenly from each rating bucket, skipping puzzles already used in another set.
    const per = Math.ceil(def.size / BUCKETS);
    const chosen = [];
    for (const { items: b } of buckets) {
      b.sort((x, y) => x.key - y.key);
      let n = 0;
      for (const e of b) {
        if (n >= per || chosen.length >= def.size) break;
        if (used.has(e.id)) continue;
        used.add(e.id);
        chosen.push(e);
        n++;
      }
    }
    chosen.sort((a, b) => a.r - b.r);
    kept += chosen.length;
    sets.push({ id: def.id, title: def.title, about: def.about, ...(def.after ? { after: def.after } : {}), puzzles: chosen.map(toPuzzle) });
    console.log(`${def.id.padEnd(14)} ${String(chosen.length).padStart(3)} / ${def.size}`);
  }
  console.log(`scanned ${rows} puzzles in ${((Date.now() - t0) / 1000).toFixed(0)}s, kept ${kept}`);
  write(sets, 'Lichess puzzle database (CC0), https://database.lichess.org/#puzzles');
});
