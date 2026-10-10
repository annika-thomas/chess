import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Crown,
  Eye,
  Flag,
  Flame,
  Lightbulb,
  Lock,
  Pause,
  Play,
  Shield,
  Shuffle,
  Star,
  Target,
  Timer,
  Trophy,
  Undo2,
  X,
  Zap,
} from 'lucide';

/** One drawn shape: tag name plus SVG attributes. */
type Shape = [string, Record<string, string | number>];

/**
 * App icons: Lucide geometry (ISC) restyled as solid brass/cream "medallion" art to match the wood theme,
 * plus the board's own rook (cburnett pieces) for boss battles. Replaces emoji, which render differently
 * on every device and clash with the classic look.
 */
type Tone = 'brass' | 'flame' | 'cream' | 'line';

interface Spec {
  node: Shape[];
  tone: Tone;
  /** Child shapes filled with the tone's gradient (others are outlines). */
  fill?: number[];
  /** Child shapes drawn as dark details on top of a filled shape (e.g. an eye's pupil). */
  dark?: number[];
}

/** Lucide exports ["svg", attrs, children]; we only need the children. */
const kids = (icon: unknown) => (icon as [string, object, Shape[]])[2];

const SPECS = {
  flame: { node: kids(Flame), tone: 'flame', fill: [0] },
  shield: { node: kids(Shield), tone: 'cream', fill: [0] },
  bolt: { node: kids(Zap), tone: 'cream', fill: [0] },
  eye: { node: kids(Eye), tone: 'cream', fill: [0], dark: [1] },
  crown: { node: kids(Crown), tone: 'brass', fill: [0] },
  crownCream: { node: kids(Crown), tone: 'cream', fill: [0] },
  trophy: { node: kids(Trophy), tone: 'brass', fill: [5] },
  star: { node: kids(Star), tone: 'brass', fill: [0] },
  starCream: { node: kids(Star), tone: 'cream', fill: [0] },
  starEmpty: { node: kids(Star), tone: 'line' },
  lock: { node: kids(Lock), tone: 'cream', fill: [0] },
  target: { node: kids(Target), tone: 'brass', fill: [0], dark: [1] },
  book: { node: kids(BookOpen), tone: 'cream', fill: [1] },
  engine: { node: kids(Cpu), tone: 'line' },
  bulb: { node: kids(Lightbulb), tone: 'brass', fill: [0] },
  timer: { node: kids(Timer), tone: 'line' },
  flag: { node: kids(Flag), tone: 'line' },
  undo: { node: kids(Undo2), tone: 'line' },
  shuffle: { node: kids(Shuffle), tone: 'line' },
  close: { node: kids(X), tone: 'line' },
  pause: { node: kids(Pause), tone: 'line' },
  play: { node: kids(Play), tone: 'line' },
  check: { node: kids(Check), tone: 'line' },
  prev: { node: kids(ChevronLeft), tone: 'line' },
  next: { node: kids(ChevronRight), tone: 'line' },
} satisfies Record<string, Spec>;

export type IconName = keyof typeof SPECS | 'rook';

const GRADIENTS: Record<Exclude<Tone, 'line'>, { stops: string[]; edge: string; dark: string }> = {
  brass: { stops: ['#fbe59a', '#e6b422', '#a67c00'], edge: '#7a5600', dark: '#5c3a00' },
  flame: { stops: ['#ffe08a', '#ff9f2e', '#e2531b'], edge: '#8a2f0c', dark: '#8a2f0c' },
  cream: { stops: ['#fff6e6', '#f3dfbf', '#d9bd8c'], edge: '#5c3a1c', dark: '#5c3a1c' },
};

let uid = 0;

const attrs = (a: Record<string, string | number>) =>
  Object.entries(a)
    .filter(([k]) => k !== 'key')
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

function gradientDef(tone: Exclude<Tone, 'line'>, id: string): string {
  const { stops } = GRADIENTS[tone];
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1">${stops
    .map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`)
    .join('')}</linearGradient></defs>`;
}

function lucideSvg(spec: Spec): string {
  if (spec.tone === 'line') {
    const body = spec.node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }
  const g = GRADIENTS[spec.tone];
  const id = `ig${++uid}`;
  const body = spec.node
    .map(([tag, a], i) => {
      const filled = spec.fill?.includes(i);
      const dark = spec.dark?.includes(i);
      const style = dark
        ? `fill="${g.dark}" stroke="${g.dark}"`
        : filled
          ? `fill="url(#${id})" stroke="${g.edge}"`
          : `fill="none" stroke="${g.stops[1]}"`;
      return `<${tag} ${attrs(a)} ${style}/>`;
    })
    .join('');
  return `<svg viewBox="0 0 24 24" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${gradientDef(spec.tone, id)}${body}</svg>`;
}

/** The board's rook in brass: the boss-battle tower. */
function rookSvg(): string {
  const id = `ig${++uid}`;
  const g = GRADIENTS.brass;
  return `<svg viewBox="2 3 41 41">${gradientDef('brass', id)}<g fill="url(#${id})" fill-rule="evenodd" stroke="${g.edge}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>`;
}

/** SVG markup for an icon. */
export function iconSvg(name: IconName): string {
  return name === 'rook' ? rookSvg() : lucideSvg(SPECS[name] as Spec);
}

/** Unit icons can be a chess glyph/text ("♗", "a1") or "icon:name" for drawn art. */
export function unitIcon(spec: string): Node {
  return spec.startsWith('icon:') ? icon(spec.slice(5) as IconName) : document.createTextNode(spec);
}

/** An inline icon element, sized by CSS (1em by default). */
export function icon(name: IconName, cls = ''): HTMLElement {
  const el = document.createElement('span');
  el.className = `icon icon-${name}${cls ? ' ' + cls : ''}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = iconSvg(name);
  return el;
}
