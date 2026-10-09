import { Chess } from 'chess.js';
import type { Key } from '@lichess-org/chessground/types';
import { accuracy, avgSeconds, FLUENT, isFluent, PASS, type Puzzle, type PuzzleSet, type SetRun } from '../engine/puzzles';
import { addXp, markHomework, save, state } from '../engine/store';
import type { Side } from '../types';
import { render, sheet } from './app';
import { Board } from './board';
import { clear, h, md } from './dom';
import { icon } from './icons';
import { sound } from './sound';

export type SetMode = 'practice' | 'test' | 'cycle' | 'retry';

export interface SetOpts {
  set: PuzzleSet;
  mode: SetMode;
  /** Use only these puzzles (e.g. the ones missed last time, or today's daily batch). */
  only?: Puzzle[];
  /** What "Run again" runs after a retry (the batch the retry came from). */
  full?: Puzzle[];
  /** Show the theme name as a hint (off for tests and mixed sets). */
  hint?: string;
  onFinish?: (run: SetRun, passed: boolean) => void;
}

const uciOf = (m: { from: string; to: string; promotion?: string }) => m.from + m.to + (m.promotion ?? '');

function shuffled<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Run a set of puzzles full-screen. Your first wrong move fails a puzzle; the solution is then shown. */
export function runPuzzleSet(o: SetOpts): void {
  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  // Tests and cycles shuffle so position order can't be memorized; practice keeps the easy-to-hard order.
  const queue = o.only ?? (o.mode === 'practice' ? o.set.puzzles.slice() : shuffled(o.set.puzzles));
  let i = 0;
  let correct = 0;
  let seconds = 0;
  let started = 0;
  let j = 0;
  let failed = false;
  let busy = false;
  let timer: number | undefined;
  const missed: Puzzle[] = [];

  const board = new Board({ orientation: 'w', onMove: (_, move) => onMove(uciOf(move)) });
  const counter = h('div.guess-score');
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave' }, icon('close'));
  const title = h('div.game-title', o.set.title);
  const turn = h('div.puzzle-turn');
  const feedback = h('div.puzzle-feedback');
  const next = h('button.btn.primary', { type: 'button' }, 'Next');
  next.hidden = true;
  root.append(
    h(
      'div.session.game.puzzles',
      h('header.run-head', close, title, counter),
      h('div.progress.puzzle-progress', h('div.fill')),
      turn,
      board.el,
      feedback,
      h('div.game-controls', next),
    ),
  );

  const progress = () => {
    (root.querySelector('.puzzle-progress .fill') as HTMLElement).style.width = `${(i / queue.length) * 100}%`;
    counter.textContent = `${Math.min(i + 1, queue.length)}/${queue.length}`;
  };

  function show(): void {
    if (i >= queue.length) return finish();
    const p = queue[i];
    j = 0;
    failed = false;
    busy = false;
    next.hidden = true;
    clear(feedback);
    const side = new Chess(p.fen).turn() as Side;
    board.setOrientation(side);
    board.load([], p.fen);
    board.arrows([]);
    if (p.last) board.sync([p.last.slice(0, 2), p.last.slice(2, 4)] as Key[]);
    board.setInteractive(true);
    turn.replaceChildren(
      h('span.turn-dot', { class: side === 'w' ? 'white' : 'black' }),
      `${side === 'w' ? 'White' : 'Black'} to move`,
      o.hint ? h('span.muted', ` · ${o.hint}`) : '',
    );
    progress();
    started = Date.now();
  }

  function onMove(uci: string): boolean {
    if (busy || failed) return false;
    const p = queue[i];
    const expected = p.moves[j];
    const mate = board.chess.isCheckmate();
    if (uci === expected || mate) {
      sound.move();
      j++;
      if (mate || j >= p.moves.length) {
        solved();
        return true;
      }
      // Opponent's reply, then your next move.
      busy = true;
      board.setInteractive(false);
      timer = window.setTimeout(() => {
        playUci(p.moves[j]);
        j++;
        busy = false;
        board.setInteractive(true);
      }, 380);
      return true;
    }
    // Wrong: the puzzle is failed. Show the solution from here.
    failed = true;
    seconds += (Date.now() - started) / 1000;
    missed.push(p);
    sound.wrong();
    board.setInteractive(false);
    feedback.replaceChildren(h('div.verdict.bad', icon('close'), ' Not this time. Here’s the solution.'));
    playOut(p, j);
    return false;
  }

  function playUci(uci: string): void {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const mv = new Chess(board.chess.fen()).move({ from, to, promotion: uci[4] ?? 'q' });
    board.play(mv.san);
  }

  /** Animate the rest of the solution so the idea is always seen. */
  function playOut(p: Puzzle, from: number): void {
    let k = from;
    const step = () => {
      if (k >= p.moves.length) {
        next.hidden = false;
        return;
      }
      const uci = p.moves[k];
      board.arrows([{ from: uci.slice(0, 2), to: uci.slice(2, 4), color: k % 2 === 0 ? 'green' : 'red' }]);
      timer = window.setTimeout(() => {
        playUci(uci);
        k++;
        timer = window.setTimeout(step, 450);
      }, 650);
    };
    timer = window.setTimeout(step, 400);
  }

  function solved(): void {
    const t = (Date.now() - started) / 1000;
    seconds += t;
    correct++;
    board.setInteractive(false);
    sound.correct();
    feedback.replaceChildren(h('div.verdict.good', icon('check'), ` Solved in ${t.toFixed(1)}s`));
    next.hidden = false;
    // Keep momentum in timed runs.
    if (o.mode === 'cycle') timer = window.setTimeout(advance, 700);
  }

  function advance(): void {
    clearTimeout(timer);
    i++;
    show();
  }
  next.addEventListener('click', advance);

  function finish(): void {
    progress();
    board.setInteractive(false);
    const run: SetRun = { correct, total: queue.length, seconds };
    const acc = accuracy(run);
    const avg = avgSeconds(run);
    const passed = acc >= PASS;
    const fluent = isFluent(run);
    let note = '';
    if (o.mode !== 'retry') {
      const rec = state.sets[o.set.id] ?? { attempts: 0, bestAccuracy: 0, mastered: false, fluentRuns: 0, lastAt: 0, lastAccuracy: 0 };
      const wasMastered = rec.mastered;
      rec.attempts++;
      rec.bestAccuracy = Math.max(rec.bestAccuracy, acc);
      rec.lastAccuracy = acc;
      rec.lastAt = Date.now();
      if (passed) {
        rec.mastered = true;
        rec.bestSeconds = Math.min(rec.bestSeconds ?? Infinity, avg);
      }
      if (fluent) rec.fluentRuns++;
      state.sets[o.set.id] = rec;
      markHomework(`set:${o.set.id}`);
      if (passed && !wasMastered) note = 'Set mastered: the next step is unlocked.';
      else if (fluent) note = `Fluent run #${rec.fluentRuns}: 85%+ at ${FLUENT.seconds}s or less per puzzle. That’s the Woodpecker target.`;
    }
    addXp(5 + correct);
    save();
    o.onFinish?.(run, passed);
    (passed ? sound.finish : sound.wrong)();

    const pct = Math.round(acc * 100);
    const headline =
      o.mode === 'retry'
        ? 'Mistakes reviewed'
        : passed
          ? fluent
            ? 'Fluent!'
            : 'Passed!'
          : 'Not yet: keep drilling';
    const retry = h('button.btn.primary.wide', { type: 'button' }, `Retry the ${missed.length} I missed`);
    const again = h('button.btn.ghost.wide', { type: 'button' }, 'Run the whole set again');
    const done = h('button.btn.ghost.wide', { type: 'button' }, 'Done');
    const closeSheet = sheet(
      h(
        'div.result-sheet',
        h('div.sheet-art', icon(passed ? (fluent ? 'trophy' : 'star') : 'target')),
        h('h2', headline),
        h('div.rating-change', h('b', `${correct} / ${queue.length}`), ` · ${pct}% · ${avg.toFixed(1)}s each`),
        o.mode !== 'retry'
          ? md(
              passed
                ? note || `Next goal: ${Math.round(FLUENT.accuracy * 100)}% at ${FLUENT.seconds}s or less per puzzle. Strong players repeat sets until the patterns are instant.`
                : `You need **${Math.round(PASS * 100)}%** to pass. Retry the ones you missed now, then run the set again later. Coaches repeat a theme until it sticks.`,
            )
          : null,
        h('div.stack', missed.length ? retry : null, again, done),
      ),
    );
    const leave = () => {
      closeSheet();
      clearTimeout(timer);
      board.destroy();
      document.body.classList.remove('locked');
    };
    retry.addEventListener('click', () => {
      const m = missed.slice();
      leave();
      runPuzzleSet({ ...o, mode: 'retry', only: m, full: o.mode === 'retry' ? o.full : o.only });
    });
    again.addEventListener('click', () => {
      leave();
      runPuzzleSet({ ...o, mode: o.mode === 'retry' ? 'practice' : o.mode, only: o.mode === 'retry' ? o.full : o.only, full: undefined });
    });
    done.addEventListener('click', () => {
      leave();
      render();
    });
  }

  close.addEventListener('click', () => {
    if (i > 0 && i < queue.length && !confirm('Leave this set? This run won’t be saved.')) return;
    clearTimeout(timer);
    board.destroy();
    document.body.classList.remove('locked');
    render();
  });

  show();
}
