import { describe, expect, it } from 'vitest';
import { MASTER_GAMES } from '../src/data/masters';
import { parseLine, playMoves, sideToMove, tryMove } from '../src/engine/notation';
import { Chess } from 'chess.js';

describe('master games', () => {
  for (const g of MASTER_GAMES) {
    it(`${g.id} is legal${g.mate ? ' and ends in mate' : ''}`, () => {
      const { moves } = parseLine(g.line);
      const chess = playMoves(moves);
      if (g.mate) expect(chess.isCheckmate()).toBe(true);
      // The guessing side plays the last move (the winner finishes the game).
      expect(sideToMove(moves.length - 1)).toBe(g.side);
      for (const [ply, alts] of Object.entries(g.alts ?? {})) {
        const before = playMoves(moves, Number(ply));
        expect(sideToMove(Number(ply))).toBe(g.side);
        for (const alt of alts) expect(tryMove(new Chess(before.fen()), alt), alt).not.toBeNull();
      }
    });
  }
});

describe('master game chunks', () => {
  it('cover every move once, starting with the opening', async () => {
    const { segmentsOf } = await import('../src/ui/guess');
    for (const g of MASTER_GAMES) {
      const n = parseLine(g.line).moves.length;
      const segs = segmentsOf(g);
      expect(segs[0].from, g.id).toBe(0);
      expect(segs[segs.length - 1].to, g.id).toBe(n);
      for (let i = 1; i < segs.length; i++) expect(segs[i].from).toBe(segs[i - 1].to);
      // Every chunk gives the guessing side at least two moves.
      for (const s of segs) expect([...Array(s.to - s.from).keys()].filter((k) => sideToMove(s.from + k) === g.side).length, `${g.id}@${s.from}`).toBeGreaterThanOrEqual(2);
    }
  });
});
