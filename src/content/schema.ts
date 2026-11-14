// The shape of all course content, written once with Zod.
// The build checks every lesson file against these schemas and stops on any mistake.
// The app imports only the TypeScript types (import type), so Zod never ships to the phone.

import { z } from "zod";
import { BLANK } from "./constants.ts";

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids use lowercase letters, digits and dashes");

/** Extra files written into the working folder before the code runs, by name. */
const files = z.record(z.string().regex(/^[\w.\-/]+$/, "file names use letters, digits, dots, dashes and slashes"), z.string());

// ---- Exercises, as written in lesson files (```exercise <type> blocks) ----

/** Predict the output: show code, ask for a prediction, then reveal what it prints. */
export const predictSource = z.strictObject({
  id,
  code: z.string().min(1),
  output: z.string(),
  explain: z.string().min(1),
  hint: z.string().optional(),
  files: files.optional(),
});

/** Multiple choice. The answer is an option id, never a position, so options can be shuffled. */
export const choiceSource = z
  .strictObject({
    id,
    tag: z.enum(["Quick check", "Judgement call"]).default("Quick check"),
    question: z.string().min(1),
    code: z.string().optional(),
    options: z.array(z.strictObject({ id, text: z.string().min(1) })).min(2).max(5),
    answer: id,
    explain: z.string().min(1),
  })
  .refine((ex) => ex.options.some((option) => option.id === ex.answer), {
    message: "answer must be the id of one of the options",
  })
  .refine((ex) => new Set(ex.options.map((option) => option.id)).size === ex.options.length, {
    message: "option ids must be unique",
  });

/** Fill the gap. Each ___ in the code is one blank, filled from its list of options. */
export const clozeSource = z
  .strictObject({
    id,
    prompt: z.string().min(1),
    code: z.string().min(1),
    blanks: z
      .array(z.strictObject({ options: z.array(z.string().min(1)).min(2).max(5), answer: z.string().min(1) }))
      .min(1)
      .max(2),
    explain: z.string().min(1),
  })
  .refine((ex) => ex.code.split(BLANK).length - 1 === ex.blanks.length, {
    message: "the code must contain one ___ for each blank",
  })
  .refine((ex) => ex.blanks.every((blank) => blank.options.includes(blank.answer)), {
    message: "each blank's answer must be one of its options",
  });

/** A list of options with the id of the right one. Shared by the cause questions below. */
const optionsWithAnswer = z
  .strictObject({
    options: z.array(z.strictObject({ id, text: z.string().min(1) })).min(2).max(5),
    answer: id,
  })
  .refine((q) => q.options.some((option) => option.id === q.answer), {
    message: "answer must be the id of one of the options",
  });

/**
 * Edit and run: change the code to meet a goal. Hidden `check` code runs afterwards
 * (usually asserts). The build proves the starting code fails the check and `solution` passes it.
 */
export const editSource = z.strictObject({
  id,
  goal: z.string().min(1),
  code: z.string().min(1),
  check: z.string().min(1),
  solution: z.string().min(1),
  explain: z.string().min(1),
  files: files.optional(),
});

/** Fix the bug: like edit and run, but the code is broken. Afterwards, name the cause. */
export const fixSource = z.strictObject({
  id,
  symptom: z.string().optional(),
  code: z.string().min(1),
  check: z.string().min(1),
  solution: z.string().min(1),
  cause: optionsWithAnswer,
  explain: z.string().min(1),
  files: files.optional(),
});

/** Read the traceback: the build runs the code to produce a real traceback; tap the failing line, then pick the cause. */
export const tracebackSource = z
  .strictObject({
    id,
    code: z.string().min(1),
    question: z.string().default("What is the most likely cause?"),
    options: z.array(z.strictObject({ id, text: z.string().min(1) })).min(2).max(5),
    answer: id,
    explain: z.string().min(1),
    files: files.optional(),
  })
  .refine((ex) => ex.options.some((option) => option.id === ex.answer), {
    message: "answer must be the id of one of the options",
  });

/** Shape it: tap through a JSON structure to build the path to one value, or type the path. */
export const shapeSource = z.strictObject({
  id,
  question: z.string().min(1), // for example: Find the second material of the third asset.
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/).default("data"), // the variable the data is stored in
  data: z.string().min(1), // JSON text
  answer: z.string().min(1), // the path, for example data["assets"][2]["materials"][1]
  explain: z.string().min(1),
});

/** Reorder lines (a Parsons problem): put shuffled lines in order and set their indentation. Checked by running. */
export const parsonsSource = z.strictObject({
  id,
  prompt: z.string().min(1),
  code: z.string().min(1), // the correct program; its non-blank lines are shuffled
  check: z.string().min(1),
  explain: z.string().min(1),
});

/** Split this function: assign each part of a long script to one of the named jobs. Self-assessed against a model answer. */
export const splitSource = z.strictObject({
  id,
  prompt: z.string().min(1),
  code: z.string().min(1),
  jobs: z.array(z.strictObject({ id, name: z.string().min(1), description: z.string().min(1) })).min(2).max(6),
  answer: z.array(z.strictObject({ job: id, lines: z.string().regex(/^\d+(-\d+)?$/, 'lines look like "4" or "4-9"') })).min(2),
  model: z.string().min(1), // the model answer, as code
  explain: z.string().min(1),
});

/** Review the diff: tap every changed line that goes beyond the stated task. */
export const diffSource = z.strictObject({
  id,
  task: z.string().min(1), // what the change was supposed to do
  diff: z.string().min(1), // a unified diff
  flags: z.array(z.string()), // the changed lines (with their + or -) that should be flagged; may be empty
  explain: z.string().min(1),
});

const gitFiles = z.record(z.string(), z.string());

/** A condition the repository must meet for a Git task to be done. */
export const gitGoal = z.union([
  z.strictObject({ committed: gitFiles }), // the latest commit holds these exact file contents
  z.strictObject({ working: gitFiles }), // the working folder holds these exact file contents
  z.strictObject({ clean: z.literal(true) }), // nothing uncommitted: working folder = staging = latest commit
  z.strictObject({ branch: z.string().min(1) }), // the current branch
  z.strictObject({ lastCommitFiles: z.array(z.string()) }), // exactly these files changed in the latest commit
  z.strictObject({ commits: z.number().int().min(1) }), // commits in the current branch's history
  z.strictObject({ stashed: z.number().int().min(0) }), // entries on the stash
  z.strictObject({ merged: z.string().min(1) }), // this branch's latest commit is part of the current history
]);

/** Git: a scenario in the simulator. The build replays `solution` and proves it meets every goal. */
export const gitSource = z.strictObject({
  id,
  task: z.string().min(1),
  start: z.strictObject({
    commits: z.array(z.strictObject({ message: z.string().min(1), files: z.record(z.string(), z.string().nullable()) })).min(1),
    branches: z
      .array(
        z.strictObject({
          name: z.string().min(1),
          commits: z.array(z.strictObject({ message: z.string().min(1), files: z.record(z.string(), z.string().nullable()) })),
        }),
      )
      .optional(),
    staged: z.record(z.string(), z.string().nullable()).optional(),
    working: z.record(z.string(), z.string().nullable()).optional(),
  }),
  goal: z.array(gitGoal).min(1),
  solution: z.array(z.string().min(1)).min(1),
  explain: z.string().min(1),
});

export type GitStart = z.infer<typeof gitSource>["start"];
export type GitGoal = z.infer<typeof gitGoal>;

// ---- Exercises after the build has turned their Markdown into HTML ----
// Fields ending in Html are trusted HTML produced at build time from our own content.

export interface PredictExercise {
  type: "predict";
  id: string;
  code: string;
  output: string;
  explainHtml: string;
  hintHtml?: string;
  files?: Record<string, string>;
}

export interface ChoiceExercise {
  type: "choice";
  id: string;
  tag: "Quick check" | "Judgement call";
  questionHtml: string;
  code?: string;
  options: { id: string; html: string }[];
  answer: string;
  explainHtml: string;
}

export interface ClozeExercise {
  type: "cloze";
  id: string;
  promptHtml: string;
  code: string;
  blanks: { options: string[]; answer: string }[];
  explainHtml: string;
}

export interface EditExercise {
  type: "edit";
  id: string;
  goalHtml: string;
  code: string;
  check: string;
  solution: string;
  explainHtml: string;
  files?: Record<string, string>;
}

export interface FixExercise {
  type: "fix";
  id: string;
  symptomHtml?: string;
  code: string;
  check: string;
  solution: string;
  cause: { options: { id: string; html: string }[]; answer: string };
  explainHtml: string;
  files?: Record<string, string>;
}

export interface TracebackExercise {
  type: "traceback";
  id: string;
  code: string;
  traceback: string; // filled in by the build, from really running the code
  questionHtml: string;
  options: { id: string; html: string }[];
  answer: string;
  explainHtml: string;
  files?: Record<string, string>;
}

/** One step of a path into data: a dictionary key or a list index. */
export type PathPart = string | number;

export interface ShapeExercise {
  type: "shape";
  id: string;
  questionHtml: string;
  name: string;
  data: unknown; // parsed JSON
  answer: PathPart[]; // checked at build time to lead to a real value
  explainHtml: string;
}

export interface ParsonsExercise {
  type: "parsons";
  id: string;
  promptHtml: string;
  lines: { text: string; indent: number }[]; // correct order; the app shuffles them
  check: string;
  explainHtml: string;
}

export interface SplitExercise {
  type: "split";
  id: string;
  promptHtml: string;
  code: string;
  jobs: { id: string; name: string; descriptionHtml: string }[];
  answer: { job: string; from: number; to: number }[]; // 1-based, inclusive
  model: string;
  explainHtml: string;
}

export interface DiffExercise {
  type: "diff";
  id: string;
  taskHtml: string;
  lines: string[]; // the diff, one entry per line
  flags: number[]; // indexes into lines
  explainHtml: string;
}

export interface GitExercise {
  type: "git";
  id: string;
  taskHtml: string;
  start: GitStart;
  goal: GitGoal[];
  solution: string[];
  explainHtml: string;
}

export type Exercise =
  | PredictExercise
  | ChoiceExercise
  | ClozeExercise
  | EditExercise
  | FixExercise
  | TracebackExercise
  | ShapeExercise
  | ParsonsExercise
  | SplitExercise
  | DiffExercise
  | GitExercise;
export type ExerciseType = Exercise["type"];

// ---- Lessons, modules and the course ----

export type Step =
  | { kind: "read"; html: string }
  | { kind: "exercise"; introHtml: string; exercise: Exercise }
  | { kind: "explain"; modelHtml: string }; // "explain it back", added at the end of every lesson from its recap

export const lessonFrontmatter = z.strictObject({
  id,
  title: z.string().min(1),
  minutes: z.number().int().min(1).max(20),
  recap: z.string().min(1).optional(), // a model two-sentence explanation, shown after "explain it back"
});

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  steps: Step[];
}

const applyTask = z.strictObject({ id, tier: z.enum(["In Blender", "Pipeline", "Beyond games"]), text: z.string().min(1) });

export const moduleSource = z.strictObject({
  id,
  label: z.string().min(1), // shown before the title, for example "Module 1"
  title: z.string().min(1),
  summary: z.string().min(1),
  intro: z.string().optional(),
  lessons: z.array(z.string().min(1)).min(1), // lesson file names, in order
  check: z.array(z.string().min(1)).optional(), // "When Claude writes this, check"
  bridge: z.string().optional(), // "The same ideas in C# and C++"
  apply: z.array(applyTask).optional(),
  prompts: z.array(z.strictObject({ title: z.string().min(1), text: z.string().min(1) })).optional(), // copyable prompts for Claude
});

export interface Module {
  id: string;
  label: string;
  title: string;
  summary: string;
  introHtml?: string;
  lessons: Lesson[];
  checkHtml: string[];
  bridgeHtml?: string;
  apply: { id: string; tier: string; html: string }[];
  prompts: { title: string; text: string }[];
}

export const courseSource = z.strictObject({
  title: z.string().min(1),
  files: z.array(z.string().min(1)).default([]), // sample files in content/files/, present whenever code runs
  selfTest: z.array(z.strictObject({ id, text: z.string().min(1) })).default([]), // "You are code-literate when you can..."
  // Practice banks in content/practice/: files in the lesson format, one exercise per step.
  practice: z
    .strictObject({
      drills: z.array(z.string().min(1)).default([]), // one file per topic
      bugHunt: z.array(z.string().min(1)).default([]), // fix exercises, one file per level, easiest first
    })
    .default({ drills: [], bugHunt: [] }),
  modules: z
    .array(
      z.union([
        z.strictObject({ folder: z.string().min(1) }),
        // A module that is not written yet: shown on the course map, not openable.
        z.strictObject({ planned: z.strictObject({ id, label: z.string(), title: z.string(), summary: z.string() }) }),
      ]),
    )
    .min(1),
});

export interface PlannedModule {
  id: string;
  label: string;
  title: string;
  summary: string;
}

export interface Course {
  title: string;
  files: Record<string, string>; // sample files, written into the working folder before every run
  selfTest: { id: string; text: string }[];
  practice: { drills: Lesson[]; bugHunt: Lesson[] };
  modules: Module[];
  planned: PlannedModule[];
}
