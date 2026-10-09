import { lessonRef } from '../data';
import { dailyBatch, todaysPlan, weekly, type Task } from '../engine/homework';
import { getSet } from '../engine/puzzles';
import { buildReview } from '../engine/coach';
import { startSession } from './app';
import { h } from './dom';
import { icon } from './icons';
import { lessonItems, openSet, startLesson } from './learn';
import { startSprint } from './practice';
import { runPuzzleSet } from './puzzleRun';
import { annotateGame } from './annotate';
import { reviewGame, startSlowGame } from './play';

function runTask(key: string): void {
  const [kind, id] = key.split(':');
  const missing = () => alert('This puzzle set isn’t available yet: the puzzle library is still being imported.');
  switch (kind) {
    case 'review':
      return startSession('Daily review', buildReview(), 'practice', undefined, 'review');
    case 'sprint':
      return startSprint('w');
    case 'lesson': {
      const ref = lessonRef(id);
      if (ref) startLesson(ref);
      return;
    }
    case 'set':
    case 'mix':
      return openSet(id);
    case 'speed':
      void getSet(id).then((set) => (set ? runPuzzleSet({ set, mode: 'cycle' }) : missing()));
      return;
    case 'daily':
      void getSet('daily').then((set) => (set ? runPuzzleSet({ set, mode: 'test', only: dailyBatch(set.puzzles) }) : missing()));
      return;
    case 'endgame': {
      const ref = lessonRef(id);
      if (!ref) return;
      const items = lessonItems(ref.lesson).filter((i) => i.exercise.type === 'endgame');
      startSession(`Endgame drill: ${ref.lesson.title}`, items, 'practice', undefined, key);
      return;
    }
  }
}

function taskRow(t: Task, n: number): HTMLElement {
  const row = h(
    `button.hw-row${t.done ? '.done' : ''}`,
    { type: 'button' },
    h('span.hw-check', t.done ? icon('check') : String(n)),
    h('div.hw-main', h('b', t.title), t.detail ? h('small.muted', t.detail) : null),
    h('span.hw-min', `${t.minutes} min`),
  );
  row.addEventListener('click', () => runTask(t.key));
  return row;
}

function weeklyRow(): HTMLElement {
  const w = weekly();
  const [title, detail] = w.done
    ? ['Slow game annotated', 'Tap to look over your notes and the engine’s verdict']
    : w.game
      ? ['Annotate your slow game', 'Your thoughts first, then the engine checks them']
      : ['Play a slow game', 'No clock. Before every move: checks, captures, threats. Then annotate it.'];
  const row = h(
    `button.hw-row.weekly${w.done ? '.done' : ''}`,
    { type: 'button' },
    h('span.hw-check', w.done ? icon('check') : icon('book')),
    h('div.hw-main', h('b', title), h('small.muted', detail)),
    h('span.hw-min', w.done ? '' : w.game ? '10 min' : '30 min'),
  );
  row.addEventListener('click', () => {
    if (w.done) reviewGame(w.game!);
    else if (w.game) annotateGame(w.game);
    else startSlowGame();
  });
  return row;
}

/** Today's homework: a fixed ~30-minute plan, plus this week's annotated slow game. */
export function homeworkCard(): HTMLElement {
  const tasks = todaysPlan();
  const done = tasks.filter((t) => t.done).length;
  const minutes = tasks.reduce((a, t) => a + t.minutes, 0);
  const all = tasks.length > 0 && done === tasks.length;
  return h(
    'section.homework',
    h(
      'div.hw-head',
      h('div', h('h3', 'Today’s homework'), h('small.muted', all ? 'All done. That’s how strong players are made.' : `About ${minutes} minutes · ${done} of ${tasks.length} done`)),
      h('div.hw-ring', icon(all ? 'trophy' : 'target')),
    ),
    h('div.progress.hw-progress', h('div.fill', { style: `width:${tasks.length ? (done / tasks.length) * 100 : 0}%` })),
    ...tasks.map((t, i) => taskRow(t, i + 1)),
    h('div.hw-sub', 'This week'),
    weeklyRow(),
  );
}
