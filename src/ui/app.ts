import type { Item } from '../engine/coach';
import { h, clear } from './dom';
import { runSession } from './runner';

export type Tab = 'learn' | 'practice' | 'play' | 'repertoire' | 'profile';

type Render = (host: HTMLElement) => void;

let root: HTMLElement;
let tab: Tab = 'learn';
const tabs = new Map<Tab, Render>();
let overlay: Render | null = null;

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const TAB_META: Array<[Tab, string, string]> = [
  ['learn', 'Learn', '<span class="glyph">♞</span>'],
  ['practice', 'Practice', svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>')],
  ['play', 'Play', svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>')],
  ['repertoire', 'Repertoire', svg('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>')],
  ['profile', 'Me', svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>')],
];

export function initApp(el: HTMLElement, renders: Record<Tab, Render>): void {
  root = el;
  for (const [k, v] of Object.entries(renders)) tabs.set(k as Tab, v);
  try {
    const saved = sessionStorage.getItem('tab') as Tab | null;
    if (saved && tabs.has(saved)) tab = saved;
  } catch {
    /* ignore */
  }
  render();
  window.scrollTo(0, 0);
}

export function go(t: Tab): void {
  tab = t;
  overlay = null;
  try {
    sessionStorage.setItem('tab', t);
  } catch {
    /* ignore */
  }
  render();
  window.scrollTo(0, 0);
}

/** Full-screen page (e.g. line viewer) above the tabs. */
export function push(render: Render): void {
  overlay = render;
  renderAll();
  window.scrollTo(0, 0);
}

export function back(): void {
  overlay = null;
  render();
}

export function render(): void {
  if (overlay) return renderAll();
  renderAll();
}

function renderAll(): void {
  clear(root);
  document.body.classList.toggle('locked', !!overlay);
  if (overlay) {
    const page = h('div.fullscreen');
    overlay(page);
    root.append(page);
    return;
  }
  const page = h('div.page');
  tabs.get(tab)!(page);
  const nav = h(
    'nav.tabbar',
    ...TAB_META.map(([t, label, icon]) => {
      const b = h(`button.tab${t === tab ? '.active' : ''}`, { type: 'button' }, h('span.ti', { html: icon }), h('span.tl', label));
      b.addEventListener('click', () => go(t));
      return b;
    }),
  );
  root.append(page, nav);
}

/** Start a lesson or practice session full-screen; return to the current tab afterwards. */
export function startSession(title: string, items: Item[], mode: 'lesson' | 'practice', lessonId?: string, homework?: string): void {
  if (!items.length) {
    alert('Nothing to practice yet. Finish a lesson first!');
    return;
  }
  clear(root);
  const host = h('div.session');
  root.append(host);
  window.scrollTo(0, 0);
  enterFullscreen();
  runSession(host, {
    title,
    items,
    mode,
    lessonId,
    homework,
    onExit: () => {
      exitFullscreen();
      render();
      window.scrollTo(0, 0);
    },
  });
}

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Lessons fill the screen. Installed to the home screen they already do; in a browser that allows it
 * (iPad, Android, desktop) we also hide the browser chrome. iPhone Safari doesn't allow this. */
function enterFullscreen(): void {
  document.body.classList.add('locked');
  if (standalone() || document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined);
}

function exitFullscreen(): void {
  document.body.classList.remove('locked');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
}

/** Bottom sheet modal. */
export function sheet(content: HTMLElement): () => void {
  const backdrop = h('div.backdrop');
  const panel = h('div.modal', content);
  const close = () => {
    backdrop.classList.add('closing');
    setTimeout(() => backdrop.remove(), 200);
  };
  backdrop.addEventListener('click', (e) => e.target === backdrop && close());
  backdrop.append(panel);
  document.body.append(backdrop);
  return close;
}
