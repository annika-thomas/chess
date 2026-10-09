export type Side = 'w' | 'b';

/**
 * A move sequence written in a PGN-like notation:
 *   "1.e4 {Grab the center.} e5 2.Nf3 {Develop with tempo.} Nc6"
 * Move numbers are optional; `{...}` comments attach to the preceding move.
 */
export type LineText = string;

export interface Arrow {
  from: string;
  to: string;
  color?: 'green' | 'red' | 'blue' | 'yellow';
}

interface BaseExercise {
  /** Concept tags used to find the learner's weak spots, e.g. "center", "f7". */
  tags?: string[];
}

/** A reading card, optionally with a board. */
export interface InfoExercise extends BaseExercise {
  type: 'info';
  title?: string;
  text: string;
  /** Moves from the start position to set up the board shown. */
  setup?: LineText;
  /** Alternative to `setup` for composed positions. */
  fen?: string;
  side?: Side;
  arrows?: Arrow[];
  highlights?: string[];
}

/** Guided walkthrough: the learner plays their side with a hint arrow; each move is explained. */
export interface WalkExercise extends BaseExercise {
  type: 'walk';
  side: Side;
  line: LineText;
  /** Plies auto-played before the walkthrough starts (default 0). */
  from?: number;
  title?: string;
}

/** Recall: play the line from memory. The opponent's moves are played for you. */
export interface RecallExercise extends BaseExercise {
  type: 'recall';
  side: Side;
  line: LineText;
  /** Plies auto-played before the learner takes over (default 0). */
  from?: number;
  prompt?: string;
}

/** Find the move(s) in a position. `solution` alternates learner/opponent moves, learner first. */
export interface FindExercise extends BaseExercise {
  type: 'find';
  side: Side;
  setup?: LineText;
  fen?: string;
  solution: string[];
  /** Other acceptable first moves (they also count as correct). */
  accept?: string[];
  prompt: string;
  explain: string;
  arrows?: Arrow[];
}

export interface ChoiceOption {
  text: string;
  correct?: boolean;
  /** Shown when this option is picked. */
  why?: string;
}

/** Multiple choice, optionally about a board position. `flash` hides the board after N ms. */
export interface ChoiceExercise extends BaseExercise {
  type: 'choice';
  prompt: string;
  setup?: LineText;
  fen?: string;
  side?: Side;
  /** Show only pawns and kings: trains structure recognition. */
  pawnsOnly?: boolean;
  options: ChoiceOption[];
  explain?: string;
  flash?: number;
  arrows?: Arrow[];
  highlights?: string[];
}

export type Exercise = InfoExercise | WalkExercise | RecallExercise | FindExercise | ChoiceExercise;

export interface Lesson {
  id: string;
  title: string;
  /** One-line description of what you'll learn. */
  goal: string;
  /** Default tags for exercises that don't set their own. */
  tags?: string[];
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  color: string;
  icon: string;
  /** Which side the learner plays in this unit's lines, if any. */
  side?: Side;
  lessons: Lesson[];
}

/** A repertoire line used to grade imported games and to browse the repertoire. */
export interface RepertoireLine {
  id: string;
  side: Side;
  name: string;
  line: LineText;
  unitId: string;
}
