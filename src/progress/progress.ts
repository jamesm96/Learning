// What the learner has done, and the rules for updating it.
// Pure functions only: each takes the old progress and returns a new one.
// Saving to the device lives in storage.ts.

import type { Course, Lesson, Module } from "../content/schema";

/** Bump this when the stored shape changes, and add a step to migrate(). */
export const PROGRESS_VERSION = 2;

export interface LessonProgress {
  step: number; // index of the step to resume at
  completedAt?: string; // ISO date, set when the lesson was finished
}

export interface AnswerRecord {
  attempts: number;
  firstTryCorrect: boolean;
  lastCorrect: boolean;
  lastAnsweredAt: string; // ISO date
}

/** What the learner wrote in "Explain it back" at the end of a lesson. Never graded. */
export interface Explanation {
  text: string;
  savedAt: string; // ISO date
}

export interface Progress {
  version: typeof PROGRESS_VERSION;
  lessons: Record<string, LessonProgress>;
  answers: Record<string, AnswerRecord>;
  explanations: Record<string, Explanation>; // by lesson id (added in version 2)
}

export type LessonState = "new" | "started" | "done";

/** Progress for someone who has not started. */
export function emptyProgress(): Progress {
  return { version: PROGRESS_VERSION, lessons: {}, answers: {}, explanations: {} };
}

/** Record one answer to an exercise. The first attempt is kept separately, because that is the honest score. */
export function recordAnswer(progress: Progress, exerciseId: string, correct: boolean, now: Date): Progress {
  const previous = progress.answers[exerciseId];
  const record: AnswerRecord = {
    attempts: (previous?.attempts ?? 0) + 1,
    firstTryCorrect: previous ? previous.firstTryCorrect : correct,
    lastCorrect: correct,
    lastAnsweredAt: now.toISOString(),
  };
  return { ...progress, answers: { ...progress.answers, [exerciseId]: record } };
}

/** Save what the learner wrote for a lesson's "Explain it back". */
export function saveExplanation(progress: Progress, lessonId: string, text: string, now: Date): Progress {
  return { ...progress, explanations: { ...progress.explanations, [lessonId]: { text, savedAt: now.toISOString() } } };
}

/** Remember which step of a lesson to come back to. */
export function saveStep(progress: Progress, lessonId: string, step: number): Progress {
  const previous = progress.lessons[lessonId];
  return { ...progress, lessons: { ...progress.lessons, [lessonId]: { ...previous, step } } };
}

/** Mark a lesson finished. Going through it again later keeps the first completion date. */
export function completeLesson(progress: Progress, lessonId: string, now: Date): Progress {
  const previous = progress.lessons[lessonId];
  const completedAt = previous?.completedAt ?? now.toISOString();
  return { ...progress, lessons: { ...progress.lessons, [lessonId]: { step: 0, completedAt } } };
}

/** Whether a lesson is untouched, under way or finished. */
export function lessonState(progress: Progress, lessonId: string): LessonState {
  const lesson = progress.lessons[lessonId];
  if (!lesson) return "new";
  if (lesson.completedAt) return "done";
  return "started";
}

/** How many of a module's lessons are finished. */
export function moduleCounts(progress: Progress, module: Module): { done: number; total: number } {
  const done = module.lessons.filter((lesson) => lessonState(progress, lesson.id) === "done").length;
  return { done, total: module.lessons.length };
}

/** How many of a lesson's exercises were right first time, out of those answered. */
export function lessonScore(progress: Progress, lesson: Lesson): { right: number; answered: number } {
  let right = 0;
  let answered = 0;
  for (const step of lesson.steps) {
    if (step.kind !== "exercise") continue;
    const record = progress.answers[step.exercise.id];
    if (!record) continue;
    answered += 1;
    if (record.firstTryCorrect) right += 1;
  }
  return { right, answered };
}

export interface NextStop {
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  moduleLabel: string;
  step: number;
  stepCount: number;
}

/** The first unfinished lesson in course order, and the step to resume at. Null when everything is done. */
export function nextStop(progress: Progress, course: Course): NextStop | null {
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lessonState(progress, lesson.id) === "done") continue;
      const saved = progress.lessons[lesson.id]?.step ?? 0;
      return {
        moduleId: module.id,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleLabel: module.label,
        step: Math.min(saved, lesson.steps.length - 1),
        stepCount: lesson.steps.length,
      };
    }
  }
  return null;
}

/** Version 2 added saved explanations. Everything from version 1 is kept as it was. */
function migrateV1toV2(data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, version: 2, explanations: {} };
}

/** Thrown when stored progress cannot be read. The caller must keep the raw data, never discard it. */
export class UnreadableProgressError extends Error {}

/** Bring stored progress from any earlier version up to the current shape. */
export function migrate(stored: unknown): Progress {
  if (stored === undefined || stored === null) return emptyProgress();
  if (typeof stored !== "object" || !("version" in stored)) {
    throw new UnreadableProgressError("stored progress has no version number");
  }
  let data = stored as Record<string, unknown>;

  // One step per version, oldest first, so data from any earlier version is brought fully up to date.
  if (data.version === 1) data = migrateV1toV2(data);

  if (data.version === PROGRESS_VERSION) {
    const current = data as Partial<Progress>;
    return {
      version: PROGRESS_VERSION,
      lessons: current.lessons ?? {},
      answers: current.answers ?? {},
      explanations: current.explanations ?? {},
    };
  }
  const version = data.version;
  throw new UnreadableProgressError(`stored progress is version ${String(version)}, newer than this app understands`);
}
