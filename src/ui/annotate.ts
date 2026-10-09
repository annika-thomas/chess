import { Chess } from 'chess.js';
import { isMistake, judgeMove, lossLabel } from '../engine/bot';
import { formatMoves } from '../engine/notation';
import { addXp, markHomework, recordTags, save, state, type Annotation, type PlayedGame } from '../engine/store';
import { render, sheet } from './app';
import { Board } from './board';
import { clear, figHtml, h, md } from './dom';
import { icon } from './icons';
import { sound } from './sound';

/**
 * Self-annotation, the way the Botvinnik school set homework: go through your own game first and
 * mark the moments you think mattered, with what you were thinking. Only then does the engine check
 * your moves. Comparing the two shows what you can't yet see, and naming why each mistake happened
 * becomes the next homework.
 */

export const uciToSan = (fen: string, uci: string): string => {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' }).san;
  } catch {
    return uci;
  }
};

const CAUSES: Array<{ id: string; label: string; tags: string[]; homework: string }> = [
  { id: 'hung', label: 'I left something hanging', tags: ['blunder-check'], homework: 'Before every move, ask: **is everything protected?** Redo the **Safety check** lesson and run the **Hanging pieces** set again.' },
  { id: 'threat', label: 'I missed their threat', tags: ['blunder-check'], homework: 'After every opponent move, ask: **what does it threaten?** Checks, captures, threats: theirs first, then yours.' },
  { id: 'tactic', label: 'I missed a tactic', tags: ['fork', 'pin', 'discovery'], homework: 'More pattern reps: run your latest practice set again until it’s fluent (85% at ≤15 s).' },
  { id: 'plan', label: 'I didn’t know what to do', tags: ['plan'], homework: 'Plans come from model games: Guess the Move on the Play tab, then the Level 3 plans lessons.' },
  { id: 'opening', label: 'I didn’t know the opening', tags: [], homework: 'Look up the opening after every game. Repertoire slips are added to **Practice → From your games**.' },
];

interface Flag {
  ply: number;
  loss: number;
  best: string;
}

export function annotateGame(g: PlayedGame): void {
  const root = document.getElementById('app')!;
  clear(root);
  document.body.classList.add('locked');
  window.scrollTo(0, 0);

  const moves = g.moves;
  const fens: string[] = [];
  const c = new Chess();
  for (const m of moves) {
    fens.push(c.fen());
    c.move(m);
  }
  const mover = (ply: number) => (ply % 2 === 0 ? 'w' : 'b');
  const marks = new Map<number, string>((g.annotation?.marks ?? []).map((m) => [m.ply, m.note]));
  let flags: Flag[] = [];
  /** Board shows the position after `ply` moves; the selected move is moves[ply - 1]. */
  let ply = 1;
  let phase: 'notes' | 'engine' | 'results' = 'notes';

  const board = new Board({ orientation: g.side, viewOnly: true });
  const close = h('button.icon-btn.close', { type: 'button', 'aria-label': 'Leave' }, icon('close'));
  const title = h('div.game-title', 'Annotate your game');
  const intro = h('div.annot-intro');
  const panel = h('div.annot-panel');
  const list = h('div.movelist.annot-list');
  const prev = h('button.btn.ghost', { type: 'button', 'aria-label': 'Previous move' }, icon('prev'));
  const next = h('button.btn.ghost', { type: 'button', 'aria-label': 'Next move' }, icon('next'));
  const footer = h('div.annot-footer');
  const screen = h('div.session.game.annotate', h('header.run-head', close, title, h('span')), intro, board.el, h('div.controls', prev, next), panel, list, footer);
  root.append(screen);

  const leave = () => {
    board.destroy();
    document.body.classList.remove('locked');
    render();
    window.scrollTo(0, 0);
  };
  close.addEventListener('click', () => {
    if (phase !== 'results' && marks.size && !confirm('Leave without saving your notes?')) return;
    leave();
  });

  const flagAt = (p: number) => flags.find((f) => f.ply === p);

  function drawList(): void {
    clear(list);
    moves.forEach((m, k) => {
      if (k % 2 === 0) list.append(h('span.num', `${k / 2 + 1}.`));
      const cls = [mover(k) === g.side ? '' : '.theirs', marks.has(k) ? '.marked' : '', flagAt(k) ? '.flagged' : '', k === ply - 1 ? '.on' : ''].join('');
      const b = h(`button.mvb${cls}`, { type: 'button', html: figHtml(m) });
      b.addEventListener('click', () => {
        ply = k + 1;
        update();
      });
      list.append(b);
    });
  }

  function update(): void {
    const k = ply - 1;
    board.load(moves.slice(0, ply));
    const f = phase === 'results' ? flagAt(k) : undefined;
    board.arrows(f ? [{ from: f.best.slice(0, 2), to: f.best.slice(2, 4), color: 'green' }] : []);
    if (f) board.load(moves.slice(0, k)); // show the position before the mistake, with the better move
    drawList();
    clear(panel);
    const label = h('b.mv', { html: figHtml(formatMoves([...Array(k).fill(''), moves[k]], k)) });
    if (phase === 'notes') {
      const mine = mover(k) === g.side;
      const on = marks.has(k);
      const star = h(`button.btn.small-btn.${on ? 'primary' : 'ghost'}`, { type: 'button' }, icon(on ? 'star' : 'starEmpty'), on ? ' Critical moment' : ' Mark as critical');
      const note = h('textarea.annot-note', { placeholder: mine ? 'What were you thinking? What was your plan, what did you check?' : 'Did you see this coming? What did it threaten?', rows: 2 }) as HTMLTextAreaElement;
      note.value = marks.get(k) ?? '';
      note.hidden = !on;
      star.addEventListener('click', () => {
        if (marks.has(k)) marks.delete(k);
        else marks.set(k, '');
        update();
        if (marks.has(k)) (panel.querySelector('textarea') as HTMLTextAreaElement | null)?.focus();
      });
      note.addEventListener('input', () => marks.set(k, note.value));
      panel.append(h('div.annot-row', label, h('small.muted', mine ? ' your move' : ' their move'), star), note);
    } else if (phase === 'results') {
      const parts: string[] = [];
      if (f) parts.push(`You played **${moves[k]}** here and lost **${lossLabel(f.loss)}**. Better was **${uciToSan(fens[k], f.best)}** (green arrow).`);
      if (marks.has(k)) parts.push(`**Your note:** ${marks.get(k) || '(marked, no note)'}`);
      if (!parts.length) parts.push(mover(k) === g.side ? 'The engine had no complaints about this move.' : 'Their move.');
      panel.append(h('div.annot-row', label), md(parts.join('\n\n')));
    }
  }
  prev.addEventListener('click', () => {
    ply = Math.max(1, ply - 1);
    update();
  });
  next.addEventListener('click', () => {
    ply = Math.min(moves.length, ply + 1);
    update();
  });

  // ── Phase 1: your notes, no engine ──
  function notesPhase(): void {
    phase = 'notes';
    intro.replaceChildren(
      md(
        'Step through your game **before** the engine sees it. Mark the **2–3 moments where you think the game turned**: a move you weren’t sure about, a plan you made, a threat you noticed late. Write one line on what you were thinking.',
      ),
    );
    const go = h('button.btn.primary.wide', { type: 'button' });
    const refresh = () => {
      go.textContent = marks.size ? `Check with the engine (${marks.size} marked)` : 'Mark at least one moment first';
      (go as HTMLButtonElement).disabled = !marks.size;
    };
    refresh();
    panel.addEventListener('click', refresh);
    go.addEventListener('click', () => void enginePhase());
    footer.replaceChildren(go);
    update();
  }

  // ── Phase 2: the engine checks your moves ──
  async function enginePhase(): Promise<void> {
    phase = 'engine';
    clear(panel);
    const mine = moves.map((_, k) => k).filter((k) => mover(k) === g.side);
    const bar = h('div.progress', h('div.fill'));
    const txt = h('p.muted', 'The engine is checking your moves…');
    footer.replaceChildren(txt, bar);
    flags = [];
    let n = 0;
    for (const k of mine) {
      try {
        const j = await judgeMove(fens[k], moves[k], 10);
        if (isMistake(j)) flags.push({ ply: k, loss: j.loss, best: j.best });
      } catch {
        txt.textContent = 'Couldn’t start the engine. Try reopening the app.';
        return;
      }
      n++;
      (bar.firstChild as HTMLElement).style.width = `${(n / mine.length) * 100}%`;
      txt.textContent = `The engine is checking your moves… ${n} / ${mine.length}`;
      if (!screen.isConnected) return; // left the screen
    }
    resultsPhase();
  }

  // ── Phase 3: compare, diagnose, set homework ──
  function resultsPhase(): void {
    phase = 'results';
    // A mistake counts as spotted if you marked it, or the opponent move just before it.
    const spotted = flags.filter((f) => marks.has(f.ply) || marks.has(f.ply - 1));
    const worst = [...flags].sort((a, b) => b.loss - a.loss).slice(0, 3).sort((a, b) => a.ply - b.ply);
    const falseAlarms = [...marks.keys()].filter((p) => mover(p) === g.side && !flagAt(p));
    sound.finish();
    intro.replaceChildren(
      md(
        flags.length
          ? `The engine flagged **${flags.length}** of your moves as real mistakes. You had marked **${spotted.length}** of them${spotted.length === flags.length ? ': you see your own mistakes. That’s rare and valuable.' : '. The ones you missed are exactly what to train.'}`
          : 'The engine found **no real mistakes** in your moves. A clean game. Your notes are saved for next time.',
      ),
    );
    const causeRows = worst.map((f) => {
      const chosen = new Set<string>();
      const chips = CAUSES.map((c) => {
        const chip = h('button.chip-btn', { type: 'button' }, c.label);
        chip.addEventListener('click', () => {
          chosen.has(c.id) ? chosen.delete(c.id) : chosen.add(c.id);
          chip.classList.toggle('on', chosen.has(c.id));
        });
        return chip;
      });
      const jump = h('button.link-btn', { type: 'button', html: figHtml(formatMoves([...Array(f.ply).fill(''), moves[f.ply]], f.ply)) });
      jump.addEventListener('click', () => {
        ply = f.ply + 1;
        update();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return {
        chosen,
        el: h(
          'div.cause',
          h('div.cause-head', jump, h('small.muted', ` lost ${lossLabel(f.loss)} · better ${uciToSan(fens[f.ply], f.best)}`), marks.has(f.ply) || marks.has(f.ply - 1) ? h('span.badge.good', 'you marked it') : h('span.badge.bad', 'missed')),
          h('div.chip-wrap', ...chips),
        ),
      };
    });
    const saveBtn = h('button.btn.primary.wide', { type: 'button' }, flags.length ? 'Save & set my homework' : 'Save');
    footer.replaceChildren(
      ...(worst.length ? [h('h4.section-title', 'Why did it happen?'), h('p.muted', 'Be honest: this sets your homework. Pick any that apply.'), ...causeRows.map((r) => r.el)] : []),
      falseAlarms.length
        ? h('p.muted', `You worried about ${falseAlarms.map((p) => moves[p]).join(', ')}, but the engine was fine with ${falseAlarms.length > 1 ? 'them' : 'it'}.`)
        : '',
      saveBtn,
    );
    saveBtn.addEventListener('click', () => {
      const causes = [...new Set(causeRows.flatMap((r) => [...r.chosen]))];
      const annotation: Annotation = {
        marks: [...marks.entries()].sort((a, b) => a[0] - b[0]).map(([p, note]) => ({ ply: p, note: note.trim() })),
        flagged: flags,
        causes,
        at: Date.now(),
      };
      const stored = state.games.find((x) => x.id === g.id);
      if (stored) stored.annotation = annotation;
      g.annotation = annotation;
      for (const id of causes) recordTags(CAUSES.find((c) => c.id === id)!.tags, false);
      markHomework('annotate');
      addXp(20);
      save();
      const hw = causes.map((id) => CAUSES.find((c) => c.id === id)!.homework);
      const done = h('button.btn.primary.wide', { type: 'button' }, 'Done');
      const closeSheet = sheet(
        h(
          'div.result-sheet',
          h('div.sheet-art', icon('book')),
          h('h2', 'Game annotated'),
          h('p.muted', '+20 XP. Your notes and the engine’s verdict are saved with the game.'),
          hw.length ? h('div.hw-list', h('h4.section-title', 'Your homework this week'), ...hw.map((t) => md(`• ${t}`))) : md('No mistakes to diagnose. Keep doing the safety check every move.'),
          done,
        ),
      );
      done.addEventListener('click', () => {
        closeSheet();
        leave();
      });
    });
    ply = flags[0] ? flags[0].ply + 1 : ply;
    update();
  }

  notesPhase();
}
