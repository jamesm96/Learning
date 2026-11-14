// The course content, built by content-plugin.ts, plus small lookups the screens need.

import course from "virtual:course";
import type { Exercise, Lesson, Module } from "./schema";

export { course };

/** Find a module by id. */
export function findModule(moduleId: string): Module | undefined {
  return course.modules.find((module) => module.id === moduleId);
}

/** Find a lesson within a module. */
export function findLesson(module: Module, lessonId: string): Lesson | undefined {
  return module.lessons.find((lesson) => lesson.id === lessonId);
}

/** The lesson after this one in the same module, if there is one. */
export function nextLessonInModule(module: Module, lessonId: string): Lesson | undefined {
  const index = module.lessons.findIndex((lesson) => lesson.id === lessonId);
  return module.lessons[index + 1];
}

export interface ExerciseLocation {
  exercise: Exercise;
  lesson: Lesson;
  module: Module;
}

/** Every exercise in the course by id, with the lesson and module it sits in. */
const exercisesById = new Map<string, ExerciseLocation>();
const lessonsById = new Map<string, { lesson: Lesson; module: Module }>();
for (const module of course.modules) {
  for (const lesson of module.lessons) {
    lessonsById.set(lesson.id, { lesson, module });
    for (const step of lesson.steps) {
      if (step.kind === "exercise") exercisesById.set(step.exercise.id, { exercise: step.exercise, lesson, module });
    }
  }
}

/** Find an exercise anywhere in the course. */
export function findExercise(id: string): ExerciseLocation | undefined {
  return exercisesById.get(id);
}

/** Find a lesson anywhere in the course. */
export function findLessonById(id: string): { lesson: Lesson; module: Module } | undefined {
  return lessonsById.get(id);
}

/** Graded exercises go into spaced review. "Split this function" is self-assessed, so it stays out. */
export function isReviewable(exerciseId: string): boolean {
  const found = exercisesById.get(exerciseId);
  return found !== undefined && found.exercise.type !== "split";
}
