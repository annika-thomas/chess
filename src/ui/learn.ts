import { UNITS, LESSONS, LEVELS, isCard, type LessonRef } from '../data';
import { currentStep, lessonComplete, levelReadyForTest, levelUnlocked, practiceMastered } from '../engine/levels';
import { getSet, PASS } from '../engine/puzzles';
import { runPuzzleSet } from './puzzleRun';
import { advise, buildReview, buildUnitReview, buildWeakSpotDrill, isLessonDone, isUnlocked, unitStrength } from '../engine/coach';
import { currentStreak, state, xpToday } from '../engine/store';
import type { Lesson } from '../types';
import { bossFor, type Boss } from '../data/bosses';
import { sheet, startSession } from './app';
import { recommendedLevel, startBoss } from './play';
import { h, md } from './dom';
import { icon, unitIcon } from './icons';

export function lessonItems(lesson: Lesson) {
  return lesson.exercises.map((exercise, i) => ({
    exercise,
    tags: exercise.tags ?? lesson.tags ?? [],
    cardId: isCard(exercise) ? `${lesson.id}#${i}` : undefined,
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
  ring.append(pct >= 1 ? h('span', icon('check')) : h('span', String(xpToday())));
  return ring;
}

export function topBar(title: string): HTMLElement {
  const streak = currentStreak();
  return h(
    'header.topbar',
    h('div.brand', title),
    h('div.chips', h(`div.chip.streak${streak ? '' : '.cold'}`, icon('flame'), ` ${streak}`), goalRing()),
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
    else if (act.kind === 'set') openSet(act.setId);
  });
  return h('section.coach', h('div.avatar', '♞'), h('div.coach-body', h('h2', a.headline), h('p', a.body), btn));
}

/** Open a puzzle set: practice first, then timed reruns once it's mastered. Tests and mixes get no theme hint. */
export function openSet(setId: string): void {
  getSet(setId)
    .then((set) => {
      if (!set) {
        alert('This puzzle set isn’t available yet: the puzzle library is still being imported.');
        return;
      }
      const unlabelled = setId.includes('test') || setId.startsWith('mix') || setId === 'daily';
      runPuzzleSet({ set, mode: state.sets[setId]?.mastered ? 'cycle' : unlabelled ? 'test' : 'practice', hint: unlabelled ? undefined : set.title });
    })
    .catch(() => alert('Couldn’t load the puzzles. Try reopening the app.'));
}

function setStatus(setId: string): string {
  const rec = state.sets[setId];
  if (!rec) return `Pass at ${Math.round(PASS * 100)}% to unlock the next lesson`;
  if (rec.mastered) return `Passed · best ${Math.round(rec.bestAccuracy * 100)}%${rec.fluentRuns ? ` · fluent ×${rec.fluentRuns}` : ''}`;
  return `Best ${Math.round(rec.bestAccuracy * 100)}% · need ${Math.round(PASS * 100)}%`;
}

function lessonSheet(ref: LessonRef): void {
  const done = isLessonDone(ref.lesson.id);
  const open = isUnlocked(ref);
  const practice = ref.lesson.practice;
  const needsPractice = done && practice && !practiceMastered(practice);
  const go = h(`button.btn.${needsPractice ? 'ghost' : 'primary'}.wide`, { type: 'button' }, done ? 'Redo the lesson (+XP)' : 'Start lesson');
  const set = practice ? h(`button.btn.${needsPractice ? 'primary' : 'ghost'}.wide`, { type: 'button', disabled: !done }, done ? 'Practice set' : 'Practice set (after the lesson)') : null;
  const content = h(
    'div.lesson-sheet',
    h('div.unit-name', { style: `color:${ref.unit.color}` }, ref.unit.title),
    h('h2', ref.lesson.title),
    h('p', ref.lesson.goal),
    practice ? h('p.muted', icon('target'), ` Practice set: ${setStatus(practice)}`) : null,
    open
      ? h('div.stack', set && needsPractice ? set : null, go, set && !needsPractice ? set : null)
      : h('p.muted', icon('lock'), ' Locked. Finish the lessons before it, including their practice sets. A coach wouldn’t skip you ahead, and the patterns build on each other.'),
  );
  const close = sheet(content);
  go.addEventListener('click', () => {
    close();
    startLesson(ref);
  });
  set?.addEventListener('click', () => {
    close();
    openSet(practice!);
  });
}

/** End-of-level mixed test: unlocks the next level at 80%. */
function levelTestCard(index: number): HTMLElement | null {
  const lvl = LEVELS[index];
  if (!lvl.test) return null;
  const rec = state.sets[lvl.test];
  const ready = levelUnlocked(index) && levelReadyForTest(index);
  const btn = h('button.btn.primary', { type: 'button', disabled: !ready }, rec?.mastered ? 'Retake for a better score' : ready ? 'Take the test' : 'Finish the level first');
  btn.addEventListener('click', () => openSet(lvl.test!));
  return h(
    'section.level-test',
    h('div.sheet-art', icon(rec?.mastered ? 'trophy' : ready ? 'target' : 'lock')),
    h('h3', `${lvl.title.split(' · ')[0]} test`),
    h('p.muted', rec?.mastered ? `Passed with ${Math.round(rec.bestAccuracy * 100)}%. The next level is open.` : `30 mixed puzzles, no hints. Pass at ${Math.round(PASS * 100)}% to unlock the next level.`),
    btn,
  );
}

function levelHeader(index: number): HTMLElement {
  const lvl = LEVELS[index];
  const open = levelUnlocked(index);
  return h(
    `div.level-header${open ? '' : '.locked'}`,
    h('div', h('h4', lvl.title), h('small.muted', `Target: ${lvl.target}${open ? '' : ` · pass the ${LEVELS[index - 1].title.split(' · ')[0]} test to unlock`}`)),
    open ? null : icon('lock'),
  );
}

const OFFSETS = [0, 38, 58, 38, 0, -38, -58, -38];

/** The castle at the end of a unit: play on from the unit's position for its crown. */
function bossNode(boss: Boss, unitDone: boolean, offset: number): HTMLElement {
  const rec = state.bosses[boss.unitId];
  const beaten = !!rec?.beaten;
  const node = h(
    `button.node.boss${beaten ? '.done' : ''}${unitDone && !beaten ? '.ready' : ''}${unitDone || beaten ? '' : '.locked'}`,
    { type: 'button', style: `transform:translateX(${offset}px)`, 'aria-label': `Boss: ${boss.name}` },
    h('span.node-icon', icon(beaten ? 'crownCream' : 'rook')),
  );
  node.addEventListener('click', () => bossSheet(boss, unitDone));
  return h('div.node-wrap', node, h('div.node-label', { style: `transform:translateX(${offset}px)` }, `Boss: ${boss.name}`));
}

function bossSheet(boss: Boss, unitDone: boolean): void {
  const rec = state.bosses[boss.unitId];
  const level = recommendedLevel();
  const go = h('button.btn.primary.wide', { type: 'button' }, rec?.beaten ? 'Play again' : unitDone ? 'Challenge the boss' : 'Challenge anyway');
  const content = h(
    'div.lesson-sheet',
    h('div.unit-name', { style: 'color:var(--gold)' }, icon(rec?.beaten ? 'crown' : 'rook'), rec?.beaten ? ' Crown earned' : ' Boss battle'),
    h('h2', boss.name),
    md(boss.brief),
    md(
      `You play **${boss.side === 'w' ? 'White' : 'Black'}** against **${level.name} (~${level.elo})**, the level closest to your rating. Win, or still be standing after **${boss.moves} moves**, to earn the crown.`,
    ),
    rec ? h('p.muted', `Attempts: ${rec.attempts}`) : null,
    !unitDone && !rec?.beaten ? h('p.muted', 'Tip: finish the unit’s lessons first. The boss tests exactly those ideas.') : null,
    go,
  );
  const close = sheet(content);
  go.addEventListener('click', () => {
    close();
    startBoss(boss);
  });
}

function unitBlock(unitIndex: number): HTMLElement {
  const unit = UNITS[unitIndex];
  const refs = LESSONS.filter((l) => l.unit.id === unit.id);
  const allDone = refs.every((r) => isLessonDone(r.lesson.id));
  const strength = unitStrength(unit.id);
  const banner = h(
    'div.unit-banner',
    { style: `background:${unit.color}` },
    h('div', h('div.unit-kicker', `Unit ${unitIndex + 1}`), h('h3', unit.title), h('p', unit.subtitle)),
    h('div.unit-icon', state.bosses[unit.id]?.beaten ? icon('crown') : unitIcon(unit.icon)),
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
  const step = currentStep();
  refs.forEach((ref, i) => {
    const learned = isLessonDone(ref.lesson.id);
    const done = lessonComplete(ref);
    const half = learned && !done;
    const current = !!step && 'ref' in step && step.ref.lesson.id === ref.lesson.id;
    const locked = !isUnlocked(ref);
    const node = h(
      `button.node${done ? '.done' : ''}${half ? '.half' : ''}${current ? '.current' : ''}${locked ? '.locked' : ''}`,
      { type: 'button', style: `--c:${unit.color};transform:translateX(${OFFSETS[i % OFFSETS.length]}px)`, 'aria-label': ref.lesson.title },
      h('span.node-icon', done ? icon('starCream') : half ? icon('target') : locked ? icon('lock') : unitIcon(unit.icon)),
    );
    const bubble = current && step && 'needs' in step && step.needs === 'practice' ? 'PRACTICE' : 'START';
    const wrap = h('div.node-wrap', current ? h('div.start-bubble', { style: `transform:translateX(${OFFSETS[i % OFFSETS.length]}px)` }, bubble) : null, node, h('div.node-label', { style: `transform:translateX(${OFFSETS[i % OFFSETS.length]}px)` }, ref.lesson.title));
    node.addEventListener('click', () => lessonSheet(ref));
    path.append(wrap);
  });
  const boss = bossFor(unit.id);
  if (boss) path.append(bossNode(boss, allDone, OFFSETS[refs.length % OFFSETS.length]));
  return h('section.unit', { id: `unit-${unit.id}` }, banner, path);
}

export function renderLearn(host: HTMLElement): void {
  host.append(topBar('Chess Mentor'), coachCard());
  LEVELS.forEach((lvl, li) => {
    host.append(levelHeader(li));
    UNITS.forEach((unit, i) => {
      if (lvl.units.includes(unit.id)) host.append(unitBlock(i));
    });
    const test = levelTestCard(li);
    if (test) host.append(test);
  });
  host.append(h('p.footnote', 'Lessons unlock in order, after you pass each practice set. Reviews keep everything fresh.'));
}
