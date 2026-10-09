import { REPERTOIRE } from '../data';
import { formatMoves, parseLine } from '../engine/notation';
import type { RepertoireLine } from '../types';
import { back, push, startSession } from './app';
import { Board } from './board';
import { clear, h, md } from './dom';
import { topBar } from './learn';

const GROUPS: Array<[string, (l: RepertoireLine) => boolean]> = [
  ['As White · 1.e4', (l) => l.side === 'w'],
  ['As Black vs 1.e4 · 1...e5', (l) => l.side === 'b' && parseLine(l.line).moves[0] === 'e4'],
  ['As Black vs 1.d4 & others · QGD setup', (l) => l.side === 'b' && parseLine(l.line).moves[0] !== 'e4'],
];

export function renderRepertoire(host: HTMLElement): void {
  host.append(topBar('Repertoire'));
  host.append(h('p.muted.pad', 'Every line you are learning, with the reason behind each move. Tap one to step through it or drill it.'));
  for (const [title, pred] of GROUPS) {
    host.append(h('h4.section-title', title));
    for (const line of REPERTOIRE.filter(pred)) {
      const { moves } = parseLine(line.line);
      const row = h('button.row.line-row', { type: 'button' }, h('div.row-main', h('b', line.name), h('small.muted.mono', formatMoves(moves.slice(0, 8)) + (moves.length > 8 ? ' …' : ''))), h('span.chev', '›'));
      row.addEventListener('click', () => push((el) => lineViewer(el, line)));
      host.append(row);
    }
  }
}

function lineViewer(host: HTMLElement, line: RepertoireLine): void {
  const { moves, notes } = parseLine(line.line);
  let ply = moves.length;
  const board = new Board({ orientation: line.side, viewOnly: true });
  const note = h('div.bubble.viewer-note');
  const list = h('div.movelist');
  const prev = h('button.btn.ghost', { type: 'button' }, '◀');
  const next = h('button.btn.ghost', { type: 'button' }, '▶');
  const drill = h('button.btn.primary', { type: 'button' }, 'Drill this line');
  const backBtn = h('button.icon-btn', { type: 'button', 'aria-label': 'Back' }, '‹');
  backBtn.addEventListener('click', () => {
    board.destroy();
    back();
  });

  const update = () => {
    board.load(moves.slice(0, ply));
    clear(note);
    if (ply > 0) note.append(h('b.mv', formatMoves([...Array(ply - 1).fill(''), moves[ply - 1]], ply - 1)), ' ', md(notes[ply - 1] || '—'));
    else note.append(h('span.muted', 'Starting position'));
    list.querySelectorAll('.mvb').forEach((b, k) => b.classList.toggle('on', k === ply - 1));
  };
  moves.forEach((m, k) => {
    if (k % 2 === 0) list.append(h('span.num', `${k / 2 + 1}.`));
    const b = h(`button.mvb${notes[k] ? '.has-note' : ''}`, { type: 'button' }, m);
    b.addEventListener('click', () => {
      ply = k + 1;
      update();
    });
    list.append(b);
  });
  prev.addEventListener('click', () => {
    ply = Math.max(0, ply - 1);
    update();
  });
  next.addEventListener('click', () => {
    ply = Math.min(moves.length, ply + 1);
    update();
  });
  drill.addEventListener('click', () => {
    board.destroy();
    startSession(line.name, [{ exercise: { type: 'recall', side: line.side, line: line.line }, tags: [] }], 'practice');
  });

  host.append(
    h('header.topbar', backBtn, h('div.brand.small', line.name), h('span')),
    board.el,
    h('div.controls', prev, next),
    note,
    list,
    h('div.pad', drill),
  );
  ply = 0;
  update();
}
