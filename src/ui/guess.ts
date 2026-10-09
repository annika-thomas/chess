import { Chess } from 'chess.js';
import { moveLoss } from '../engine/bot';
import { formatMoves, parseLine, sameSan, sideToMove, squaresFor } from '../engine/notation';
import { addXp, save, state } from '../engine/store';
import { MASTER_GAMES, type MasterGame } from '../data/masters';
import { render, sheet } from './app';
import { Board } from './board';
import { clear, figHtml, h, inline, md } from './dom';
import { sound } from './sound';
import { icon } from './icons';

const moveLabel = (ply: number, san: string) => formatMoves([...Array(ply).fill(''), san], ply);

/** Points for a guess that isn't the master's move, from how much worse the engine thinks it is. */
export function pointsForLoss(loss: number): { points: number; verdict: string } {
  if (loss <= 25) return { points: 2, verdict: 'Excellent alternative!' };
  if (loss <= 80) return { points: 1, verdict: 'Good move.' };
  if (loss <= 200) return { points: 0, verdict: 'Playable, but not the strongest.' };
  return { points: 0, verdict: 'A real mistake here.' };
}

export function masterCards(): HTMLElement {
  return h(
    'section',
    h('h4.section-title', 'Guess the Move · Master games'),
    h('p.muted.pad', 'Play through classic games as the winner. Predict each move, and score points when you think like a master.'),
    ...MASTER_GAMES.map((g) => {
      const rec = state.masters[g.id];
      const row = h(
        'button.row.line-row',
        { type: 'button' },
        h('span.result-dot.master', g.side === 'w' ? '♔' : '♚'),
        h(
          'div.row-main',
          h('b', g.title),
          h('small.muted', `${g.white} – ${g.black}, ${g.year} · ${g.opening}`),
          h('span.stars', ...[1, 2, 3].map((k) => icon(k <= g.difficulty ? 'star' : 'starEmpty'))),
        ),
        rec ? h('span.delta.up', `${Math.round((rec.best / rec.max) * 100)}%`) : h('span.chev', '›'),
      );
      row.addEventListener('click', () => startGuess(g));
      return row;
    }),
  );
}

function startGuess(g: MasterGame): void {
  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  const { moves, notes } = parseLine(g.line);
  const player = g.side === 'w' ? g.white : g.black;
  const short = player.split(' ').pop()!;
  let i = 0;
  let points = 0;
  let max = 0;
  let matched = 0;
  let guesses = 0;
  let hinted = false;
  /** Position at the start of the learner's turn, for judging the guess. */
  let turnFen = '';
  let busy = false;
  let timer: number | undefined;

  const board = new Board({
    orientation: g.side,
    onMove: (san) => {
      if (busy || i >= moves.length || sideToMove(i) !== g.side) return false;
      void judge(san);
      return true;
    },
  });
  const scoreEl = h('div.guess-score');
  const bubble = h('div.bubble.guess-bubble');
  const hint = h('button.btn.ghost', { type: 'button' }, 'Hint');
  const next = h('button.btn.primary', { type: 'button' }, 'Start');
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave' }, icon('close'));
  root.append(
    h(
      'div.session.game',
      h('header.run-head', close, h('div.game-title', g.title), scoreEl),
      h('div.player-bar', h('div', h('b', `${g.white} – ${g.black}`), ' ', h('small.muted', `${g.event} ${g.year}`))),
      board.el,
      bubble,
      h('div.game-controls', hint, next),
    ),
  );

  const showScore = () => {
    scoreEl.textContent = max ? `${points}/${max}` : '';
  };
  const say = (...parts: Array<Node | string>) => {
    clear(bubble);
    bubble.append(...parts);
    bubble.scrollTop = 0;
  };
  const note = (ply: number) =>
    h('div.note', h('b.mv', { html: figHtml(moveLabel(ply, moves[ply])) }), notes[ply] ? ' ' : null, notes[ply] ? md(notes[ply]) : null);

  const setNext = (label: string | null, fn?: () => void) => {
    next.hidden = !label;
    next.textContent = label ?? '';
    next.onclick = fn ?? null;
  };
  const setHint = (on: boolean) => {
    hint.hidden = !on;
  };

  // Intro card.
  say(h('div.note', md(`**You are ${player}** (${g.side === 'w' ? 'White' : 'Black'}). ${g.intro}`)));
  setHint(false);
  setNext('Start', () => advance());
  showScore();

  /** Play opponent moves until it's the learner's turn. */
  function advance(): void {
    setNext(null);
    if (i >= moves.length) return finish();
    if (sideToMove(i) !== g.side) {
      busy = true;
      timer = window.setTimeout(() => {
        board.play(moves[i]);
        say(note(i));
        i++;
        busy = false;
        advance();
      }, 650);
      return;
    }
    hinted = false;
    turnFen = board.chess.fen();
    board.arrows([]);
    board.highlight([]);
    setHint(true);
    board.setInteractive(true);
    const prev = i > 0 ? note(i - 1) : null;
    say(...(prev ? [prev] : []), h('div.note.prompt-note', { html: inline(`**Your move.** What did ${short} play?`) }));
  }

  hint.addEventListener('click', () => {
    if (busy || hinted || sideToMove(i) !== g.side) return;
    hinted = true;
    const sq = squaresFor(board.chess, moves[i]);
    if (sq) board.highlight([sq.from], 'mentor-target');
    bubble.append(h('div.note.muted', 'Hint: the highlighted piece moves. This move is now worth up to 2 points.'));
  });

  async function judge(san: string): Promise<void> {
    busy = true;
    board.setInteractive(false);
    setHint(false);
    const ply = i;
    const master = moves[ply];
    const full = hinted ? 2 : 3;
    max += 3;
    guesses++;
    const exact = sameSan(san, master) || (g.alts?.[ply] ?? []).some((a) => sameSan(a, san));
    if (exact) {
      points += full;
      matched++;
      sound.correct();
      showScore();
      say(h('div.verdict.good', icon('check'), ` ${sameSan(san, master) ? `${short}’s move!` : 'Also wins!'} +${full}`), note(ply));
      if (!sameSan(san, master)) {
        // An equally good alternative (e.g. another mate): show the game move too.
        board.undo();
        board.play(master);
      }
      i++;
      busy = false;
      return setNext(i >= moves.length ? 'Finish' : 'Next', advance);
    }
    // Not the game move: ask the engine how good it was, then show what the master played.
    const fenBefore = turnFen;
    say(h('div.verdict', 'Checking your move…'));
    let verdict = '';
    let pts = 0;
    try {
      const loss = await moveLoss(fenBefore, san);
      ({ points: pts, verdict } = pointsForLoss(loss));
      pts = Math.min(pts, full);
    } catch {
      verdict = 'Couldn’t check this move (engine unavailable).';
    }
    points += pts;
    showScore();
    (pts > 0 ? sound.move : sound.wrong)();
    // Show the learner's move briefly, then the master's.
    const tried = moveLabel(ply, san);
    timer = window.setTimeout(() => {
      board.undo();
      board.play(master);
      const sq = squaresFor(new Chess(fenBefore), master);
      if (sq) board.arrows([{ from: sq.from, to: sq.to, color: 'green' }]);
      say(
        h(pts > 0 ? 'div.verdict.ok' : 'div.verdict.bad', { html: inline(`You played ${tried}. ${verdict}${pts ? ` +${pts}` : ''}`) }),
        h('div.note', { html: inline(`**${short} played ${moveLabel(ply, master)}.**`) }),
        note(ply),
      );
      i++;
      busy = false;
      setNext(i >= moves.length ? 'Finish' : 'Next', advance);
    }, 700);
  }

  function finish(): void {
    setHint(false);
    setNext(null);
    const prev = state.masters[g.id];
    const best = Math.max(prev?.best ?? 0, points);
    state.masters[g.id] = { best, max, plays: (prev?.plays ?? 0) + 1 };
    addXp(5 + matched);
    save();
    sound.finish();
    const pct = max ? Math.round((points / max) * 100) : 0;
    const title = pct >= 85 ? 'Master-level thinking!' : pct >= 60 ? 'Strong play!' : pct >= 35 ? 'Good effort' : 'Now you know the ideas';
    const again = h('button.btn.ghost.wide', { type: 'button' }, 'Play again');
    const done = h('button.btn.primary.wide', { type: 'button' }, 'Done');
    const closeSheet = sheet(
      h(
        'div.result-sheet',
        h('div.sheet-art', icon(pct >= 60 ? 'trophy' : 'bulb')),
        h('h2', title),
        h('div.rating-change', h('b', `${points} / ${max}`), ` · ${pct}%`),
        h('p.muted', `You matched ${matched} of ${guesses} moves.${prev && points > prev.best ? ' New best!' : ''}`),
        md(g.outro),
        h('div.stack', done, again),
      ),
    );
    const leave = () => {
      closeSheet();
      clearTimeout(timer);
      board.destroy();
      document.body.classList.remove('locked');
    };
    done.addEventListener('click', () => {
      leave();
      render();
    });
    again.addEventListener('click', () => {
      leave();
      startGuess(g);
    });
  }

  close.addEventListener('click', () => {
    if (i > 2 && i < moves.length && !confirm('Leave this game? Your score won’t be saved.')) return;
    clearTimeout(timer);
    board.destroy();
    document.body.classList.remove('locked');
    render();
  });
}
