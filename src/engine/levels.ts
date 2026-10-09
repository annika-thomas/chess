import { LESSONS, LEVELS, type LessonRef } from '../data';
import { state } from './store';

/**
 * Mastery gates (Steps Method / mastery learning): a lesson is complete when it's done AND its practice
 * set is passed at 80%. Lessons open strictly in order within a level; a level opens when the previous
 * level's mixed test is passed. Anything you already started stays open, so progress is never taken away.
 */

/** Sets present in the loaded puzzle file. Until it loads (or if a set is missing), its gate is skipped. */
let available = new Set<string>();
export function setAvailableSets(ids: Iterable<string>): void {
  available = new Set(ids);
}
const gated = (setId: string | undefined) => !!setId && available.has(setId);

export const practiceMastered = (setId: string | undefined) => !gated(setId) || !!state.sets[setId!]?.mastered;

export function lessonComplete(ref: LessonRef): boolean {
  return !!state.lessons[ref.lesson.id] && practiceMastered(ref.lesson.practice);
}

export function levelOf(ref: LessonRef): number {
  return LEVELS.findIndex((l) => l.units.includes(ref.unit.id));
}

export function levelUnlocked(index: number): boolean {
  if (index <= 0) return true;
  const prev = LEVELS[index - 1];
  return !gated(prev.test) || !!state.sets[prev.test!]?.mastered;
}

export function levelLessons(index: number): LessonRef[] {
  return LESSONS.filter((l) => LEVELS[index].units.includes(l.unit.id));
}

/** Ready for the level test: every lesson in the level is complete. */
export function levelReadyForTest(index: number): boolean {
  return levelLessons(index).every(lessonComplete);
}

export function lessonUnlocked(ref: LessonRef): boolean {
  if (state.lessons[ref.lesson.id]) return true;
  const lvl = levelOf(ref);
  if (lvl < 0) return true;
  if (!levelUnlocked(lvl)) return false;
  // Strict order within the level: every earlier lesson must be complete (done + set passed).
  return levelLessons(lvl)
    .filter((l) => l.order < ref.order)
    .every(lessonComplete);
}

/** The first lesson that still needs work (not done, or its practice set not passed yet). */
export function currentStep(): { ref: LessonRef; needs: 'lesson' | 'practice' } | { test: number } | undefined {
  for (let lvl = 0; lvl < LEVELS.length; lvl++) {
    if (!levelUnlocked(lvl)) return undefined;
    for (const ref of levelLessons(lvl)) {
      if (!state.lessons[ref.lesson.id]) return { ref, needs: 'lesson' };
      if (!practiceMastered(ref.lesson.practice)) return { ref, needs: 'practice' };
    }
    const test = LEVELS[lvl].test;
    if (gated(test) && !state.sets[test!]?.mastered) return { test: lvl };
  }
  return undefined;
}

/** Whether a puzzle set can be opened yet. */
export function setUnlocked(setId: string): boolean {
  if (setId === 'daily') return true;
  const owner = LESSONS.find((l) => l.lesson.practice === setId);
  if (owner) return lessonUnlocked(owner);
  const lvl = LEVELS.findIndex((l) => l.test === setId);
  if (lvl >= 0) return levelUnlocked(lvl) && levelReadyForTest(lvl);
  const mix = LEVELS.findIndex((l) => l.mix === setId);
  if (mix >= 0) return levelUnlocked(mix + 1);
  return true;
}
