import { newCard, review, type Card, type Grade } from './srs';
import type { FindExercise, Side } from '../types';
import { START, type Rating } from './rating';

export interface Profile {
  name: string;
  /** Daily XP goal. */
  goal: number;
  onboarded: boolean;
  createdAt: number;
  lichess?: string;
  chesscom?: string;
}

export interface LessonRecord {
  completedAt: number;
  /** Mistakes on the best run. */
  mistakes: number;
  runs: number;
}

export interface TagStat {
  seen: number;
  wrong: number;
  /** Exponentially decayed recent error weight, so old mistakes fade. */
  heat: number;
  last: number;
}

/** A drill created from the learner's own games: their move vs. the repertoire move. */
export interface GameDrill extends FindExercise {
  id: string;
  gameUrl: string;
  played: string;
  opponent: string;
  date: string;
}

export interface OpeningStat {
  name: string;
  side: 'w' | 'b';
  games: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface ImportReport {
  source: 'lichess' | 'chesscom';
  username: string;
  fetchedAt: number;
  games: number;
  openings: OpeningStat[];
  /** Games where the learner followed the repertoire all the way through its book moves. */
  followed: number;
  /** Games where the learner left the repertoire. */
  deviated: number;
  /** Games where the opponent left book first. */
  oppDeviated: number;
  /** Games whose opening isn't in the repertoire (e.g. learner played 1.d4 as White). */
  outside: number;
}

/** A rating seen in imported games, e.g. Lichess blitz 1234. */
export interface PlatformRating {
  source: 'lichess' | 'chesscom';
  speed: string;
  rating: number;
  date: string;
}

export interface PlayedGame {
  id: string;
  date: number;
  side: Side;
  level: number;
  result: 'win' | 'draw' | 'loss';
  /** How it ended, e.g. "checkmate", "resigned", "stalemate". */
  reason: string;
  moves: string[];
  rated: boolean;
  /** Rating change from this game, if rated. */
  delta?: number;
  /** Repertoire line the opening followed, if any. */
  opening?: string;
  /** Your own notes on the game, then the engine's check of them (weekly homework). */
  annotation?: Annotation;
}

/** A self-annotated game: your critical moments first, then what the engine found. */
export interface Annotation {
  /** Plies you marked as critical, with what you were thinking. */
  marks: Array<{ ply: number; note: string }>;
  /** Your moves the engine flagged (loss in centipawns, with its better move). */
  flagged: Array<{ ply: number; loss: number; best: string }>;
  /** Why the biggest mistakes happened, in your words (cause ids). */
  causes: string[];
  at: number;
}

/** Today's homework: what was assigned, and what's been done. */
export interface Homework {
  day: string;
  /** Task keys assigned for the day, fixed when the plan is first built so it doesn't shift. */
  plan: string[];
  done: string[];
}

export interface SetRecord {
  attempts: number;
  bestAccuracy: number;
  /** Best average seconds per puzzle among runs that passed. */
  bestSeconds?: number;
  /** Reached the pass mark (80%) at least once. */
  mastered: boolean;
  /** Runs that hit 85% at ≤15 s per puzzle (Woodpecker-style cycles). */
  fluentRuns: number;
  lastAt: number;
  lastAccuracy: number;
}

export interface State {
  v: 1;
  profile: Profile;
  xp: number;
  xpByDay: Record<string, number>;
  streak: { count: number; lastDay: string; best: number };
  lessons: Record<string, LessonRecord>;
  cards: Record<string, Card>;
  tags: Record<string, TagStat>;
  drills: Record<string, GameDrill>;
  report?: ImportReport;
  platformRatings: PlatformRating[];
  games: PlayedGame[];
  rating: Rating;
  /** Last-used Play settings. */
  play: { level: number; side: Side | 'random'; repertoire: boolean; guard: boolean };
  settings: { sound: boolean; haptics: boolean; showCoords: boolean; labelSquares: boolean; figurines: boolean };
  /** Best Coordinate Sprint scores by orientation. */
  sprintBest: { w: number; b: number };
  /** Guess the Move: best score per master game. */
  masters: Record<string, { best: number; max: number; plays: number }>;
  /** Puzzle sets: best results and mastery. */
  sets: Record<string, SetRecord>;
  /** Boss battles by unit id. */
  bosses: Record<string, { beaten: boolean; attempts: number; beatenAt?: number }>;
  homework: Homework;
}

const KEY = 'chess-mentor.v1';

export function today(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterday(now = Date.now()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return today(d.getTime());
}

function fresh(): State {
  return {
    v: 1,
    profile: { name: '', goal: 30, onboarded: false, createdAt: Date.now() },
    xp: 0,
    xpByDay: {},
    streak: { count: 0, lastDay: '', best: 0 },
    lessons: {},
    cards: {},
    tags: {},
    drills: {},
    platformRatings: [],
    games: [],
    rating: { ...START },
    play: { level: 3, side: 'w', repertoire: true, guard: true },
    settings: { sound: true, haptics: true, showCoords: true, labelSquares: false, figurines: true },
    sprintBest: { w: 0, b: 0 },
    masters: {},
    sets: {},
    bosses: {},
    homework: { day: '', plan: [], done: [] },
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as State;
    const base = fresh();
    return { ...base, ...parsed, play: { ...base.play, ...parsed.play }, settings: { ...base.settings, ...parsed.settings } };
  } catch {
    return fresh();
  }
}

export let state: State = load();
const listeners = new Set<() => void>();

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable: keep running in memory */
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Ask the browser not to evict our data (matters on iOS). */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => undefined);
}

export function currentStreak(now = Date.now()): number {
  const { count, lastDay } = state.streak;
  return lastDay === today(now) || lastDay === yesterday(now) ? count : 0;
}

export function addXp(amount: number, now = Date.now()): void {
  const day = today(now);
  state.xp += amount;
  state.xpByDay[day] = (state.xpByDay[day] ?? 0) + amount;
  if (state.streak.lastDay !== day) {
    state.streak.count = state.streak.lastDay === yesterday(now) ? state.streak.count + 1 : 1;
    state.streak.lastDay = day;
    state.streak.best = Math.max(state.streak.best, state.streak.count);
  }
}

export function xpToday(now = Date.now()): number {
  return state.xpByDay[today(now)] ?? 0;
}

export function gradeCard(id: string, grade: Grade, now = Date.now()): void {
  const prev = state.cards[id];
  state.cards[id] = prev ? review(prev, grade, now) : newCard(id, grade, now);
}

const HALF_LIFE_DAYS = 10;

export function recordTags(tags: string[] | undefined, correct: boolean, now = Date.now()): void {
  for (const tag of tags ?? []) {
    const t = state.tags[tag] ?? { seen: 0, wrong: 0, heat: 0, last: now };
    const decay = Math.pow(0.5, (now - t.last) / 86_400_000 / HALF_LIFE_DAYS);
    t.heat = t.heat * decay + (correct ? 0 : 1);
    t.seen++;
    if (!correct) t.wrong++;
    t.last = now;
    state.tags[tag] = t;
  }
}

export function completeLesson(id: string, mistakes: number, now = Date.now()): void {
  const prev = state.lessons[id];
  state.lessons[id] = {
    completedAt: prev?.completedAt ?? now,
    mistakes: prev ? Math.min(prev.mistakes, mistakes) : mistakes,
    runs: (prev?.runs ?? 0) + 1,
  };
}

/** Record that a piece of homework was done today (e.g. "review", "set:mate1", "lesson:mate-one"). */
export function markHomework(key: string, now = Date.now()): void {
  const day = today(now);
  if (state.homework.day !== day) state.homework = { day, plan: [], done: [] };
  if (!state.homework.done.includes(key)) state.homework.done.push(key);
}

export function exportBackup(): string {
  return JSON.stringify(state);
}

export function importBackup(json: string): void {
  const parsed = JSON.parse(json) as State;
  if (parsed?.v !== 1 || typeof parsed.cards !== 'object') throw new Error('Not a Chess Mentor backup');
  state = { ...fresh(), ...parsed };
  save();
}

export function resetAll(): void {
  state = fresh();
  save();
}
