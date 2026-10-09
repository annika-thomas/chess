import { requestPersistence, save, state } from '../engine/store';
import { clear, h } from './dom';

const GOALS: Array<[number, string, string]> = [
  [10, 'Casual', '5 min / day'],
  [20, 'Regular', '10 min / day'],
  [30, 'Serious', '15 min / day'],
  [50, 'Intense', '25 min / day'],
];

/** Three quick screens: name, daily goal, and the plan. */
export function renderOnboarding(root: HTMLElement, onDone: () => void): void {
  let step = 0;
  const draw = () => {
    clear(root);
    const page = h('div.onboard');
    root.append(page);
    if (step === 0) {
      const input = h('input.big-input', { type: 'text', placeholder: 'Your first name', value: state.profile.name, autocomplete: 'given-name' });
      const next = h('button.btn.primary.wide', { type: 'button' }, 'Continue');
      next.addEventListener('click', () => {
        state.profile.name = input.value.trim();
        step = 1;
        draw();
      });
      input.addEventListener('keydown', (e) => e.key === 'Enter' && next.click());
      page.append(
        h('div.hero', '♞'),
        h('h1', 'Hi! I’m your chess mentor.'),
        h('p', 'I’ll teach you openings the way memory actually works: short lessons, recall instead of rereading, and reviews timed right before you would forget.'),
        h('label.field', h('span', 'What should I call you?'), input),
        next,
      );
    } else if (step === 1) {
      page.append(h('h1', 'Pick a daily goal'), h('p', 'Little and often beats long and rare. You can change this later.'));
      for (const [xp, label, time] of GOALS) {
        const b = h(`button.goal-opt${state.profile.goal === xp ? '.selected' : ''}`, { type: 'button' }, h('b', label), h('span', time));
        b.addEventListener('click', () => {
          state.profile.goal = xp;
          step = 2;
          draw();
        });
        page.append(b);
      }
    } else {
      const go = h('button.btn.primary.wide', { type: 'button' }, 'Start lesson 1');
      go.addEventListener('click', () => {
        state.profile.onboarded = true;
        save();
        requestPersistence();
        onDone();
      });
      const name = state.profile.name ? `, ${state.profile.name}` : '';
      page.append(
        h('h1', `Your plan${name}`),
        h('p', 'You know the rules and you’re good at spotting patterns, so this course gives you the patterns to spot. I chose a repertoire where the same ideas repeat across openings:'),
        h(
          'ul.plan',
          h('li', h('b', '1. Foundations: '), 'the three jobs of every opening, and the traps beginners fall into.'),
          h('li', h('b', '2. White, 1.e4 Italian Game: '), 'classical, principled, and centuries old. Its plan works against almost anything.'),
          h('li', h('b', '3. Black, 1...e5: '), 'the Italian in the mirror. You reuse what you learned as White.'),
          h('li', h('b', '4. Black vs 1.d4, Queen’s Gambit Declined: '), 'one solid setup that also handles the London, English and Réti.'),
          h('li', h('b', '5. Pattern Gym: '), 'flash drills that train you to recognize pawn structures and openings at a glance.'),
        ),
        h('p.muted', 'Tip: in Safari, tap Share → “Add to Home Screen” to install me like an app. I work offline.'),
        go,
      );
    }
  };
  draw();
}
