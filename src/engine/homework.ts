import { LESSONS, LEVELS, lessonRef } from '../data';
import { buildPositionalDrill, dueCards, gameDrillsDue } from './coach';
import { currentStep, levelUnlocked, setAvailable, setsLoaded } from './levels';
import { mixedPool, setTitle } from './puzzles';
import { save, state, today, type PlayedGame } from './store';

/**
 * The coach's homework, modelled on how strong players train (Botvinnik school, Heisman, Steps):
 * every day a fixed ~30-minute plan (review what's fading, the current lesson or set, a timed
 * re-run of a mastered set for speed, an endgame drill, mixed puzzles), and once a week a slow game
 * that you annotate yourself before the engine checks it.
 *
 * Task keys say what to do and double as completion markers:
 *   review · sprint · lesson:<id> · set:<id> (practice/test) · speed:<setId> · endgame:<lessonId> · mix:<setId> · daily
 */
export interface Task {
  key: string;
  title: string;
  detail: string;
  minutes: number;
  done: boolean;
}

/** The marker that finishing a task records (several kinds are finished by running a puzzle set). */
export function doneKey(key: string): string {
  if (key.startsWith('speed:') || key.startsWith('mix:')) return `set:${key.split(':')[1]}`;
  if (key === 'daily') return 'set:daily';
  if (key === 'mixed') return 'set:mixed';
  return key;
}

export const ENDGAME_LESSONS = LESSONS.filter((l) => l.lesson.exercises.some((e) => e.type === 'endgame'));

const dayNumber = (now: number) => Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / 86_400_000);

/** Choose today's tasks. Pure apart from reading state, so it's easy to test. */
export function buildPlan(now = Date.now()): string[] {
  // About 30 minutes, shaped as the research suggests: an easy warm-up, the effortful core (curriculum,
  // mixed puzzles, positional practice), and a play-out to finish (Heisman's splits; flow/competence research).
  const keys: string[] = [];
  const learnedCards = Object.keys(state.cards).length > 0;
  if (learnedCards || Object.keys(state.drills).length) keys.push('review');

  const mastered = (id: string) => !!state.sets[id]?.mastered;
  const anyPassed = Object.entries(state.sets).some(([id, r]) => r.mastered && setAvailable(id));

  // Warm-up: board fluency until it's automatic, then a few easy mixed puzzles.
  if (!state.lessons['basics-reading'] || Math.max(state.sprintBest.w, state.sprintBest.b) < 15) keys.push('sprint');
  else if (setAvailable('daily') && anyPassed) keys.push('daily');

  // The main course: whatever the curriculum needs next.
  const step = currentStep();
  if (step && 'test' in step) keys.push(`set:${LEVELS[step.test].test!}`);
  else if (step?.needs === 'practice') keys.push(`set:${step.ref.lesson.practice!}`);
  else if (step) keys.push(`lesson:${step.ref.lesson.id}`);

  // Mixed, unlabelled tactics: the test of recognition (interleaving research).
  if (mixedPool(mastered).length >= 10) keys.push('mixed');
  else {
    const mixLevel = LEVELS.findIndex((l, i) => l.mix && setAvailable(l.mix) && levelUnlocked(i + 1) && !state.sets[LEVELS[i + 1]?.test ?? '']?.mastered);
    if (mixLevel >= 0) keys.push(`mix:${LEVELS[mixLevel].mix}`);
  }

  // Positional practice once you've had a Piece Placement lesson.
  if (buildPositionalDrill(1, now).length) keys.push('positional');

  // Finish with play: conversion of a won position, alternating with an endgame drill you've learned.
  const endgames = ENDGAME_LESSONS.filter((l) => state.lessons[l.lesson.id]);
  const canConvert = mixedPool(mastered).length >= 10;
  if (canConvert && (dayNumber(now) % 2 === 0 || !endgames.length)) keys.push('convert');
  else if (endgames.length) keys.push(`endgame:${endgames[dayNumber(now) % endgames.length].lesson.id}`);

  return keys;
}

/** Today's plan: built once per day so it doesn't shift as you complete things. */
export function todaysPlan(now = Date.now()): Task[] {
  const day = today(now);
  const hw = state.homework;
  if (hw.day !== day || !hw.plan.length) {
    const plan = buildPlan(now);
    // Until the puzzle sets load, show a provisional plan without fixing it for the day.
    if (!setsLoaded()) return plan.map((key) => describe(key));
    state.homework = { day, plan, done: hw.day === day ? hw.done : [] };
    save();
  }
  return state.homework.plan.map((key) => describe(key));
}

export const DAILY_SIZE = 10;
/** Puzzles per homework run of a mixed review set (misses first). */
export const MIX_SIZE = 20;

export function describe(key: string): Task {
  const [kind, id] = key.split(':');
  const done = state.homework.done.includes(doneKey(key));
  const t = (title: string, detail: string, minutes: number): Task => ({ key, title, detail, minutes, done });
  switch (kind) {
    case 'review': {
      const due = dueCards().length + gameDrillsDue().length;
      return t('Review', due ? `${due} card${due > 1 ? 's' : ''} fading: refresh them before they’re gone` : 'Keep what you’ve learned sharp', 5);
    }
    case 'sprint':
      return t('Coordinate sprint', 'Name squares on sight: 30 seconds, beat your best', 2);
    case 'lesson': {
      const ref = lessonRef(id);
      return t(`Lesson: ${ref?.lesson.title ?? id}`, ref?.lesson.goal ?? '', 8);
    }
    case 'set': {
      const test = id.includes('test');
      const owner = LESSONS.find((l) => l.lesson.practice === id);
      return t(
        test ? `${setTitle(id)}` : `Practice set: ${owner?.lesson.title ?? setTitle(id)}`,
        test ? '30 mixed puzzles, no hints. 80% unlocks the next level.' : '80% to pass. Retry the misses until it sticks.',
        test ? 12 : 10,
      );
    }
    case 'speed': {
      const rec = state.sets[id];
      return t(`Speed run: ${setTitle(id)}`, `Same puzzles, faster. Target 85% at ≤15 s each${rec?.fluentRuns ? ` (fluent ×${rec.fluentRuns} so far)` : ''}.`, 6);
    }
    case 'endgame': {
      const ref = lessonRef(id);
      return t(`Endgame drill: ${ref?.lesson.title ?? id}`, 'Play it out against the engine until it’s automatic', 4);
    }
    case 'mix':
      return t(`Mixed review: ${setTitle(id)}`, `${MIX_SIZE} puzzles with no labels, like a real game: spot which pattern it is`, 6);
    case 'daily':
      return t('Warm-up puzzles', `${DAILY_SIZE} easy mixed puzzles to get going, new every day`, 5);
    case 'mixed':
      return t('Mixed puzzles', '20 unlabelled puzzles from every theme you’ve passed, misses first', 6);
    case 'positional':
      return t('Positional practice', 'Worst pieces, open files, outposts and weak pawns, mixed', 5);
    case 'convert':
      return t('Convert the win', 'You’ve just won material: stay winning for 10 moves against a human-like opponent', 5);
  }
  return t(key, '', 5);
}

/** The day's batch from the daily set: deterministic per day, cycling through the whole set. */
export function dailyBatch<T>(puzzles: T[], now = Date.now()): T[] {
  if (!puzzles.length) return [];
  const start = (dayNumber(now) * DAILY_SIZE) % puzzles.length;
  return Array.from({ length: Math.min(DAILY_SIZE, puzzles.length) }, (_, i) => puzzles[(start + i) % puzzles.length]);
}

// ───────────────────────── Weekly: slow game + self-annotation ─────────────────────────

/** Monday 00:00 (local) of the week containing `now`. */
export function weekStart(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** A game long enough to be worth annotating: not a boss battle, at least 15 moves each. */
export const annotatable = (g: PlayedGame) => !g.opening?.startsWith('Boss') && g.moves.length >= 30;

export interface Weekly {
  /** This week's game to annotate (the latest annotatable one), if any. */
  game?: PlayedGame;
  done: boolean;
}

export function weekly(now = Date.now()): Weekly {
  const from = weekStart(now);
  const games = state.games.filter((g) => g.date >= from && annotatable(g));
  const annotated = games.find((g) => g.annotation);
  return annotated ? { game: annotated, done: true } : { game: games.at(-1), done: false };
}
