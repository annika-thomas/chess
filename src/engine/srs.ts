/**
 * FSRS-4.5 spaced-repetition scheduler (default parameters).
 * Cards track stability (days until recall drops to 90%) and difficulty (1–10).
 */
export type Grade = 1 | 2 | 3 | 4; // again | hard | good | easy

export interface Card {
  id: string;
  stability: number;
  difficulty: number;
  /** Epoch ms of last review. */
  last: number;
  /** Epoch ms when the card is next due. */
  due: number;
  reps: number;
  lapses: number;
}

const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793,
  0.3246, 1.587, 0.2272, 2.8755,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY = 86_400_000;
export const TARGET_RETENTION = 0.9;
const MAX_INTERVAL_DAYS = 365;
/** Failed cards come back within the same session/day. */
const RELEARN_MS = 10 * 60_000;

const clampD = (d: number) => Math.min(10, Math.max(1, d));

export function retrievability(card: Card, now = Date.now()): number {
  const elapsedDays = Math.max(0, (now - card.last) / DAY);
  return Math.pow(1 + (FACTOR * elapsedDays) / card.stability, DECAY);
}

function intervalDays(stability: number): number {
  const raw = (stability / FACTOR) * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(raw)));
}

/** Small deterministic jitter so cards learned together don't all fall due together. */
function fuzz(days: number, id: string): number {
  if (days < 3) return days;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  const f = ((Math.abs(h) % 1000) / 1000) * 0.1 - 0.05; // ±5%
  return Math.max(1, Math.round(days * (1 + f)));
}

/** Start of the local day `days` from `now`, plus a few hours so "tomorrow" means tomorrow morning. */
function dueAt(now: number, days: number): number {
  const d = new Date(now);
  d.setHours(4, 0, 0, 0);
  return d.getTime() + days * DAY;
}

export function newCard(id: string, grade: Grade, now = Date.now()): Card {
  const stability = W[grade - 1];
  const difficulty = clampD(W[4] - (grade - 3) * W[5]);
  const card: Card = { id, stability, difficulty, last: now, due: now, reps: 1, lapses: grade === 1 ? 1 : 0 };
  card.due = grade === 1 ? now + RELEARN_MS : dueAt(now, fuzz(intervalDays(stability), id));
  return card;
}

export function review(card: Card, grade: Grade, now = Date.now()): Card {
  const r = retrievability(card, now);
  const d0Good = W[4];
  const difficulty = clampD(W[7] * d0Good + (1 - W[7]) * (card.difficulty - W[6] * (grade - 3)));
  let stability: number;
  if (grade === 1) {
    stability =
      W[11] *
      Math.pow(card.difficulty, -W[12]) *
      (Math.pow(card.stability + 1, W[13]) - 1) *
      Math.exp(W[14] * (1 - r));
    stability = Math.min(stability, card.stability);
  } else {
    const hard = grade === 2 ? W[15] : 1;
    const easy = grade === 4 ? W[16] : 1;
    stability =
      card.stability *
      (1 +
        Math.exp(W[8]) *
          (11 - card.difficulty) *
          Math.pow(card.stability, -W[9]) *
          (Math.exp(W[10] * (1 - r)) - 1) *
          hard *
          easy);
    // Same-day re-reviews barely move stability; keep it from shrinking.
    stability = Math.max(stability, card.stability);
  }
  const due = grade === 1 ? now + RELEARN_MS : dueAt(now, fuzz(intervalDays(stability), card.id));
  return {
    ...card,
    stability,
    difficulty,
    last: now,
    due,
    reps: card.reps + 1,
    lapses: card.lapses + (grade === 1 ? 1 : 0),
  };
}

export function isDue(card: Card, now = Date.now()): boolean {
  return card.due <= now;
}

/** Days until due, for display. */
export function daysUntil(card: Card, now = Date.now()): number {
  return Math.ceil((card.due - now) / DAY);
}
