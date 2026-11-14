// The shape of all course content, written once with Zod.
// The build checks every lesson file against these schemas and stops on any mistake.
// The app imports only the TypeScript types (import type), so Zod never ships to the phone.

import { z } from "zod";
import { BLANK } from "./constants.ts";

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids use lowercase letters, digits and dashes");

// ---- Exercises, as written in lesson files (```exercise <type> blocks) ----

/** Predict the output: show code, ask for a prediction, then reveal what it prints. */
export const predictSource = z.strictObject({
  id,
  code: z.string().min(1),
  output: z.string(),
  explain: z.string().min(1),
  hint: z.string().optional(),
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

// ---- Exercises after the build has turned their Markdown into HTML ----
// Fields ending in Html are trusted HTML produced at build time from our own content.

export interface PredictExercise {
  type: "predict";
  id: string;
  code: string;
  output: string;
  explainHtml: string;
  hintHtml?: string;
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

export type Exercise = PredictExercise | ChoiceExercise | ClozeExercise;
export type ExerciseType = Exercise["type"];

// ---- Lessons, modules and the course ----

export type Step = { kind: "read"; html: string } | { kind: "exercise"; introHtml: string; exercise: Exercise };

export const lessonFrontmatter = z.strictObject({
  id,
  title: z.string().min(1),
  minutes: z.number().int().min(1).max(20),
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
}

export const courseSource = z.strictObject({
  title: z.string().min(1),
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
  modules: Module[];
  planned: PlannedModule[];
}
