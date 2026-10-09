import { UNITS, LESSONS, type LessonRef } from '../data';
import { advise, buildReview, buildUnitReview, buildWeakSpotDrill, isLessonDone, isUnlocked, nextLesson, unitStrength } from '../engine/coach';
import { currentStreak, state, xpToday } from '../engine/store';
import type { Lesson } from '../types';
import { sheet, startSession } from './app';
import { h } from './dom';

export function lessonItems(lesson: Lesson) {
  return lesson.exercises.map((exercise, i) => ({
    exercise,
    tags: exercise.tags ?? lesson.tags ?? [],
    cardId: exercise.type === 'recall' || exercise.type === 'find' || exercise.type === 'choice' ? `${lesson.id}#${i}` : undefined,
  }));
}

export function startLesson(ref: LessonRef): void {
  startSession(ref.lesson.title, lessonItems(ref.lesson), 'lesson', ref.lesson.id);
}

export function goalRing(size = 34): HTMLElement {
  const pct = Math.min(1, xpToday() / state.profile.goal);
  const r = 15;
  const c = 2 * Math.PI * r;
  const ring = h('div.ring', {
    title: `${xpToday()} / ${state.profile.goal} XP today`,
    html: `<svg viewBox="0 0 36 36" width="${size}" height="${size}"><circle cx="18" cy="18" r="${r}" class="ring-bg"/><circle cx="18" cy="18" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>`,
  });
  ring.append(h('span', pct >= 1 ? '✓' : String(xpToday())));
  return ring;
}

export function topBar(title: string): HTMLElement {
  const streak = currentStreak();
  return h(
    'header.topbar',
    h('div.brand', title),
    h('div.chips', h(`div.chip.streak${streak ? '' : '.cold'}`, `🔥 ${streak}`), goalRing()),
  );
}

function coachCard(): HTMLElement {
  const a = advise();
  const btn = h('button.btn.primary', { type: 'button', disabled: a.action.kind === 'done' }, a.cta);
  btn.addEventListener('click', () => {
    const act = a.action;
    if (act.kind === 'lesson') startLesson(act.ref);
    else if (act.kind === 'review') startSession('Daily review', buildReview(), 'practice');
    else if (act.kind === 'weak') startSession(act.spot.label, buildWeakSpotDrill(act.spot.tag), 'practice');
  });
  return h('section.coach', h('div.avatar', '♞'), h('div.coach-body', h('h2', a.headline), h('p', a.body), btn));
}

function lessonSheet(ref: LessonRef): void {
  const done = isLessonDone(ref.lesson.id);
  const open = isUnlocked(ref);
  const go = h('button.btn.primary.wide', { type: 'button' }, done ? 'Practice again (+XP)' : open ? 'Start lesson' : 'Jump ahead to here');
  const content = h(
    'div.lesson-sheet',
    h('div.unit-name', { style: `color:${ref.unit.color}` }, ref.unit.title),
    h('h2', ref.lesson.title),
    h('p', ref.lesson.goal),
    !open ? h('p.muted', 'This is ahead of your path. You can jump here, but earlier lessons build the patterns it relies on.') : null,
    go,
  );
  const close = sheet(content);
  go.addEventListener('click', () => {
    close();
    startLesson(ref);
  });
}

const OFFSETS = [0, 38, 58, 38, 0, -38, -58, -38];

function unitBlock(unitIndex: number): HTMLElement {
  const unit = UNITS[unitIndex];
  const refs = LESSONS.filter((l) => l.unit.id === unit.id);
  const allDone = refs.every((r) => isLessonDone(r.lesson.id));
  const strength = unitStrength(unit.id);
  const next = nextLesson();

  const banner = h(
    'div.unit-banner',
    { style: `background:${unit.color}` },
    h('div', h('div.unit-kicker', `Unit ${unitIndex + 1}`), h('h3', unit.title), h('p', unit.subtitle)),
    h('div.unit-icon', unit.icon),
  );
  if (strength !== undefined) {
    banner.append(
      h(
        'div.strength',
        { title: 'How well you remember this unit right now' },
        h('div.strength-fill', { style: `width:${Math.round(strength * 100)}%` }),
      ),
    );
  }
  if (allDone) {
    const rev = h('button.btn.small.on-color', { type: 'button' }, '↻ Review');
    rev.addEventListener('click', () => startSession(`${unit.title} review`, buildUnitReview(unit.id), 'practice'));
    banner.append(rev);
  }

  const path = h('div.path');
  refs.forEach((ref, i) => {
    const done = isLessonDone(ref.lesson.id);
    const current = next?.lesson.id === ref.lesson.id;
    const locked = !isUnlocked(ref);
    const node = h(
      `button.node${done ? '.done' : ''}${current ? '.current' : ''}${locked ? '.locked' : ''}`,
      { type: 'button', style: `--c:${unit.color};transform:translateX(${OFFSETS[i % OFFSETS.length]}px)`, 'aria-label': ref.lesson.title },
      h('span.node-icon', done ? '★' : locked ? '🔒' : unit.icon),
    );
    const wrap = h('div.node-wrap', current ? h('div.start-bubble', { style: `transform:translateX(${OFFSETS[i % OFFSETS.length]}px)` }, 'START') : null, node, h('div.node-label', { style: `transform:translateX(${OFFSETS[i % OFFSETS.length]}px)` }, ref.lesson.title));
    node.addEventListener('click', () => lessonSheet(ref));
    path.append(wrap);
  });
  return h('section.unit', { id: `unit-${unit.id}` }, banner, path);
}

export function renderLearn(host: HTMLElement): void {
  host.append(topBar('Chess Mentor'), coachCard());
  let section = '';
  UNITS.forEach((unit, i) => {
    if (unit.section !== section) {
      section = unit.section;
      host.append(h('h4.section-title', section));
    }
    host.append(unitBlock(i));
  });
  host.append(h('p.footnote', 'Lessons unlock in order. Reviews keep everything fresh.'));
}
