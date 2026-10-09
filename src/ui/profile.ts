import { CARDS, LESSONS } from '../data';
import { tagLabel } from '../engine/coach';
import { analyzeGames, fetchChessCom, fetchLichess } from '../engine/importer';
import { currentStreak, exportBackup, importBackup, resetAll, save, state, today } from '../engine/store';
import { render } from './app';
import { h } from './dom';
import { topBar } from './learn';

const GOALS: Array<[number, string]> = [
  [10, 'Casual · ~5 min'],
  [20, 'Regular · ~10 min'],
  [30, 'Serious · ~15 min'],
  [50, 'Intense · ~25 min'],
];

function weekChart(): HTMLElement {
  const days: Array<[string, number]> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push([d.toLocaleDateString(undefined, { weekday: 'narrow' }), state.xpByDay[today(d.getTime())] ?? 0]);
  }
  const max = Math.max(state.profile.goal, ...days.map(([, x]) => x));
  return h(
    'div.week',
    ...days.map(([label, xp]) =>
      h(
        'div.wcol',
        h('div.wbar', h('div', { style: `height:${(xp / max) * 100}%`, class: xp >= state.profile.goal ? 'hit' : '' })),
        h('small', label),
      ),
    ),
  );
}

function stat(value: string, label: string): HTMLElement {
  return h('div.pstat', h('b', value), h('small', label));
}

function importSection(): HTMLElement {
  const sel = h('select', h('option', { value: 'lichess' }, 'Lichess'), h('option', { value: 'chesscom' }, 'Chess.com'));
  const input = h('input', { type: 'text', placeholder: 'Username', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
  const prevSource = state.report?.source;
  if (prevSource) sel.value = prevSource;
  input.value = (sel.value === 'lichess' ? state.profile.lichess : state.profile.chesscom) ?? '';
  sel.addEventListener('change', () => (input.value = (sel.value === 'lichess' ? state.profile.lichess : state.profile.chesscom) ?? ''));
  const btn = h('button.btn.primary', { type: 'button' }, 'Analyze my games');
  const status = h('p.muted');

  btn.addEventListener('click', async () => {
    const user = input.value.trim();
    if (!user) return input.focus();
    btn.disabled = true;
    status.textContent = 'Fetching your recent games…';
    try {
      const source = sel.value as 'lichess' | 'chesscom';
      const games = source === 'lichess' ? await fetchLichess(user) : await fetchChessCom(user);
      if (!games.length) throw new Error('No standard games found.');
      const { report, drills } = analyzeGames(games, source, user);
      if (source === 'lichess') state.profile.lichess = user;
      else state.profile.chesscom = user;
      state.report = report;
      state.drills = Object.fromEntries(drills.map((d) => [d.id, d]));
      save();
      render();
    } catch (e) {
      status.textContent = `Couldn't import: ${(e as Error).message}`;
      btn.disabled = false;
    }
  });

  const box = h(
    'section.panel',
    h('h3', 'Your games'),
    h('p.muted', 'I check your recent games against your repertoire: where you followed it, where you left it, and which openings you actually face. Mistakes become drills.'),
    h('div.inline', sel, input),
    btn,
    status,
  );

  const r = state.report;
  if (r) {
    const pct = (n: number) => `${Math.round((n / Math.max(1, r.games)) * 100)}%`;
    box.append(
      h('h4', `Last ${r.games} games · ${r.username}`),
      h(
        'div.pstats',
        stat(pct(r.followed), 'stayed in book'),
        stat(String(r.deviated), 'left repertoire'),
        stat(pct(r.oppDeviated), 'opponent left first'),
      ),
      h('p.muted', `${Object.keys(state.drills).length} drills created from your deviations. Find them in Practice → From your games.`),
      h(
        'table.openings',
        h('tr', h('th', 'Opening'), h('th', 'As'), h('th', 'G'), h('th', 'W/D/L')),
        ...r.openings
          .slice(0, 10)
          .map((o) => h('tr', h('td', o.name), h('td', o.side === 'w' ? '⚪' : '⚫'), h('td', String(o.games)), h('td', `${o.wins}/${o.draws}/${o.losses}`))),
      ),
    );
  }
  return box;
}

function settingsSection(): HTMLElement {
  const goal = h('select', ...GOALS.map(([v, l]) => h('option', { value: String(v), selected: v === state.profile.goal }, `${l} (${v} XP)`)));
  goal.addEventListener('change', () => {
    state.profile.goal = Number(goal.value);
    save();
  });
  const toggle = (label: string, key: 'sound' | 'showCoords') => {
    const cb = h('input', { type: 'checkbox', checked: state.settings[key] });
    cb.addEventListener('change', () => {
      state.settings[key] = cb.checked;
      save();
    });
    return h('label.toggle', h('span', label), cb);
  };
  const name = h('input', { type: 'text', value: state.profile.name, placeholder: 'Your name' });
  name.addEventListener('change', () => {
    state.profile.name = name.value.trim();
    save();
  });

  const exp = h('button.btn.ghost', { type: 'button' }, 'Export backup');
  exp.addEventListener('click', () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `chess-mentor-${today()}.json` });
    a.click();
  });
  const file = h('input', { type: 'file', accept: 'application/json', hidden: true });
  const imp = h('button.btn.ghost', { type: 'button' }, 'Restore backup');
  imp.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      importBackup(await f.text());
      render();
    } catch (e) {
      alert((e as Error).message);
    }
  });
  const reset = h('button.btn.danger', { type: 'button' }, 'Reset all progress');
  reset.addEventListener('click', () => {
    if (confirm('Erase all progress, streaks and reviews? This cannot be undone.')) {
      resetAll();
      render();
    }
  });

  return h(
    'section.panel',
    h('h3', 'Settings'),
    h('label.field', h('span', 'Name'), name),
    h('label.field', h('span', 'Daily goal'), goal),
    toggle('Sound effects', 'sound'),
    toggle('Board coordinates', 'showCoords'),
    h('div.inline', exp, imp, file),
    reset,
  );
}

export function renderProfile(host: HTMLElement): void {
  host.append(topBar(state.profile.name || 'Me'));
  const lessonsDone = Object.keys(state.lessons).length;
  const cards = CARDS.filter((c) => state.cards[c.id]).length;
  host.append(
    h(
      'section.panel',
      h('div.pstats', stat(`🔥 ${currentStreak()}`, 'day streak'), stat(`${state.streak.best}`, 'best streak'), stat(`${state.xp}`, 'total XP')),
      h('div.pstats', stat(`${lessonsDone}/${LESSONS.length}`, 'lessons'), stat(String(cards), 'patterns learned'), stat(`${state.profile.goal}`, 'XP goal')),
      h('h4', 'This week'),
      weekChart(),
    ),
  );

  const tags = Object.entries(state.tags)
    .filter(([t, s]) => s.seen >= 2 && t !== 'from-games')
    .map(([t, s]) => ({ t, acc: 1 - s.wrong / s.seen, seen: s.seen }))
    .sort((a, b) => a.acc - b.acc);
  if (tags.length) {
    host.append(
      h(
        'section.panel',
        h('h3', 'Concept accuracy'),
        h('p.muted', 'How often you get each idea right. Lowest first; these are what your reviews will focus on.'),
        ...tags.map(({ t, acc, seen }) =>
          h(
            'div.acc-row',
            h('span', tagLabel(t)),
            h('div.meter', h('div', { style: `width:${Math.round(acc * 100)}%`, class: acc < 0.7 ? 'low' : '' })),
            h('small.muted', `${Math.round(acc * 100)}% · ${seen}`),
          ),
        ),
      ),
    );
  }
  host.append(importSection(), settingsSection(), h('p.footnote', 'Progress is stored on this device. Export a backup now and then.'));
}
