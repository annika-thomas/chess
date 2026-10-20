import { CARDS, LESSONS, cardRef, lessonRef, type CardRef, type LessonRef } from '../data';
import type { Exercise } from '../types';
import { Chess } from 'chess.js';
import { mixedPool, type Puzzle } from './puzzles';
import { variantOf } from './variants';
import { isDue, retrievability } from './srs';
import { currentStep, lessonUnlocked, repertoireOpen, setAvailable } from './levels';
import { LEVELS } from '../data';
import { currentStreak, NEW_PER_DAY, newLessonsToday, state, xpToday } from './store';

/** One item in a runnable session. */
export interface Item {
  exercise: Exercise;
  tags: string[];
  /** Spaced-repetition card id, if this item is graded. */
  cardId?: string;
  /** Where it came from, shown as a small label in practice sessions. */
  label?: string;
}

export const TAG_LABELS: Record<string, string> = {
  coordinates: 'Finding squares',
  activity: 'Piece activity',
  files: 'Open files & the 7th rank',
  outpost: 'Outposts',
  pawns: 'Weak & passed pawns',
  bishops: 'Good & bad bishops',
  space: 'Space',
  convert: 'Converting won positions',
  calculation: 'Thinking ahead',
  notation: 'Reading notation',
  center: 'Controlling the center',
  development: 'Developing pieces',
  'king-safety': 'King safety',
  tempo: 'Tempo & early queen moves',
  f7: 'The f7/f2 weak spot',
  'blunder-check': 'Blunder checking',
  punish: 'Punishing mistakes',
  mate: 'Checkmate patterns',
  fork: 'Forks',
  pin: 'Pins',
  discovery: 'Discovered attacks',
  italian: 'Italian Game',
  petrov: 'Petrov Defense',
  sicilian: 'Sicilian (Alapin)',
  'pawn-chain': 'Pawn chains',
  ruy: 'Ruy Lopez',
  scotch: 'Scotch Game',
  qgd: "Queen's Gambit Declined",
  carlsbad: 'Carlsbad structure',
  london: 'vs the London',
  structure: 'Pawn structures',
  plan: 'Middlegame plans',
  transposition: 'Transpositions',
  recognition: 'Opening recognition',
  tactics: 'Opening tactics',
};

export const tagLabel = (t: string) => TAG_LABELS[t] ?? t;

export const isLessonDone = (id: string) => !!state.lessons[id];

/** The next lesson to learn (first not-done lesson you're allowed to open). */
export function nextLesson(): LessonRef | undefined {
  return LESSONS.find((l) => !isLessonDone(l.lesson.id) && lessonUnlocked(l));
}

/** A lesson is open if it's done, or it's the next one, or the learner skipped ahead to it. */
/** Lessons open strictly in order, gated by practice sets and level tests (see levels.ts). */
export const isUnlocked = (ref: LessonRef) => lessonUnlocked(ref);

const learned = (c: CardRef) => !!state.cards[c.id];

export function dueCards(now = Date.now()): CardRef[] {
  return CARDS.filter((c) => state.cards[c.id] && isDue(state.cards[c.id], now)).sort(
    (a, b) => state.cards[a.id].due - state.cards[b.id].due,
  );
}

export function gameDrillsDue(now = Date.now()): string[] {
  // Opening drills from your games wait until the repertoire is taught (Level 3).
  if (!repertoireOpen()) return [];
  return Object.keys(state.drills).filter((id) => {
    const card = state.cards[`game:${id}`];
    return !card || isDue(card, now);
  });
}

/** Round-robin across units so consecutive items come from different openings (interleaving). */
function interleave(cards: CardRef[]): CardRef[] {
  const groups = new Map<string, CardRef[]>();
  for (const c of cards) {
    const g = groups.get(c.unit.id) ?? [];
    g.push(c);
    groups.set(c.unit.id, g);
  }
  const lists = [...groups.values()];
  const out: CardRef[] = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift()!);
  return out;
}

const toItem = (c: CardRef): Item => ({
  exercise: c.exercise,
  tags: c.tags,
  cardId: c.id,
  label: `${c.unit.title} · ${c.lesson.title}`,
});

function drillItem(id: string): Item {
  const d = state.drills[id];
  return { exercise: d, tags: d.tags ?? [], cardId: `game:${id}`, label: `From your game vs ${d.opponent}` };
}

export const SESSION_SIZE = 12;

/** Lessons whose idea is a puzzle theme: reviews of their find-the-move cards can use a fresh puzzle instead. */
const LESSON_THEMES: Record<string, string[]> = {
  'tactics-values': ['hangingPiece'],
  'mate-one': ['mateIn1'],
  'mate-backrank': ['backRankMate'],
  'tactics-fork': ['fork'],
  'fork-check': ['fork'],
  'tactics-pin': ['pin'],
  skewer: ['skewer'],
  'tactics-discovery': ['discoveredAttack'],
  'double-check': ['doubleCheck'],
  'remove-defender': ['capturingDefender'],
  'mate-two': ['mateIn2'],
  'f7-attacks': ['attackingF2F7'],
};

const passedSet = (id: string) => !!state.sets[id]?.mastered;

/** A puzzle you haven't seen, as a find-the-move item. */
function puzzleItem(p: Puzzle, label: string, cardId?: string, tags: string[] = []): Item | null {
  try {
    const c = new Chess(p.fen);
    const solution = p.moves.map((u) => c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san);
    const ideas = p.themes.filter((t) => ['fork', 'pin', 'skewer', 'discoveredAttack', 'mateIn1', 'mateIn2', 'backRankMate', 'hangingPiece', 'attackingF2F7', 'doubleCheck', 'capturingDefender'].includes(t));
    const exercise: Exercise = {
      type: 'find',
      side: new Chess(p.fen).turn(),
      setup: '',
      fen: p.fen,
      solution,
      prompt: 'New position, same idea: find the best move.',
      explain: `**${solution.join(' ')}**${ideas.length ? ` (${ideas.map((t) => tagLabel(t)).join(', ')})` : ''}.`,
    };
    return { exercise, tags, cardId, label };
  } catch {
    return null;
  }
}

function freshPuzzle(themes: string[], seen: Set<string>): Puzzle | undefined {
  const pool = mixedPool(passedSet).filter((p) => !state.puzzles[p.id] && !seen.has(p.id) && p.themes.some((t) => themes.includes(t)));
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Review the idea, not the item: a card you've answered correctly a couple of times comes back as a new
 * instance (a fresh puzzle with the same theme, or the same position mirrored/colour-swapped), graded on
 * the original card. Opening questions stay as they are.
 */
export function reviewItem(c: CardRef, seen = new Set<string>()): Item {
  const base = toItem(c);
  const card = state.cards[c.id];
  if (!card || card.reps - card.lapses < 2) return base;
  const themes = c.exercise.type === 'find' ? (LESSON_THEMES[c.lesson.id] ?? []) : [];
  if (themes.length && Math.random() < 0.6) {
    const p = freshPuzzle(themes, seen);
    if (p) {
      seen.add(p.id);
      const item = puzzleItem(p, `New position · ${c.lesson.title}`, c.id, c.tags);
      if (item) return item;
    }
  }
  const v = variantOf(c.exercise);
  return v ? { ...base, exercise: v, label: `New angle · ${c.lesson.title}` } : base;
}

/** Fresh puzzles from ideas you've learned (used to top up short reviews instead of repeating known cards). */
export function freshPuzzleItems(n: number, seen = new Set<string>()): Item[] {
  const learned = Object.entries(LESSON_THEMES)
    .filter(([id]) => isLessonDone(id))
    .flatMap(([, t]) => t);
  const out: Item[] = [];
  for (let k = 0; k < n; k++) {
    const p = freshPuzzle(learned, seen);
    if (!p) break;
    seen.add(p.id);
    const item = puzzleItem(p, 'Fresh puzzle');
    if (item) out.push(item);
  }
  return out;
}

/** Daily review: due cards only (as new instances once you know them), topped up with fresh puzzles, never with repeats. */
export function buildReview(now = Date.now()): Item[] {
  const seen = new Set<string>();
  const due = dueCards(now).slice(0, SESSION_SIZE);
  const items = interleave(due).map((c) => reviewItem(c, seen));
  if (items.length < 6) items.push(...freshPuzzleItems(6 - items.length, seen));
  const drills = gameDrillsDue(now).slice(0, 3).map(drillItem);
  // Sprinkle game drills through the session rather than bunching them.
  drills.forEach((d, i) => items.splice(Math.min(items.length, 2 + i * 4), 0, d));
  return items;
}

export interface WeakSpot {
  tag: string;
  label: string;
  errorRate: number;
  heat: number;
}

/** Concepts where recent mistakes cluster, worst first. */
export function weakSpots(limit = 3): WeakSpot[] {
  return Object.entries(state.tags)
    .filter(([, t]) => t.seen >= 4 && t.heat >= 1 && t.wrong / t.seen >= 0.2)
    .map(([tag, t]) => ({ tag, label: tagLabel(tag), errorRate: t.wrong / t.seen, heat: t.heat }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, limit);
}

export function strengths(limit = 3): WeakSpot[] {
  return Object.entries(state.tags)
    .filter(([, t]) => t.seen >= 5)
    .map(([tag, t]) => ({ tag, label: tagLabel(tag), errorRate: t.wrong / t.seen, heat: t.heat }))
    .sort((a, b) => a.errorRate - b.errorRate || a.heat - b.heat)
    .slice(0, limit);
}

export function buildWeakSpotDrill(tag: string, now = Date.now()): Item[] {
  // Quick questions only: long play-out drills (endgames) belong in their own practice, not a focused drill.
  const cards = CARDS.filter((c) => c.tags.includes(tag) && c.exercise.type !== 'endgame' && (learned(c) || isLessonDone(c.lesson.id)));
  const ranked = cards.sort((a, b) => {
    const ra = state.cards[a.id] ? retrievability(state.cards[a.id], now) : 0;
    const rb = state.cards[b.id] ? retrievability(state.cards[b.id], now) : 0;
    return ra - rb;
  });
  const seen = new Set<string>();
  return interleave(ranked.slice(0, 8)).map((c) => reviewItem(c, seen));
}

/** Fast recognition drill: flashes, skeletons, and "which opening" questions from what you've learned. */
export function buildPatternSprint(): Item[] {
  const pool = CARDS.filter(
    (c) =>
      c.exercise.type === 'choice' &&
      (c.exercise.flash || c.exercise.pawnsOnly || c.tags.includes('structure')) &&
      isLessonDone(c.lesson.id),
  );
  return shuffleItems(pool.map(toItem)).slice(0, 10);
}

/** Positional practice: placement questions from lessons you've done, mixed and unlabelled. */
export const POSITIONAL_TAGS = ['activity', 'files', 'outpost', 'pawns', 'bishops', 'space'];
export function buildPositionalDrill(size = 8, now = Date.now()): Item[] {
  const pool = CARDS.filter((c) => c.unit.id === 'placement' && isLessonDone(c.lesson.id) && c.exercise.type !== 'info');
  // Weakest first (lowest recall), then shuffled so the theme isn't predictable.
  const ranked = pool
    .map((c) => ({ c, r: state.cards[c.id] ? retrievability(state.cards[c.id], now) : 0 }))
    .sort((a, b) => a.r - b.r)
    .slice(0, size)
    .map(({ c }) => ({ exercise: c.exercise, tags: c.tags, cardId: c.id }));
  return shuffleItems(ranked);
}

export function buildUnitReview(unitId: string): Item[] {
  const seen = new Set<string>();
  return shuffleItems(CARDS.filter((c) => c.unit.id === unitId))
    .slice(0, SESSION_SIZE)
    .map((c) => reviewItem(c, seen));
}

export function buildGameDrills(): Item[] {
  return Object.keys(state.drills).map(drillItem);
}

function shuffleItems<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mean recall probability for a unit's learned cards: drives the "strength" meter. */
export function unitStrength(unitId: string, now = Date.now()): number | undefined {
  const cards = CARDS.filter((c) => c.unit.id === unitId && state.cards[c.id]);
  if (!cards.length) return undefined;
  return cards.reduce((s, c) => s + retrievability(state.cards[c.id], now), 0) / cards.length;
}

/** Map opening names from Lichess/Chess.com to the lesson that teaches your answer. */
const OPENING_TO_LESSON: Array<[RegExp, string]> = [
  [/sicilian/i, 'beyond-sicilian'],
  [/french|caro/i, 'beyond-chains'],
  [/scandinavian|pirc|modern|alekhine|owen|nimzowitsch defense/i, 'beyond-other'],
  [/petrov|russian/i, 'punish-petrov'],
  [/philidor|damiano|elephant gambit/i, 'punish-philidor'],
  [/ruy lopez|spanish/i, 'ruy-1'],
  [/scotch/i, 'scotch-1'],
  [/vienna|four knights|three knights|bishop'?s opening/i, 'oe4-1'],
  [/king'?s gambit|center game|danish/i, 'oe4-2'],
  [/evans/i, 'bi-3'],
  [/italian|giuoco|two knights|fried liver/i, 'italian-1'],
  [/london/i, 'sys-1'],
  [/queen'?s gambit|slav/i, 'qgd-1'],
  [/english|r[ée]ti|zukertort|colle|queen'?s pawn/i, 'sys-2'],
];

export function lessonForOpening(name: string): string | undefined {
  return OPENING_TO_LESSON.find(([re]) => re.test(name))?.[1];
}

/** The opening you face most often whose lesson you haven't done yet. */
export function gameBasedPriority(): { lesson: LessonRef; opening: string; games: number } | undefined {
  const report = state.report;
  if (!report) return undefined;
  for (const o of [...report.openings].sort((a, b) => b.games - a.games)) {
    const id = lessonForOpening(o.name);
    const ref = id ? lessonRef(id) : undefined;
    if (ref && !isLessonDone(id!) && lessonUnlocked(ref) && o.games >= 2) return { lesson: ref, opening: o.name, games: o.games };
  }
  return undefined;
}

export type Action =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'set'; setId: string }
  | { kind: 'review'; count: number }
  | { kind: 'weak'; spot: WeakSpot }
  | { kind: 'done' };

export interface Advice {
  headline: string;
  body: string;
  action: Action;
  cta: string;
}

/** The coach's single best suggestion for right now. */
export function advise(now = Date.now()): Advice {
  const name = state.profile.name || 'there';
  const due = dueCards(now).length + gameDrillsDue(now).length;
  const weak = weakSpots(1)[0];
  const next = nextLesson();
  const priority = gameBasedPriority();
  const streak = currentStreak(now);
  const goalHit = xpToday(now) >= state.profile.goal;

  if (due >= 8) {
    return {
      headline: `${due} moves are fading, ${name}`,
      body: 'Memory is strongest when you review right before you would forget. These are due now, so they will stick better than anything new today.',
      action: { kind: 'review', count: due },
      cta: `Review ${due}`,
    };
  }
  if (weak && weak.heat >= 1.5) {
    return {
      headline: `Let's fix: ${weak.label}`,
      body: `You've missed ${Math.round(weak.errorRate * 100)}% of ${weak.label.toLowerCase()} questions lately. A short focused drill now beats seeing them randomly later.`,
      action: { kind: 'weak', spot: weak },
      cta: 'Drill it',
    };
  }
  if (priority) {
    return {
      headline: `You keep meeting the ${priority.opening.split(':')[0]}`,
      body: `It showed up in ${priority.games} of your recent games. Next up: "${priority.lesson.lesson.title}", your answer to it.`,
      action: { kind: 'lesson', ref: priority.lesson },
      cta: 'Learn it',
    };
  }
  if (due > 0 && (goalHit || !next)) {
    return {
      headline: `${due} quick review${due > 1 ? 's' : ''}`,
      body: 'Keep these patterns sharp.',
      action: { kind: 'review', count: due },
      cta: 'Review',
    };
  }
  const step = currentStep();
  if (step && 'test' in step) {
    const lvl = LEVELS[step.test];
    return {
      headline: `${lvl.title.split(' · ')[0]} test`,
      body: `You’ve finished every lesson in ${lvl.title}. Pass the mixed test (80%, no hints) to unlock the next level.`,
      action: { kind: 'set', setId: lvl.test! },
      cta: 'Take the test',
    };
  }
  if (step && step.needs === 'practice') {
    return {
      headline: `Homework: “${step.ref.lesson.title}” practice set`,
      body: 'Pass it at 80% to unlock the next lesson. A coach wouldn’t move you on until the pattern sticks, and neither will I.',
      action: { kind: 'set', setId: step.ref.lesson.practice! },
      cta: 'Start the set',
    };
  }
  if (next && newLessonsToday(now) >= NEW_PER_DAY) {
    // Enough new material for one day: steer to practice that makes it stick.
    const speed = Object.entries(state.sets)
      .filter(([id, r]) => r.mastered && id !== 'daily' && id !== 'mixed' && !id.includes('test') && setAvailable(id))
      .sort(([, a], [, b]) => a.fluentRuns - b.fluentRuns || a.lastAt - b.lastAt)[0];
    return {
      headline: `${NEW_PER_DAY} new lessons today: now make them stick`,
      body: speed
        ? 'New patterns stick when you practice them before adding more. A speed run of a set you’ve passed, a review, or a game is the best use of the rest of today. Next lesson tomorrow.'
        : 'New patterns stick when you practice them before adding more. Review or play a game, and pick up the next lesson tomorrow.',
      action: speed ? { kind: 'set', setId: speed[0] } : due ? { kind: 'review', count: due } : { kind: 'done' },
      cta: speed ? 'Speed run' : due ? 'Review' : 'Done for today',
    };
  }
  if (next) {
    const first = !Object.keys(state.lessons).length;
    return {
      headline: first ? `Welcome, ${name}!` : goalHit ? 'Goal done. Keep going?' : streak ? `Day ${streak}. Keep it going` : `Hi ${name}`,
      body: first
        ? `We'll start with "${next.lesson.title}": ${next.lesson.goal.toLowerCase()}. Each lesson is about 3 minutes.`
        : `Next: ${next.unit.title}: "${next.lesson.title}". ${next.lesson.goal}.`,
      action: { kind: 'lesson', ref: next },
      cta: first ? 'Start' : 'Continue',
    };
  }
  return {
    headline: 'Course complete!',
    body: 'Daily reviews keep your repertoire sharp. Import your games to find new gaps.',
    action: due ? { kind: 'review', count: due } : { kind: 'done' },
    cta: due ? 'Review' : 'All caught up',
  };
}

export { cardRef };
