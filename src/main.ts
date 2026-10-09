import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { state } from './engine/store';
import { initApp } from './ui/app';
import { renderLearn } from './ui/learn';
import { renderOnboarding } from './ui/onboarding';
import { renderPractice } from './ui/practice';
import { renderProfile } from './ui/profile';
import { renderRepertoire } from './ui/repertoire';

registerSW({ immediate: true });

const root = document.getElementById('app')!;

function start(): void {
  initApp(root, { learn: renderLearn, practice: renderPractice, repertoire: renderRepertoire, profile: renderProfile });
}

if (state.profile.onboarded) start();
else renderOnboarding(root, start);
