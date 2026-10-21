import type { Item } from '../engine/coach';
import { buildPositionalDrill } from '../engine/coach';
import { adaptPool, conversionPositions, loadedSets, mixedPool, pickRun, type PuzzleSet } from '../engine/puzzles';
import { state } from '../engine/store';
import type { EndgameExercise } from '../types';
import { startSession } from './app';
import { recommendedLevel } from './play';
import { runPuzzleSet } from './puzzleRun';
import { LEVELS } from '../engine/bot';

export const MIXED_ID = 'mixed';
export const MIXED_SIZE = 20;

/** Shown before mixed runs: effortful practice reads as poor learning unless someone says why (Bjork; Kirk-Johnson et al.). */
const WHY_HARDER =
  'No labels: you have to work out which pattern it is, like in a game. It feels harder than a themed set, and that’s the skill being trained. This score shows what you can spot in a game.';

const mastered = (id: string) => !!state.sets[id]?.mastered;

export function mixedAvailable(): number {
  return mixedPool(mastered).length;
}

/** Mixed, unlabelled puzzles from every theme you've passed: misses first, then unseen. */
export function startMixed(size = MIXED_SIZE): boolean {
  const pool = mixedPool(mastered);
  if (pool.length < 10) return false;
  const recent = state.progress.filter((p) => p.kind === 'mixed').slice(-3);
  const total = recent.reduce((a, p) => a + p.total, 0);
  const acc = total ? recent.reduce((a, p) => a + p.correct, 0) / total : undefined;
  const set: PuzzleSet = { id: MIXED_ID, title: 'Mixed puzzles', about: 'Every pattern you’ve learned, unlabelled', puzzles: pool };
  runPuzzleSet({ set, mode: 'test', only: pickRun(adaptPool(pool, acc), state.puzzles, { size }), intro: WHY_HARDER });
  return true;
}

/** Conversion play-outs: you've just won material; stay winning for 10 moves against a human-like bot. */
export function conversionItems(n = 3): Item[] {
  const sets = [...(loadedSets()?.values() ?? [])];
  const positions = conversionPositions(mixedPool(mastered, sets));
  const rec = recommendedLevel();
  const opponent = Math.min(LEVELS[LEVELS.length - 1].id, rec.id + 2);
  const picked: typeof positions = [];
  const pool = positions.slice();
  while (picked.length < n && pool.length) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return picked.map((p) => {
    const exercise: EndgameExercise = {
      type: 'endgame',
      prompt: 'You’ve just won material. Convert it: stay clearly winning for 10 moves, or mate.',
      fens: [p.fen],
      side: p.side,
      goal: 'keep',
      limit: 10,
      keep: 300,
      opponent,
      explain:
        'Converting: trade pieces (not pawns) when you’re ahead, keep your pieces protected, and before each move ask “how could I throw this away?” Complications help the side that’s losing.',
    };
    return { exercise, tags: ['convert'] };
  });
}

export function startConvert(n = 3): boolean {
  const items = conversionItems(n);
  if (!items.length) return false;
  startSession('Convert the win', items, 'practice', undefined, 'convert');
  return true;
}

export function startPositional(): boolean {
  const items = buildPositionalDrill();
  if (!items.length) return false;
  startSession('Positional practice', items, 'practice', undefined, 'positional');
  return true;
}
