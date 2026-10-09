import { describe, expect, it } from 'vitest';
import { LESSONS, lessonRef } from '../src/data';
import { isUnlocked, nextLesson } from '../src/engine/coach';
import { state } from '../src/engine/store';

describe('progress after new units are added', () => {
  it('keeps earlier progress and does not re-lock reached lessons', () => {
    // Saved progress from before Board Basics existed: the first three principles lessons done.
    for (const id of ['principles-center', 'principles-develop', 'principles-king']) {
      state.lessons[id] = { completedAt: 1, mistakes: 0, runs: 1 };
    }
    // The new first unit is suggested next...
    expect(nextLesson()?.lesson.id).toBe('basics-grid');
    // ...but everything already reached stays open, including the next unreached principles lesson.
    for (const id of ['principles-center', 'principles-develop', 'principles-king', 'principles-tempo']) {
      expect(isUnlocked(lessonRef(id)!), id).toBe(true);
    }
    // Lessons further ahead are still locked.
    const later = LESSONS.find((l) => l.lesson.id === 'survive-f7')!;
    expect(isUnlocked(later)).toBe(false);
    // Basics lessons are open (they come before the frontier).
    expect(isUnlocked(lessonRef('basics-speed')!)).toBe(true);
    state.lessons = {};
  });
});
