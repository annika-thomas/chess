import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/data/bosses';
import { UNITS } from '../src/data';
import { parseLine, playMoves } from '../src/engine/notation';
import { pointsForLoss } from '../src/ui/guess';

describe('boss battles', () => {
  for (const b of BOSSES) {
    it(`${b.unitId} starts from a legal, unfinished position`, () => {
      expect(UNITS.some((u) => u.id === b.unitId)).toBe(true);
      const chess = playMoves(parseLine(b.start).moves);
      expect(chess.isGameOver()).toBe(false);
      expect(b.moves).toBeGreaterThan(0);
    });
  }
});

describe('guess the move scoring', () => {
  it('rewards near-best alternatives and not mistakes', () => {
    expect(pointsForLoss(0).points).toBe(2);
    expect(pointsForLoss(60).points).toBe(1);
    expect(pointsForLoss(150).points).toBe(0);
    expect(pointsForLoss(900).verdict).toMatch(/mistake/i);
  });
});
