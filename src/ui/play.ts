import { Chess } from 'chess.js';
import { botMove, engine, LEVELS, levelById, type Level } from '../engine/bot';
import { buildBook, gradeGame, makeDrill, type Game } from '../engine/importer';
import { fenKey, sameSan } from '../engine/notation';
import { currentRd, isProvisional, rate } from '../engine/rating';
import { addXp, save, state, type PlayedGame } from '../engine/store';
import type { Side } from '../types';
import { push, render, sheet } from './app';
import { Board } from './board';
import { clear, figHtml, h, md } from './dom';
import { topBar } from './learn';
import { movesViewer } from './repertoire';
import { sound } from './sound';

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
    const b = h(`button.seg${cfg.side === s ? '.on' : ''}`, { type: 'button' }, s === 'w' ? '♔ White' : s === 'b' ? '♚ Black' : '⚄ Random');
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
    h('label.toggle', h('span', h('b', 'Opening practice'), h('br'), h('small.muted', 'The computer plays into your repertoire, and I tell you when you leave it.')), rep),
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
            h('small.muted', `${resultLabel(g)} by ${g.reason} · ${Math.ceil(g.moves.length / 2)} moves${g.opening ? ' · ' + g.opening : ''}`),
          ),
          g.rated && g.delta !== undefined ? h(`span.delta${g.delta >= 0 ? '.up' : '.down'}`, `${g.delta >= 0 ? '+' : ''}${g.delta}`) : h('span.delta', '—'),
        );
        row.addEventListener('click', () => reviewGame(g));
        return row;
      }),
  );
}

export function renderPlay(host: HTMLElement): void {
  host.append(topBar('Play'), ratingCard(), setupPanel(), recentGames() ?? h('p.footnote', 'Your games will appear here.'));
  // Start loading the engine in the background so the first move is quick.
  engine.warmUp();
}

function reviewGame(g: PlayedGame): void {
  const book = buildBook(g.side);
  const chess = new Chess();
  const notes = g.moves.map((san) => {
    const entry = book.get(fenKey(chess.fen()));
    chess.move(san);
    const info = entry ? [...entry.moves.entries()].find(([m]) => sameSan(m, san))?.[1] : undefined;
    return info ? `📖 ${info.note || 'Book move.'}` : '';
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

function startGame(side: Side, level: Level, repertoire: boolean): void {
  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  const book = buildBook(side);
  let rated = true;
  let over = false;
  let deviatedNoted = false;
  let leftBookNoted = false;
  let lastBookLine: string | undefined;
  let thinking = false;

  const board = new Board({
    orientation: side,
    onMove: (san) => {
      if (over || thinking || board.chess.turn() === side) return false;
      afterLearnerMove(san);
      return true;
    },
  });

  const coach = h('div.coach-strip');
  const say = (text: string, tone: 'info' | 'good' | 'warn' = 'info') => {
    clear(coach);
    coach.className = `coach-strip ${tone}`;
    coach.append(md(text));
  };
  const status = h('span.thinking');
  const movesEl = h('div.game-moves');
  const takeback = h('button.btn.ghost.small-btn', { type: 'button' }, '↶ Takeback');
  const resign = h('button.btn.ghost.small-btn', { type: 'button' }, '⚑ Resign');
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave game' }, '✕');
  const myName = state.profile.name || 'You';
  const bar = (name: string, sub: string, extra?: HTMLElement) => h('div.player-bar', h('div', h('b', name), ' ', h('small.muted', sub)), extra ?? null);

  root.append(
    h(
      'div.session.game',
      h('header.run-head', close, h('div.game-title', `${level.name} · ~${level.elo}`), h('span')),
      bar(`🤖 ${level.name}`, `~${level.elo}`, status),
      board.el,
      bar(myName, `~${state.rating.r}${isProvisional(state.rating) ? '?' : ''}`),
      coach,
      movesEl,
      h('div.game-controls', takeback, resign),
    ),
  );
  say(
    repertoire
      ? `Opening practice: the computer will play into your **${side === 'w' ? 'White' : 'Black'}** repertoire. Play your moves, and I’ll say when either of you leaves it.`
      : `Good luck! Remember the three jobs: center, develop, castle.`,
  );

  const showMoves = () => {
    const h2 = board.chess.history();
    const parts: string[] = [];
    h2.forEach((m, i) => parts.push(i % 2 === 0 ? `${i / 2 + 1}.${m}` : m));
    movesEl.innerHTML = figHtml(parts.slice(-14).join(' '));
    movesEl.dataset.plies = String(h2.length);
  };

  function bookEntry() {
    return book.get(fenKey(board.chess.fen()));
  }

  function afterLearnerMove(san: string): void {
    // The board has already played the move; look up the position before it.
    const prev = new Chess();
    const hist = board.chess.history();
    for (const m of hist.slice(0, -1)) prev.move(m);
    const entry = book.get(fenKey(prev.fen()));
    if (entry && !leftBookNoted) {
      const hit = [...entry.moves.entries()].find(([m]) => sameSan(m, san));
      if (hit) {
        lastBookLine = hit[1].line.name;
        say(`✓ **Book move.** ${hit[1].note}`, 'good');
      } else if (!deviatedNoted) {
        deviatedNoted = true;
        const [exp, info] = [...entry.moves.entries()][0];
        say(`📖 Your repertoire plays **${exp}** here (${info.line.name}). ${info.note} Keep playing, and I’ll add it to your drills.`, 'warn');
      }
    }
    showMoves();
    if (!checkEnd()) setTimeout(botTurn, 250);
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
        if (!deviatedNoted) say('Out of book. You’re on your own now: use the plans from your lessons.');
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
      board.play(san!);
      thinking = false;
      status.textContent = '';
      showMoves();
      if (!checkEnd()) board.setInteractive(true);
    }, wait);
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
    if (verdict.kind === 'deviated') {
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
      opening: lastBookLine,
    };
    state.games = [...state.games, game].slice(-200);
    addXp(moves.length >= 10 ? 10 : 3);
    save();
    (result === 'win' ? sound.finish : result === 'loss' ? sound.wrong : sound.correct)();

    const title = result === 'win' ? 'You won! 🏆' : result === 'loss' ? 'You lost' : 'Draw';
    const sub = `${reason[0].toUpperCase()}${reason.slice(1)} · ${Math.ceil(moves.length / 2)} moves`;
    const rematch = h('button.btn.primary.wide', { type: 'button' }, 'Rematch');
    const review = h('button.btn.ghost.wide', { type: 'button' }, 'Review game');
    const done = h('button.btn.ghost.wide', { type: 'button' }, 'Done');
    const closeSheet = sheet(
      h(
        'div.result-sheet',
        h('h2', title),
        h('p.muted', sub),
        rated
          ? h('div.rating-change', `Rating ${before} → `, h('b', String(state.rating.r)), h(`span.delta${delta! >= 0 ? '.up' : '.down'}`, ` ${delta! >= 0 ? '+' : ''}${delta}`))
          : h('p.muted', 'Unrated: a takeback was used.'),
        lastBookLine ? h('p', `Opening: ${lastBookLine}`) : null,
        drillNote ? md(drillNote) : null,
        h('div.stack', rematch, review, done),
      ),
    );
    const leave = () => {
      closeSheet();
      board.destroy();
      document.body.classList.remove('locked');
    };
    rematch.addEventListener('click', () => {
      leave();
      startGame(side, level, repertoire);
    });
    review.addEventListener('click', () => {
      leave();
      render();
      reviewGame(game);
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
    if (board.chess.turn() !== side) {
      setTimeout(botTurn, 200);
    } else board.setInteractive(true);
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

  if (side === 'b') setTimeout(botTurn, 400);
  else board.setInteractive(true);
}
