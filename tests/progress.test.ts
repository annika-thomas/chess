import { describe, expect, it } from 'vitest';
import { lessonRef } from '../src/data';
import { isUnlocked, nextLesson } from '../src/engine/coach';
import { state } from '../src/engine/store';

describe('progress after the course is restructured', () => {
  it('keeps every lesson you have done open, and gates the rest strictly in order', () => {
    // Saved progress from earlier versions: Board Basics and three principles lessons done.
    const done = ['basics-grid', 'basics-speed', 'basics-pieces', 'basics-symbols', 'basics-reading', 'principles-center', 'principles-develop', 'principles-king'];
    for (const id of done) state.lessons[id] = { completedAt: 1, mistakes: 0, runs: 1 };
    // Everything already done stays open.
    for (const id of done) expect(isUnlocked(lessonRef(id)!), id).toBe(true);
    // The next new lesson in Level 1 is open and suggested...
    expect(nextLesson()?.lesson.id).toBe('tactics-values');
    expect(isUnlocked(lessonRef('tactics-values')!)).toBe(true);
    // ...and later unfinished lessons wait for it (strict order).
    expect(isUnlocked(lessonRef('principles-tempo')!)).toBe(false);
    expect(isUnlocked(lessonRef('skewer')!)).toBe(false);
    state.lessons = {};
  });
});
