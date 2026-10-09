/**
 * Glicko-1 rating estimate from games against bots of (approximately) known strength.
 * Starts wide (±350) and narrows with each game; inactivity slowly widens it again.
 */
export interface Rating {
  r: number;
  rd: number;
  games: number;
  /** Epoch ms of the last rated game. */
  last: number;
  history: Array<{ t: number; r: number }>;
}

const Q = Math.LN10 / 400;
const MAX_RD = 350;
const MIN_RD = 45;
/** RD growth per day without games, so old estimates loosen. */
const C2_PER_DAY = 30 * 30;

/** Someone who knows the rules but rarely plays. */
export const START: Rating = { r: 800, rd: MAX_RD, games: 0, last: 0, history: [] };

const g = (rd: number) => 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));

export function expected(r: number, opp: number, oppRd: number): number {
  return 1 / (1 + Math.pow(10, (-g(oppRd) * (r - opp)) / 400));
}

/** RD after `now - last` of inactivity. */
export function currentRd(rating: Rating, now = Date.now()): number {
  if (!rating.last) return rating.rd;
  const days = Math.max(0, (now - rating.last) / 86_400_000);
  return Math.min(MAX_RD, Math.sqrt(rating.rd * rating.rd + C2_PER_DAY * days));
}

/** Update after one game. score: 1 win, 0.5 draw, 0 loss. */
export function rate(rating: Rating, opp: number, oppRd: number, score: number, now = Date.now()): Rating {
  const rd = currentRd(rating, now);
  const gj = g(oppRd);
  const e = expected(rating.r, opp, oppRd);
  const d2 = 1 / (Q * Q * gj * gj * e * (1 - e));
  const denom = 1 / (rd * rd) + 1 / d2;
  const r = rating.r + (Q / denom) * gj * (score - e);
  const newRd = Math.max(MIN_RD, Math.sqrt(1 / denom));
  return {
    r: Math.round(Math.max(100, r)),
    rd: Math.round(newRd),
    games: rating.games + 1,
    last: now,
    history: [...rating.history, { t: now, r: Math.round(r) }].slice(-100),
  };
}

export const isProvisional = (rating: Rating) => rating.games < 5 || rating.rd > 150;
