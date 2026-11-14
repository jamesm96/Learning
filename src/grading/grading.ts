// Marking answers. Pure functions, no UI.

import type { ChoiceExercise, ClozeExercise } from "../content/schema";

/** Is this the right option? Answers are matched by id, so shuffled order never matters. */
export function gradeChoice(exercise: ChoiceExercise, optionId: string): boolean {
  return exercise.answer === optionId;
}

export interface ClozeResult {
  correct: boolean; // every blank right
  blanks: boolean[]; // one entry per blank
}

/** Mark each blank of a fill-the-gap exercise. An unfilled blank (null) is wrong. */
export function gradeCloze(exercise: ClozeExercise, picks: (string | null)[]): ClozeResult {
  const blanks = exercise.blanks.map((blank, index) => picks[index] === blank.answer);
  return { correct: blanks.every(Boolean), blanks };
}

/** A shuffled copy of a list (Fisher-Yates). Pass your own random function in tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = temp;
  }
  return copy;
}
