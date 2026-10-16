import { Chess } from 'chess.js';
/**
 * Puzzle sets (from the Lichess puzzle database, CC0). Each puzzle is stored ready to play:
 * `fen` is the position you solve, `last` the opponent move that led to it (for highlighting),
 * and `moves` the solution in UCI, starting with your move and alternating with the opponent's replies.
 */
export interface Puzzle {
  id: string;
  fen: string;
  last?: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export interface PuzzleSet {
  id: string;
  title: string;
  /** One line about what the set trains. */
  about: string;
  /** A follow-up set: opens once this set is passed. */
  after?: string;
  /** Lichess theme the set trains (practice sets only). */
  theme?: string;
  puzzles: Puzzle[];
}

interface SetsFile {
  version: number;
  source: string;
  sets: PuzzleSet[];
}

let loading: Promise<Map<string, PuzzleSet>> | null = null;
let loaded: Map<string, PuzzleSet> | null = null;
/** The sets, if already loaded (for synchronous lookups). */
export const loadedSets = () => loaded;
export function useSets(sets: PuzzleSet[]): void {
  loaded = new Map(sets.map((s) => [s.id, s]));
}
const titles = new Map<string, string>();

/** A set's title once the file has loaded (falls back to its id). */
export const setTitle = (id: string) => titles.get(id) ?? id;

/** Load all sets once (precached by the service worker, so it works offline). */
export function loadSets(): Promise<Map<string, PuzzleSet>> {
  loading ??= fetch(new URL('puzzles/sets.json', document.baseURI))
    .then((r) => {
      if (!r.ok) throw new Error(`puzzle sets: ${r.status}`);
      return r.json() as Promise<SetsFile>;
    })
    .then((f) => {
      for (const s of f.sets) titles.set(s.id, s.title);
      loaded = new Map(f.sets.map((s) => [s.id, s]));
      return loaded;
    })
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

export async function getSet(id: string): Promise<PuzzleSet | undefined> {
  return (await loadSets()).get(id);
}

/** Mastery thresholds (Steps Method: ~80% to move on; Woodpecker/Bain: 85% at ≤15 s for automaticity). */
export const PASS = 0.8;
export const FLUENT = { accuracy: 0.85, seconds: 15 };

export interface SetRun {
  correct: number;
  total: number;
  seconds: number;
}

export const accuracy = (r: SetRun) => (r.total ? r.correct / r.total : 0);
export const avgSeconds = (r: SetRun) => (r.total ? r.seconds / r.total : 0);
export const isFluent = (r: SetRun) => accuracy(r) >= FLUENT.accuracy && avgSeconds(r) <= FLUENT.seconds;

// ───────────────────────── Fresh runs: draw each run from a theme pool ─────────────────────────

/** What each practice set trains, for sets built before the file recorded it. */
const THEMES: Record<string, string> = {
  hanging: 'hangingPiece',
  mate1: 'mateIn1',
  backrank: 'backRankMate',
  'fork-1': 'fork',
  'fork-2': 'fork',
  'fork-3': 'fork',
  pin: 'pin',
  skewer: 'skewer',
  discovered: 'discoveredAttack',
  'double-check': 'doubleCheck',
  defender: 'capturingDefender',
  mate2: 'mateIn2',
  f7: 'attackingF2F7',
};

export const themeOf = (set: PuzzleSet): string | undefined => set.theme ?? THEMES[set.id] ?? THEMES[set.id.replace(/-2$/, '')];

/** Sets whose puzzles must stay unseen: tests and mixed reviews are assessments. */
const reserved = (s: PuzzleSet) => s.id.includes('test') || s.id.startsWith('mix');

/** Every puzzle with the set's theme and a similar rating: the set's own plus matching ones from other sets. */
export function themePool(set: PuzzleSet, all: Iterable<PuzzleSet> = loaded?.values() ?? []): Puzzle[] {
  const theme = themeOf(set);
  if (!theme || !set.puzzles.length) return set.puzzles.slice();
  const ratings = set.puzzles.map((p) => p.rating);
  const lo = Math.min(...ratings) - 100;
  const hi = Math.max(...ratings) + 100;
  const pool = new Map(set.puzzles.map((p) => [p.id, p]));
  for (const other of all) {
    if (other.id === set.id || reserved(other)) continue;
    for (const p of other.puzzles) if (p.themes.includes(theme) && p.rating >= lo && p.rating <= hi) pool.set(p.id, p);
  }
  return [...pool.values()];
}

/** How you've done on one puzzle. */
export interface PuzzleRecord {
  seen: number;
  wrong: number;
  /** Result of the latest attempt. */
  lastOk: boolean;
  last: number;
  /** Seconds on the latest attempt. */
  secs: number;
}

export const RUN_SIZE = 25;

/**
 * Choose a run: puzzles you missed last time first (up to a third of the run), then ones you haven't
 * seen, then the ones seen longest ago. Practice runs go roughly easy to hard, with jitter so the order
 * can't be memorized; other runs are shuffled.
 */
export function pickRun(pool: Puzzle[], history: Record<string, PuzzleRecord>, opts: { size?: number; ordered?: boolean; rand?: () => number } = {}): Puzzle[] {
  const size = opts.size ?? RUN_SIZE;
  const rand = opts.rand ?? Math.random;
  const shuffle = <T>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const missed = shuffle(pool.filter((p) => history[p.id] && !history[p.id].lastOk));
  const unseen = shuffle(pool.filter((p) => !history[p.id]));
  const solved = pool.filter((p) => history[p.id]?.lastOk).sort((a, b) => history[a.id].last - history[b.id].last);
  const run = missed.slice(0, Math.ceil(size / 3));
  for (const p of [...unseen, ...missed.slice(run.length), ...solved]) {
    if (run.length >= size) break;
    if (!run.includes(p)) run.push(p);
  }
  if (!opts.ordered) return shuffle(run);
  const jitter = new Map(run.map((p) => [p.id, p.rating + (rand() - 0.5) * 300]));
  return run.sort((a, b) => jitter.get(a.id)! - jitter.get(b.id)!);
}

// ───────────────────────── Mixed practice and conversion ─────────────────────────

/** Practice sets whose theme you've passed: their pools feed mixed, unlabelled practice. */
export function masteredThemeSets(mastered: (id: string) => boolean, all: Iterable<PuzzleSet> = loaded?.values() ?? []): PuzzleSet[] {
  return [...all].filter((s) => themeOf(s) && mastered(s.id));
}

/** Unlabelled pool: every puzzle from the themes you've passed, plus the daily pool. */
export function mixedPool(mastered: (id: string) => boolean, all: PuzzleSet[] = [...(loaded?.values() ?? [])]): Puzzle[] {
  const passed = masteredThemeSets(mastered, all);
  const themes = new Set(passed.map((s) => themeOf(s)!));
  // Longer combinations (3+ of your own moves) wait until you've learned to calculate a mate in two.
  const maxLen = mastered('mate2') ? 5 : 3;
  const fits = (p: Puzzle) => p.moves.length <= maxLen;
  const pool = new Map<string, Puzzle>();
  for (const s of passed) for (const p of themePool(s, all)) if (fits(p)) pool.set(p.id, p);
  const daily = all.find((s) => s.id === 'daily');
  const maxRating = Math.max(1000, ...[...pool.values()].map((p) => p.rating));
  // Daily puzzles only if they use a pattern you've learned.
  for (const p of daily?.puzzles ?? []) if (p.rating <= maxRating && fits(p) && p.themes.some((t) => themes.has(t))) pool.set(p.id, p);
  return [...pool.values()];
}

/**
 * Keep mixed practice in the productive zone (roughly 75–90% success; Wilson et al. 2019 as a rule of thumb):
 * after low recent scores draw from the easier part of the pool, after high scores from the harder part.
 */
export function adaptPool(pool: Puzzle[], recentAccuracy: number | undefined): Puzzle[] {
  if (recentAccuracy === undefined || pool.length < 40) return pool;
  const sorted = pool.slice().sort((a, b) => a.rating - b.rating);
  if (recentAccuracy < 0.75) return sorted.slice(0, Math.ceil(sorted.length * 0.6));
  if (recentAccuracy > 0.9) return sorted.slice(Math.floor(sorted.length * 0.4));
  return pool;
}

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Winning positions to convert: the end of a solved puzzle (not a mate), where the solver is up at least
 * `minGain` points of material. The opponent is to move, as in a game right after your combination.
 */
export function conversionPositions(pool: Puzzle[], minGain = 3): Array<{ fen: string; side: 'w' | 'b'; id: string }> {
  const out: Array<{ fen: string; side: 'w' | 'b'; id: string }> = [];
  for (const p of pool) {
    if (p.themes.some((t) => t.startsWith('mate'))) continue;
    const c = new Chess(p.fen);
    const side = c.turn();
    try {
      for (const u of p.moves) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    } catch {
      continue;
    }
    if (c.isGameOver()) continue;
    let diff = 0;
    for (const row of c.board()) for (const sq of row) if (sq) diff += (sq.color === side ? 1 : -1) * VALUE[sq.type];
    if (diff >= minGain) out.push({ fen: c.fen(), side, id: p.id });
  }
  return out;
}
