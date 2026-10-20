import { Chess } from 'chess.js';
import { parseLine, playMoves } from './notation';
import type { Exercise } from '../types';

/**
 * Review the idea, not the item. Re-showing an identical question trains memory of that question; a new
 * instance of the same idea trains the idea (varied practice / retrieval of the concept, not the answer).
 * Two kinds of variant:
 * - a transformed copy of the same position: mirrored left–right and/or with the colours swapped, with every
 *   coordinate, move and side named in the text rewritten to match;
 * - a fresh puzzle with the same theme (see coach.ts).
 */

export interface Transform {
  /** Mirror a↔h. */
  files: boolean;
  /** Swap colours (and ranks 1↔8). */
  colors: boolean;
}

const FILES = 'abcdefgh';
export const mapSquare = (sq: string, t: Transform): string => {
  const f = FILES.indexOf(sq[0]);
  const r = Number(sq[1]);
  return FILES[t.files ? 7 - f : f] + (t.colors ? 9 - r : r);
};
const mapUci = (uci: string, t: Transform) => mapSquare(uci.slice(0, 2), t) + mapSquare(uci.slice(2, 4), t) + uci.slice(4);

export function transformFen(fen: string, t: Transform): string {
  const [board, turn, , , half = '0', full = '1'] = fen.split(' ');
  let rows = board.split('/').map((row) => row.replace(/\d/g, (d) => '1'.repeat(Number(d))));
  if (t.files) rows = rows.map((r) => [...r].reverse().join(''));
  if (t.colors) rows = rows.reverse().map((r) => [...r].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(''));
  const packed = rows.map((r) => r.replace(/1+/g, (m) => String(m.length)));
  const side = t.colors ? (turn === 'w' ? 'b' : 'w') : turn;
  return `${packed.join('/')} ${side} - - ${half} ${full}`;
}

/** Rewrite coordinates, files, sides and wing/colour words in text to match the transformed board. */
export function transformText(text: string, t: Transform): string {
  const squareColorFlips = t.files !== t.colors; // a1 is dark; mirroring once makes it light
  const swaps: Array<[RegExp, (m: string) => string]> = [];
  if (t.colors)
    swaps.push([/\b(White|Black|white|black)\b/g, (m) => ({ White: 'Black', Black: 'White', white: 'black', black: 'white' })[m]!]);
  if (t.files) swaps.push([/\b(kingside|queenside|Kingside|Queenside)\b/g, (m) => ({ kingside: 'queenside', queenside: 'kingside', Kingside: 'Queenside', Queenside: 'Kingside' })[m]!]);
  if (squareColorFlips)
    swaps.push([/\b(light|dark)(-squared| squares?)\b/g, (m) => m.replace(/^light|^dark/, (w) => (w === 'light' ? 'dark' : 'light'))]);
  let out = text;
  // Squares (also inside moves like Qb8+ or exd5).
  out = out.replace(/([a-h])([1-8])/g, (m) => mapSquare(m, t));
  // Pawn-capture file prefixes (the "e" in exd5) and named files ("the c-file", "a-pawn").
  out = out.replace(/\b([a-h])(?=x[a-h][1-8])/g, (f) => (t.files ? FILES[7 - FILES.indexOf(f)] : f));
  out = out.replace(/\b([a-h])-(file|pawn)/g, (_m, f: string, w: string) => `${t.files ? FILES[7 - FILES.indexOf(f)] : f}-${w}`);
  for (const [re, fn] of swaps) out = out.replace(re, fn);
  return out;
}

/** Text we can't safely rewrite: castling, and ranks named by number when colours swap. */
function unsafe(text: string, t: Transform): boolean {
  if (/O-O|castl/i.test(text)) return true;
  // Move numbers ("3...Bc5") tie the text to a game; don't rewrite those.
  if (/\b\d+\.(\.\.)?\s?[KQRBN]?[a-h]?x?[a-h][1-8]/.test(text)) return true;
  if (t.colors && /\b[1-8](st|nd|rd|th) rank\b|\brank [1-8]\b/i.test(text)) return true;
  return false;
}

function startFen(ex: { fen?: string; setup?: string }): string {
  if (ex.fen) return ex.fen;
  return playMoves(parseLine(ex.setup ?? '').moves).fen();
}

/** Convert a SAN line from `fen` into the transformed position; null if anything doesn't map. */
function mapLine(fen: string, sans: string[], t: Transform): string[] | null {
  const a = new Chess(fen);
  const b = new Chess(transformFen(fen, t));
  const out: string[] = [];
  for (const san of sans) {
    let mv;
    try {
      mv = a.move(san);
    } catch {
      return null;
    }
    const uci = mapUci(mv.from + mv.to + (mv.promotion ?? ''), t);
    try {
      out.push(b.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san);
    } catch {
      return null;
    }
  }
  return out;
}

const textOf = (ex: Exercise): string => JSON.stringify(ex);

/** A transformed copy of a positional exercise, or null when it can't be done safely. */
export function transformExercise(ex: Exercise, t: Transform): Exercise | null {
  if (!t.files && !t.colors) return null;
  // Positions reached by opening moves stay as they are: mirrored, an Italian Game is no longer an Italian.
  if ('setup' in ex && ex.setup) return null;
  if (unsafe(textOf(ex), t)) return null;
  try {
    switch (ex.type) {
      case 'find': {
        const fen = startFen(ex);
        const solution = mapLine(fen, ex.solution, t);
        if (!solution) return null;
        const accept = (ex.accept ?? []).map((m) => mapLine(fen, [m], t)?.[0]).filter((m): m is string => !!m);
        const newFen = transformFen(fen, t);
        new Chess(newFen);
        return {
          ...ex,
          setup: undefined,
          fen: newFen,
          side: t.colors ? (ex.side === 'w' ? 'b' : 'w') : ex.side,
          solution,
          accept,
          prompt: transformText(ex.prompt, t),
          explain: transformText(ex.explain, t),
        };
      }
      case 'tap':
        return {
          ...ex,
          fen: transformFen(ex.fen, t),
          side: t.colors ? (ex.side === 'w' ? 'b' : 'w') : ex.side,
          answers: ex.answers.map((s) => mapSquare(s, t)),
          prompt: transformText(ex.prompt, t),
          explain: transformText(ex.explain, t),
        };
      case 'grade': {
        const good = ex.good.map((m) => mapLine(ex.fen, [m], t)?.[0]);
        const ok = (ex.ok ?? []).map((m) => mapLine(ex.fen, [m], t)?.[0]);
        if (good.some((m) => !m) || ok.some((m) => !m)) return null;
        return {
          ...ex,
          fen: transformFen(ex.fen, t),
          side: t.colors ? (ex.side === 'w' ? 'b' : 'w') : ex.side,
          good: good as string[],
          ok: ok as string[],
          prompt: transformText(ex.prompt, t),
          explain: transformText(ex.explain, t),
        };
      }
      case 'choice': {
        if (!ex.fen && !ex.setup) return null;
        const fen = transformFen(startFen(ex), t);
        new Chess(fen);
        return {
          ...ex,
          setup: undefined,
          fen,
          side: ex.side ? (t.colors ? (ex.side === 'w' ? 'b' : 'w') : ex.side) : ex.side,
          prompt: transformText(ex.prompt, t),
          explain: ex.explain ? transformText(ex.explain, t) : ex.explain,
          arrows: ex.arrows?.map((a) => ({ ...a, from: mapSquare(a.from, t), to: mapSquare(a.to, t) })),
          highlights: ex.highlights?.map((s) => mapSquare(s, t)),
          options: ex.options.map((o) => ({ ...o, text: transformText(o.text, t), why: o.why ? transformText(o.why, t) : o.why })),
        };
      }
      case 'endgame':
        return {
          ...ex,
          fens: ex.fens.map((f) => transformFen(f, t)),
          side: t.colors ? (ex.side === 'w' ? 'b' : 'w') : ex.side,
          prompt: transformText(ex.prompt, t),
          explain: transformText(ex.explain, t),
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** Try transforms in a random order; the first that works wins. */
export function variantOf(ex: Exercise, rand = Math.random): Exercise | null {
  const options: Transform[] = [
    { files: true, colors: false },
    { files: false, colors: true },
    { files: true, colors: true },
  ];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  for (const t of options) {
    const v = transformExercise(ex, t);
    if (v) return v;
  }
  return null;
}
