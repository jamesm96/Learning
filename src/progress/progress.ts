// What the learner has done, and the rules for updating it.
// Pure functions only: each takes the old progress and returns a new one.
// Saving to the device lives in storage.ts.

import type { Course, Lesson, Module } from "../content/schema";
import { dayKey, type DayKey } from "./dates";
import { addCard, answerCard, type ReviewCard } from "./review";

/** Bump this when the stored shape changes, and add a step to migrate(). */
export const PROGRESS_VERSION = 3;

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

/** One entry in the bug journal. */
export interface BugEntry {
  id: string;
  symptom: string; // what you saw
  cause: string; // what was really wrong
  howFound: string; // how you tracked it down
  createdAt: string; // ISO date
  exerciseId?: string; // set when logged from a Fix the bug exercise
}

/** An Apply task: done or not, and your notes. */
export interface ApplyTaskState {
  done: boolean;
  notes: string;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  haptics: boolean;
}

export interface Progress {
  version: typeof PROGRESS_VERSION;
  lessons: Record<string, LessonProgress>;
  answers: Record<string, AnswerRecord>;
  explanations: Record<string, Explanation>; // by lesson id (added in version 2)
  review: Record<string, ReviewCard>; // by exercise id, or "recall:" + lesson id (version 3 onwards)
  activity: Record<DayKey, number>; // seconds of practice per day
  bugs: BugEntry[]; // newest first
  apply: Record<string, ApplyTaskState>; // by Apply task id
  selfTest: Record<string, boolean>; // by self-test item id
  settings: Settings;
  lastBackupAt: string | null; // ISO date of the last export
}

export const DEFAULT_SETTINGS: Settings = { theme: "system", haptics: true };

export type LessonState = "new" | "started" | "done";

/** Progress for someone who has not started. */
export function emptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    lessons: {},
    answers: {},
    explanations: {},
    review: {},
    activity: {},
    bugs: [],
    apply: {},
    selfTest: {},
    settings: { ...DEFAULT_SETTINGS },
    lastBackupAt: null,
  };
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

/** Put an exercise or recall card into spaced review, if it is not there already. */
export function addToReview(progress: Progress, id: string, today: DayKey): Progress {
  const review = addCard(progress.review, id, today);
  return review === progress.review ? progress : { ...progress, review };
}

/** Move a card after answering it in a review session. */
export function recordReview(progress: Progress, id: string, correct: boolean, today: DayKey): Progress {
  return { ...progress, review: { ...progress.review, [id]: answerCard(progress.review[id], correct, today) } };
}

/** Add seconds of practice to a day. */
export function addActivity(progress: Progress, day: DayKey, seconds: number): Progress {
  return { ...progress, activity: { ...progress.activity, [day]: (progress.activity[day] ?? 0) + seconds } };
}

/** Add a bug journal entry, newest first. */
export function addBug(progress: Progress, entry: BugEntry): Progress {
  return { ...progress, bugs: [entry, ...progress.bugs] };
}

/** Change a bug journal entry. */
export function updateBug(progress: Progress, id: string, change: Partial<Omit<BugEntry, "id">>): Progress {
  return { ...progress, bugs: progress.bugs.map((bug) => (bug.id === id ? { ...bug, ...change } : bug)) };
}

/** Remove a bug journal entry. The screen asks first. */
export function deleteBug(progress: Progress, id: string): Progress {
  return { ...progress, bugs: progress.bugs.filter((bug) => bug.id !== id) };
}

/** Tick an Apply task, or change its notes. */
export function updateApplyTask(progress: Progress, id: string, change: Partial<ApplyTaskState>): Progress {
  const previous = progress.apply[id] ?? { done: false, notes: "" };
  return { ...progress, apply: { ...progress.apply, [id]: { ...previous, ...change } } };
}

/** Tick or untick a self-test item. */
export function setSelfTest(progress: Progress, id: string, done: boolean): Progress {
  return { ...progress, selfTest: { ...progress.selfTest, [id]: done } };
}

/** Change settings. */
export function updateSettings(progress: Progress, change: Partial<Settings>): Progress {
  return { ...progress, settings: { ...progress.settings, ...change } };
}

/** Note that a backup was just exported. */
export function markBackedUp(progress: Progress, now: Date): Progress {
  return { ...progress, lastBackupAt: now.toISOString() };
}

/** True when it has been more than 30 days since the last backup (or there never was one) and there is progress worth keeping. */
export function backupDue(progress: Progress, now: Date): boolean {
  const hasProgress = Object.keys(progress.lessons).length > 0 || progress.bugs.length > 0;
  if (!hasProgress) return false;
  if (!progress.lastBackupAt) return true;
  return now.getTime() - new Date(progress.lastBackupAt).getTime() > 30 * 86_400_000;
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

/** Version 3 added review, activity, the bug journal, Apply notes, the self-test, settings and backups.
 * Exercises answered before then go straight into review, due today, so the queue is not empty on day one. */
function migrateV2toV3(data: Record<string, unknown>, today: DayKey): Record<string, unknown> {
  const review: Record<string, ReviewCard> = {};
  for (const id of Object.keys((data.answers as Record<string, unknown> | undefined) ?? {})) {
    review[id] = { box: 1, due: today };
  }
  return {
    ...data,
    version: 3,
    review,
    activity: {},
    bugs: [],
    apply: {},
    selfTest: {},
    settings: { ...DEFAULT_SETTINGS },
    lastBackupAt: null,
  };
}

/** Thrown when stored progress cannot be read. The caller must keep the raw data, never discard it. */
export class UnreadableProgressError extends Error {}

/** Bring stored progress from any earlier version up to the current shape. */
export function migrate(stored: unknown, today: DayKey = dayKey(new Date())): Progress {
  if (stored === undefined || stored === null) return emptyProgress();
  if (typeof stored !== "object" || !("version" in stored)) {
    throw new UnreadableProgressError("stored progress has no version number");
  }
  let data = stored as Record<string, unknown>;

  // One step per version, oldest first, so data from any earlier version is brought fully up to date.
  if (data.version === 1) data = migrateV1toV2(data);
  if (data.version === 2) data = migrateV2toV3(data, today);

  if (data.version === PROGRESS_VERSION) {
    const current = data as Partial<Progress>;
    const empty = emptyProgress();
    return {
      version: PROGRESS_VERSION,
      lessons: current.lessons ?? empty.lessons,
      answers: current.answers ?? empty.answers,
      explanations: current.explanations ?? empty.explanations,
      review: current.review ?? empty.review,
      activity: current.activity ?? empty.activity,
      bugs: current.bugs ?? empty.bugs,
      apply: current.apply ?? empty.apply,
      selfTest: current.selfTest ?? empty.selfTest,
      settings: { ...DEFAULT_SETTINGS, ...current.settings },
      lastBackupAt: current.lastBackupAt ?? null,
    };
  }
  const version = data.version;
  throw new UnreadableProgressError(`stored progress is version ${String(version)}, newer than this app understands`);
}
