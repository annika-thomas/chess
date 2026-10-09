import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { state } from './engine/store';
import { setFigurineSource } from './ui/dom';
import { termByKey } from './data/glossary';
import { initApp, render, sheet } from './ui/app';
import { loadSets } from './engine/puzzles';
import { setAvailableSets } from './engine/levels';
import { h } from './ui/dom';
import { renderLearn } from './ui/learn';
import { renderOnboarding } from './ui/onboarding';
import { renderPlay } from './ui/play';
import { renderPractice } from './ui/practice';
import { renderProfile } from './ui/profile';
import { renderRepertoire } from './ui/repertoire';

// Home-screen apps on iOS are usually resumed, not relaunched, so also check for a new version
// whenever the app comes back to the foreground (and hourly while open). autoUpdate then reloads.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => undefined);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    setInterval(check, 60 * 60 * 1000);
  },
});
setFigurineSource(() => state.settings.figurines);

const root = document.getElementById('app')!;

// Tap a dotted-underlined chess word anywhere for its definition.
function showTerm(el: Element): void {
  const term = termByKey.get((el as HTMLElement).dataset.term ?? '');
  if (!term) return;
  sheet(h('div.term-sheet', h('div.unit-name', { style: 'color:var(--gold)' }, 'Chess word'), h('h2', term.title), h('p', term.def)));
}
document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest?.('.term');
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  showTerm(el);
}, true);
document.addEventListener('keydown', (e) => {
  const el = (e.target as Element).closest?.('.term');
  if (el && (e.key === 'Enter' || e.key === ' ')) showTerm(el);
});
clearTimeout((window as Window & { __bootTimer?: number }).__bootTimer);
root.textContent = '';

// Load the puzzle library; mastery gates switch on once the sets are known.
loadSets()
  .then((sets) => {
    setAvailableSets(sets.keys());
    if (state.profile.onboarded) render();
  })
  .catch(() => undefined);

function start(): void {
  initApp(root, { learn: renderLearn, practice: renderPractice, play: renderPlay, repertoire: renderRepertoire, profile: renderProfile });
}

if (state.profile.onboarded) start();
else renderOnboarding(root, start);
