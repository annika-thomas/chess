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

/** Minimal markdown: **bold**, *italic*, paragraphs. Input is our own content, but we escape anyway. */
export function md(text: string): HTMLElement {
  const html = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')}</p>`)
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
