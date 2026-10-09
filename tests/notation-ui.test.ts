import { describe, expect, it } from 'vitest';
import { fig, setFigurineSource } from '../src/ui/dom';

const icon = (g: string) => `<span class="fig">${g}︎</span>`;

describe('figurine notation', () => {
  it('replaces piece letters in moves only', () => {
    setFigurineSource(() => true);
    expect(fig('3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5')).toBe(`3.${icon('♝')}c4 ${icon('♞')}f6 4.${icon('♞')}g5 d5 5.exd5 ${icon('♞')}xd5`);
    expect(fig('O-O and Qxf7# and Nbd2 and R1e1')).toBe(`O-O and ${icon('♛')}xf7# and ${icon('♞')}bd2 and ${icon('♜')}1e1`);
    expect(fig('Black plays Bc5. Knights on b and g. Queen’s Gambit. KQRBN')).toBe(`Black plays ${icon('♝')}c5. Knights on b and g. Queen’s Gambit. KQRBN`);
  });

  it('can be turned off', () => {
    setFigurineSource(() => false);
    expect(fig('Nf3')).toBe('Nf3');
    setFigurineSource(() => true);
  });
});
