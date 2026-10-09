import { readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';

const file = JSON.parse(readFileSync(new URL('../public/puzzles/sets.json', import.meta.url), 'utf8')) as {
  sets: Array<{ id: string; puzzles: Array<{ id: string; fen: string; moves: string[]; themes: string[]; last?: string }> }>;
};

describe('puzzle sets', () => {
  it('has unique puzzle ids across sets', () => {
    const ids = file.sets.flatMap((s) => s.puzzles.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const set of file.sets) {
    it(`${set.id}: every solution is legal from its position`, () => {
      expect(set.puzzles.length).toBeGreaterThan(0);
      for (const p of set.puzzles) {
        const c = new Chess(p.fen);
        for (const uci of p.moves) {
          const mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
          expect(mv, `${p.id} ${uci}`).toBeTruthy();
        }
        // Learner moves first and last: the solution has an odd number of moves.
        expect(p.moves.length % 2, p.id).toBe(1);
        if (p.themes.includes('mateIn1')) expect(c.isCheckmate(), p.id).toBe(true);
      }
    });
  }
});
