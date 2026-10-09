import { Chess } from 'chess.js';

/**
 * Stockfish 19 (lite, single-threaded WASM) in a Web Worker, plus strength levels.
 * Stockfish's own limiter (UCI_Elo) only goes down to ~1320, so the beginner levels
 * add a handicap: shallow search, picking among several decent moves, and occasional blunders.
 */
export interface Level {
  id: number;
  name: string;
  /** Approximate playing strength used for the rating estimate. */
  elo: number;
  /** How sure we are of `elo` (Glicko RD); handicapped levels are rougher. */
  rd: number;
  depth?: number;
  movetime?: number;
  multipv?: number;
  /** Candidates may be up to this many centipawns worse than the best move. */
  maxLoss?: number;
  /** Chance of playing a random legal move instead. */
  blunder?: number;
  /** Use Stockfish's calibrated limiter at this Elo. */
  uciElo?: number;
}

export const LEVELS: Level[] = [
  { id: 1, name: 'Pawn', elo: 400, rd: 200, depth: 1, multipv: 10, maxLoss: 600, blunder: 0.3 },
  { id: 2, name: 'Squire', elo: 600, rd: 180, depth: 2, multipv: 8, maxLoss: 350, blunder: 0.18 },
  { id: 3, name: 'Knight', elo: 800, rd: 160, depth: 3, multipv: 6, maxLoss: 220, blunder: 0.1 },
  { id: 4, name: 'Bishop', elo: 1000, rd: 150, depth: 5, multipv: 5, maxLoss: 140, blunder: 0.05 },
  { id: 5, name: 'Rook', elo: 1200, rd: 140, depth: 6, multipv: 4, maxLoss: 80, blunder: 0.02 },
  { id: 6, name: 'Queen', elo: 1400, rd: 100, movetime: 400, uciElo: 1400 },
  { id: 7, name: 'King', elo: 1700, rd: 90, movetime: 500, uciElo: 1700 },
  { id: 8, name: 'Master', elo: 2000, rd: 90, movetime: 600, uciElo: 2000 },
  { id: 9, name: 'Grandmaster', elo: 2400, rd: 100, movetime: 800, uciElo: 2400 },
  { id: 10, name: 'Stockfish', elo: 2900, rd: 150, movetime: 1200 },
];

export const levelById = (id: number) => LEVELS.find((l) => l.id === id) ?? LEVELS[2];

/** Search settings: a Level works here, or an ad-hoc `{ depth: 10 }`. */
export type Search = Pick<Level, 'depth' | 'movetime' | 'multipv' | 'uciElo'>;

interface Line {
  move: string;
  /** Centipawns from the side to move's point of view (mates mapped to ±100000). */
  score: number;
}

type Listener = (line: string) => void;

class Engine {
  private worker: Worker | null = null;
  private listeners = new Set<Listener>();
  private ready: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private boot(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('engine/stockfish-19-lite-single.js', document.baseURI));
      } catch (e) {
        reject(e);
        return;
      }
      this.worker.onmessage = (e: MessageEvent) => {
        const text = typeof e.data === 'string' ? e.data : String(e.data);
        for (const line of text.split('\n')) this.listeners.forEach((fn) => fn(line));
      };
      this.worker.onerror = (e) => reject(new Error(e.message || 'Engine failed to load'));
      this.waitFor('uciok', () => this.send('uci'))
        .then(() => this.waitFor('readyok', () => this.send('isready')))
        .then(() => resolve(), reject);
    });
    return this.ready;
  }

  private send(cmd: string): void {
    this.worker!.postMessage(cmd);
  }

  private waitFor(token: string, start: () => void, onLine?: Listener): Promise<string> {
    return new Promise((resolve) => {
      const fn: Listener = (line) => {
        onLine?.(line);
        if (line.startsWith(token)) {
          this.listeners.delete(fn);
          resolve(line);
        }
      };
      this.listeners.add(fn);
      start();
    });
  }

  /** Top lines for a position. Calls are serialized so searches never overlap. */
  analyse(fen: string, level: Search): Promise<Line[]> {
    const run = async () => {
      await this.boot();
      const limited = level.uciElo !== undefined;
      this.send(`setoption name UCI_LimitStrength value ${limited}`);
      if (limited) this.send(`setoption name UCI_Elo value ${level.uciElo}`);
      this.send(`setoption name MultiPV value ${level.multipv ?? 1}`);
      await this.waitFor('readyok', () => this.send('isready'));
      const lines = new Map<number, Line>();
      const go = level.depth ? `go depth ${level.depth}` : `go movetime ${level.movetime ?? 500}`;
      const best = await this.waitFor(
        'bestmove',
        () => {
          this.send(`position fen ${fen}`);
          this.send(go);
        },
        (line) => {
          if (!line.startsWith('info') || !line.includes(' pv ')) return;
          const mpv = Number(/ multipv (\d+)/.exec(line)?.[1] ?? 1);
          const cp = / score cp (-?\d+)/.exec(line);
          const mate = / score mate (-?\d+)/.exec(line);
          const move = / pv (\S+)/.exec(line)?.[1];
          if (!move) return;
          const score = cp ? Number(cp[1]) : mate ? Math.sign(Number(mate[1])) * 100000 : 0;
          lines.set(mpv, { move, score });
        },
      );
      const bestMove = best.split(' ')[1];
      const out = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
      if (bestMove && bestMove !== '(none)' && !out.some((l) => l.move === bestMove)) out.unshift({ move: bestMove, score: out[0]?.score ?? 0 });
      return out;
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => undefined);
    return p;
  }

  warmUp(): void {
    this.boot().catch(() => undefined);
  }
}

export const engine = new Engine();

const clampScore = (s: number) => Math.max(-2000, Math.min(2000, s));

/**
 * How many centipawns worse `san` is than the engine's best move in this position (0 = as good as best).
 * Used to give credit for strong alternatives in Guess the Move.
 */
export async function moveLoss(fen: string, san: string, depth = 10): Promise<number> {
  return (await judgeMove(fen, san, depth)).loss;
}

export interface MoveJudgement {
  /** Centipawns lost compared with the best move (0 = as good as best). */
  loss: number;
  /** Engine's best move in UCI. */
  best: string;
  /** Evaluation before the move and after it, both from the mover's point of view. */
  before: number;
  after: number;
}

export async function judgeMove(fen: string, san: string, depth = 10): Promise<MoveJudgement> {
  const [best] = await engine.analyse(fen, { depth, multipv: 1 });
  const before = clampScore(best?.score ?? 0);
  const after = new Chess(fen);
  after.move(san);
  if (after.isCheckmate()) return { loss: 0, best: best?.move ?? '', before, after: 2000 };
  if (after.isDraw()) return { loss: Math.max(0, before), best: best?.move ?? '', before, after: 0 };
  const [reply] = await engine.analyse(after.fen(), { depth: depth - 1, multipv: 1 });
  const mine = clampScore(-(reply?.score ?? 0));
  return { loss: Math.max(0, before - mine), best: best?.move ?? '', before, after: mine };
}

/**
 * Rough size of a loss in plain words. Stockfish's scores are scaled to winning chances, not material
 * (a hung bishop reads about +7), so we don't call them "pawns".
 */
export function lossLabel(cp: number): string {
  if (cp >= 1000) return 'more than a piece';
  if (cp >= 500) return 'about a piece';
  if (cp >= 250) return 'about two pawns';
  return 'about a pawn';
}

/** A real mistake worth flagging: big loss, and the game wasn't already decided either way. */
export function isMistake(j: MoveJudgement, threshold = 150): boolean {
  if (j.loss < threshold) return false;
  if (j.before <= -500) return false; // already lost
  if (j.after >= 400) return false; // still clearly winning
  return true;
}

/** Evaluation in centipawns from the side to move's point of view. */
export async function evaluate(fen: string, depth = 12): Promise<number> {
  const [best] = await engine.analyse(fen, { depth, multipv: 1 });
  return clampScore(best?.score ?? 0);
}

/** Choose the bot's move (UCI, e.g. "e2e4") for a level, applying the beginner handicap. */
export async function botMove(fen: string, level: Level, rand = Math.random): Promise<string> {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (level.blunder && rand() < level.blunder) {
    const mv = legal[Math.floor(rand() * legal.length)];
    return mv.from + mv.to + (mv.promotion ?? '');
  }
  const lines = await engine.analyse(fen, level);
  if (!lines.length) {
    const mv = legal[Math.floor(rand() * legal.length)];
    return mv.from + mv.to + (mv.promotion ?? '');
  }
  return pickMove(lines, level.maxLoss ?? 0, rand);
}

/** Among lines within `maxLoss` of the best, prefer better ones (weights fall off linearly). */
export function pickMove(lines: Line[], maxLoss: number, rand = Math.random): string {
  const best = lines[0].score;
  if (maxLoss <= 0) return lines[0].move;
  const pool = lines.filter((l) => best - l.score <= maxLoss);
  const weights = pool.map((l) => 1 - (best - l.score) / (maxLoss + 1) + 0.15);
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i].move;
  }
  return pool[0].move;
}
