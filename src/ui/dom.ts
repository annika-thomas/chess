import { GLOSSARY } from '../data/glossary';

type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | boolean | number | EventListener | undefined>;

/** Tiny hyperscript: h('div.card.big', { onclick }, ...children). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K | `${K}.${string}`,
  attrs: Attrs | Child = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name as K);
  if (classes.length) el.className = classes.join(' ');
  if (attrs instanceof Node || typeof attrs !== 'object' || attrs === null) {
    children.unshift(attrs as Child);
  } else {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className += ' ' + v;
      else if (k === 'html') el.innerHTML = String(v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const FIGURINES: Record<string, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞' };

/**
 * Show piece moves with icons (Nf3 → ♞f3) when the setting is on. Only touches tokens shaped like a
 * piece move: a piece letter, optional disambiguation, optional "x", then a square.
 * Takes HTML-safe text and returns HTML (each icon is wrapped so it can be sized to match the letters).
 */
export function fig(html: string): string {
  if (!figurinesOn()) return html;
  return html.replace(
    /(^|[^A-Za-z])([KQRBN])(?=[a-h1-8]?x?[a-h][1-8])/g,
    (_, pre: string, p: string) => `${pre}<span class="fig">${FIGURINES[p]}\uFE0E</span>`,
  );
}

/** Plain text (e.g. a move list) to HTML with piece icons. */
export const figHtml = (text: string) => fig(escape(text));

let figurinesOn = () => true;
/** Wired up by the store at startup so this module stays dependency-free. */
export function setFigurineSource(fn: () => boolean): void {
  figurinesOn = fn;
}

/**
 * Underline the first mention of each glossary term (tap for a definition). Uses placeholders so a
 * term's markup can never be matched again by a later term.
 */
function linkTerms(html: string, seen: Set<string>): string {
  const spans: string[] = [];
  for (const t of GLOSSARY) {
    if (seen.has(t.key)) continue;
    html = html.replace(t.pattern, (m) => {
      seen.add(t.key);
      spans.push(`<span class="term" role="button" tabindex="0" data-term="${t.key}">${m}</span>`);
      return `\u0000${spans.length - 1}\u0000`;
    });
  }
  return html.replace(/\u0000(\d+)\u0000/g, (_, i: string) => spans[Number(i)]);
}

/**
 * One line of markdown-style bold and italic, with piece icons, as HTML-safe markup. `Code` stays as letters.
 * Glossary terms are linked unless `terms` is false (e.g. inside answer buttons).
 */
export function inline(text: string, terms = true, seen = new Set<string>()): string {
  // `backticks` keep notation as letters (lessons that teach the letters themselves).
  const html = text
    .split('`')
    .map((part, i) => (i % 2 ? `<span class="san">${escape(part)}</span>` : fig(terms ? linkTerms(escape(part), seen) : escape(part))))
    .join('');
  return html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
}

/** Minimal markdown: **bold**, *italic*, paragraphs. Input is our own content, but we escape anyway. */
export function md(text: string): HTMLElement {
  const seen = new Set<string>();
  const html = text
    .split(/\n{2,}/)
    .map((p) => `<p>${inline(p, true, seen)}</p>`)
    .join('');
  return h('div.md', { html });
}

export function clear(el: Element): void {
  while (el.firstChild) el.firstChild.remove();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
