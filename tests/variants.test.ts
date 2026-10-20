import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data';
import { transformExercise, transformFen, transformText, type Transform } from '../src/engine/variants';

const T: Transform[] = [
  { files: true, colors: false },
  { files: false, colors: true },
  { files: true, colors: true },
];

describe('review variants', () => {
  it('transforms text consistently', () => {
    const t = { files: true, colors: true };
    expect(transformText('White plays Qb8+ and Qxe8#, taking on the c-file. exd5!', t)).toBe('Black plays Qg1+ and Qxd1#, taking on the f-file. dxe4!');
    expect(transformText('the light-squared bishop on the kingside', { files: true, colors: false })).toBe('the dark-squared bishop on the queenside');
    expect(transformText('the light-squared bishop', t)).toBe('the light-squared bishop');
    expect(transformFen('7k/2B3pp/2b5/q7/8/1Q6/4P1PP/7K w - - 0 1', { files: false, colors: true })).toBe('7k/4p1pp/1q6/8/Q7/2B5/2b3PP/7K b - - 0 1');
  });

  let made = 0;
  for (const c of CARDS) {
    for (const t of T) {
      const v = transformExercise(c.exercise, t);
      if (!v) continue;
      made++;
      it(`${c.id} ${t.files ? 'mirrored' : ''}${t.colors ? ' colour-swapped' : ''} stays correct`, () => {
        switch (v.type) {
          case 'find': {
            const chess = new Chess(v.fen!);
            expect(chess.turn()).toBe(v.side);
            for (const san of v.solution) expect(() => chess.move(san), san).not.toThrow();
            if (v.solution.at(-1)!.endsWith('#')) expect(chess.isCheckmate()).toBe(true);
            // The explanation names the transformed moves.
            for (const san of v.solution) if (c.exercise.type === 'find' && c.exercise.explain.includes(c.exercise.solution[v.solution.indexOf(san)])) expect(v.explain).toContain(san.replace(/[+#]$/, ''));
            break;
          }
          case 'tap':
            new Chess(v.fen);
            for (const s of v.answers) expect(s).toMatch(/^[a-h][1-8]$/);
            break;
          case 'grade': {
            for (const m of v.good) expect(() => new Chess(v.fen).move(m), m).not.toThrow();
            expect(new Chess(v.fen).turn()).toBe(v.side);
            break;
          }
          case 'choice':
            new Chess(v.fen!);
            expect(v.options.filter((o) => o.correct).length).toBe(1);
            break;
          case 'endgame':
            for (const f of v.fens) expect(new Chess(f).turn()).toBe(v.side);
            break;
        }
      });
    }
  }
  it('makes variants for a good share of positional cards', () => {
    expect(made).toBeGreaterThan(40);
  });
});
