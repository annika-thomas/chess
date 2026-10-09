import type { Item } from '../engine/coach';
import { formatMoves, parseLine, sameSan, sideToMove, squaresFor } from '../engine/notation';
import type { Grade } from '../engine/srs';
import { addXp, completeLesson, currentStreak, gradeCard, markHomework, recordTags, save, state, xpToday } from '../engine/store';
import type { ChoiceExercise, EndgameExercise, Exercise, FindExercise, InfoExercise, RecallExercise, SquareExercise, WalkExercise } from '../types';
import { engine } from '../engine/bot';
import { Chess } from 'chess.js';
import { Board, pawnSkeleton } from './board';
import { clear, figHtml, h, inline, md, shuffle } from './dom';
import { sound } from './sound';
import { icon } from './icons';

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
  /** Homework key to mark done when the session finishes. */
  homework?: string;
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
  return h('div.prompt', h('h2', { html: inline(text) }), sub ? h('p.sub', { html: inline(sub) }) : null);
}

function noteBubble(): { el: HTMLElement; show(ply: number, san: string, note: string): void; reset(text?: string): void } {
  const el = h('div.bubble');
  return {
    el,
    show(ply, san, note) {
      const row = h('div.note', h('b.mv', { html: figHtml(moveLabel(ply, san)) }), note ? ' ' : null, note ? md(note) : null);
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
      const btn = h('button.option', { type: 'button', html: inline(o.text, false) });
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
          opts.classList.remove('hidden');
          if (sub) sub.textContent = 'From memory:';
        }, ex.flash);
      });
    } else {
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

const ALL_FILES = 'abcdefgh';
const ALL_RANKS = '12345678';

function randomSquares(ex: SquareExercise, n: number): string[] {
  const files = ex.files ?? ALL_FILES;
  const ranks = ex.ranks ?? ALL_RANKS;
  const out: string[] = [];
  while (out.length < n) {
    const sq = files[Math.floor(Math.random() * files.length)] + ranks[Math.floor(Math.random() * ranks.length)];
    // No immediate repeats, and avoid the same square twice in a short drill.
    if (sq !== out[out.length - 1] && (n > 30 || !out.includes(sq))) out.push(sq);
  }
  return out;
}

/** Three plausible wrong names: same file, same rank, and the square mirrored (the classic "board flipped" slip). */
function squareDistractors(sq: string): string[] {
  const f = sq[0];
  const r = sq[1];
  const others = new Set<string>();
  const mirror = ALL_FILES[7 - ALL_FILES.indexOf(f)] + ALL_RANKS[7 - ALL_RANKS.indexOf(r)];
  if (mirror !== sq) others.add(mirror);
  while (others.size < 3) {
    const c =
      others.size % 2
        ? f + ALL_RANKS[Math.floor(Math.random() * 8)]
        : ALL_FILES[Math.floor(Math.random() * 8)] + r;
    if (c !== sq) others.add(c);
  }
  return [...others].slice(0, 3);
}

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

const mountSquare =
  (ex: SquareExercise): Mount =>
  (host, ctx) => {
    const side = ex.side ?? 'w';
    const timed = !!ex.seconds;
    const queue = ex.squares ?? randomSquares(ex, timed ? 400 : ex.count ?? 8);
    let i = 0;
    let right = 0;
    let wrong = 0;
    let locked = false;
    let timer: number | undefined;
    let ticker: number | undefined;
    const started = Date.now();
    const missed: string[] = [];

    const target = h('div.sq-target');
    const counter = h('div.sq-counter');
    const opts = h('div.options.sq-options');
    const board = new Board({
      orientation: side,
      onSelect: ex.mode === 'tap' ? (sq) => answer(sq) : undefined,
    });
    if (!ex.pieces) board.showFen(EMPTY);

    const title =
      ex.prompt ??
      (ex.mode === 'tap'
        ? timed
          ? `Tap each square as fast as you can: ${ex.seconds} seconds!`
          : 'Tap the square'
        : 'Name the highlighted square');
    host.append(
      prompt(title, side === 'b' ? 'You’re viewing from Black’s side: a1 is now top-right.' : 'You’re viewing from White’s side: a1 is bottom-left.'),
      h('div.sq-head', target, counter),
      board.el,
      opts,
    );

    const updateCounter = () => {
      if (timed) {
        const left = Math.max(0, ex.seconds! - Math.floor((Date.now() - started) / 1000));
        counter.replaceChildren(icon('timer'), ` ${left}s  `, icon('check', 'ok'), ` ${right}`);
      } else counter.textContent = `${Math.min(i + 1, queue.length)} / ${queue.length}`;
    };

    const show = () => {
      locked = false;
      const sq = queue[i];
      updateCounter();
      board.highlight([]);
      clear(opts);
      if (ex.mode === 'tap') {
        target.textContent = sq;
      } else {
        target.textContent = '?';
        board.highlight([sq], 'mentor-target');
        for (const name of shuffle([sq, ...squareDistractors(sq)])) {
          const b = h('button.option.sq-opt', { type: 'button' }, name);
          b.addEventListener('click', () => answer(name, b));
          opts.append(b);
        }
      }
    };

    function answer(given: string, btn?: HTMLElement): void {
      if (locked || i >= queue.length) return;
      const sq = queue[i];
      const ok = given === sq;
      if (ok) {
        right++;
        sound.move();
      } else {
        wrong++;
        missed.push(sq);
        sound.wrong();
      }
      // Show where it really was (green) and where you tapped (red).
      if (ex.mode === 'tap') {
        board.mark([sq], ok ? [] : [given]);
        if (!ok) target.textContent = `${sq} is here`;
      } else {
        btn?.classList.add(ok ? 'right' : 'wrong');
        if (!ok) opts.querySelectorAll('.option').forEach((b) => b.textContent === sq && b.classList.add('right'));
      }
      locked = true;
      i++;
      const pause = ok ? (timed ? 120 : 350) : 900;
      timer = window.setTimeout(() => (i >= queue.length ? finish() : show()), pause);
    }

    let finished = false;
    function finish(): void {
      // The sprint timer and the last answer can both end the drill; only finish once.
      if (finished) return;
      finished = true;
      clearInterval(ticker);
      clearTimeout(timer);
      board.highlight([]);
      locked = true;
      const secs = (Date.now() - started) / 1000;
      const total = right + wrong;
      const avg = total ? (secs / total).toFixed(1) : '–';
      if (timed) {
        const best = state.sprintBest[side];
        const isBest = right > best;
        if (isBest) {
          state.sprintBest[side] = right;
          save();
        }
        ctx.done({
          correct: wrong <= Math.max(1, Math.round(total * 0.1)),
          grade: 3,
          title: isBest ? `New best: ${right} squares!` : `${right} squares`,
          detail: `${wrong ? `${wrong} miss${wrong > 1 ? 'es' : ''} (${missed.slice(0, 6).join(', ')}). ` : 'No misses! '}About ${avg}s per square.${isBest ? '' : ` Your best as ${side === 'w' ? 'White' : 'Black'}: ${best}.`}`,
        });
        return;
      }
      const accuracy = right / queue.length;
      ctx.done({
        correct: accuracy >= 0.85,
        grade: accuracy === 1 ? 3 : accuracy >= 0.85 ? 2 : 1,
        title: accuracy === 1 ? `All ${queue.length} right!` : `${right} / ${queue.length}`,
        detail: `${missed.length ? `Missed: **${missed.join(', ')}**. ` : ''}About ${avg}s per square: speed comes with repetition.`,
      });
    }

    ctx.button(ex.mode === 'tap' ? 'Tap the board' : 'Pick a name', () => undefined, false);
    show();
    if (timed) {
      ticker = window.setInterval(() => {
        updateCounter();
        if (Date.now() - started >= ex.seconds! * 1000) {
          i = queue.length;
          finish();
        }
      }, 250);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(ticker);
      board.destroy();
    };
  };

/** Count pieces of one kind and color in a position. */
const countPieces = (fen: string, piece: string) => [...fen.split(' ')[0]].filter((c) => c === piece).length;

const mountEndgame =
  (ex: EndgameExercise): Mount =>
  (host, ctx) => {
    const fen = ex.fens[Math.floor(Math.random() * ex.fens.length)];
    const me = ex.side;
    const them = me === 'w' ? 'b' : 'w';
    const myQueen = me === 'w' ? 'Q' : 'q';
    const theirQueen = me === 'w' ? 'q' : 'Q';
    const theirPawn = me === 'w' ? 'p' : 'P';
    let myMoves = 0;
    let over = false;
    let timer: number | undefined;
    const status = h('div.sq-counter');
    const board = new Board({
      orientation: me,
      onMove: () => {
        if (over || board.chess.turn() === me) return false;
        myMoves++;
        updateStatus();
        timer = window.setTimeout(afterMine, 120);
        return true;
      },
    });
    board.load([], fen);
    host.append(prompt(ex.prompt, `${me === 'w' ? 'White' : 'Black'} to play · ${goalText()}`), h('div.sq-head', h('div'), status), board.el);
    ctx.button('Your move', () => undefined, false);

    function goalText(): string {
      return ex.goal === 'mate'
        ? `checkmate within ${ex.limit} moves`
        : ex.goal === 'promote'
          ? `promote and keep your new queen (${ex.limit} moves)`
          : `stop the pawn for ${ex.limit} moves`;
    }
    function updateStatus(): void {
      status.textContent = `Move ${myMoves} / ${ex.limit}`;
    }

    function end(success: boolean, why: string): void {
      if (over) return;
      over = true;
      board.setInteractive(false);
      ctx.done({ correct: success, grade: success ? 3 : 1, title: success ? 'Done!' : 'Not this time', detail: `${why}\n\n${ex.explain}` });
    }

    /** Check goals after any move; returns true if the drill ended. */
    function judge(): boolean {
      const c = board.chess;
      const f = c.fen();
      if (c.isCheckmate()) {
        end(c.turn() === them, c.turn() === them ? `Checkmate in ${myMoves} moves.` : 'You were checkmated.');
        return true;
      }
      if (c.isStalemate()) {
        end(ex.goal === 'hold', ex.goal === 'hold' ? 'Stalemate: a draw, so you held.' : 'Stalemate! The game is a draw: always leave the king a square.');
        return true;
      }
      if (ex.goal === 'hold') {
        if (countPieces(f, theirQueen) > 0) {
          end(false, 'The pawn promoted.');
          return true;
        }
        if (countPieces(f, theirPawn) === 0) {
          end(true, 'You won the pawn: a draw.');
          return true;
        }
      }
      if (ex.goal === 'mate' && countPieces(f, myQueen) === 0 && countPieces(f, me === 'w' ? 'R' : 'r') === 0) {
        end(false, `Your ${countPieces(fen, myQueen) ? 'queen' : 'rook'} was captured: with a bare king it’s a draw. Keep it protected or a safe distance away.`);
        return true;
      }
      if (c.isDraw()) {
        end(ex.goal === 'hold', ex.goal === 'hold' ? 'A draw: you held.' : 'The position is a draw now.');
        return true;
      }
      return false;
    }

    function afterMine(): void {
      if (judge()) return;
      if (ex.goal === 'promote' && countPieces(board.chess.fen(), myQueen) > 0) {
        // Promoted: success if the queen survives the reply.
        void reply().then(() => {
          if (over) return;
          if (countPieces(board.chess.fen(), myQueen) > 0) end(true, `Promoted in ${myMoves} moves and kept the queen.`);
          else end(false, 'Your new queen was captured.');
        });
        return;
      }
      if (myMoves >= ex.limit) {
        if (ex.goal === 'hold') end(true, `You held for ${ex.limit} moves.`);
        else end(false, `Move limit reached (${ex.limit}).`);
        return;
      }
      void reply().then(() => {
        if (!judge()) board.setInteractive(true);
      });
    }

    async function reply(): Promise<void> {
      board.setInteractive(false);
      status.textContent = 'Engine thinking…';
      try {
        const [best] = await engine.analyse(board.chess.fen(), { depth: 12, multipv: 1 });
        if (over || !best) return;
        const mv = new Chess(board.chess.fen()).move({ from: best.move.slice(0, 2), to: best.move.slice(2, 4), promotion: best.move[4] ?? 'q' });
        board.play(mv.san);
      } catch {
        end(false, 'The engine couldn’t start. Try reopening the app.');
        return;
      }
      updateStatus();
    }

    updateStatus();
    if (board.chess.turn() === me) board.setInteractive(true);
    else void reply().then(() => !judge() && board.setInteractive(true));
    return () => {
      over = true;
      clearTimeout(timer);
      board.destroy();
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
    case 'square':
      return mountSquare(ex);
    case 'endgame':
      return mountEndgame(ex);
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
  const close = h('button.icon-btn.close', { 'aria-label': 'Quit', type: 'button' }, icon('close'));
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
      comboEl.replaceChildren(...(combo >= 3 ? [icon('flame'), ` ${combo}`] : []));
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
    if (opts.lessonId) {
      completeLesson(opts.lessonId, mistakes, now);
      markHomework(`lesson:${opts.lessonId}`, now);
    }
    if (opts.homework) markHomework(opts.homework, now);
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
      h('div.trophy', s.perfect ? icon('trophy') : '♞'),
      h('h1', s.perfect ? 'Flawless!' : s.title),
      s.streakUp ? h('p.streak-up', icon('flame'), ` ${s.streak} day streak!`) : null,
      s.goalHit ? h('p.goal-hit', icon('target'), ' Daily goal reached') : null,
      h('div.stats', stat('XP', `+${s.xp}`, 'xp'), stat('Accuracy', `${s.accuracy}%`, 'acc'), stat('Time', time, 'time')),
      btn,
    ),
  );
}
