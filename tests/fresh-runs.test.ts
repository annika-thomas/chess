import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickRun, themeOf, themePool, type PuzzleRecord, type PuzzleSet } from '../src/engine/puzzles';

const sets = (JSON.parse(readFileSync(new URL('../public/puzzles/sets.json', import.meta.url), 'utf8')) as { sets: PuzzleSet[] }).sets;
const byId = (id: string) => sets.find((s) => s.id === id)!;
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('fresh practice runs', () => {
  it('pools only same-theme puzzles of similar difficulty, never from tests or mixed reviews', () => {
    const set = byId('fork-2');
    const pool = themePool(set, sets);
    expect(pool.length).toBeGreaterThan(set.puzzles.length);
    const reserved = new Set(sets.filter((s) => s.id.includes('test') || s.id.startsWith('mix')).flatMap((s) => s.puzzles.map((p) => p.id)));
    const own = new Set(set.puzzles.map((p) => p.id));
    for (const p of pool) {
      expect(p.themes).toContain('fork');
      if (!own.has(p.id)) expect(reserved.has(p.id), p.id).toBe(false);
    }
  });

  it('every practice set has a theme', () => {
    for (const id of ['hanging', 'mate1', 'backrank', 'fork-1', 'fork-2', 'pin', 'skewer', 'discovered', 'double-check', 'defender', 'mate2', 'f7']) {
      expect(themeOf(byId(id)), id).toBeTruthy();
    }
  });

  it('brings back misses first, then unseen puzzles, and changes between runs', () => {
    const pool = themePool(byId('fork-2'), sets);
    const history: Record<string, PuzzleRecord> = {};
    const first = pickRun(pool, history, { ordered: true, rand });
    expect(first).toHaveLength(25);
    expect(new Set(first.map((p) => p.id)).size).toBe(25);
    // Solve all but three of the first run.
    first.forEach((p, i) => (history[p.id] = { seen: 1, wrong: i < 3 ? 1 : 0, lastOk: i >= 3, last: 1000 + i, secs: 10 }));
    const second = pickRun(pool, history, { ordered: true, rand });
    const ids = new Set(second.map((p) => p.id));
    for (const p of first.slice(0, 3)) expect(ids.has(p.id), 'missed puzzle returns').toBe(true);
    const repeats = second.filter((p) => history[p.id]?.lastOk).length;
    expect(repeats).toBeLessThan(25 - 3); // mostly new puzzles
  });

  it('practice runs go roughly easy to hard', () => {
    const run = pickRun(themePool(byId('mate2'), sets), {}, { ordered: true, rand });
    const firstHalf = run.slice(0, 12).reduce((a, p) => a + p.rating, 0) / 12;
    const secondHalf = run.slice(13).reduce((a, p) => a + p.rating, 0) / 12;
    expect(firstHalf).toBeLessThan(secondHalf);
  });
});

describe('mixed practice and conversion positions', () => {
  it('mixes every passed theme, and only passed themes', async () => {
    const { mixedPool } = await import('../src/engine/puzzles');
    const passed = new Set(['hanging', 'fork-1']);
    const pool = mixedPool((id) => passed.has(id), sets);
    const themes = new Set(pool.flatMap((p) => p.themes));
    expect(themes.has('fork')).toBe(true);
    expect(themes.has('hangingPiece')).toBe(true);
    expect(pool.length).toBeGreaterThan(50); // with matching daily puzzles
    expect(mixedPool(() => false, sets).length).toBeLessThan(pool.length);
  });

  it('finds winning positions to convert, with the opponent to move', async () => {
    const { conversionPositions, mixedPool } = await import('../src/engine/puzzles');
    const { Chess } = await import('chess.js');
    const positions = conversionPositions(mixedPool(() => true, sets));
    expect(positions.length).toBeGreaterThan(50);
    for (const p of positions.slice(0, 40)) {
      const c = new Chess(p.fen);
      expect(c.turn()).not.toBe(p.side);
      expect(c.isGameOver()).toBe(false);
    }
  });
});

describe('mixed practice stays within what you have learned', () => {
  it('keeps longer combinations out until mate in two is passed, and only learned themes from the daily pool', async () => {
    const { mixedPool, themeOf } = await import('../src/engine/puzzles');
    const passed = new Set(['hanging', 'mate1', 'fork-1']);
    const pool = mixedPool((id) => passed.has(id), sets);
    const learned = new Set(['hangingPiece', 'mateIn1', 'fork']);
    for (const p of pool) {
      expect(p.moves.length, p.id).toBeLessThanOrEqual(3);
      expect(p.themes.some((t) => learned.has(t)), `${p.id} ${p.themes.join(',')}`).toBe(true);
    }
    expect(themeOf(sets.find((s) => s.id === 'mate2')!)).toBe('mateIn2');
  });

  it('adapts difficulty to recent accuracy', async () => {
    const { adaptPool, mixedPool } = await import('../src/engine/puzzles');
    const pool = mixedPool(() => true, sets);
    const avg = (ps: { rating: number }[]) => ps.reduce((a, p) => a + p.rating, 0) / ps.length;
    expect(avg(adaptPool(pool, 0.6))).toBeLessThan(avg(pool));
    expect(avg(adaptPool(pool, 0.95))).toBeGreaterThan(avg(pool));
    expect(adaptPool(pool, 0.82)).toBe(pool);
  });
});
