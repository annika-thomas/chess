import { CARDS, LESSONS, cardRef, lessonRef, type CardRef, type LessonRef } from '../data';
import type { Exercise } from '../types';
import { isDue, retrievability } from './srs';
import { currentStreak, state, xpToday } from './store';

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

export function nextLesson(): LessonRef | undefined {
  return LESSONS.find((l) => !isLessonDone(l.lesson.id));
}

/** A lesson is open if it's done, or it's the next one, or the learner skipped ahead to it. */
export function isUnlocked(ref: LessonRef): boolean {
  if (isLessonDone(ref.lesson.id)) return true;
  const next = nextLesson();
  return !next || ref.order <= next.order;
}

const learned = (c: CardRef) => !!state.cards[c.id];

export function dueCards(now = Date.now()): CardRef[] {
  return CARDS.filter((c) => state.cards[c.id] && isDue(state.cards[c.id], now)).sort(
    (a, b) => state.cards[a.id].due - state.cards[b.id].due,
  );
}

export function gameDrillsDue(now = Date.now()): string[] {
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

/** Daily review: due cards first, then the shakiest learned cards so a session is never empty. */
export function buildReview(now = Date.now()): Item[] {
  const due = dueCards(now);
  const picked = due.slice(0, SESSION_SIZE);
  if (picked.length < 6) {
    const extra = CARDS.filter((c) => learned(c) && !picked.includes(c))
      .sort((a, b) => retrievability(state.cards[a.id], now) - retrievability(state.cards[b.id], now))
      .slice(0, 6 - picked.length);
    picked.push(...extra);
  }
  const items = interleave(picked).map(toItem);
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
  const cards = CARDS.filter((c) => c.tags.includes(tag) && (learned(c) || isLessonDone(c.lesson.id)));
  const ranked = cards.sort((a, b) => {
    const ra = state.cards[a.id] ? retrievability(state.cards[a.id], now) : 0;
    const rb = state.cards[b.id] ? retrievability(state.cards[b.id], now) : 0;
    return ra - rb;
  });
  return interleave(ranked.slice(0, 8)).map(toItem);
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

export function buildUnitReview(unitId: string): Item[] {
  return shuffleItems(CARDS.filter((c) => c.unit.id === unitId).map(toItem)).slice(0, SESSION_SIZE);
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
    if (ref && !isLessonDone(id!) && o.games >= 2) return { lesson: ref, opening: o.name, games: o.games };
  }
  return undefined;
}

export type Action =
  | { kind: 'lesson'; ref: LessonRef }
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
  if (next) {
    const first = !Object.keys(state.lessons).length;
    return {
      headline: first ? `Welcome, ${name}!` : goalHit ? 'Goal done. Keep going?' : streak ? `Day ${streak}. Keep it going` : `Hi ${name}`,
      body: first
        ? "We'll start with the three jobs every opening does. Each lesson is about 3 minutes."
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
