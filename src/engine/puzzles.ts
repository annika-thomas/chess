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
  puzzles: Puzzle[];
}

interface SetsFile {
  version: number;
  source: string;
  sets: PuzzleSet[];
}

let loading: Promise<Map<string, PuzzleSet>> | null = null;
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
      return new Map(f.sets.map((s) => [s.id, s]));
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
