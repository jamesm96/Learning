// Prove every runnable piece of content against real Python (Pyodide), at build time:
//   - predict: the stored output equals what the code really prints
//   - edit and fix: the starting code fails its check, and the solution passes it
//   - traceback: the code really raises, and its traceback is stored for the lesson
//   - ```traceback blocks in lesson text: the code is run and replaced by its real traceback
// The runner is passed in, so this file does not care whether Python runs in Node or a browser.

import { compareOutput } from "../grading/compare-output.ts";
import type { RunPython, RunResult } from "../python/types.ts";
import type { Course, Exercise } from "./schema.ts";

/** Check every exercise that runs code. Fills in traceback text. Returns a list of problems (empty when all is well). */
export async function checkWithPython(course: Course, runInFolder: RunPython): Promise<string[]> {
  const problems: string[] = [];
  // Every run gets the course's sample files, as on the phone.
  const run: RunPython = (code, check, files) => runInFolder(code, check, { ...course.files, ...files });
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      for (const [index, step] of lesson.steps.entries()) {
        const where = `${lesson.id} step ${index + 1}`;
        if (step.kind === "read") {
          step.html = await fillTracebacks(step.html, run, where, problems);
          continue;
        }
        if (step.kind === "explain") continue;
        step.introHtml = await fillTracebacks(step.introHtml, run, where, problems);
        const problem = await checkExercise(step.exercise, run);
        if (problem) problems.push(`${lesson.id} / ${step.exercise.id}: ${problem}`);
      }
    }
  }
  return problems;
}

/** Check one exercise. Returns a description of what is wrong, or null. */
async function checkExercise(exercise: Exercise, run: RunPython): Promise<string | null> {
  switch (exercise.type) {
    case "predict": {
      const result = await run(exercise.code, "", exercise.files);
      if (result.error) return `the code raised an error:\n${result.error.traceback}`;
      const comparison = compareOutput(exercise.output, result.stdout);
      if (!comparison.match) {
        return `the stored output does not match what Python prints.\n--- stored\n${exercise.output}\n--- real\n${result.stdout}`;
      }
      return null;
    }
    case "edit":
    case "fix": {
      const starting = await run(exercise.code, exercise.check, exercise.files);
      if (passed(starting)) return "the starting code already passes the check, so there is nothing to do";
      const solved = await run(exercise.solution, exercise.check, exercise.files);
      if (!passed(solved)) {
        const error = solved.error ?? solved.checkError;
        return `the solution does not pass the check:\n${error?.traceback ?? ""}`;
      }
      return null;
    }
    case "traceback": {
      const result = await run(exercise.code, "", exercise.files);
      if (!result.error) return "the code ran without an error, so there is no traceback to read";
      exercise.traceback = result.error.traceback;
      return null;
    }
    case "parsons": {
      const program = exercise.lines.map((line) => "    ".repeat(line.indent) + line.text).join("\n");
      const result = await run(program, exercise.check);
      if (!passed(result)) {
        const error = result.error ?? result.checkError;
        return `the lines in their correct order do not pass the check:\n${error?.traceback ?? ""}`;
      }
      return null;
    }
    case "choice":
    case "cloze":
    case "shape":
    case "split":
    case "diff":
    case "git": // checked in the simulator while parsing
      return null;
  }
}

const TRACEBACK_MARKER = /<div data-traceback="([^"]*)"><\/div>/g;

/** Replace each ```traceback marker left by the Markdown renderer with the traceback the code really produces. */
async function fillTracebacks(html: string, run: RunPython, where: string, problems: string[]): Promise<string> {
  let filled = html;
  for (const match of html.matchAll(TRACEBACK_MARKER)) {
    const code = decodeURIComponent(match[1] ?? "");
    const result = await run(code);
    if (!result.error) {
      problems.push(`${where}: a \`\`\`traceback block ran without an error, so there is no traceback to show`);
      continue;
    }
    const escaped = result.error.traceback
      .replace(/\n+$/, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    filled = filled.replace(match[0], `<pre class="code is-output" tabindex="0" aria-label="Traceback"><code>${escaped}</code></pre>`);
  }
  return filled;
}

/** True when neither the code nor its check raised. */
function passed(result: RunResult): boolean {
  return result.error === null && result.checkError === null && !result.timedOut;
}
