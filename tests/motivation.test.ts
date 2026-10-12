import { beforeEach, describe, expect, it } from 'vitest';
import { addXp, currentStreak, state, today } from '../src/engine/store';
import { progressLines } from '../src/engine/progress';

const DAY = 86_400_000;
const T0 = new Date(2026, 9, 1, 12).getTime();

beforeEach(() => {
  state.streak = { count: 0, lastDay: '', best: 0 };
  state.xpByDay = {};
  state.progress = [];
  state.puzzles = {};
});

describe('forgiving streak', () => {
  it('survives one missed day a week, not two', () => {
    addXp(5, T0);
    addXp(5, T0 + DAY);
    expect(currentStreak(T0 + DAY)).toBe(2);
    // Miss a day: the freeze keeps the streak alive and continues it.
    expect(currentStreak(T0 + 3 * DAY)).toBe(2);
    addXp(5, T0 + 3 * DAY);
    expect(currentStreak(T0 + 3 * DAY)).toBe(3);
    // Miss another day in the same week: no freeze left.
    addXp(5, T0 + 5 * DAY);
    expect(currentStreak(T0 + 5 * DAY)).toBe(1);
  });

  it('two missed days in a row break it', () => {
    addXp(5, T0);
    expect(currentStreak(T0 + 3 * DAY)).toBe(0);
    expect(today(T0)).toBeTruthy();
  });
});

describe('progress feedback', () => {
  it('compares this week’s mixed accuracy with last week’s, and counts fixed misses', () => {
    const now = T0 + 14 * DAY;
    state.progress = [
      { t: now - 10 * DAY, kind: 'mixed', correct: 14, total: 20 },
      { t: now - 2 * DAY, kind: 'mixed', correct: 16, total: 20 },
      { t: now - 1 * DAY, kind: 'convert', correct: 2, total: 3 },
    ];
    state.puzzles = {
      a: { seen: 2, wrong: 1, lastOk: true, last: now, secs: 5 },
      b: { seen: 1, wrong: 1, lastOk: false, last: now, secs: 5 },
    };
    const lines = progressLines(now);
    expect(lines.find((l) => l.label === 'Mixed puzzles')?.value).toBe('70% → 80%');
    expect(lines.find((l) => l.label === 'Misses fixed')?.value).toBe('1 of 2');
    expect(lines.find((l) => l.label === 'Wins converted')?.value).toBe('2 of 3');
  });
});
