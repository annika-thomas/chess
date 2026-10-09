import { Chess, type Move } from 'chess.js';
import type { LineText, Side } from '../types';

export interface ParsedLine {
  /** SAN moves from the start position. */
  moves: string[];
  /** Comment after each ply ('' if none); same length as `moves`. */
  notes: string[];
}

const cache = new Map<string, ParsedLine>();

/** Parse "1.e4 {comment} e5 2.Nf3 Nc6" into moves and per-move notes. */
export function parseLine(text: LineText): ParsedLine {
  const hit = cache.get(text);
  if (hit) return hit;
  const moves: string[] = [];
  const notes: string[] = [];
  const re = /\{([^}]*)\}|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) {
      if (!moves.length) throw new Error(`Comment before first move in: ${text}`);
      const prev = notes[notes.length - 1];
      notes[notes.length - 1] = (prev ? prev + ' ' : '') + m[1].trim();
      continue;
    }
    // Strip move numbers such as "1.", "12...", or "3.e4".
    const tok = m[2].replace(/^\d+\.(\.\.)?/, '');
    if (!tok) continue;
    moves.push(tok);
    notes.push('');
  }
  const parsed = { moves, notes };
  cache.set(text, parsed);
  return parsed;
}

/** Play `moves` (SAN) from the start position; throws on an illegal move. */
export function playMoves(moves: string[], upTo = moves.length): Chess {
  const chess = new Chess();
  for (let i = 0; i < upTo; i++) {
    if (!tryMove(chess, moves[i])) {
      throw new Error(`Illegal move ${moves[i]} at ply ${i + 1} in "${moves.join(' ')}"`);
    }
  }
  return chess;
}

export function tryMove(chess: Chess, san: string): Move | null {
  try {
    return chess.move(san);
  } catch {
    return null;
  }
}

/** Position identity ignoring move counters, so transpositions share a key. */
export function fenKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** Normalize SAN for comparison (ignores check/mate/annotation symbols). */
export function sameSan(a: string, b: string): boolean {
  const n = (s: string) => s.replace(/[+#!?]/g, '');
  return n(a) === n(b);
}

export function sideToMove(plies: number): Side {
  return plies % 2 === 0 ? 'w' : 'b';
}

/** "1.e4 e5 2.Nf3" style rendering, starting at ply index `start`. */
export function formatMoves(moves: string[], start = 0): string {
  const out: string[] = [];
  for (let i = start; i < moves.length; i++) {
    const n = Math.floor(i / 2) + 1;
    if (i % 2 === 0) out.push(`${n}.${moves[i]}`);
    else out.push(i === start ? `${n}...${moves[i]}` : moves[i]);
  }
  return out.join(' ');
}

/** Legal destinations in chessground's format. */
export function legalDests(chess: Chess): Map<string, string[]> {
  const dests = new Map<string, string[]>();
  for (const mv of chess.moves({ verbose: true })) {
    const list = dests.get(mv.from);
    if (list) list.push(mv.to);
    else dests.set(mv.from, [mv.to]);
  }
  return dests;
}

/** Find the SAN for a from/to pair in the current position (auto-queen promotions). */
export function sanFor(chess: Chess, from: string, to: string): string | null {
  const mv = chess
    .moves({ verbose: true })
    .find((m) => m.from === from && m.to === to && (!m.promotion || m.promotion === 'q'));
  return mv ? mv.san : null;
}

/** from/to squares for a SAN move in the current position. */
export function squaresFor(chess: Chess, san: string): { from: string; to: string } | null {
  const mv = chess.moves({ verbose: true }).find((m) => sameSan(m.san, san));
  return mv ? { from: mv.from, to: mv.to } : null;
}
