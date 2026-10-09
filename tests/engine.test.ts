import { describe, expect, it } from 'vitest';
import { upTo } from '../src/data/build';
import { ITALIAN_MAIN } from '../src/data/lines';
import { analyzeGames, buildBook, gradeGame, type Game } from '../src/engine/importer';
import { parseLine, formatMoves } from '../src/engine/notation';
import { newCard, retrievability, review } from '../src/engine/srs';

const DAY = 86_400_000;

describe('srs', () => {
  it('grows intervals on success and resets on failure', () => {
    const t0 = new Date('2026-01-01T12:00:00').getTime();
    let c = newCard('x', 3, t0);
    expect(c.due).toBeGreaterThan(t0 + DAY / 2);
    const firstGap = c.due - t0;
    c = review(c, 3, c.due);
    const secondGap = c.due - c.last;
    expect(secondGap).toBeGreaterThan(firstGap);
    const failed = review(c, 1, c.due);
    expect(failed.due - failed.last).toBeLessThan(DAY);
    expect(failed.stability).toBeLessThan(c.stability);
    expect(failed.lapses).toBe(1);
  });

  it('forgetting curve is 90% at one stability-length', () => {
    const c = newCard('y', 3, 0);
    expect(retrievability(c, c.stability * DAY)).toBeCloseTo(0.9, 2);
  });
});

describe('notation', () => {
  it('slices annotated lines with upTo', () => {
    const sliced = parseLine(upTo(ITALIAN_MAIN, 6));
    expect(sliced.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
    expect(sliced.notes[5]).toMatch(/Giuoco Piano/);
  });

  it('formats move numbers', () => {
    expect(formatMoves(['e4', 'e5', 'Nf3'])).toBe('1.e4 e5 2.Nf3');
    expect(formatMoves(['e4', 'e5', 'Nf3'], 1)).toBe('1...e5 2.Nf3');
  });
});

const game = (moves: string, mySide: 'w' | 'b' = 'w'): Game => ({
  url: 'https://example.com/g',
  mySide,
  opponent: 'opp',
  result: 'win',
  moves: moves.split(' '),
  opening: 'Italian Game: Giuoco Piano',
  date: '2026-01-01',
});

describe('game grading', () => {
  const white = buildBook('w');
  const black = buildBook('b');

  it('detects when the learner leaves the repertoire', () => {
    const v = gradeGame(game('e4 e5 Nf3 Nc6 Bc4 Bc5 d3'), white);
    expect(v.kind).toBe('deviated');
    if (v.kind === 'deviated') {
      expect(v.played).toBe('d3');
      expect(v.expected).toContain('c3');
    }
  });

  it('notes when the opponent leaves book first', () => {
    expect(gradeGame(game('e4 e5 Nf3 Nc6 Bc4 h6 c3'), white).kind).toBe('opp-left');
  });

  it('handles transpositions by position, not move order', () => {
    // 1...Nc6 2.Nf3 e5 reaches the Italian position after 2...Nc6 by transposition.
    expect(gradeGame(game('e4 Nc6 Nf3 e5 Bc4 Bc5 c3'), white).kind).not.toBe('deviated');
  });

  it('treats a different first move as outside the repertoire', () => {
    expect(gradeGame(game('d4 d5 c4'), white).kind).toBe('outside');
  });

  it('grades Black games', () => {
    const v = gradeGame(game('d4 d5 c4 e6 Nc3 Nf6 Bg5 h6', 'b'), black);
    expect(v.kind).toBe('deviated');
  });

  it('builds drills and opening stats', () => {
    const { report, drills } = analyzeGames(
      [game('e4 e5 Nf3 Nc6 Bc4 Bc5 d3'), game('e4 e5 Nf3 Nc6 Bc4 Bc5 d3'), game('e4 c5 c3 d5 exd5 Qxd5 d4')],
      'lichess',
      'me',
    );
    expect(report.deviated).toBe(2);
    expect(drills).toHaveLength(1); // same mistake twice → one drill
    expect(drills[0].solution[0]).toBe('c3');
    expect(report.openings[0]).toMatchObject({ name: 'Italian Game', games: 3 });
  });
});
