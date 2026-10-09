import { UNITS } from '../data';
import {
  buildGameDrills,
  buildPatternSprint,
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
import { topBar } from './learn';

function card(title: string, body: string, cta: string, onClick: () => void, opts: { accent?: string; disabled?: boolean } = {}): HTMLElement {
  const btn = h('button.btn.primary', { type: 'button', disabled: opts.disabled }, cta);
  btn.addEventListener('click', onClick);
  return h('section.pcard', { style: opts.accent ? `--accent:${opts.accent}` : undefined }, h('div', h('h3', title), h('p', body)), btn);
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
      () => startSession('Daily review', buildReview(), 'practice'),
      { accent: '#58cc02', disabled: !learnedAny },
    ),
  );

  const sprint = buildPatternSprint();
  host.append(
    card(
      'Pattern sprint',
      sprint.length
        ? 'Flashed positions and pawn skeletons from what you have learned. Glance, then answer. This trains your eye to see chunks.'
        : 'Unlocks after lessons with recognition drills (Unit 3 onward).',
      'Sprint',
      () => startSession('Pattern sprint', buildPatternSprint(), 'practice'),
      { accent: '#ff86d0', disabled: sprint.length < 3 },
    ),
  );

  const drills = Object.keys(state.drills).length;
  host.append(
    card(
      'From your games',
      drills
        ? `${drills} position${drills > 1 ? 's' : ''} where you left your repertoire in real games. Fix the exact moves you got wrong.`
        : 'Connect Lichess or Chess.com and I will find where your games left your repertoire.',
      drills ? 'Fix them' : 'Connect',
      () => (drills ? startSession('Your games', buildGameDrills(), 'practice') : go('profile')),
      { accent: '#1cb0f6' },
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
      host.append(h('div.row', h('div.row-main', h('b', `✓ ${s.label}`), h('small.muted', `${Math.round((1 - s.errorRate) * 100)}% correct`))));
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
          h('div.unit-dot', { style: `background:${u.color}` }, u.icon),
          h('div.row-main', h('b', u.title), h('div.meter', h('div', { style: `width:${Math.round(s! * 100)}%;background:${u.color}` }))),
          btn,
        ),
      );
    }
  }
}
