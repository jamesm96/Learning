// Turn one lesson file (Markdown with YAML frontmatter) into a typed Lesson.
// Runs at build time only. Pure: takes text in, gives data out, touches no files.

import { Marked } from "marked";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { highlightPythonToHtml } from "./highlight.ts";
import {
  choiceSource,
  clozeSource,
  editSource,
  fixSource,
  lessonFrontmatter,
  predictSource,
  tracebackSource,
  type Exercise,
  type Lesson,
  type Step,
} from "./schema.ts";

/** A mistake in a content file. The message says which file and what is wrong. */
export class ContentError extends Error {}

const markdown = new Marked({
  gfm: true,
  renderer: {
    // Python code blocks (and unlabelled ones) get syntax colours at build time, so the phone does no work.
    // Other languages, such as ```text or ```diff, fall back to marked's plain rendering.
    code({ text, lang }) {
      // A ```traceback block holds Python code that fails. The build runs it and puts the real
      // traceback here (see python-checks.ts), so no traceback is ever typed by hand.
      if (lang === "traceback") return `<div data-traceback="${encodeURIComponent(text)}"></div>\n`;
      if (lang && lang !== "python") return false;
      return `<pre class="code" tabindex="0"><code>${highlightPythonToHtml(text)}</code></pre>\n`;
    },
  },
});

/** Render a block of Markdown (paragraphs, lists, code, tables) to HTML. */
export function markdownToHtml(text: string): string {
  return markdown.parse(text, { async: false }).trim();
}

/** Render one line of Markdown (bold, `code`, links) to HTML, with no surrounding <p>. */
export function inlineMarkdownToHtml(text: string): string {
  return markdown.parseInline(text.trim(), { async: false });
}

/** Windows checkouts may have \r\n line endings; work with \n only. */
function normaliseLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Split "---\n<yaml>\n---\n<body>" into the YAML text and the body. */
export function splitFrontmatter(text: string): { frontmatter: string; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normaliseLineEndings(text));
  if (!match) {
    throw new ContentError("the file must start with frontmatter between two --- lines");
  }
  return { frontmatter: match[1] ?? "", body: match[2] ?? "" };
}

/** Split a lesson body into steps at lines that are exactly ---, ignoring any inside code fences. */
export function splitSteps(body: string): string[] {
  const steps: string[] = [];
  let current: string[] = [];
  let insideFence = false;

  for (const line of normaliseLineEndings(body).split("\n")) {
    if (line.startsWith("```")) {
      insideFence = !insideFence;
    }
    if (!insideFence && line.trim() === "---") {
      steps.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  steps.push(current.join("\n"));

  return steps.map((step) => step.trim()).filter((step) => step.length > 0);
}

const EXERCISE_BLOCK = /^```exercise ([a-z]+)\n([\s\S]*?)^```[ \t]*$/gm;

/** Check an exercise's YAML against its schema and render its Markdown fields. */
export function parseExercise(type: string, yamlText: string): Exercise {
  const data: unknown = parseYaml(yamlText);

  switch (type) {
    case "predict": {
      const ex = check(predictSource, data, type);
      return {
        type: "predict",
        id: ex.id,
        code: trimCode(ex.code),
        output: ex.output.replace(/\n$/, ""),
        explainHtml: markdownToHtml(ex.explain),
        hintHtml: ex.hint === undefined ? undefined : inlineMarkdownToHtml(ex.hint),
      };
    }
    case "choice": {
      const ex = check(choiceSource, data, type);
      return {
        type: "choice",
        id: ex.id,
        tag: ex.tag,
        questionHtml: inlineMarkdownToHtml(ex.question),
        code: ex.code === undefined ? undefined : trimCode(ex.code),
        options: renderOptions(ex.options),
        answer: ex.answer,
        explainHtml: markdownToHtml(ex.explain),
      };
    }
    case "cloze": {
      const ex = check(clozeSource, data, type);
      return {
        type: "cloze",
        id: ex.id,
        promptHtml: inlineMarkdownToHtml(ex.prompt),
        code: trimCode(ex.code),
        blanks: ex.blanks,
        explainHtml: markdownToHtml(ex.explain),
      };
    }
    case "edit": {
      const ex = check(editSource, data, type);
      return {
        type: "edit",
        id: ex.id,
        goalHtml: inlineMarkdownToHtml(ex.goal),
        code: trimCode(ex.code),
        check: trimCode(ex.check),
        solution: trimCode(ex.solution),
        explainHtml: markdownToHtml(ex.explain),
      };
    }
    case "fix": {
      const ex = check(fixSource, data, type);
      return {
        type: "fix",
        id: ex.id,
        symptomHtml: ex.symptom === undefined ? undefined : inlineMarkdownToHtml(ex.symptom),
        code: trimCode(ex.code),
        check: trimCode(ex.check),
        solution: trimCode(ex.solution),
        cause: { options: renderOptions(ex.cause.options), answer: ex.cause.answer },
        explainHtml: markdownToHtml(ex.explain),
      };
    }
    case "traceback": {
      const ex = check(tracebackSource, data, type);
      return {
        type: "traceback",
        id: ex.id,
        code: trimCode(ex.code),
        traceback: "", // generated later by really running the code (see python-checks.ts)
        questionHtml: inlineMarkdownToHtml(ex.question),
        options: renderOptions(ex.options),
        answer: ex.answer,
        explainHtml: markdownToHtml(ex.explain),
      };
    }
    default:
      throw new ContentError(
        `unknown exercise type "${type}" (expected predict, choice, cloze, edit, fix or traceback)`,
      );
  }
}

/** Render each option's Markdown text to inline HTML. */
function renderOptions(options: { id: string; text: string }[]): { id: string; html: string }[] {
  return options.map((option) => ({ id: option.id, html: inlineMarkdownToHtml(option.text) }));
}

/** Validate data with a Zod schema, or throw a ContentError listing every problem. */
function check<T>(schema: z.ZodType<T>, data: unknown, type: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const name = typeof data === "object" && data !== null && "id" in data ? ` "${String(data.id)}"` : "";
    throw new ContentError(`${type} exercise${name} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** YAML block scalars (code: |) keep a trailing newline; code blocks look better without it. */
function trimCode(code: string): string {
  return code.replace(/\s+$/, "");
}

/** Turn one step's text into a reading step, or an exercise step with optional intro text. */
export function parseStep(text: string): Step {
  const blocks = [...text.matchAll(EXERCISE_BLOCK)];
  const first = blocks[0];
  if (!first) {
    return { kind: "read", html: markdownToHtml(text) };
  }
  if (blocks.length > 1) {
    throw new ContentError("a step can hold only one exercise; put a --- line between them");
  }
  const intro = text.replace(first[0], "").trim();
  return {
    kind: "exercise",
    introHtml: intro ? markdownToHtml(intro) : "",
    exercise: parseExercise(first[1] ?? "", first[2] ?? ""),
  };
}

/** Parse a whole lesson file. Errors say which step was wrong. */
export function parseLesson(text: string): Lesson {
  const { frontmatter, body } = splitFrontmatter(text);
  const meta = check(lessonFrontmatter, parseYaml(frontmatter), "frontmatter of this");

  const steps = splitSteps(body).map((stepText, index) => {
    try {
      return parseStep(stepText);
    } catch (error) {
      throw new ContentError(`step ${index + 1}: ${(error as Error).message}`);
    }
  });

  if (steps.length === 0) {
    throw new ContentError("the lesson has no steps");
  }
  return { ...meta, steps };
}
