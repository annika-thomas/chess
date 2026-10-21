import { buildPositionalDrill, buildReview, buildWeakSpotDrill, dueCards, gameDrillsDue, nextLesson, weakSpots } from '../engine/coach';
import { loadedSets, type Puzzle, type PuzzleSet } from '../engine/puzzles';
import { newLessonsToday, NEW_PER_DAY, save, state, today } from '../engine/store';
import { startSession } from './app';
import { mixedAvailable, startConvert, startMixed } from './drills';
import { nextSegment, startGuess } from './guess';
import { startLesson } from './learn';
import { startConfiguredGame } from './play';
import { runPuzzleSet } from './puzzleRun';
import { levelById } from '../engine/bot';
import { mistakeItems } from '../engine/mistakes';

/**
 * "Up next" after homework: one button that picks the best next activity. It scores what you need
 * (due reviews, weak spots, past misses, no game today) and then varies it: never the same kind twice in a row,
 * and something fun after something effortful (competence and enjoyment keep a voluntary habit going).
 */
export interface Activity {
  kind: string;
  title: string;
  why: string;
  /** Effortful practice vs. play; used to alternate. */
  effort: boolean;
  score: number;
  run: () => void;
}

const EFFORT = new Set(['review', 'weak', 'retry', 'mixed', 'positional', 'lesson', 'mistakes']);

function missedPuzzles(): Puzzle[] {
  const byId = new Map<string, Puzzle>();
  for (const s of loadedSets()?.values() ?? []) for (const p of s.puzzles) byId.set(p.id, p);
  return Object.entries(state.puzzles)
    .filter(([, r]) => !r.lastOk)
    .sort(([, a], [, b]) => a.last - b.last)
    .map(([id]) => byId.get(id))
    .filter((p): p is Puzzle => !!p);
}

export function candidates(now = Date.now()): Activity[] {
  const out: Activity[] = [];
  const due = dueCards(now).length + gameDrillsDue(now).length;
  if (due) {
    out.push({ kind: 'review', title: `Review ${due} card${due > 1 ? 's' : ''}`, why: 'They’re fading: refresh them right before you’d forget.', effort: true, score: due >= 8 ? 90 : 40 + due * 3, run: () => startSession('Daily review', buildReview(), 'practice', undefined, 'review') });
  }
  const weak = weakSpots(1)[0];
  if (weak && weak.heat >= 1.5) {
    out.push({ kind: 'weak', title: `Drill: ${weak.label}`, why: `You’ve missed ${Math.round(weak.errorRate * 100)}% of these lately. A short focused drill fixes it faster than meeting them at random.`, effort: true, score: 55 + Math.min(20, weak.heat * 4), run: () => startSession(weak.label, buildWeakSpotDrill(weak.tag), 'practice') });
  }
  const misses = missedPuzzles();
  if (misses.length >= 3) {
    const set: PuzzleSet = { id: 'retry-misses', title: 'Puzzles you missed', about: '', puzzles: misses };
    out.push({ kind: 'retry', title: `Fix ${Math.min(15, misses.length)} puzzles you missed`, why: 'Coming back to a miss after a gap is one of the strongest ways to make a pattern stick.', effort: true, score: 50 + Math.min(20, misses.length), run: () => runPuzzleSet({ set, mode: 'test', only: misses.slice(0, 15) }) });
  }
  const mine = mistakeItems(8, now);
  if (mine.length >= 2) {
    out.push({ kind: 'mistakes', title: `Rewrite ${mine.length} of your own mistakes`, why: 'Positions from your games where you went wrong. The most relevant practice there is.', effort: true, score: 58, run: () => startSession('Your mistakes', mine, 'practice', undefined, 'mistakes') });
  }
  const playedToday = state.games.some((g) => today(g.date) === today(now));
  const lvl = levelById(state.play.level);
  out.push({ kind: 'game', title: `Play a game vs ${lvl.name} (~${lvl.elo})`, why: playedToday ? 'Another game: real games are where everything comes together.' : 'No game yet today. Games are where the patterns have to show up on their own.', effort: false, score: playedToday ? 30 : 70, run: startConfiguredGame });
  if (mixedAvailable() >= 10) {
    out.push({ kind: 'mixed', title: 'Mixed puzzles', why: 'Unlabelled puzzles from everything you’ve learned: the test of whether you can spot them in a game.', effort: true, score: 50, run: () => void startMixed() });
    out.push({ kind: 'convert', title: 'Convert the win', why: 'Turn a won position into a won game against a human-like opponent.', effort: false, score: 45, run: () => void startConvert() });
  }
  if (buildPositionalDrill(1, now).length) {
    out.push({ kind: 'positional', title: 'Positional practice', why: 'Where pieces belong when there’s no tactic: worst pieces, files, outposts.', effort: true, score: 48, run: () => startSession('Positional practice', buildPositionalDrill(), 'practice', undefined, 'positional') });
  }
  const seg = nextSegment();
  if (seg)
    out.push({
      kind: 'guess',
      title: `Guess the Move: ${seg.game.title}, moves ${Math.floor(seg.seg.from / 2) + 1}–${Math.floor((seg.seg.to - 1) / 2) + 1}`,
      why: 'Predict a master’s moves for about 10 moves and see the plan unfold. Model games are where placement ideas come from.',
      effort: false,
      score: 35,
      run: () => startGuess(seg.game, seg.seg),
    });
  const next = nextLesson();
  if (next && newLessonsToday(now) < NEW_PER_DAY) {
    out.push({ kind: 'lesson', title: `Lesson: ${next.lesson.title}`, why: next.lesson.goal, effort: true, score: 40, run: () => startLesson(next) });
  }
  // Variety and balance.
  const last = state.lastActivity;
  const lastEffort = last ? EFFORT.has(last.kind) : false;
  for (const a of out) {
    if (last && a.kind === last.kind && now - last.at < 6 * 3600_000) a.score -= 40;
    if (lastEffort && !a.effort) a.score += 15;
  }
  return out.sort((a, b) => b.score - a.score);
}

export function launch(a: Activity): void {
  state.lastActivity = { kind: a.kind, at: Date.now() };
  save();
  a.run();
}

