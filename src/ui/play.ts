import { Chess } from 'chess.js';
import { botMove, engine, evaluate, explainBlunder, isMistake, judgeMove, lossLabel, LEVELS, materialWords, levelById, type Level } from '../engine/bot';
import { annotatable, weekStart } from '../engine/homework';
import { repertoireOpen } from '../engine/levels';
import { findMistakes } from '../engine/mistakes';
import { annotateGame, uciToSan } from './annotate';
import type { Boss } from '../data/bosses';
import { formatMoves, parseLine } from '../engine/notation';
import { buildBook, gradeGame, makeDrill, type Game } from '../engine/importer';
import { fenKey, sameSan } from '../engine/notation';
import { currentRd, isProvisional, rate } from '../engine/rating';
import { addXp, save, state, type PlayedGame } from '../engine/store';
import type { Side } from '../types';
import { push, render, sheet } from './app';
import { Board } from './board';
import { clear, figHtml, h, md } from './dom';
import { topBar } from './learn';
import { masterCards } from './guess';
import { movesViewer } from './repertoire';
import { sound } from './sound';
import { icon, type IconName } from './icons';

const SPEED_LABEL: Record<string, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  daily: 'Daily',
  correspondence: 'Daily',
};

export function recommendedLevel(): Level {
  const r = state.rating.r;
  return LEVELS.reduce((best, l) => (Math.abs(l.elo - r) < Math.abs(best.elo - r) ? l : best), LEVELS[0]);
}

function sparkline(points: number[]): HTMLElement | null {
  if (points.length < 2) return null;
  const w = 280;
  const hgt = 44;
  const min = Math.min(...points) - 20;
  const max = Math.max(...points) + 20;
  const xy = points.map((p, i) => `${((i / (points.length - 1)) * w).toFixed(1)},${(hgt - ((p - min) / (max - min)) * hgt).toFixed(1)}`);
  return h('div.spark', {
    html: `<svg viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="none" width="100%" height="${hgt}"><polyline points="${xy.join(' ')}" fill="none" stroke="#81b64c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  });
}

function ratingCard(): HTMLElement {
  const r = state.rating;
  const rd = Math.round(currentRd(r));
  const low = Math.max(100, Math.round((r.r - 2 * rd) / 10) * 10);
  const high = Math.round((r.r + 2 * rd) / 10) * 10;
  const platform = state.platformRatings;
  return h(
    'section.panel.rating-card',
    h('div.rating-head', h('div', h('small.muted', 'Estimated rating'), h('div.rating-big', `~${r.r}`)), h('div.rating-range', h('b', `${low}–${high}`), h('small.muted', '95% range'))),
    h(
      'p.muted',
      r.games === 0
        ? 'Play a few games and I’ll estimate your strength. The range narrows with every game.'
        : isProvisional(r)
          ? `Provisional: based on ${r.games} game${r.games > 1 ? 's' : ''}. A few more and it settles down.`
          : `Based on ${r.games} games against the computer levels.`,
    ),
    sparkline([800, ...r.history.map((p) => p.r)]),
    platform.length
      ? h(
          'div.chips-row',
          ...platform.map((p) => h('span.rchip', `${p.source === 'lichess' ? 'Lichess' : 'Chess.com'} ${SPEED_LABEL[p.speed] ?? p.speed} `, h('b', String(p.rating)))),
        )
      : null,
    h('p.fine', 'Ratings below 1400 are approximate: those levels use my own handicap rather than Stockfish’s calibrated limiter. Lichess, Chess.com and FIDE ratings are on different scales.'),
  );
}

function setupPanel(): HTMLElement {
  const cfg = state.play;
  const rec = recommendedLevel();
  let level = levelById(cfg.level);
  const sideBtns = (['w', 'b', 'random'] as const).map((s) => {
    const b = h(`button.seg${cfg.side === s ? '.on' : ''}`, { type: 'button' }, ...(s === 'w' ? ['♔ White'] : s === 'b' ? ['♚ Black'] : [icon('shuffle'), ' Random']));
    b.addEventListener('click', () => {
      cfg.side = s;
      sideBtns.forEach((x, i) => x.classList.toggle('on', (['w', 'b', 'random'] as const)[i] === s));
      save();
    });
    return b;
  });
  const lvlName = h('b');
  const lvlElo = h('small.muted');
  const showLevel = () => {
    lvlName.textContent = `${level.id}. ${level.name}`;
    lvlElo.textContent = `~${level.elo}${level.id === rec.id ? ' · recommended for you' : ''}`;
  };
  const step = (d: number) => {
    level = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, LEVELS.indexOf(level) + d))];
    cfg.level = level.id;
    save();
    showLevel();
  };
  const minus = h('button.stepper', { type: 'button', 'aria-label': 'Easier' }, '−');
  const plus = h('button.stepper', { type: 'button', 'aria-label': 'Harder' }, '+');
  minus.addEventListener('click', () => step(-1));
  plus.addEventListener('click', () => step(1));
  showLevel();

  const rep = h('input', { type: 'checkbox', checked: cfg.repertoire });
  rep.addEventListener('change', () => {
    cfg.repertoire = rep.checked;
    save();
  });
  const guardBox = h('input', { type: 'checkbox', checked: cfg.guard });
  guardBox.addEventListener('change', () => {
    cfg.guard = guardBox.checked;
    save();
  });
  // Easy wins build loose habits: suggest the next level after 3+ wins in the last 4 rated games there.
  const recent = state.games.filter((g) => g.rated && !g.opening?.startsWith('Boss')).slice(-4);
  const atLevel = recent.filter((g) => g.level === level.id);
  const wins = atLevel.filter((g) => g.result === 'win').length;
  const harder = LEVELS[LEVELS.indexOf(level) + 1];
  let levelUp: HTMLElement | null = null;
  if (harder && atLevel.length >= 3 && wins >= 3) {
    const move = h('button.btn.primary.small-btn', { type: 'button' }, `Move up to ${harder.name}`);
    levelUp = h(
      'div.level-up',
      md(`You’ve won **${wins} of your last ${atLevel.length}** games against ${level.name}. Wins that come easily build loose habits, so try **${harder.name} (~${harder.elo})**.`),
      move,
    );
    move.addEventListener('click', () => {
      step(1);
      levelUp?.remove();
    });
  }
  const start = h('button.btn.primary.wide', { type: 'button' }, 'Play');
  start.addEventListener('click', () => {
    const side: Side = cfg.side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : cfg.side;
    startGame(side, level, cfg.repertoire);
  });
  return h(
    'section.panel',
    h('h3', 'New game'),
    h('div.seg-row', ...sideBtns),
    h('div.level-row', minus, h('div.level-label', lvlName, lvlElo), plus),
    levelUp,
    h('label.toggle', h('span', h('b', 'Opening practice'), h('br'), h('small.muted', 'The computer plays into your repertoire, and I tell you when you leave it.')), rep),
    h('label.toggle', h('span', h('b', 'Blunder guard'), h('br'), h('small.muted', 'I warn you when a move drops material, without saying why. Taking it back makes the game unrated.')), guardBox),
    start,
  );
}

function resultLabel(g: PlayedGame): string {
  return g.result === 'win' ? 'Won' : g.result === 'loss' ? 'Lost' : 'Draw';
}

function recentGames(): HTMLElement | null {
  if (!state.games.length) return null;
  return h(
    'section',
    h('h4.section-title', 'Recent games'),
    ...state.games
      .slice(-15)
      .reverse()
      .map((g) => {
        const lvl = levelById(g.level);
        const row = h(
          'button.row.line-row',
          { type: 'button' },
          h(`span.result-dot.${g.result}`, g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'D'),
          h(
            'div.row-main',
            h('b', `${g.side === 'w' ? '♔' : '♚'} vs ${lvl.name} (~${lvl.elo})`),
            h('small.muted', `${resultLabel(g)} by ${g.reason} · ${Math.ceil(g.moves.length / 2)} moves${g.opening ? ' · ' + g.opening : ''}${g.annotation ? ' · annotated' : ''}`),
          ),
          g.rated && g.delta !== undefined ? h(`span.delta${g.delta >= 0 ? '.up' : '.down'}`, `${g.delta >= 0 ? '+' : ''}${g.delta}`) : h('span.delta', '—'),
        );
        row.addEventListener('click', () => reviewGame(g));
        return row;
      }),
  );
}

export function renderPlay(host: HTMLElement): void {
  host.append(topBar('Play'), ratingCard(), setupPanel(), masterCards(), recentGames() ?? h('p.footnote', 'Your games will appear here.'));
  // Start loading the engine in the background so the first move is quick.
  engine.warmUp();
}

export function reviewGame(g: PlayedGame): void {
  const book = buildBook(g.side);
  const chess = new Chess();
  const notes = g.moves.map((san, ply) => {
    const entry = book.get(fenKey(chess.fen()));
    const fen = chess.fen();
    chess.move(san);
    const info = entry ? [...entry.moves.entries()].find(([m]) => sameSan(m, san))?.[1] : undefined;
    const parts = info ? [`**Book move.** ${info.note}`] : [];
    const mark = g.annotation?.marks.find((m) => m.ply === ply);
    if (mark) parts.push(`**Your note:** ${mark.note || '(marked as critical)'}`);
    const flag = g.annotation?.flagged.find((f) => f.ply === ply);
    if (flag) parts.push(`**Engine:** this lost ${lossLabel(flag.loss)}. Better was **${uciToSan(fen, flag.best)}**.`);
    return parts.join('\n\n');
  });
  push((el) =>
    movesViewer(el, {
      title: `vs ${levelById(g.level).name} · ${resultLabel(g)}`,
      side: g.side,
      moves: g.moves,
      notes,
      start: g.moves.length,
    }),
  );
}

// ───────────────────────── The game screen ─────────────────────────

/** Boss battle: play on from a unit's position against the level recommended for you. */
export function startBoss(boss: Boss): void {
  startGame(boss.side, recommendedLevel(), false, boss);
}

/** A game with your saved Play settings (used by "what's next"). */
export function startConfiguredGame(): void {
  const cfg = state.play;
  const side: Side = cfg.side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : cfg.side;
  startGame(side, levelById(cfg.level), cfg.repertoire);
}

/** Weekly homework: a slow game at your level, alternating colours week to week. */
export function startSlowGame(): void {
  const side: Side = Math.round(weekStart() / 604_800_000) % 2 ? 'b' : 'w';
  startGame(side, recommendedLevel(), true, undefined, true);
}

/** A boss game counts as passed unless you lost it. */
const bossPassed = (result: PlayedGame['result']) => result !== 'loss';

function startGame(side: Side, level: Level, repertoire: boolean, boss?: Boss, slow = false): void {
  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  const book = buildBook(side);
  let rated = !boss;
  let over = false;
  /** Your moves played since the boss position (boss mode only). */
  let myMoves = 0;
  let deviatedNoted = false;
  let leftBookNoted = false;
  let lastBookLine: string | undefined;
  let thinking = false;
  /** Seconds you took per move; the clock starts when it becomes your turn. */
  const times: number[] = [];
  let turnStart = Date.now();
  const yourTurn = () => {
    turnStart = Date.now();
    board.setInteractive(true);
  };

  const board = new Board({
    orientation: side,
    onMove: (san) => {
      if (over || thinking || board.chess.turn() === side) return false;
      afterLearnerMove(san);
      return true;
    },
    onLive: () => {
      if (viewPly === null) return;
      viewPly = null;
      banner.hidden = true;
      showMoves();
    },
  });

  const startMoves = boss ? parseLine(boss.start).moves : [];
  if (boss) board.load(startMoves);

  // The coach strip only talks about the current turn: your move and the computer's reply.
  // It's cleared when you make your next move.
  const coach = h('div.coach-strip');
  type Tone = 'info' | 'good' | 'warn';
  const TONE_ICON: Record<Tone, IconName> = { info: 'bulb', good: 'check', warn: 'book' };
  const RANK: Record<Tone, number> = { info: 0, good: 1, warn: 2 };
  let stripTone: Tone = 'info';
  /** Add a line to this turn's notes. */
  const note = (text: string, tone: Tone = 'info') => {
    if (!coach.childElementCount || RANK[tone] >= RANK[stripTone]) stripTone = tone;
    coach.className = `coach-strip ${stripTone}`;
    coach.append(h(`div.coach-line.${tone}`, icon(TONE_ICON[tone], 'coach-icon'), md(text)));
    coach.hidden = false;
    coach.scrollTop = coach.scrollHeight;
  };
  /** Replace all notes with one message. */
  const say = (text: string, tone: Tone = 'info') => {
    clear(coach);
    note(text, tone);
  };
  const newTurn = () => {
    clear(coach);
    coach.hidden = true;
  };

  // Look back through the game: tap a move, or use the arrows. The game waits until you return.
  let viewPly: number | null = null;
  const plies = () => board.chess.history().length;
  const banner = h('button.view-banner', { type: 'button' });
  banner.hidden = true;
  board.el.append(banner);
  const prevBtn = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Previous move' }, icon('prev'));
  const nextBtn = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Next move' }, icon('next'));
  function view(k: number): void {
    const n = plies();
    if (k >= n) return void board.sync();
    viewPly = Math.max(0, k);
    board.showPly(viewPly);
    const m = board.chess.history()[viewPly - 1];
    clear(banner);
    banner.append(
      h('span', { html: viewPly ? `Viewing ${figHtml(formatMoves([...Array(viewPly - 1).fill(''), m], viewPly - 1))}` : 'Viewing the start' }),
      h('b', 'Back to game ›'),
    );
    banner.hidden = false;
    showMoves();
  }
  prevBtn.addEventListener('click', () => view((viewPly ?? plies()) - 1));
  nextBtn.addEventListener('click', () => viewPly !== null && view(viewPly + 1));
  banner.addEventListener('click', () => board.sync());
  const status = h('span.thinking');
  const counter = h('span.thinking');
  const movesEl = h('div.game-moves');
  const takeback = h('button.btn.ghost.small-btn', { type: 'button' }, icon('undo'), ' Takeback');
  const resign = h('button.btn.ghost.small-btn', { type: 'button' }, icon('flag'), ' Resign');
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave game' }, icon('close'));
  const myName = state.profile.name || 'You';
  const bar = (name: string | Array<Node | string>, sub: string, extra?: HTMLElement) =>
    h('div.player-bar', h('div', h('b', ...(Array.isArray(name) ? name : [name])), ' ', h('small.muted', sub)), extra ?? null);

  root.append(
    h(
      'div.session.game',
      h('header.run-head', close, h('div.game-title', ...(boss ? [icon('rook'), ` ${boss.name}`] : [`${level.name} · ~${level.elo}`])), h('span')),
      bar([icon('engine'), ` ${level.name}`], `~${level.elo}`, status),
      board.el,
      bar(myName, `~${state.rating.r}${isProvisional(state.rating) ? '?' : ''}`, counter),
      coach,
      movesEl,
      h('div.game-controls', prevBtn, nextBtn, boss ? null : takeback, resign),
    ),
  );
  if (boss) {
    say(
      `**Boss battle.** ${boss.brief}\n\nWin, or still be standing after **${boss.moves} of your moves** (no worse than −1.5 by the engine’s count), to earn the crown.`,
    );
  } else if (slow) {
    say(
      `**Slow game (this week’s homework).** No clock, so take your time. Before every move, the safety check: what are the **checks, captures and threats**, for both sides? Afterwards you’ll annotate it.`,
    );
  } else say(
    repertoire
      ? `Opening practice: the computer will play into your **${side === 'w' ? 'White' : 'Black'}** repertoire. Play your moves, and I’ll say when either of you leaves it.`
      : `Good luck! Remember the three jobs: center, develop, castle.`,
  );

  function showMoves(): void {
    const hist = board.chess.history();
    const current = (viewPly ?? hist.length) - 1;
    clear(movesEl);
    let on: HTMLElement | undefined;
    hist.forEach((m, i) => {
      if (i % 2 === 0) movesEl.append(h('span.gm-num', `${i / 2 + 1}.`));
      const mine = (i % 2 === 0) === (side === 'w');
      const b = h(`button.gm${mine ? '' : '.theirs'}${i === current ? '.on' : ''}`, { type: 'button', html: figHtml(m) });
      b.addEventListener('click', () => view(i + 1));
      if (i === current) on = b;
      movesEl.append(b);
    });
    movesEl.dataset.plies = String(hist.length);
    // Keep the selected move in sight (the list only scrolls vertically).
    if (on) movesEl.scrollTop = Math.max(0, on.offsetTop - movesEl.clientHeight + on.offsetHeight + 4);
    (prevBtn as HTMLButtonElement).disabled = current < 0;
    (nextBtn as HTMLButtonElement).disabled = viewPly === null;
  }

  function bookEntry() {
    return book.get(fenKey(board.chess.fen()));
  }

  function afterLearnerMove(san: string): void {
    times.push(Math.round((Date.now() - turnStart) / 100) / 10);
    newTurn();
    // The board has already played the move; look up the position before it.
    const prev = new Chess();
    const hist = board.chess.history();
    for (const m of hist.slice(0, -1)) prev.move(m);
    const entry = book.get(fenKey(prev.fen()));
    if (entry && !leftBookNoted) {
      const hit = [...entry.moves.entries()].find(([m]) => sameSan(m, san));
      if (hit) {
        lastBookLine = hit[1].line.name;
        note(`**Book move.** ${hit[1].note}`, 'good');
      } else if (!deviatedNoted) {
        deviatedNoted = true;
        const [exp, info] = [...entry.moves.entries()][0];
        if (repertoireOpen()) note(`Your repertoire plays **${exp}** here (${info.line.name}). ${info.note} Keep playing, and I’ll add it to your drills.`, 'warn');
        else note(`For later: your repertoire plays **${exp}** here (${info.line.name}). You’ll learn it in Level 3. For now, just follow the opening principles.`);
      }
    }
    showMoves();
    if (checkEnd()) return;
    if (boss) {
      myMoves++;
      counter.textContent = `${myMoves} / ${boss.moves}`;
      if (myMoves >= boss.moves) {
        void judgeBoss();
        return;
      }
    }
    if (state.play.guard && !boss && !slow) void guard(prev.fen(), san);
    else setTimeout(botTurn, 250);
  }

  /** Blunder guard: if your move drops material, say so (not why) and offer to take it back. */
  async function guard(fen: string, san: string): Promise<void> {
    thinking = true;
    board.setInteractive(false);
    status.textContent = 'checking…';
    let bad = false;
    let loss = 0;
    let bestUci = '';
    try {
      const j = await judgeMove(fen, san, 8);
      bad = isMistake(j, 200);
      loss = j.loss;
      bestUci = j.best;
    } catch {
      /* no engine: just play on */
    }
    status.textContent = '';
    thinking = false;
    if (over) return;
    if (!bad) return void setTimeout(botTurn, 150);
    sound.wrong();
    const back = h('button.btn.primary.small-btn', { type: 'button' }, icon('undo'), ' Take it back');
    const on = h('button.btn.ghost.small-btn', { type: 'button' }, 'Play on');
    const why = h('button.btn.ghost.small-btn', { type: 'button' }, 'Why?');
    note(
      `**Blunder guard:** ${san} is a mistake: ${lossLabel(loss)} worse than your best move. What can your opponent capture, check or threaten now? Think first, then tap **Why?** to see. (Taking it back makes this game unrated.)`,
      'warn',
    );
    coach.append(h('div.guard-btns', back, why, on));
    why.addEventListener('click', () => void showWhy());

    /** Show the refutation: the opponent's best reply and the line after it, steppable on the board. */
    async function showWhy(): Promise<void> {
      why.remove();
      const box = h('div.why-box', h('p.muted', 'Looking at the best reply…'));
      // Keep the buttons in view: the explanation goes below them, with more room while it's open.
      coach.append(box);
      coach.classList.add('why-open');
      movesEl.hidden = true;
      let ex;
      try {
        ex = await explainBlunder(fen, san, bestUci);
      } catch {
        box.replaceChildren(h('p.muted', 'Couldn’t start the engine.'));
        return;
      }
      if (!ex.line.length) {
        box.replaceChildren(h('p.muted', 'No clear reply found.'));
        return;
      }
      const them = side === 'w' ? 'Black' : 'White';
      const first = ex.line[0].san;
      const lineText = ex.line.map((m) => m.san).join(' ');
      const verdict = ex.mate
        ? `it leads to checkmate: **${lineText}**.`
        : ex.material <= -1
          ? `after **${lineText}** you’re down ${materialWords(-ex.material)}.`
          : ex.better
            ? `you don’t lose material, but you miss something much stronger. Compare the line (**${lineText}**) with the better move below.`
            : `you don’t lose material right away, but your position gets clearly worse (**${lineText}**).`;
      let k = 0;
      const label = h('span.step-label');
      const prev = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Previous move' }, icon('prev'));
      const next = h('button.btn.ghost.nav-btn', { type: 'button', 'aria-label': 'Next move' }, icon('next'));
      const show = (i: number) => {
        k = Math.max(0, Math.min(ex.line.length, i));
        if (k === 0) {
          board.sync();
          board.arrows([{ from: ex.line[0].from, to: ex.line[0].to, color: 'red' }]);
          label.textContent = `${them}’s reply`;
        } else {
          const m = ex.line[k - 1];
          board.showFen(m.fen);
          board.arrows([{ from: m.from, to: m.to, color: (k - 1) % 2 === 0 ? 'red' : 'green' }]);
          label.textContent = `${k} / ${ex.line.length}`;
        }
      };
      prev.addEventListener('click', () => show(k - 1));
      next.addEventListener('click', () => show(k + 1));
      box.replaceChildren(
        md(`${them} answers **${first}** (red arrow), and ${verdict}${ex.better ? ` A better move was **${ex.better}**.` : ''}`),
        h('div.why-steps', prev, label, next),
      );
      show(0);
    }
    const leaveWhy = () => {
      board.arrows([]);
      board.sync();
      coach.classList.remove('why-open');
      movesEl.hidden = false;
    };
    back.addEventListener('click', () => {
      leaveWhy();
      board.undo();
      times.pop();
      rated = false;
      showMoves();
      say('Taken back. Do the safety check, then find a better move.', 'info');
      yourTurn();
    });
    on.addEventListener('click', () => {
      leaveWhy();
      coach.querySelector('.why-box')?.remove();
      coach.querySelector('.guard-btns')?.remove();
      note('Playing on. Watch what happens next: it’s a good moment to annotate later.');
      setTimeout(botTurn, 150);
    });
  }

  /** After your last boss move: let the engine decide whether you're still standing. */
  async function judgeBoss(): Promise<void> {
    thinking = true;
    board.setInteractive(false);
    say('Time! The engine is judging the position…');
    let mine = 0;
    try {
      // It's the computer's move, so flip the sign to get your point of view.
      mine = -(await evaluate(board.chess.fen(), 12));
    } catch {
      mine = 0;
    }
    thinking = false;
    const pawns = (mine / 100).toFixed(1);
    const shown = mine > 0 ? `+${pawns}` : pawns;
    if (mine >= 300) finish('win', `a winning position (${shown}) after ${boss!.moves} moves`);
    else if (mine >= -150) finish('draw', `still standing after ${boss!.moves} moves (${shown})`);
    else finish('loss', `a losing position (${shown}) after ${boss!.moves} moves`);
  }

  async function botTurn(): Promise<void> {
    if (over) return;
    thinking = true;
    board.setInteractive(false);
    status.textContent = 'thinking…';
    const started = Date.now();
    let san: string | undefined;
    const entry = repertoire ? bookEntry() : undefined;
    if (entry && !leftBookNoted) {
      const options = [...entry.moves.keys()];
      san = options[Math.floor(Math.random() * options.length)];
    } else {
      if (repertoire && !leftBookNoted && board.chess.history().length > 0) {
        leftBookNoted = true;
        // Keep the "your repertoire plays X" note visible if that's why we left book.
        note('Out of book. You’re on your own now: use the plans from your lessons.');
      }
      try {
        const uci = await botMove(board.chess.fen(), level);
        const mv = new Chess(board.chess.fen()).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' });
        san = mv.san;
      } catch (e) {
        say(`Couldn’t start the chess engine (${(e as Error).message}). Try reopening the app.`, 'warn');
        thinking = false;
        status.textContent = '';
        return;
      }
    }
    // A short pause so instant replies don't feel robotic.
    const wait = Math.max(0, 450 - (Date.now() - started));
    setTimeout(() => {
      if (over) return;
      const mv = board.play(san!);
      thinking = false;
      status.textContent = '';
      describeReply(mv);
      showMoves();
      if (!checkEnd()) yourTurn();
    }, wait);
  }

  const PIECE: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

  /** Say what the computer just did, so a fast reply never goes unnoticed. */
  function describeReply(mv: { san: string; to: string; captured?: string }): void {
    const i = plies() - 1;
    const label = `${Math.floor(i / 2) + 1}${i % 2 === 0 ? '.' : '...'}${mv.san}`;
    let text = `**${level.name}** played **${label}**`;
    if (mv.captured) text += `, taking your ${PIECE[mv.captured]} on ${mv.to}`;
    text += '.';
    const check = board.chess.inCheck() && !board.chess.isCheckmate();
    if (check) text += ' **You’re in check.**';
    note(text, mv.captured || check ? 'warn' : 'info');
  }

  function checkEnd(): boolean {
    const c = board.chess;
    if (!c.isGameOver()) return false;
    if (c.isCheckmate()) finish(c.turn() === side ? 'loss' : 'win', 'checkmate');
    else if (c.isStalemate()) finish('draw', 'stalemate');
    else if (c.isThreefoldRepetition()) finish('draw', 'repetition');
    else if (c.isInsufficientMaterial()) finish('draw', 'insufficient material');
    else finish('draw', '50-move rule');
    return true;
  }

  function finish(result: PlayedGame['result'], reason: string): void {
    if (over) return;
    over = true;
    board.setInteractive(false);
    const moves = board.chess.history();
    const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    const before = state.rating.r;
    if (rated) state.rating = rate(state.rating, level.elo, level.rd, score);
    const delta = rated ? state.rating.r - before : undefined;

    // Opening slips become drills, just like imported games.
    const asGame: Game = {
      url: '',
      mySide: side,
      opponent: `${level.name} (computer)`,
      result,
      moves,
      opening: lastBookLine ?? '',
      date: new Date().toISOString().slice(0, 10),
    };
    const verdict = gradeGame(asGame, book);
    let drillNote = '';
    if (verdict.kind === 'deviated' && repertoireOpen()) {
      const d = makeDrill(asGame, verdict);
      if (!state.drills[d.id]) drillNote = 'Your opening slip was added to **Practice → From your games**.';
      state.drills[d.id] = d;
    }
    const game: PlayedGame = {
      id: String(Date.now()),
      date: Date.now(),
      side,
      level: level.id,
      result,
      reason,
      moves,
      rated,
      delta,
      opening: boss ? `Boss: ${boss.name}` : lastBookLine,
      times,
    };
    state.games = [...state.games, game].slice(-200);
    let crown = false;
    if (boss) {
      const rec = state.bosses[boss.unitId] ?? { beaten: false, attempts: 0 };
      rec.attempts++;
      if (bossPassed(result) && !rec.beaten) {
        rec.beaten = true;
        rec.beatenAt = Date.now();
        crown = true;
      }
      state.bosses[boss.unitId] = rec;
      addXp(bossPassed(result) ? 30 : 5);
    } else addXp(moves.length >= 10 ? 10 : 3);
    save();
    (result === 'win' ? sound.finish : result === 'loss' ? sound.wrong : sound.correct)();

    const title = boss
      ? bossPassed(result)
        ? crown
          ? 'Crown earned!'
          : 'Boss defeated again!'
        : 'The boss wins this time'
      : result === 'win'
        ? 'You won!'
        : result === 'loss'
          ? 'You lost'
          : 'Draw';
    const played = Math.ceil((moves.length - startMoves.length) / 2);
    const sub = `${reason[0].toUpperCase()}${reason.slice(1)} · ${played} moves`;
    const rematch = h('button.btn.primary.wide', { type: 'button' }, boss ? 'Try again' : 'Rematch');
    const review = h('button.btn.ghost.wide', { type: 'button' }, 'Review game');
    const canAnnotate = !boss && annotatable(game);
    const drillBtn = h('button.btn.ghost.wide', { type: 'button' }, 'Turn my mistakes into drills');
    const mistakeNote = h('p.muted');
    drillBtn.addEventListener('click', () => {
      (drillBtn as HTMLButtonElement).disabled = true;
      drillBtn.textContent = 'Checking your moves…';
      findMistakes(game, level.name, (d, n) => (drillBtn.textContent = `Checking your moves… ${d} / ${n}`))
        .then((found) => {
          drillBtn.remove();
          mistakeNote.textContent = found.length
            ? `${found.length} mistake${found.length > 1 ? 's' : ''} saved as drills: find them in Practice → Your mistakes.`
            : 'No real mistakes by the engine’s count. Nice game.';
        })
        .catch(() => (drillBtn.textContent = 'Couldn’t start the engine'));
    });
    const annotate = h(`button.btn.${slow ? 'primary' : 'ghost'}.wide`, { type: 'button' }, 'Annotate this game');
    const done = h('button.btn.ghost.wide', { type: 'button' }, 'Done');
    const closeSheet = sheet(
      h(
        'div.result-sheet',
        h('div.sheet-art', icon(boss ? (bossPassed(result) ? 'crown' : 'rook') : result === 'win' ? 'trophy' : result === 'draw' ? 'shield' : 'flag')),
        h('h2', title),
        h('p.muted', sub),
        rated
          ? h('div.rating-change', `Rating ${before} → `, h('b', String(state.rating.r)), h(`span.delta${delta! >= 0 ? '.up' : '.down'}`, ` ${delta! >= 0 ? '+' : ''}${delta}`))
          : h('p.muted', boss ? 'Boss battles don’t change your rating.' : 'Unrated: a takeback was used.'),
        boss && !bossPassed(result) ? md('Review the game to see where it turned, then try again. Every attempt earns XP.') : null,
        lastBookLine ? h('p', `Opening: ${lastBookLine}`) : null,
        drillNote ? md(drillNote) : null,
        slow && !canAnnotate ? md('Short games aren’t worth annotating: this week’s homework needs at least 15 moves each. Play another when you can.') : null,
        h('div.stack', canAnnotate && slow ? annotate : null, rematch, canAnnotate && !slow ? annotate : null, !boss && moves.length >= 16 ? drillBtn : null, mistakeNote, review, done),
      ),
    );
    const leave = () => {
      closeSheet();
      board.destroy();
      document.body.classList.remove('locked');
    };
    rematch.addEventListener('click', () => {
      leave();
      startGame(side, level, repertoire, boss, slow);
    });
    review.addEventListener('click', () => {
      leave();
      render();
      reviewGame(game);
    });
    annotate.addEventListener('click', () => {
      leave();
      render();
      annotateGame(game);
    });
    done.addEventListener('click', () => {
      leave();
      render();
    });
  }

  takeback.addEventListener('click', () => {
    if (over || thinking) return;
    const hist = board.chess.history();
    if (!hist.length) return;
    // Undo back to the learner's last turn.
    board.undo();
    if (board.chess.turn() !== side && board.chess.history().length) board.undo();
    // Keep one time per move you still have on the board.
    const mine = board.chess.history().filter((_, i) => i >= startMoves.length && (i % 2 === 0) === (side === 'w')).length;
    times.length = Math.min(times.length, mine);
    if (board.chess.turn() !== side) {
      setTimeout(botTurn, 200);
    } else yourTurn();
    rated = false;
    showMoves();
    say('Takeback used: this game won’t count toward your rating.', 'warn');
  });

  const quit = () => {
    const played = board.chess.history().length >= 2;
    if (over || !played) {
      over = true;
      board.destroy();
      document.body.classList.remove('locked');
      render();
      return;
    }
    if (confirm('Resign this game?')) finish('loss', 'resignation');
  };
  resign.addEventListener('click', quit);
  close.addEventListener('click', quit);

  if (boss) counter.textContent = `0 / ${boss.moves}`;
  if (board.chess.turn() !== side) setTimeout(botTurn, 400);
  else {
    yourTurn();
    if (boss) counter.textContent = `0 / ${boss.moves}`;
  }
}
