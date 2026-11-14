// The course content, built by content-plugin.ts, plus small lookups the screens need.

import course from "virtual:course";
import type { Lesson, Module } from "./schema";

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
