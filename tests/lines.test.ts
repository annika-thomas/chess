import { describe, expect, it } from 'vitest';
import * as L from '../src/data/lines';
import { parseLine, playMoves } from '../src/engine/notation';

describe('repertoire lines', () => {
  for (const [name, text] of Object.entries(L)) {
    it(`${name} is legal`, () => {
      const { moves, notes } = parseLine(text);
      expect(moves.length).toBeGreaterThan(3);
      expect(notes.length).toBe(moves.length);
      expect(() => playMoves(moves)).not.toThrow();
    });
  }
});
