import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { state } from './engine/store';
import { initApp } from './ui/app';
import { renderLearn } from './ui/learn';
import { renderOnboarding } from './ui/onboarding';
import { renderPlay } from './ui/play';
import { renderPractice } from './ui/practice';
import { renderProfile } from './ui/profile';
import { renderRepertoire } from './ui/repertoire';

registerSW({ immediate: true });

const root = document.getElementById('app')!;
clearTimeout((window as Window & { __bootTimer?: number }).__bootTimer);
root.textContent = '';

function start(): void {
  initApp(root, { learn: renderLearn, practice: renderPractice, play: renderPlay, repertoire: renderRepertoire, profile: renderProfile });
}

if (state.profile.onboarded) start();
else renderOnboarding(root, start);
