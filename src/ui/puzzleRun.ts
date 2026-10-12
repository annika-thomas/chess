import { Chess } from 'chess.js';
import type { Key } from '@lichess-org/chessground/types';
import { accuracy, avgSeconds, FLUENT, isFluent, loadedSets, PASS, pickRun, themeOf, themePool, type Puzzle, type PuzzleSet, type SetRun } from '../engine/puzzles';
import { addXp, markHomework, save, state, type SavedRun } from '../engine/store';
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
  /** Continue a run that was paused and saved. */
  resume?: SavedRun;
  /** A short note shown before the first puzzle (e.g. why mixed practice feels harder). */
  intro?: string;
  /** Show the theme name as a hint (off for tests and mixed sets). */
  hint?: string;
  onFinish?: (run: SetRun, passed: boolean) => void;
}

const uciOf = (m: { from: string; to: string; promotion?: string }) => m.from + m.to + (m.promotion ?? '');

/** Plain names for the Lichess themes worth pointing out after a miss. */
const IDEAS: Record<string, string> = {
  fork: 'Fork',
  pin: 'Pin',
  skewer: 'Skewer',
  discoveredAttack: 'Discovered attack',
  doubleCheck: 'Double check',
  capturingDefender: 'Removing the defender',
  hangingPiece: 'Free piece',
  backRankMate: 'Back-rank mate',
  smotheredMate: 'Smothered mate',
  mateIn1: 'Mate in one',
  mateIn2: 'Mate in two',
  mateIn3: 'Mate in three',
  attackingF2F7: 'Attack on f7/f2',
  deflection: 'Deflection',
  attraction: 'Decoy',
  trappedPiece: 'Trapped piece',
  interference: 'Interference',
  intermezzo: 'In-between move',
  xRayAttack: 'X-ray',
  sacrifice: 'Sacrifice',
  clearance: 'Clearance',
  quietMove: 'Quiet move',
  promotion: 'Promotion',
  exposedKing: 'Exposed king',
};
const ideasOf = (p: Puzzle) => p.themes.map((t) => IDEAS[t]).filter(Boolean).slice(0, 3);

/** The solution as SAN, from the puzzle position. */
function solutionSans(p: Puzzle): string[] {
  const c = new Chess(p.fen);
  return p.moves.map((u) => c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] ?? 'q' }).san);
}

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
  const saved = state.runs[o.set.id];
  if (saved && !o.resume && o.mode !== 'retry') {
    // A run of this set was paused earlier: offer to pick it up.
    const resume = h('button.btn.primary.wide', { type: 'button' }, `Continue from #${saved.index + 1}`);
    const fresh = h('button.btn.ghost.wide', { type: 'button' }, 'Start over from #1');
    const closeSheet = sheet(
      h(
        'div.result-sheet',
        h('div.sheet-art', icon('pause')),
        h('h2', 'You paused this set'),
        h('p.muted', `${saved.index} of ${saved.queue.length} done · ${saved.correct} correct so far. Continue that run, or start a fresh one?`),
        h('div.stack', resume, fresh),
      ),
    );
    resume.addEventListener('click', () => {
      closeSheet();
      runPuzzleSet({ ...o, resume: saved });
    });
    fresh.addEventListener('click', () => {
      closeSheet();
      delete state.runs[o.set.id];
      save();
      runPuzzleSet(o);
    });
    return;
  }

  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  const byId = new Map<string, Puzzle>();
  for (const s of loadedSets()?.values() ?? []) for (const p of s.puzzles) byId.set(p.id, p);
  for (const p of o.set.puzzles) byId.set(p.id, p);
  const fromIds = (ids: string[]) => ids.map((id) => byId.get(id)).filter((p): p is Puzzle => !!p);
  // Practice and speed runs draw a fresh 25 from the theme's pool each time, so you learn the pattern,
  // not the answers: misses come back first, then unseen puzzles. Tests and mixes shuffle their own set.
  const fresh = (o.mode === 'practice' || o.mode === 'cycle') && !!themeOf(o.set);
  const queue = o.resume
    ? fromIds(o.resume.queue)
    : (o.only ??
      (fresh
        ? pickRun(themePool(o.set), state.puzzles, { ordered: o.mode === 'practice' })
        : o.mode === 'practice'
          ? o.set.puzzles.slice()
          : shuffled(o.set.puzzles)));
  let i = o.resume?.index ?? 0;
  const firstIndex = i;
  let correct = o.resume?.correct ?? 0;
  let seconds = o.resume?.seconds ?? 0;
  let started = 0;
  let j = 0;
  let failed = false;
  let busy = false;
  /** The current puzzle has been scored (solved or failed). */
  let resolved = false;
  let paused = false;
  let pausedAt = 0;
  let timer: number | undefined;
  const missed: Puzzle[] = o.resume ? fromIds(o.resume.missed) : [];

  const board = new Board({ orientation: 'w', onMove: (_, move) => onMove(uciOf(move)) });
  const counter = h('div.guess-score');
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave' }, icon('close'));
  const pauseBtn = h('button.icon-btn.pause-btn', { type: 'button', 'aria-label': 'Pause' }, icon('pause'));
  const title = h('div.game-title', o.set.title);
  const turn = h('div.puzzle-turn');
  const feedback = h('div.puzzle-feedback');
  const next = h('button.btn.primary', { type: 'button' }, 'Next');
  next.hidden = true;
  // After a miss: step through the solution, watch it again, or try it yourself (not scored).
  const stepBack = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Previous move' }, icon('prev'));
  const stepFwd = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Next move' }, icon('next'));
  const replayBtn = h('button.btn.ghost.small-btn', { type: 'button' }, icon('play'), ' Replay');
  const tryBtn = h('button.btn.ghost.small-btn', { type: 'button' }, icon('undo'), ' Try it');
  const stepLabel = h('span.step-label');
  const reviewBar = h('div.review-bar', stepBack, stepLabel, stepFwd, replayBtn, tryBtn);
  reviewBar.hidden = true;
  root.append(
    h(
      'div.session.game.puzzles',
      h('header.run-head', close, title, h('div.run-right', counter, pauseBtn)),
      h('div.progress.puzzle-progress', h('div.fill')),
      turn,
      board.el,
      feedback,
      reviewBar,
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
    resolved = false;
    next.hidden = true;
    review = null;
    reviewBar.hidden = true;
    clear(feedback);
    if (o.intro && i === firstIndex) feedback.append(h('div.intro-note', icon('bulb'), ' ', o.intro));
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
    if (review?.trying) return onTryMove(uci);
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
    resolved = true;
    seconds += (Date.now() - started) / 1000;
    record(p, false, (Date.now() - started) / 1000);
    missed.push(p);
    sound.wrong();
    board.setInteractive(false);
    const ideas = ideasOf(p);
    feedback.replaceChildren(
      h('div.verdict.bad', icon('close'), ' Not this time. Watch the solution.'),
      ideas.length ? h('div.idea', 'Idea: ', h('b', ideas.join(' · '))) : '',
    );
    next.hidden = false;
    // Let the wrong move snap back first, then replay from the start.
    timer = window.setTimeout(() => startReview(p), 350);
    return false;
  }

  // ── Solution review ──
  let review: { p: Puzzle; sans: string[]; k: number; trying: boolean; tj: number } | null = null;

  function startReview(p: Puzzle): void {
    review = { p, sans: solutionSans(p), k: 0, trying: false, tj: 0 };
    reviewBar.hidden = false;
    watch();
  }

  /** Show the position after k solution moves, with an arrow for the move that comes next. */
  function showStep(k: number): void {
    if (!review) return;
    const { p, sans } = review;
    review.k = Math.max(0, Math.min(sans.length, k));
    board.load(sans.slice(0, review.k), p.fen);
    if (review.k === 0 && p.last) board.sync([p.last.slice(0, 2), p.last.slice(2, 4)] as Key[]);
    const nextUci = p.moves[review.k];
    board.arrows(nextUci ? [{ from: nextUci.slice(0, 2), to: nextUci.slice(2, 4), color: review.k % 2 === 0 ? 'green' : 'red' }] : []);
    stepLabel.textContent = review.k === sans.length ? 'Solved position' : review.k === 0 ? 'Start' : `Move ${review.k} of ${sans.length}`;
    (stepBack as HTMLButtonElement).disabled = review.k === 0;
    (stepFwd as HTMLButtonElement).disabled = review.k === sans.length;
  }

  /** Play the whole solution slowly from the start. */
  function watch(): void {
    if (!review) return;
    clearTimeout(timer);
    review.trying = false;
    board.setInteractive(false);
    showStep(0);
    const tick = () => {
      if (!review || review.trying || review.k >= review.sans.length) return;
      timer = window.setTimeout(() => {
        if (!review || review.trying) return;
        showStep(review.k + 1);
        tick();
      }, 1200);
    };
    timer = window.setTimeout(tick, 600);
  }

  stepBack.addEventListener('click', () => {
    if (!review) return;
    clearTimeout(timer);
    review.trying = false;
    board.setInteractive(false);
    showStep(review.k - 1);
  });
  stepFwd.addEventListener('click', () => {
    if (!review) return;
    clearTimeout(timer);
    review.trying = false;
    board.setInteractive(false);
    showStep(review.k + 1);
  });
  replayBtn.addEventListener('click', watch);
  tryBtn.addEventListener('click', () => {
    if (!review) return;
    clearTimeout(timer);
    showStep(0);
    board.arrows([]);
    review.trying = true;
    review.tj = 0;
    stepLabel.textContent = 'Your turn (not scored)';
    board.setInteractive(true);
  });

  /** A practice attempt at a missed puzzle: same rules, no score. */
  function onTryMove(uci: string): boolean {
    const r = review!;
    const mate = board.chess.isCheckmate();
    if (uci === r.p.moves[r.tj] || mate) {
      r.tj++;
      if (mate || r.tj >= r.p.moves.length) {
        sound.correct();
        board.setInteractive(false);
        r.trying = false;
        stepLabel.textContent = 'Got it! (not scored)';
        return true;
      }
      board.setInteractive(false);
      timer = window.setTimeout(() => {
        playUci(r.p.moves[r.tj]);
        r.tj++;
        board.setInteractive(true);
      }, 380);
      return true;
    }
    sound.wrong();
    stepLabel.textContent = 'Not that one. Try again, or replay it.';
    return false;
  }

  function playUci(uci: string): void {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const mv = new Chess(board.chess.fen()).move({ from, to, promotion: uci[4] ?? 'q' });
    board.play(mv.san);
  }

  function solved(): void {
    const t = (Date.now() - started) / 1000;
    seconds += t;
    correct++;
    resolved = true;
    record(queue[i], true, t);
    board.setInteractive(false);
    sound.correct();
    feedback.replaceChildren(h('div.verdict.good', icon('check'), ` Solved in ${t.toFixed(1)}s`));
    next.hidden = false;
    // Keep momentum in timed runs.
    if (o.mode === 'cycle') timer = window.setTimeout(advance, 700);
  }

  /** Remember how this puzzle went (retries of a miss don't overwrite the miss). */
  function record(p: Puzzle, ok: boolean, secs: number): void {
    const prev = state.puzzles[p.id];
    state.puzzles[p.id] = {
      seen: (prev?.seen ?? 0) + 1,
      wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
      lastOk: ok,
      last: Date.now(),
      secs: Math.round(secs * 10) / 10,
    };
  }

  function advance(): void {
    clearTimeout(timer);
    i++;
    show();
  }
  next.addEventListener('click', advance);

  function finish(): void {
    document.removeEventListener('visibilitychange', onHide);
    if (o.mode !== 'retry') delete state.runs[o.set.id];
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
      runPuzzleSet({ ...o, mode: 'retry', only: m, full: o.mode === 'retry' ? o.full : o.only, resume: undefined });
    });
    again.addEventListener('click', () => {
      leave();
      // A fresh run from #1: never carry over the position of a resumed run.
      runPuzzleSet({ ...o, mode: o.mode === 'retry' ? 'practice' : o.mode, only: o.mode === 'retry' ? o.full : o.only, full: undefined, resume: undefined });
    });
    done.addEventListener('click', () => {
      leave();
      render();
    });
  }

  // ── Pause: stops the clock and hides the board; the run can be saved and finished later. ──
  const canSave = o.mode !== 'retry';
  function saveRun(): void {
    if (!canSave) return;
    state.runs[o.set.id] = {
      mode: o.mode,
      queue: queue.map((p) => p.id),
      // A puzzle already scored counts as done; one in progress is replayed from the start.
      index: resolved ? i + 1 : i,
      correct,
      seconds,
      missed: missed.map((p) => p.id),
      savedAt: Date.now(),
    };
    save();
  }
  function exit(): void {
    document.removeEventListener('visibilitychange', onHide);
    overlay.remove();
    clearTimeout(timer);
    board.destroy();
    document.body.classList.remove('locked');
    render();
  }
  const resumeBtn = h('button.btn.primary.wide', { type: 'button' }, icon('play'), ' Resume');
  const saveBtn = h('button.btn.ghost.wide', { type: 'button' }, 'Save and finish later');
  const quitBtn = h('button.btn.ghost.wide', { type: 'button' }, 'Quit without saving');
  const pauseInfo = h('p.muted');
  const overlay = h('div.pause-overlay', h('div.pause-card', h('div.sheet-art', icon('pause')), h('h2', 'Paused'), pauseInfo, h('p.muted', 'The clock is stopped and the board is hidden.'), h('div.stack', resumeBtn, canSave ? saveBtn : null, quitBtn)));
  function pause(): void {
    if (paused || i >= queue.length) return;
    paused = true;
    pausedAt = Date.now();
    pauseInfo.textContent = `${i + (resolved ? 1 : 0)} of ${queue.length} done · ${correct} correct`;
    root.append(overlay);
  }
  function resume(): void {
    if (!paused) return;
    paused = false;
    // Time spent paused doesn't count toward the puzzle (one that appeared during the pause starts now).
    started = started > pausedAt ? Date.now() : started + (Date.now() - pausedAt);
    overlay.remove();
  }
  /** Leaving the app (a call, switching apps) pauses and saves, so nothing is lost. */
  function onHide(): void {
    if (document.visibilityState !== 'hidden' || i >= queue.length) return;
    pause();
    saveRun();
  }
  document.addEventListener('visibilitychange', onHide);
  pauseBtn.addEventListener('click', pause);
  resumeBtn.addEventListener('click', resume);
  saveBtn.addEventListener('click', () => {
    saveRun();
    exit();
  });
  quitBtn.addEventListener('click', () => {
    if (canSave) {
      delete state.runs[o.set.id];
      save();
    }
    exit();
  });
  close.addEventListener('click', () => {
    if (i === 0 && !resolved) return exit();
    pause();
  });

  show();
}
