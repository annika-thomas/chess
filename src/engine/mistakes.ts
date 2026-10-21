import { Chess } from 'chess.js';
import type { Item } from './coach';
import { isMistake, judgeMove } from './bot';
import { retrievability } from './srs';
import { save, state, type MistakeDrill, type PlayedGame } from './store';
import type { GradeExercise, Side } from '../types';

/**
 * "Rewrite the ending": the positions where you went wrong in your own games, replayed as drills. They're the
 * most relevant positions there are. Graded live by the engine (any good move counts), spaced like other cards.
 */
const uciToSan = (fen: string, uci: string) => {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' }).san;
  } catch {
    return uci;
  }
};

export function saveMistake(game: PlayedGame, opponent: string, ply: number, fen: string, bestUci: string): MistakeDrill {
  const id = `${game.id}:${ply}`;
  const d: MistakeDrill = { id, fen, side: (ply % 2 === 0 ? 'w' : 'b') as Side, played: game.moves[ply], best: uciToSan(fen, bestUci), opponent, move: Math.floor(ply / 2) + 1, date: game.date };
  state.mistakes[id] = d;
  return d;
}

/** Check every move you made in a game and save the mistakes. */
export async function findMistakes(game: PlayedGame, opponent: string, onProgress?: (done: number, total: number) => void): Promise<MistakeDrill[]> {
  const c = new Chess();
  const fens: string[] = [];
  for (const m of game.moves) {
    fens.push(c.fen());
    c.move(m);
  }
  const mine = game.moves.map((_, k) => k).filter((k) => (k % 2 === 0 ? 'w' : 'b') === game.side);
  const found: MistakeDrill[] = [];
  let n = 0;
  for (const k of mine) {
    const j = await judgeMove(fens[k], game.moves[k], 10);
    if (isMistake(j)) found.push(saveMistake(game, opponent, k, fens[k], j.best));
    onProgress?.(++n, mine.length);
  }
  save();
  return found;
}

const cardOf = (d: MistakeDrill) => `mistake:${d.id}`;

/** Unfixed and due mistakes first. */
export function mistakeItems(size = 8, now = Date.now()): Item[] {
  const drills = Object.values(state.mistakes);
  const rank = (d: MistakeDrill) => {
    const card = state.cards[cardOf(d)];
    return card ? retrievability(card, now) : -1;
  };
  return drills
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, size)
    .map((d) => {
      const exercise: GradeExercise = {
        type: 'grade',
        prompt: `From your game vs ${d.opponent} (move ${d.move}): you played ${d.played}. Find a better move.`,
        fen: d.fen,
        side: d.side,
        good: [],
        explain: `The engine’s choice was **${d.best}**. Before moving, run the safety check: what does your move leave undefended, and what can they do next?`,
      };
      return { exercise, tags: ['from-games', 'blunder-check'], cardId: cardOf(d), label: `Your game vs ${d.opponent}` };
    });
}

export const mistakeCount = () => Object.keys(state.mistakes).length;
