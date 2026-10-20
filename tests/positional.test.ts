import { describe, expect, it } from 'vitest';
import { buildPositionalDrill } from '../src/engine/coach';
import { state } from '../src/engine/store';

describe('positional practice', () => {
  it('mixes formats and never repeats the same pool and format back to back', () => {
    for (const id of ['place-activity', 'place-files', 'place-outposts', 'place-pawns', 'place-bishops', 'place-space']) state.lessons[id] = { completedAt: 1, mistakes: 0, runs: 1 };
    const items = buildPositionalDrill(10);
    expect(items.length).toBe(10);
    const keys = items.map((it) => (it.exercise.type === 'concept' ? `${it.exercise.pool}:${it.exercise.mode}` : it.cardId));
    const modes = new Set(items.map((it) => (it.exercise.type === 'concept' ? it.exercise.mode : it.exercise.type)));
    expect(modes.size).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < keys.length; i++) expect(keys[i]).not.toBe(keys[i - 1]);
    // Most of the session is fresh real positions, not fixed cards.
    expect(items.filter((it) => it.exercise.type === 'concept').length).toBeGreaterThanOrEqual(7);
  });
});
