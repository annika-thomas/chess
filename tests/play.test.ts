import { describe, expect, it } from 'vitest';
import { LEVELS, pickMove } from '../src/engine/bot';
import { expected, rate, START } from '../src/engine/rating';

describe('rating', () => {
  it('moves toward the opponent strength you can beat', () => {
    let r = { ...START };
    for (let i = 0; i < 5; i++) r = rate(r, 1200, 140, 1, 1000 + i);
    expect(r.r).toBeGreaterThan(1000);
    expect(r.rd).toBeLessThan(START.rd);
    expect(r.games).toBe(5);
  });

  it('drops after losses and barely moves on expected results', () => {
    const lost = rate({ ...START }, 400, 200, 0, 1);
    expect(lost.r).toBeLessThan(START.r);
    const settled = { r: 1500, rd: 50, games: 50, last: 1, history: [] };
    expect(Math.abs(rate(settled, 600, 150, 1, 2).r - 1500)).toBeLessThan(3);
  });

  it('expected score is symmetric', () => {
    expect(expected(1000, 1000, 50)).toBeCloseTo(0.5);
    expect(expected(1400, 1000, 50)).toBeGreaterThan(0.85);
  });
});

describe('bot levels', () => {
  it('are ordered by strength', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].elo).toBeGreaterThan(LEVELS[i - 1].elo);
  });

  it('picks the best move with no allowed loss', () => {
    const lines = [
      { move: 'e2e4', score: 30 },
      { move: 'a2a3', score: -50 },
    ];
    expect(pickMove(lines, 0, () => 0.9)).toBe('e2e4');
  });

  it('never picks a move worse than maxLoss', () => {
    const lines = [
      { move: 'good', score: 100 },
      { move: 'ok', score: 0 },
      { move: 'awful', score: -900 },
    ];
    for (let i = 0; i < 50; i++) expect(pickMove(lines, 200, () => i / 50)).not.toBe('awful');
  });
});
