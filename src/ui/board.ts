import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Key } from '@lichess-org/chessground/types';
import type { DrawShape } from '@lichess-org/chessground/draw';
import { Chess, type Move } from 'chess.js';
import { legalDests, sanFor } from '../engine/notation';
import { state } from '../engine/store';
import type { Arrow, Side } from '../types';
import { h } from './dom';
import { sound } from './sound';

export interface BoardOpts {
  orientation: Side;
  /** Called when the learner makes a legal move. Return false to reject (board snaps back). */
  onMove?: (san: string, move: Move) => boolean | void;
  viewOnly?: boolean;
  /** Called when any square is tapped (used by coordinate drills). */
  onSelect?: (square: string) => void;
  /** Called when the board returns to the live position after showing an earlier one. */
  onLive?: () => void;
}

const color = (s: Side) => (s === 'w' ? 'white' : 'black');

/** Keep only pawns and kings in a FEN board. */
export function pawnSkeleton(fen: string): string {
  const [board, ...rest] = fen.split(' ');
  const stripped = board
    .split('/')
    .map((rank) => {
      let out = '';
      let empty = 0;
      for (const ch of rank) {
        if (/\d/.test(ch)) empty += Number(ch);
        else if ('pPkK'.includes(ch)) {
          if (empty) out += empty;
          empty = 0;
          out += ch;
        } else empty++;
      }
      return out + (empty ? empty : '');
    })
    .join('/');
  return [stripped, ...rest].join(' ');
}

/** chessground + chess.js, with the learner allowed to move only when `interactive` is on. */
export class Board {
  readonly el: HTMLElement;
  readonly chess: Chess;
  private cg: Api;
  private opts: BoardOpts;
  private interactive = false;
  private shapes: DrawShape[] = [];
  private viewing = false;

  constructor(opts: BoardOpts, fen?: string) {
    this.opts = opts;
    this.chess = new Chess(fen);
    const wrap = h('div.board-wrap');
    const inner = h('div.cg-wrap');
    wrap.append(inner);
    this.el = wrap;
    this.cg = Chessground(inner, {
      fen: this.chess.fen(),
      orientation: color(opts.orientation),
      coordinates: state.settings.showCoords,
      coordinatesOnSquares: state.settings.labelSquares,
      viewOnly: opts.viewOnly,
      animation: { enabled: true, duration: 220 },
      highlight: { lastMove: true, check: true },
      movable: { free: false, color: undefined, showDests: true, events: { after: (o, d) => this.userMoved(o, d) } },
      draggable: { showGhost: true },
      premovable: { enabled: false },
      drawable: { enabled: false, visible: true },
      events: opts.onSelect ? { select: (key) => opts.onSelect!(key) } : {},
    });
    // chessground measures its container; re-measure once attached.
    requestAnimationFrame(() => this.cg.redrawAll());
  }

  private userMoved(orig: Key, dest: Key): void {
    const san = sanFor(this.chess, orig, dest);
    if (!san) return this.sync();
    const move = this.chess.move(san);
    const ok = this.opts.onMove?.(move.san, move);
    if (ok === false) {
      this.chess.undo();
      setTimeout(() => this.sync(), 250);
      return;
    }
    (move.captured ? sound.capture : sound.move)();
    this.sync();
  }

  /** Play a move programmatically with animation. */
  play(san: string): Move {
    const move = this.chess.move(san);
    this.cg.move(move.from as Key, move.to as Key);
    (move.captured ? sound.capture : sound.move)();
    this.sync();
    return move;
  }

  /** Load a sequence instantly (no animation). */
  load(moves: string[], fen?: string): void {
    this.chess.reset();
    if (fen) this.chess.load(fen);
    let last: Move | undefined;
    for (const m of moves) last = this.chess.move(m);
    this.sync(last ? [last.from as Key, last.to as Key] : undefined);
  }

  undo(): void {
    this.chess.undo();
    this.sync();
  }

  setOrientation(side: Side): void {
    this.cg.set({ orientation: color(side) });
  }

  setInteractive(on: boolean): void {
    this.interactive = on;
    this.sync();
  }

  sync(lastMove?: Key[]): void {
    if (this.viewing) {
      this.viewing = false;
      this.opts.onLive?.();
    }
    const hist = this.chess.history({ verbose: true });
    const last = hist[hist.length - 1];
    this.cg.set({
      fen: this.chess.fen(),
      turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
      check: this.chess.inCheck(),
      lastMove: lastMove ?? (last ? [last.from as Key, last.to as Key] : undefined),
      movable: {
        color: this.interactive ? color(this.chess.turn()) : undefined,
        dests: this.interactive ? (legalDests(this.chess) as Map<Key, Key[]>) : new Map(),
      },
    });
  }

  /** Show the position after `ply` moves of this game without changing the game. sync() goes back to it. */
  showPly(ply: number): void {
    const hist = this.chess.history({ verbose: true });
    const m = hist[ply - 1];
    const fen = m ? m.after : (hist[0]?.before ?? this.chess.fen());
    this.viewing = true;
    this.cg.set({
      fen,
      turnColor: fen.split(' ')[1] === 'w' ? 'white' : 'black',
      check: new Chess(fen).inCheck(),
      lastMove: m ? [m.from as Key, m.to as Key] : undefined,
      movable: { color: undefined, dests: new Map() },
    });
  }

  /** Show a static position (FEN may be a pawn skeleton that chess.js wouldn't accept). */
  showFen(fen: string): void {
    this.cg.set({ fen, lastMove: undefined, check: false });
  }

  arrows(list: Arrow[] = []): void {
    this.shapes = list.map((a) => ({ orig: a.from as Key, dest: a.to as Key, brush: a.color ?? 'green' }));
    this.cg.setAutoShapes(this.shapes);
  }

  highlight(squares: string[] = [], cls = 'mentor-hl'): void {
    this.cg.set({ highlight: { custom: new Map(squares.map((s) => [s as Key, cls])) } });
  }

  /** Mark squares green and/or red at the same time. */
  mark(good: string[], bad: string[] = []): void {
    const custom = new Map<Key, string>();
    for (const s of good) custom.set(s as Key, 'mentor-good');
    for (const s of bad) custom.set(s as Key, 'mentor-bad');
    this.cg.set({ highlight: { custom } });
  }

  flashSquare(square: string, cls: 'good' | 'bad'): void {
    this.highlight([square], `mentor-${cls}`);
    setTimeout(() => this.highlight([]), 700);
  }

  destroy(): void {
    this.cg.destroy();
  }
}
