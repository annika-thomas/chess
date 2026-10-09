import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/data/glossary';
import { inline, setFigurineSource } from '../src/ui/dom';

describe('glossary links', () => {
  it('links the first mention of a term only', () => {
    const html = inline('A fork wins material. Another fork later.');
    expect(html.match(/class="term"/g)?.length).toBe(1);
    expect(html).toContain('data-term="fork"');
  });

  it('handles several terms and piece icons together', () => {
    setFigurineSource(() => true);
    const html = inline('Nc7+ forks the king, and the pinned knight is hanging in the center.');
    for (const key of ['fork', 'pin', 'hanging', 'center']) expect(html).toContain(`data-term="${key}"`);
    expect(html).toContain('<span class="fig">');
    // No nested or broken markup from one term matching inside another's tag.
    expect(html.match(/<span class="term"/g)?.length).toBe(4);
  });

  it('can be switched off (answer buttons)', () => {
    expect(inline('a fork', false)).not.toContain('term');
  });

  it('has a definition for every term', () => {
    for (const t of GLOSSARY) expect(t.def.length).toBeGreaterThan(20);
    expect(new Set(GLOSSARY.map((t) => t.key)).size).toBe(GLOSSARY.length);
  });
});
