import type { Item } from '../engine/coach';
import { h, clear } from './dom';
import { runSession } from './runner';

export type Tab = 'learn' | 'practice' | 'repertoire' | 'profile';

type Render = (host: HTMLElement) => void;

let root: HTMLElement;
let tab: Tab = 'learn';
const tabs = new Map<Tab, Render>();
let overlay: Render | null = null;

const TAB_META: Array<[Tab, string, string]> = [
  ['learn', 'Learn', '♞'],
  ['practice', 'Practice', '🎯'],
  ['repertoire', 'Repertoire', '📖'],
  ['profile', 'Me', '👤'],
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
  const page = h('div.page');
  if (overlay) {
    overlay(page);
    root.append(page);
    return;
  }
  tabs.get(tab)!(page);
  const nav = h(
    'nav.tabbar',
    ...TAB_META.map(([t, label, icon]) => {
      const b = h(`button.tab${t === tab ? '.active' : ''}`, { type: 'button' }, h('span.ti', icon), h('span.tl', label));
      b.addEventListener('click', () => go(t));
      return b;
    }),
  );
  root.append(page, nav);
}

/** Start a lesson or practice session full-screen; return to the current tab afterwards. */
export function startSession(title: string, items: Item[], mode: 'lesson' | 'practice', lessonId?: string): void {
  if (!items.length) {
    alert('Nothing to practice yet. Finish a lesson first!');
    return;
  }
  clear(root);
  const host = h('div.session');
  root.append(host);
  window.scrollTo(0, 0);
  runSession(host, {
    title,
    items,
    mode,
    lessonId,
    onExit: () => {
      render();
      window.scrollTo(0, 0);
    },
  });
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
