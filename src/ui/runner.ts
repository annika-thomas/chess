import type { Item } from '../engine/coach';
import { formatMoves, parseLine, sameSan, sideToMove, squaresFor } from '../engine/notation';
import type { Grade } from '../engine/srs';
import { addXp, completeLesson, currentStreak, gradeCard, recordTags, save, state, xpToday } from '../engine/store';
import type { ChoiceExercise, Exercise, FindExercise, InfoExercise, RecallExercise, WalkExercise } from '../types';
import { Board, pawnSkeleton } from './board';
import { clear, h, md, shuffle } from './dom';
import { sound } from './sound';

export interface Result {
  correct: boolean;
  grade: Grade;
  /** Info cards and walkthroughs aren't scored and skip the feedback sheet. */
  quiet?: boolean;
  title?: string;
  detail?: string;
}

interface Ctx {
  /** Configure the main bottom button. */
  button(label: string, onClick: () => void, enabled?: boolean): void;
  /** Optional secondary action (e.g. Hint). */
  secondary(label: string | null, onClick?: () => void): void;
  done(r: Result): void;
}

type Mount = (host: HTMLElement, ctx: Ctx) => (() => void) | void;

export interface RunOptions {
  title: string;
  items: Item[];
  mode: 'lesson' | 'practice';
  lessonId?: string;
  onExit: () => void;
}

const moveLabel = (ply: number, san: string) => formatMoves([...Array(ply).fill(''), san], ply);

/** Ply index of the side to move in a FEN. */
const fenPly = (fen: string) => {
  const [, turn, , , , full] = fen.split(' ');
  return (Number(full || 1) - 1) * 2 + (turn === 'b' ? 1 : 0);
};

// ───────────────────────── Exercise views ─────────────────────────

function prompt(text: string, sub?: string): HTMLElement {
  return h('div.prompt', h('h2', text), sub ? h('p.sub', sub) : null);
}

function noteBubble(): { el: HTMLElement; show(ply: number, san: string, note: string): void; reset(text?: string): void } {
  const el = h('div.bubble');
  return {
    el,
    show(ply, san, note) {
      const row = h('div.note', h('b.mv', moveLabel(ply, san)), note ? ' ' : null, note ? md(note) : null);
      el.prepend(row);
      while (el.children.length > 2) el.lastElementChild!.remove();
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 300);
    },
    reset(text) {
      clear(el);
      if (text) el.append(h('div.note.muted', text));
    },
  };
}

const mountInfo =
  (ex: InfoExercise): Mount =>
  (host, ctx) => {
    let board: Board | undefined;
    if (ex.setup !== undefined || ex.fen || ex.highlights || ex.arrows) {
      board = new Board({ orientation: ex.side ?? 'w', viewOnly: true });
      board.load(parseLine(ex.setup ?? '').moves, ex.fen);
      board.arrows(ex.arrows);
      board.highlight(ex.highlights);
    }
    host.append(h('div.info', ex.title ? h('h2', ex.title) : null, board?.el, md(ex.text)));
    ctx.button('Continue', () => ctx.done({ correct: true, grade: 3, quiet: true }));
    return () => board?.destroy();
  };

function lineDriver(
  ex: WalkExercise | RecallExercise,
  host: HTMLElement,
  ctx: Ctx,
  guided: boolean,
): () => void {
  const { moves, notes } = parseLine(ex.line);
  const from = ex.from ?? 0;
  let i = from;
  let mistakes = 0;
  let wrongHere = 0;
  const missed: string[] = [];
  let timer: number | undefined;
  const bubble = noteBubble();

  const board = new Board({
    orientation: ex.side,
    onMove: (san) => {
      if (sameSan(san, moves[i])) {
        board.arrows([]);
        bubble.show(i, moves[i], notes[i]);
        i++;
        wrongHere = 0;
        board.setInteractive(false);
        timer = window.setTimeout(step, 60);
        return true;
      }
      sound.wrong();
      wrongHere++;
      if (!guided) {
        if (wrongHere === 1) {
          mistakes++;
          missed.push(moveLabel(i, moves[i]));
        }
        if (wrongHere >= 2) showHint();
      }
      host.querySelector('.board-wrap')?.classList.add('shake');
      setTimeout(() => host.querySelector('.board-wrap')?.classList.remove('shake'), 400);
      return false;
    },
  });
  board.load(moves.slice(0, from));

  const showHint = () => {
    const sq = squaresFor(board.chess, moves[i]);
    if (sq) board.arrows([{ from: sq.from, to: sq.to, color: guided ? 'green' : 'yellow' }]);
  };

  const title = guided
    ? (ex as WalkExercise).title ?? 'Play along'
    : (ex as RecallExercise).prompt ?? 'Play the line from memory';
  const sub = guided
    ? 'Follow the green arrows. Read why each move is played.'
    : from > 0
      ? `Starting after ${formatMoves(moves.slice(0, from))}`
      : 'Your opponent’s moves are played for you.';
  host.append(prompt(title, sub), board.el, bubble.el);
  bubble.reset(guided ? undefined : 'Your move.');

  function step(): void {
    if (i >= moves.length) {
      board.setInteractive(false);
      ctx.secondary(null);
      if (guided) {
        ctx.button('Continue', () => ctx.done({ correct: true, grade: 3, quiet: true }));
      } else {
        const learnerMoves = moves.slice(from).filter((_, k) => sideToMove(from + k) === ex.side).length;
        const grade: Grade = mistakes === 0 ? 3 : mistakes === 1 && learnerMoves >= 4 ? 2 : 1;
        ctx.done({
          correct: mistakes === 0,
          grade,
          title: mistakes === 0 ? 'Perfect line!' : mistakes === 1 ? 'Almost!' : `${mistakes} slips`,
          detail: mistakes ? `Review: ${missed.join(', ')}` : `${formatMoves(moves)}`,
        });
      }
      return;
    }
    if (sideToMove(i) !== ex.side) {
      timer = window.setTimeout(
        () => {
          board.play(moves[i]);
          bubble.show(i, moves[i], notes[i]);
          i++;
          step();
        },
        i === from ? 350 : 650,
      );
      return;
    }
    if (guided) showHint();
    board.setInteractive(true);
  }

  if (!guided) {
    ctx.secondary('Hint', () => {
      if (i < moves.length && sideToMove(i) === ex.side) {
        if (wrongHere === 0) {
          mistakes++;
          missed.push(moveLabel(i, moves[i]));
          wrongHere = 1;
        }
        showHint();
      }
    });
  }
  ctx.button('Your move', () => undefined, false);
  step();
  return () => {
    clearTimeout(timer);
    board.destroy();
  };
}

const mountWalk =
  (ex: WalkExercise): Mount =>
  (host, ctx) =>
    lineDriver(ex, host, ctx, true);

const mountRecall =
  (ex: RecallExercise): Mount =>
  (host, ctx) =>
    lineDriver(ex, host, ctx, false);

const mountFind =
  (ex: FindExercise): Mount =>
  (host, ctx) => {
    let j = 0;
    let timer: number | undefined;
    const setupMoves = parseLine(ex.setup ?? '').moves;
    const board = new Board({
      orientation: ex.side,
      onMove: (san) => {
        const expected = ex.solution[j];
        const alt = j === 0 && (ex.accept ?? []).some((a) => sameSan(a, san));
        if (sameSan(san, expected) || alt) {
          sound.correct();
          j++;
          board.setInteractive(false);
          if (alt || j >= ex.solution.length) {
            finish(true);
          } else {
            timer = window.setTimeout(() => {
              board.play(ex.solution[j]);
              j++;
              if (j >= ex.solution.length) finish(true);
              else board.setInteractive(true);
            }, 600);
          }
          return true;
        }
        sound.wrong();
        board.setInteractive(false);
        setTimeout(() => {
          const sq = squaresFor(board.chess, expected);
          if (sq) board.arrows([{ from: sq.from, to: sq.to, color: 'green' }]);
          finish(false, san);
        }, 300);
        return false;
      },
    });
    board.load(setupMoves, ex.fen);
    board.arrows(ex.arrows);
    const ctxLine = setupMoves.length ? `After ${formatMoves(setupMoves.slice(-4), Math.max(0, setupMoves.length - 4))}` : undefined;
    host.append(prompt(ex.prompt, ctxLine), board.el);
    board.setInteractive(true);
    ctx.button('Your move', () => undefined, false);
    ctx.secondary('Show me', () => {
      const sq = squaresFor(board.chess, ex.solution[j]);
      board.setInteractive(false);
      if (sq) board.arrows([{ from: sq.from, to: sq.to, color: 'yellow' }]);
      finish(false);
    });

    function finish(correct: boolean, tried?: string): void {
      ctx.secondary(null);
      const startPly = ex.fen ? fenPly(ex.fen) : setupMoves.length;
      const answer = formatMoves([...Array(startPly).fill(''), ...ex.solution], startPly);
      ctx.done({
        correct,
        grade: correct ? 3 : 1,
        title: correct ? 'Correct!' : tried ? `Not ${tried}` : 'Here’s the idea',
        detail: (correct ? '' : `Solution: **${answer}**\n\n`) + ex.explain,
      });
    }
    return () => {
      clearTimeout(timer);
      board.destroy();
    };
  };

const mountChoice =
  (ex: ChoiceExercise): Mount =>
  (host, ctx) => {
    let board: Board | undefined;
    let flashTimer: number | undefined;
    const hasBoard = ex.setup !== undefined || !!ex.fen;
    const wrap = h('div.choice');
    const opts = h('div.options');
    const options = ex.options.length > 2 ? shuffle(ex.options) : ex.options;
    let picked = -1;

    options.forEach((o, idx) => {
      const btn = h('button.option', { type: 'button' }, o.text);
      btn.addEventListener('click', () => {
        picked = idx;
        opts.querySelectorAll('.option').forEach((b, k) => b.classList.toggle('selected', k === idx));
        ctx.button('Check', check, true);
      });
      opts.append(btn);
    });

    if (hasBoard) {
      board = new Board({ orientation: ex.side ?? 'w', viewOnly: true });
      board.load(parseLine(ex.setup ?? '').moves, ex.fen);
      if (ex.pawnsOnly) board.showFen(pawnSkeleton(board.chess.fen()));
      board.arrows(ex.arrows);
      board.highlight(ex.highlights);
    }

    const secs = ex.flash ? Math.round(ex.flash / 1000) : 0;
    wrap.append(prompt(ex.prompt, ex.flash ? `Read the question first. When you tap Show board, you get ${secs} seconds to look.` : undefined));
    if (board) wrap.append(board.el);
    wrap.append(opts);
    host.append(wrap);

    // While the options are visible, the board shrinks to leave room for them.
    const fit = () => wrap.style.setProperty('--n', String(options.length));
    if (ex.flash && board) {
      // Flash drills: the board stays covered until the learner has read the question and taps to start,
      // so the timer only measures looking at the position.
      board.el.classList.add('veiled', 'waiting');
      opts.classList.add('hidden');
      const sub = wrap.querySelector('.sub');
      ctx.button('Show board', () => {
        board!.el.classList.remove('veiled', 'waiting');
        board!.el.append(h('div.flashbar', h('div', { style: `animation-duration:${ex.flash}ms` })));
        if (sub) sub.textContent = `Memorize it: ${secs} seconds…`;
        ctx.button('Check', check, false);
        flashTimer = window.setTimeout(() => {
          board!.el.classList.add('veiled');
          fit();
          opts.classList.remove('hidden');
          if (sub) sub.textContent = 'From memory:';
        }, ex.flash);
      });
    } else {
      fit();
      ctx.button('Check', check, false);
    }

    function check(): void {
      if (picked < 0) return;
      const o = options[picked];
      const right = options.find((x) => x.correct)!;
      opts.querySelectorAll('.option').forEach((b, k) => {
        b.classList.toggle('right', options[k].correct === true);
        b.classList.toggle('wrong', k === picked && !o.correct);
        (b as HTMLButtonElement).disabled = true;
      });
      board?.el.classList.remove('veiled');
      const parts = [o.why, o.correct ? '' : `Answer: **${right.text}**. ${right.why ?? ''}`, ex.explain].filter(Boolean);
      ctx.done({
        correct: !!o.correct,
        grade: o.correct ? 3 : 1,
        title: o.correct ? 'Correct!' : 'Not quite',
        detail: parts.join('\n\n'),
      });
    }
    return () => {
      clearTimeout(flashTimer);
      board?.destroy();
    };
  };

export function mountExercise(ex: Exercise): Mount {
  switch (ex.type) {
    case 'info':
      return mountInfo(ex);
    case 'walk':
      return mountWalk(ex);
    case 'recall':
      return mountRecall(ex);
    case 'find':
      return mountFind(ex);
    case 'choice':
      return mountChoice(ex);
  }
}

// ───────────────────────── Session runner ─────────────────────────

interface Slot {
  item: Item;
  /** Index into the original items, so a retry doesn't re-grade. */
  origin: number;
  retry: boolean;
}

const PRAISE = ['Nice!', 'Great!', 'Excellent!', 'Sharp!', 'You got it!', 'Brilliant!'];

export function runSession(root: HTMLElement, opts: RunOptions): void {
  const queue: Slot[] = opts.items.map((item, origin) => ({ item, origin, retry: false }));
  const first = new Map<number, Result>();
  const started = Date.now();
  let pos = 0;
  let combo = 0;
  let cleanup: (() => void) | void;

  clear(root);
  const bar = h('div.progress', h('div.fill'));
  const close = h('button.icon-btn.close', { 'aria-label': 'Quit', type: 'button' }, '✕');
  const comboEl = h('div.combo');
  const header = h('header.run-head', close, bar, comboEl);
  const stage = h('main.stage');
  const fbTitle = h('div.fb-title');
  const fbDetail = h('div.fb-detail');
  const secondary = h('button.btn.ghost', { type: 'button' });
  const primary = h('button.btn.primary', { type: 'button' });
  const sheet = h('footer.sheet', h('div.fb', fbTitle, fbDetail), h('div.actions', secondary, primary));
  const screen = h('div.runner', header, stage, sheet);
  root.append(screen);

  close.addEventListener('click', () => {
    if (pos === 0 || confirm('Quit this session? Progress in it will be lost.')) {
      cleanup?.();
      opts.onExit();
    }
  });

  let primaryHandler: () => void = () => undefined;
  let secondaryHandler: (() => void) | undefined;
  primary.addEventListener('click', () => primaryHandler());
  secondary.addEventListener('click', () => secondaryHandler?.());

  const ctx: Ctx = {
    button(label, onClick, enabled = true) {
      primary.textContent = label;
      primary.disabled = !enabled;
      primaryHandler = onClick;
    },
    secondary(label, onClick) {
      secondary.hidden = !label;
      secondary.textContent = label ?? '';
      secondaryHandler = onClick;
    },
    done(r) {
      const slot = queue[pos];
      if (!slot.retry && slot.item.cardId && !r.quiet) first.set(slot.origin, r);
      if (r.quiet) return advance();
      if (!r.correct && opts.mode === 'lesson' && !slot.retry && slot.item.cardId) {
        queue.push({ ...slot, retry: true });
      }
      combo = r.correct ? combo + 1 : 0;
      comboEl.textContent = combo >= 3 ? `🔥 ${combo}` : '';
      (r.correct ? sound.correct : sound.wrong)();
      sheet.className = `sheet ${r.correct ? 'ok' : 'bad'}`;
      fbTitle.textContent = r.correct ? (r.title === 'Correct!' ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : r.title ?? '') : r.title ?? 'Not quite';
      clear(fbDetail);
      if (r.detail) fbDetail.append(md(r.detail));
      ctx.secondary(null);
      ctx.button('Continue', advance);
    },
  };

  function advance(): void {
    cleanup?.();
    pos++;
    render();
  }

  function render(): void {
    (bar.firstChild as HTMLElement).style.width = `${(pos / queue.length) * 100}%`;
    if (pos >= queue.length) return finish();
    clear(stage);
    sheet.className = 'sheet';
    clear(fbDetail);
    fbTitle.textContent = '';
    ctx.secondary(null);
    const slot = queue[pos];
    const card = h('div.ex-card');
    if (slot.retry) card.append(h('div.tag.retry', '↺ Let’s try that again'));
    else if (slot.item.label && opts.mode === 'practice') card.append(h('div.tag', slot.item.label));
    stage.append(card);
    cleanup = mountExercise(slot.item.exercise)(card, ctx);
    stage.scrollTop = 0;
  }

  function finish(): void {
    const results = [...first.entries()];
    const graded = results.length;
    const correct = results.filter(([, r]) => r.correct).length;
    const mistakes = graded - correct;
    const now = Date.now();
    for (const [origin, r] of results) {
      const item = opts.items[origin];
      if (item.cardId) gradeCard(item.cardId, opts.mode === 'lesson' && r.correct ? 3 : r.grade, now);
      recordTags(item.tags, r.correct, now);
    }
    const before = currentStreak(now);
    const xp = opts.mode === 'lesson' ? 10 + (mistakes === 0 ? 5 : 0) : 5 + correct;
    addXp(xp, now);
    if (opts.lessonId) completeLesson(opts.lessonId, mistakes, now);
    save();
    sound.finish();
    showSummary(root, {
      title: opts.mode === 'lesson' ? 'Lesson complete!' : 'Practice complete!',
      xp,
      accuracy: graded ? Math.round((correct / graded) * 100) : 100,
      seconds: Math.round((Date.now() - started) / 1000),
      streak: currentStreak(now),
      streakUp: currentStreak(now) > before,
      goalHit: xpToday(now) >= state.profile.goal,
      perfect: graded > 0 && mistakes === 0,
      onDone: opts.onExit,
    });
  }

  render();
}

interface Summary {
  title: string;
  xp: number;
  accuracy: number;
  seconds: number;
  streak: number;
  streakUp: boolean;
  goalHit: boolean;
  perfect: boolean;
  onDone: () => void;
}

function showSummary(root: HTMLElement, s: Summary): void {
  clear(root);
  const mins = Math.floor(s.seconds / 60);
  const time = `${mins}:${String(s.seconds % 60).padStart(2, '0')}`;
  const stat = (label: string, value: string, cls: string) => h(`div.stat.${cls}`, h('div.label', label), h('div.value', value));
  const btn = h('button.btn.primary.wide', { type: 'button' }, 'Continue');
  btn.addEventListener('click', s.onDone);
  root.append(
    h(
      'div.summary',
      h('div.trophy', s.perfect ? '🏆' : '♞'),
      h('h1', s.perfect ? 'Flawless!' : s.title),
      s.streakUp ? h('p.streak-up', `🔥 ${s.streak} day streak!`) : null,
      s.goalHit ? h('p.goal-hit', '🎯 Daily goal reached') : null,
      h('div.stats', stat('XP', `+${s.xp}`, 'xp'), stat('Accuracy', `${s.accuracy}%`, 'acc'), stat('Time', time, 'time')),
      btn,
    ),
  );
}
