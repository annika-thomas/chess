import { UNITS } from '../data';
import {
  buildGameDrills,
  buildPatternSprint,
  buildPositionalDrill,
  buildReview,
  buildUnitReview,
  buildWeakSpotDrill,
  dueCards,
  gameDrillsDue,
  strengths,
  unitStrength,
  weakSpots,
} from '../engine/coach';
import { state } from '../engine/store';
import { go, startSession } from './app';
import { h } from './dom';
import { icon, unitIcon } from './icons';
import { loadSets, PASS, RUN_SIZE, themeOf, themePool, type PuzzleSet } from '../engine/puzzles';
import { runPuzzleSet } from './puzzleRun';
import { repertoireOpen, setUnlocked } from '../engine/levels';
import type { Side } from '../types';
import { topBar } from './learn';
import { MIXED_SIZE, mixedAvailable, startConvert, startMixed, startPositional } from './drills';

function card(title: string, body: string, cta: string, onClick: () => void, opts: { accent?: string; disabled?: boolean } = {}): HTMLElement {
  const btn = h('button.btn.primary', { type: 'button', disabled: opts.disabled }, cta);
  btn.addEventListener('click', onClick);
  return h('section.pcard', { style: opts.accent ? `--accent:${opts.accent}` : undefined }, h('div', h('h3', title), h('p', body)), btn);
}

/** One row per puzzle set: best score, mastery, and Woodpecker-style fluent runs. */
function setRow(set: PuzzleSet): HTMLElement {
  const rec = state.sets[set.id];
  const open = setUnlocked(set.id);
  const status = !open
    ? 'Locked: reach this in the course first'
    : !rec
      ? `${themeOf(set) ? `${RUN_SIZE} per run, from ${themePool(set).length}` : `${set.puzzles.length} puzzles`} · not started`
      : rec.mastered
        ? `Mastered · best ${Math.round(rec.bestAccuracy * 100)}%${rec.bestSeconds ? ` at ${rec.bestSeconds.toFixed(0)}s` : ''}${rec.fluentRuns ? ` · fluent ×${rec.fluentRuns}` : ''}`
        : `Best ${Math.round(rec.bestAccuracy * 100)}% · need ${Math.round(PASS * 100)}%`;
  const row = h(
    `button.row.line-row${open ? '' : '.locked-row'}`,
    { type: 'button', disabled: !open },
    h('span.result-dot.master', icon(!open ? 'lock' : rec?.mastered ? 'star' : 'target')),
    h('div.row-main', h('b', set.title), h('small.muted', set.about), h('small.muted', status)),
    h('span.chev', '›'),
  );
  row.addEventListener('click', () => runPuzzleSet({ set, mode: rec?.mastered ? 'cycle' : 'practice', hint: set.id.includes('test') || set.id.startsWith('mix') ? undefined : set.title }));
  return row;
}

function puzzleSets(): HTMLElement {
  const box = h('section', h('h4.section-title', 'Puzzle sets'), h('p.muted.pad', 'Loading puzzles…'));
  loadSets()
    .then((sets) => {
      box.querySelector('p')?.remove();
      box.append(h('p.muted.pad', 'Drill each theme until you pass (80%), then rerun it faster. Strong players repeat the same sets until the patterns are instant.'));
      for (const set of sets.values()) if (set.id !== 'daily') box.append(setRow(set));
    })
    .catch(() => {
      box.querySelector('p')!.textContent = 'Couldn’t load the puzzle sets. Try reopening the app.';
    });
  return box;
}

export const startSprint = (side: Side) =>
  startSession(
    'Coordinate Sprint',
    [{ exercise: { type: 'square', mode: 'tap', seconds: 30, side }, tags: ['coordinates'] }],
    'practice',
    undefined,
    'sprint',
  );

/** 30-second "tap the square" race, from either side, with best scores. */
function coordinateSprint(): HTMLElement {
  const go = startSprint;
  const white = h('button.btn.primary', { type: 'button' }, 'As White');
  const black = h('button.btn.ghost', { type: 'button' }, 'As Black');
  white.addEventListener('click', () => go('w'));
  black.addEventListener('click', () => go('b'));
  const best = state.sprintBest;
  return h(
    'section.pcard',
    { style: '--accent:#7a6a4f' },
    h(
      'div',
      h('h3', 'Coordinate Sprint'),
      h('p', `Tap as many squares as you can in 30 seconds. Best: ${best.w} as White · ${best.b} as Black. Once you can do 20+, reading moves stops feeling like decoding.`),
    ),
    h('div.inline', white, black),
  );
}

export function renderPractice(host: HTMLElement): void {
  host.append(topBar('Practice'));
  const learnedAny = Object.keys(state.cards).length > 0;
  const due = dueCards().length + gameDrillsDue().length;

  host.append(
    card(
      'Daily review',
      due
        ? `${due} item${due > 1 ? 's' : ''} due. Spaced repetition brings each move back right before you would forget it.`
        : learnedAny
          ? 'Nothing is due. You can still sharpen your shakiest moves.'
          : 'Finish your first lesson and reviews will appear here.',
      due ? `Review ${due}` : 'Practice anyway',
      () => startSession('Daily review', buildReview(), 'practice', undefined, 'review'),
      { accent: '#6f8f4e', disabled: !learnedAny },
    ),
  );

  // The three drills the research says matter most at this stage: mixed recognition, placement, conversion.
  const mixedN = mixedAvailable();
  host.append(
    card(
      'Mixed puzzles',
      mixedN >= 10
        ? `${MIXED_SIZE} unlabelled puzzles from every theme you’ve passed, misses first. Harder than themed sets, and closer to a real game.`
        : 'Pass a few themed puzzle sets first; their puzzles then come back here, mixed.',
      'Start',
      () => void startMixed(),
      { accent: '#6f8f4e', disabled: mixedN < 10 },
    ),
    card(
      'Convert the win',
      'You’ve just won material. Stay clearly winning for 10 moves against a human-like opponent, or mate.',
      'Play it out',
      () => void startConvert(),
      { accent: '#7b3f3f', disabled: mixedN < 10 },
    ),
    card(
      'Positional practice',
      buildPositionalDrill().length
        ? 'Worst pieces, open files, outposts, weak pawns: mixed questions from your Piece Placement lessons.'
        : 'Unlocks with the Piece Placement lessons in Level 2.',
      'Practice',
      () => void startPositional(),
      { accent: '#3f6e7b', disabled: !buildPositionalDrill().length },
    ),
  );

  host.append(coordinateSprint(), puzzleSets());

  const sprint = buildPatternSprint();
  host.append(
    card(
      'Pattern sprint',
      sprint.length
        ? 'Flashed positions and pawn skeletons from what you have learned. Glance, then answer. This trains your eye to see chunks.'
        : 'Unlocks after lessons with recognition drills (Unit 3 onward).',
      'Sprint',
      () => startSession('Pattern sprint', buildPatternSprint(), 'practice'),
      { accent: '#7d4a63', disabled: sprint.length < 3 },
    ),
  );

  const drills = Object.keys(state.drills).length;
  host.append(
    card(
      'From your games',
      drills && !repertoireOpen()
        ? `${drills} opening position${drills > 1 ? 's' : ''} from your games, saved for Level 3 when you learn the repertoire. They won’t come up in your reviews until then, but you can look now.`
        : drills
          ? `${drills} position${drills > 1 ? 's' : ''} where you left your repertoire in real games. Fix the exact moves you got wrong.`
          : 'Connect Lichess or Chess.com and I will find where your games left your repertoire.',
      drills ? 'Fix them' : 'Connect',
      () => (drills ? startSession('Your games', buildGameDrills(), 'practice') : go('profile')),
      { accent: '#8b5a2b' },
    ),
  );

  const weak = weakSpots();
  host.append(h('h4.section-title', 'Your weak spots'));
  if (!weak.length) {
    host.append(h('p.muted.pad', learnedAny ? 'No clear weak spots yet. Keep practicing and they will show up here.' : 'Weak spots appear after a few lessons.'));
  }
  for (const w of weak) {
    const btn = h('button.btn.small', { type: 'button' }, 'Drill');
    btn.addEventListener('click', () => startSession(w.label, buildWeakSpotDrill(w.tag), 'practice'));
    host.append(
      h(
        'div.row',
        h('div.row-main', h('b', w.label), h('div.meter.bad', h('div', { style: `width:${Math.round(w.errorRate * 100)}%` })), h('small.muted', `${Math.round(w.errorRate * 100)}% missed recently`)),
        btn,
      ),
    );
  }
  const strong = strengths().filter((s) => !weak.some((w) => w.tag === s.tag));
  if (strong.length) {
    host.append(h('h4.section-title', 'Strengths'));
    for (const s of strong) {
      host.append(h('div.row', h('div.row-main', h('b', icon('check', 'ok'), ` ${s.label}`), h('small.muted', `${Math.round((1 - s.errorRate) * 100)}% correct`))));
    }
  }

  const reviewable = UNITS.map((u) => ({ u, s: unitStrength(u.id) })).filter((x) => x.s !== undefined);
  if (reviewable.length) {
    host.append(h('h4.section-title', 'Unit strength'));
    for (const { u, s } of reviewable) {
      const btn = h('button.btn.small', { type: 'button' }, 'Review');
      btn.addEventListener('click', () => startSession(`${u.title} review`, buildUnitReview(u.id), 'practice'));
      host.append(
        h(
          'div.row',
          h('div.unit-dot', { style: `background:${u.color}` }, unitIcon(u.icon)),
          h('div.row-main', h('b', u.title), h('div.meter', h('div', { style: `width:${Math.round(s! * 100)}%;background:${u.color}` }))),
          btn,
        ),
      );
    }
  }
}
