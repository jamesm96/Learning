// Assemble the whole course from content/: course.yaml, then each module.yaml and its lessons.
// File reading is passed in, so this stays pure and testable; the Vite plugin supplies real files.

import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { ContentError, inlineMarkdownToHtml, markdownToHtml, parseLesson } from "./parse-lesson.ts";
import { courseSource, moduleSource, type Course, type Lesson, type Module } from "./schema.ts";

/** Reads a file under content/ by its relative path, for example "modules/01-data/module.yaml". */
export type ReadContentFile = (relativePath: string) => string;

/** Load, validate and render every content file. Throws one ContentError listing all problems. */
export function loadCourse(read: ReadContentFile): Course {
  const problems: string[] = [];

  const courseData = courseSource.safeParse(parseYaml(read("course.yaml")));
  if (!courseData.success) {
    throw new ContentError(`course.yaml is invalid:\n${z.prettifyError(courseData.error)}`);
  }

  const modules: Module[] = [];
  const planned = [];
  for (const entry of courseData.data.modules) {
    if ("planned" in entry) {
      planned.push(entry.planned);
      continue;
    }
    const module = loadModule(entry.folder, read, problems);
    if (module) modules.push(module);
  }

  const practice = {
    drills: loadPractice(courseData.data.practice.drills, read, problems, () => null),
    bugHunt: loadPractice(courseData.data.practice.bugHunt, read, problems, (step) =>
      step.kind === "exercise" && step.exercise.type === "fix" ? null : "the bug hunt holds only fix exercises",
    ),
  };

  problems.push(...findDuplicateIds([...modules, practiceAsModule(practice)]));

  if (problems.length > 0) {
    throw new ContentError(`Content has ${problems.length} problem(s):\n\n${problems.join("\n\n")}`);
  }
  const files: Record<string, string> = {};
  for (const name of courseData.data.files) {
    files[name] = read(`files/${name}`).replace(/\r\n/g, "\n");
  }
  return { title: courseData.data.title, files, selfTest: courseData.data.selfTest, practice, modules, planned };
}

/** Load one module folder. Problems are added to the list rather than thrown, so all are reported at once. */
function loadModule(folder: string, read: ReadContentFile, problems: string[]): Module | null {
  const base = `modules/${folder}`;
  const data = moduleSource.safeParse(parseYaml(read(`${base}/module.yaml`)));
  if (!data.success) {
    problems.push(`${base}/module.yaml is invalid:\n${z.prettifyError(data.error)}`);
    return null;
  }
  const source = data.data;

  const lessons: Lesson[] = [];
  for (const file of source.lessons) {
    try {
      lessons.push(parseLesson(read(`${base}/${file}`)));
    } catch (error) {
      problems.push(`${base}/${file}: ${(error as Error).message}`);
    }
  }

  return {
    id: source.id,
    label: source.label,
    title: source.title,
    summary: source.summary,
    introHtml: source.intro === undefined ? undefined : markdownToHtml(source.intro),
    lessons,
    checkHtml: (source.check ?? []).map(inlineMarkdownToHtml),
    bridgeHtml: source.bridge === undefined ? undefined : markdownToHtml(source.bridge),
    apply: (source.apply ?? []).map((task) => ({ id: task.id, tier: task.tier, html: inlineMarkdownToHtml(task.text) })),
    prompts: source.prompts ?? [],
  };
}

/**
 * Load practice bank files. Every step must be an exercise, with no reading steps or recap,
 * and `rule` can refuse a step (it returns a problem, or null when the step is fine).
 */
function loadPractice(
  files: string[],
  read: ReadContentFile,
  problems: string[],
  rule: (step: Lesson["steps"][number]) => string | null,
): Lesson[] {
  const lessons: Lesson[] = [];
  for (const file of files) {
    try {
      const lesson = parseLesson(read(`practice/${file}`));
      lesson.steps.forEach((step, index) => {
        if (step.kind !== "exercise") throw new ContentError(`step ${index + 1}: practice files hold only exercises`);
        const problem = rule(step);
        if (problem) throw new ContentError(`step ${index + 1}: ${problem}`);
      });
      lessons.push(lesson);
    } catch (error) {
      problems.push(`practice/${file}: ${(error as Error).message}`);
    }
  }
  return lessons;
}

/** The practice banks wrapped as a module, so the same id and Python checks cover them. */
export function practiceAsModule(practice: Course["practice"]): Module {
  return {
    id: "practice",
    label: "Practice",
    title: "Practice",
    summary: "",
    lessons: [...practice.drills, ...practice.bugHunt],
    checkHtml: [],
    apply: [],
    prompts: [],
  };
}

/** Progress is stored by id, so every module, lesson and exercise id must be unique across the course. */
export function findDuplicateIds(modules: Module[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const note = (id: string) => {
    if (seen.has(id)) duplicates.push(`Duplicate id "${id}". Ids must be unique across the whole course.`);
    seen.add(id);
  };

  for (const module of modules) {
    note(module.id);
    for (const lesson of module.lessons) {
      note(lesson.id);
      for (const step of lesson.steps) {
        if (step.kind === "exercise") note(step.exercise.id);
      }
    }
  }
  return duplicates;
}
