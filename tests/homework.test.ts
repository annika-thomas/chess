import { beforeEach, describe, expect, it } from 'vitest';
import { buildPlan, dailyBatch, describe as describeTask, doneKey, ENDGAME_LESSONS, todaysPlan, weekStart, weekly } from '../src/engine/homework';
import { setAvailableSets } from '../src/engine/levels';
import { markHomework, state, type PlayedGame } from '../src/engine/store';
import { isMistake } from '../src/engine/bot';

const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { completedAt: 1, mistakes: 0, runs: 1 }]));
const BASICS = ['basics-grid', 'basics-speed', 'basics-pieces', 'basics-symbols', 'basics-reading'];
const NOW = new Date(2026, 9, 7, 12).getTime(); // a Wednesday

beforeEach(() => {
  state.lessons = {};
  state.cards = {};
  state.drills = {};
  state.sets = {};
  state.games = [];
  state.sprintBest = { w: 0, b: 0 };
  state.homework = { day: '', plan: [], done: [] };
  setAvailableSets([]);
});

describe('daily homework plan', () => {
  it('starts a brand-new learner on board fluency and the first lesson', () => {
    expect(buildPlan(NOW)).toEqual(['sprint', 'lesson:basics-grid']);
  });

  it('assigns the practice set before the next lesson, plus review, a speed run and an endgame drill', () => {
    setAvailableSets(['mate1', 'hanging']);
    state.lessons = done([...BASICS, 'tactics-values', 'safety-check', 'survive-blunder', 'check-escape', 'mate-one', 'mate-queen']);
    state.sprintBest = { w: 20, b: 12 };
    state.cards = { 'x#1': { id: 'x#1' } as never };
    state.sets = { hanging: { attempts: 1, bestAccuracy: 0.9, mastered: true, fluentRuns: 0, lastAt: 1, lastAccuracy: 0.9 } };
    const plan = buildPlan(NOW);
    expect(plan[0]).toBe('review');
    expect(plan).toContain('set:mate1'); // mate-one's practice set is the current step
    expect(plan).toContain('speed:hanging');
    expect(plan).toContain('endgame:mate-queen');
    expect(plan).not.toContain('sprint');
  });

  it('is fixed for the day and tracks what is done', () => {
    const first = todaysPlan(NOW).map((t) => t.key);
    state.lessons = done(BASICS); // progress during the day doesn't reshuffle the list
    expect(todaysPlan(NOW).map((t) => t.key)).toEqual(first);
    markHomework('lesson:basics-grid', NOW);
    expect(todaysPlan(NOW).find((t) => t.key === 'lesson:basics-grid')?.done).toBe(true);
    // A new day: a new plan, nothing done yet.
    const tomorrow = NOW + 86_400_000;
    expect(todaysPlan(tomorrow).every((t) => !t.done)).toBe(true);
  });

  it('maps tasks finished by a puzzle run to that set', () => {
    expect(doneKey('speed:pin')).toBe('set:pin');
    expect(doneKey('mix:mix-1')).toBe('set:mix-1');
    expect(doneKey('daily')).toBe('set:daily');
    expect(doneKey('endgame:mate-rook')).toBe('endgame:mate-rook');
    expect(describeTask('endgame:mate-rook').title).toContain('Mating with the rook'.split(' ')[0]);
  });

  it('keeps a typical day near 30 minutes', () => {
    setAvailableSets(['mate1', 'hanging', 'daily']);
    state.lessons = done([...BASICS, 'tactics-values', 'safety-check', 'survive-blunder', 'check-escape', 'mate-one', 'mate-queen']);
    state.sprintBest = { w: 20, b: 20 };
    state.cards = { 'x#1': { id: 'x#1' } as never };
    state.sets = { hanging: { attempts: 1, bestAccuracy: 0.9, mastered: true, fluentRuns: 0, lastAt: 1, lastAccuracy: 0.9 } };
    const mins = buildPlan(NOW).map(describeTask).reduce((a, t) => a + t.minutes, 0);
    expect(mins).toBeGreaterThanOrEqual(20);
    expect(mins).toBeLessThanOrEqual(40);
  });

  it('has endgame drills to rotate through', () => {
    expect(ENDGAME_LESSONS.map((l) => l.lesson.id)).toEqual(expect.arrayContaining(['mate-queen', 'mate-rook', 'opposition']));
  });

  it('gives a different daily batch each day, cycling through the set', () => {
    const pool = Array.from({ length: 300 }, (_, i) => i);
    const a = dailyBatch(pool, NOW);
    const b = dailyBatch(pool, NOW + 86_400_000);
    expect(a).toHaveLength(10);
    expect(a).not.toEqual(b);
    expect(dailyBatch(pool, NOW)).toEqual(a);
  });
});

describe('weekly slow game', () => {
  const game = (date: number, moves = 40, extra: Partial<PlayedGame> = {}): PlayedGame => ({
    id: String(date), date, side: 'w', level: 3, result: 'loss', reason: 'checkmate', moves: Array(moves).fill('e4'), rated: true, ...extra,
  });

  it('weeks start on Monday', () => {
    const d = new Date(weekStart(NOW));
    expect(d.getDay()).toBe(1);
    expect(NOW - d.getTime()).toBeLessThan(7 * 86_400_000);
  });

  it('needs a long enough game this week, then its annotation', () => {
    expect(weekly(NOW)).toEqual({ game: undefined, done: false });
    state.games = [game(NOW - 10 * 86_400_000), game(NOW - 3600_000, 12), game(NOW - 7200_000, 30, { opening: 'Boss: X' })];
    expect(weekly(NOW).game).toBeUndefined(); // old, short, or a boss battle
    state.games.push(game(NOW - 600_000));
    expect(weekly(NOW)).toMatchObject({ done: false, game: { id: String(NOW - 600_000) } });
    state.games.at(-1)!.annotation = { marks: [], flagged: [], causes: [], at: NOW };
    expect(weekly(NOW).done).toBe(true);
  });
});

describe('mistake flagging', () => {
  it('ignores losses in positions that were already decided', () => {
    expect(isMistake({ loss: 300, best: 'e2e4', before: 50, after: -250 })).toBe(true);
    expect(isMistake({ loss: 80, best: 'e2e4', before: 50, after: -30 })).toBe(false);
    expect(isMistake({ loss: 600, best: 'e2e4', before: -900, after: -1500 })).toBe(false);
    expect(isMistake({ loss: 600, best: 'e2e4', before: 1500, after: 900 })).toBe(false);
  });
});

describe('follow-up puzzle sets', () => {
  it('open only after the first set of the theme is passed', async () => {
    const { setUnlocked } = await import('../src/engine/levels');
    setAvailableSets(['pin', 'pin-2'], [['pin-2', 'pin']]);
    expect(setUnlocked('pin-2')).toBe(false);
    state.sets.pin = { attempts: 1, bestAccuracy: 0.8, mastered: true, fluentRuns: 0, lastAt: 1, lastAccuracy: 0.8 };
    expect(setUnlocked('pin-2')).toBe(true);
  });
});
