import type {
  Arrow,
  ChoiceExercise,
  ChoiceOption,
  FindExercise,
  InfoExercise,
  LineText,
  RecallExercise,
  Side,
  WalkExercise,
} from '../types';

/** Compact constructors so the curriculum reads like a lesson plan. */
export const info = (text: string, o: Partial<InfoExercise> = {}): InfoExercise => ({ type: 'info', text, ...o });

export const walk = (side: Side, line: LineText, o: Partial<WalkExercise> = {}): WalkExercise => ({
  type: 'walk',
  side,
  line,
  ...o,
});

export const recall = (side: Side, line: LineText, o: Partial<RecallExercise> = {}): RecallExercise => ({
  type: 'recall',
  side,
  line,
  ...o,
});

export const find = (
  side: Side,
  setup: LineText,
  solution: string[],
  prompt: string,
  explain: string,
  o: Partial<FindExercise> = {},
): FindExercise => ({ type: 'find', side, setup, solution, prompt, explain, ...o });

export const choice = (prompt: string, options: ChoiceOption[], o: Partial<ChoiceExercise> = {}): ChoiceExercise => ({
  type: 'choice',
  prompt,
  options,
  ...o,
});

export const yes = (text: string, why?: string): ChoiceOption => ({ text, correct: true, why });
export const no = (text: string, why?: string): ChoiceOption => ({ text, why });

export const arrow = (from: string, to: string, color: Arrow['color'] = 'green'): Arrow => ({ from, to, color });

/** First `n` plies of an annotated line, keeping its notes. */
export function upTo(line: LineText, n: number): LineText {
  const re = /\{[^}]*\}|\S+/g;
  const out: string[] = [];
  let plies = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const tok = m[0];
    if (tok.startsWith('{')) {
      if (plies <= n && out.length) out.push(tok);
      continue;
    }
    if (/^\d+\.(\.\.)?$/.test(tok)) continue;
    if (plies === n) break;
    out.push(tok);
    plies++;
  }
  return out.join(' ');
}
