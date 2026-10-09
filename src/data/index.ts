import type { Exercise, Lesson, RepertoireLine, Unit } from '../types';
import { basics } from './basics';
import { blackItalian, carlsbad, otherE4, qgd, ruyScotch, vsSystems } from './black';
import { principles, survive } from './foundations';
import * as L from './lines';
import { patternGym } from './patterns';
import { beyond, italian, punish } from './white';

export const UNITS: Unit[] = [
  basics,
  principles,
  survive,
  italian,
  punish,
  beyond,
  blackItalian,
  ruyScotch,
  otherE4,
  qgd,
  carlsbad,
  vsSystems,
  patternGym,
];

export interface LessonRef {
  unit: Unit;
  lesson: Lesson;
  /** Index across the whole course, used for unlock order. */
  order: number;
}

export const LESSONS: LessonRef[] = UNITS.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson, order: 0 }))).map(
  (ref, order) => ({ ...ref, order }),
);

const byId = new Map(LESSONS.map((r) => [r.lesson.id, r]));
export const lessonRef = (id: string) => byId.get(id);

/** Exercises that become spaced-repetition cards (everything you actively recall). */
export function isCard(ex: Exercise): boolean {
  return ex.type !== 'info' && ex.type !== 'walk';
}

export const cardId = (lessonId: string, index: number) => `${lessonId}#${index}`;

export interface CardRef {
  id: string;
  unit: Unit;
  lesson: Lesson;
  exercise: Exercise;
  tags: string[];
}

export const CARDS: CardRef[] = LESSONS.flatMap(({ unit, lesson }) =>
  lesson.exercises.flatMap((exercise, i) =>
    isCard(exercise) ? [{ id: cardId(lesson.id, i), unit, lesson, exercise, tags: exercise.tags ?? lesson.tags ?? [] }] : [],
  ),
);

const cardById = new Map(CARDS.map((c) => [c.id, c]));
export const cardRef = (id: string) => cardById.get(id);

export const tagsOf = (lesson: Lesson, ex: Exercise) => ex.tags ?? lesson.tags ?? [];

const lineMeta: Array<[keyof typeof L, string, string]> = [
  ['ITALIAN_MAIN', 'Italian Game · Giuoco Piano', 'italian'],
  ['TWO_KNIGHTS_D3', 'Italian · Two Knights with 4.d3', 'italian'],
  ['TWO_KNIGHTS_TRANSPO', 'Italian · Two Knights into the Piano', 'italian'],
  ['BLACKBURNE_AVOID', 'Italian · vs 3...Nd4', 'italian'],
  ['PETROV', 'Petrov Defense', 'punish'],
  ['PHILIDOR', 'Philidor Defense', 'punish'],
  ['ALAPIN_D5', 'Sicilian Alapin · 2...d5', 'beyond'],
  ['ALAPIN_NF6', 'Sicilian Alapin · 2...Nf6', 'beyond'],
  ['FRENCH_ADVANCE', 'French · Advance', 'beyond'],
  ['CARO_ADVANCE', 'Caro-Kann · Advance', 'beyond'],
  ['SCANDI', 'Scandinavian · 3.Nc3', 'beyond'],
  ['PIRC_CLASSICAL', 'Pirc · Classical setup', 'beyond'],
  ['BLACK_ITALIAN', 'Italian (as Black) · Giuoco Piano', 'black-italian'],
  ['BLACK_ITALIAN_D4', 'Italian (as Black) · vs c3 & d4', 'black-italian'],
  ['EVANS_DECLINED', 'Evans Gambit Declined', 'black-italian'],
  ['RUY_CLOSED', 'Ruy Lopez · Closed (Chigorin)', 'ruy-scotch'],
  ['RUY_EXCHANGE', 'Ruy Lopez · Exchange', 'ruy-scotch'],
  ['SCOTCH', 'Scotch · 5.Be3', 'ruy-scotch'],
  ['SCOTCH_NXC6', 'Scotch · 5.Nxc6', 'ruy-scotch'],
  ['VIENNA', 'Vienna Game', 'other-e4'],
  ['KINGS_GAMBIT', "King's Gambit Declined", 'other-e4'],
  ['CENTER_GAME', 'Center Game', 'other-e4'],
  ['FOUR_KNIGHTS', 'Four Knights · Symmetrical', 'other-e4'],
  ['QGD_MAIN', "Queen's Gambit Declined · Orthodox", 'qgd'],
  ['QGD_NF3', 'QGD · 3.Nf3 move order', 'qgd'],
  ['QGD_BF4', 'QGD · 4.Bf4', 'qgd'],
  ['QGD_EXCHANGE', 'QGD · Exchange (Carlsbad)', 'carlsbad'],
  ['VS_LONDON', 'vs London System', 'vs-systems'],
  ['VS_COLLE', 'vs Colle / 2.Nf3', 'vs-systems'],
  ['VS_ENGLISH', 'vs English (1.c4)', 'vs-systems'],
  ['VS_RETI', 'vs Réti (1.Nf3)', 'vs-systems'],
];

const WHITE_UNITS = new Set(['italian', 'punish', 'beyond']);

export const REPERTOIRE: RepertoireLine[] = lineMeta.map(([key, name, unitId]) => ({
  id: key,
  name,
  unitId,
  side: WHITE_UNITS.has(unitId) ? 'w' : 'b',
  line: L[key],
}));
