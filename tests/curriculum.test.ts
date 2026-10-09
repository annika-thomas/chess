import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import * as L from '../src/data/lines';
import { CARDS, LESSONS, REPERTOIRE, UNITS } from '../src/data';
import { parseLine, playMoves, sideToMove, tryMove } from '../src/engine/notation';
import type { Exercise } from '../src/types';

function setupBoard(ex: { setup?: string; fen?: string }): Chess {
  if (ex.fen) return new Chess(ex.fen);
  return playMoves(parseLine(ex.setup ?? '').moves);
}

function check(ex: Exercise): void {
  switch (ex.type) {
    case 'info':
      setupBoard(ex);
      break;
    case 'walk':
    case 'recall': {
      const { moves } = parseLine(ex.line);
      playMoves(moves);
      const from = ex.from ?? 0;
      expect(from).toBeLessThan(moves.length);
      // The learner must have at least one move to play after `from`.
      const learnerPlies = moves.map((_, i) => i).filter((i) => i >= from && sideToMove(i) === ex.side);
      expect(learnerPlies.length).toBeGreaterThan(0);
      break;
    }
    case 'find': {
      const chess = setupBoard(ex);
      expect(chess.turn()).toBe(ex.side);
      for (const alt of ex.accept ?? []) {
        expect(tryMove(new Chess(chess.fen()), alt), `accept ${alt}`).not.toBeNull();
      }
      for (const san of ex.solution) {
        expect(tryMove(chess, san), `solution move ${san}`).not.toBeNull();
      }
      const last = ex.solution[ex.solution.length - 1];
      if (last.endsWith('#')) expect(chess.isCheckmate()).toBe(true);
      // Learner moves must be the first and every second move.
      expect(ex.solution.length % 2).toBe(1);
      break;
    }
    case 'choice': {
      if (ex.setup || ex.fen) setupBoard(ex);
      expect(ex.options.filter((o) => o.correct).length).toBe(1);
      break;
    }
  }
}

describe('curriculum', () => {
  it('has unique lesson ids', () => {
    const ids = LESSONS.map((l) => l.lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique unit ids and non-empty lessons', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
    for (const u of UNITS) for (const l of u.lessons) expect(l.exercises.length).toBeGreaterThan(2);
  });

  for (const { unit, lesson } of LESSONS) {
    lesson.exercises.forEach((ex, i) => {
      it(`${unit.id}/${lesson.id}#${i} (${ex.type}) is valid`, () => check(ex));
    });
  }

  it('every lesson has at least one card', () => {
    for (const { lesson } of LESSONS) {
      expect(CARDS.some((c) => c.lesson.id === lesson.id), lesson.id).toBe(true);
    }
  });

  it('lists every line in the repertoire', () => {
    expect(REPERTOIRE.length).toBe(Object.keys(L).length);
  });
});
