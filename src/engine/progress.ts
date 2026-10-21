import { state } from './store';

/**
 * Informational progress feedback: learning signals (unlabelled accuracy over time, past misses fixed,
 * conversions), so effortful practice reads as progress. Positive informational feedback supports intrinsic
 * motivation, unlike rewards for volume (Deci, Koestner & Ryan 1999).
 */
export interface ProgressLine {
  label: string;
  value: string;
  detail: string;
}

const DAY = 86_400_000;

function window(kind: 'mixed' | 'convert', from: number, to: number) {
  const pts = state.progress.filter((p) => p.kind === kind && p.t >= from && p.t < to);
  const correct = pts.reduce((a, p) => a + p.correct, 0);
  const total = pts.reduce((a, p) => a + p.total, 0);
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : undefined };
}

export function progressLines(now = Date.now()): ProgressLine[] {
  const out: ProgressLine[] = [];
  const thisWeek = window('mixed', now - 7 * DAY, now + 1);
  const lastWeek = window('mixed', now - 14 * DAY, now - 7 * DAY);
  // Before any mixed runs were logged, the daily puzzles' last score is the baseline.
  const baseline = lastWeek.pct ?? (state.sets.daily ? Math.round(state.sets.daily.lastAccuracy * 100) : undefined);
  if (thisWeek.pct !== undefined) {
    out.push({
      label: 'Mixed puzzles',
      value: baseline !== undefined && baseline !== thisWeek.pct ? `${baseline}% → ${thisWeek.pct}%` : `${thisWeek.pct}%`,
      detail: `this week, ${thisWeek.total} unlabelled puzzles${baseline !== undefined ? (lastWeek.pct !== undefined ? ' vs last week' : ' vs your earlier score') : ''}`,
    });
  }
  const missed = Object.values(state.puzzles).filter((r) => r.wrong > 0);
  const fixed = missed.filter((r) => r.lastOk).length;
  if (missed.length) out.push({ label: 'Misses fixed', value: `${fixed} of ${missed.length}`, detail: 'puzzles you once missed and later solved' });
  const conv = window('convert', 0, now + 1);
  if (conv.total) out.push({ label: 'Wins converted', value: `${conv.correct} of ${conv.total}`, detail: 'won positions kept winning to the end' });
  const r = state.rating;
  if (r.history.length >= 2) {
    const weekAgo = [...r.history].reverse().find((h) => h.t <= now - 7 * DAY)?.r ?? r.history[0].r;
    if (weekAgo !== r.r) out.push({ label: 'Rating estimate', value: `${weekAgo} → ${r.r}`, detail: 'against the computer, over the last week' });
  }
  return out;
}
