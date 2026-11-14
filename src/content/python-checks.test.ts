import { describe, expect, it } from "vitest";
import type { RunPython, RunResult } from "../python/types";
import { markdownToHtml } from "./parse-lesson";
import { checkWithPython } from "./python-checks";
import type { Course, Exercise, Step } from "./schema";

/** A fake Python: looks up each piece of code in a table of results. */
function fakePython(results: Record<string, Partial<RunResult>>): RunPython {
  return async (code, check = "") => ({
    stdout: "",
    error: null,
    checkError: null,
    timedOut: false,
    ...results[check ? `${code}|${check}` : code],
  });
}

const fail = (type: string) => ({ type, message: "", traceback: `Traceback (most recent call last):\n${type}` });

function courseWith(steps: Step[]): Course {
  return {
    title: "Test",
    planned: [],
    files: {},
    modules: [{ id: "m", label: "M", title: "M", summary: "", checkHtml: [], apply: [], prompts: [], lessons: [{ id: "l", title: "L", minutes: 1, steps }] }],
  };
}

const exerciseStep = (exercise: Exercise): Step => ({ kind: "exercise", introHtml: "", exercise });

describe("checkWithPython", () => {
  it("accepts a predict whose stored output matches", async () => {
    const course = courseWith([exerciseStep({ type: "predict", id: "p", code: "print(1)", output: "1", explainHtml: "" })]);
    expect(await checkWithPython(course, fakePython({ "print(1)": { stdout: "1\n" } }))).toEqual([]);
  });

  it("reports a predict whose stored output is wrong", async () => {
    const course = courseWith([exerciseStep({ type: "predict", id: "p", code: "print(1)", output: "2", explainHtml: "" })]);
    const problems = await checkWithPython(course, fakePython({ "print(1)": { stdout: "1\n" } }));
    expect(problems[0]).toContain("does not match");
  });

  it("reports an edit whose starting code already passes", async () => {
    const edit: Exercise = { type: "edit", id: "e", goalHtml: "", code: "a", check: "c", solution: "s", explainHtml: "" };
    const problems = await checkWithPython(courseWith([exerciseStep(edit)]), fakePython({}));
    expect(problems[0]).toContain("already passes");
  });

  it("accepts an edit that fails before and passes after", async () => {
    const edit: Exercise = { type: "edit", id: "e", goalHtml: "", code: "a", check: "c", solution: "s", explainHtml: "" };
    const python = fakePython({ "a|c": { checkError: fail("AssertionError") } });
    expect(await checkWithPython(courseWith([exerciseStep(edit)]), python)).toEqual([]);
  });

  it("stores the real traceback for a traceback exercise", async () => {
    const exercise: Exercise = {
      type: "traceback",
      id: "t",
      code: "x",
      traceback: "",
      questionHtml: "",
      options: [],
      answer: "a",
      explainHtml: "",
    };
    await checkWithPython(courseWith([exerciseStep(exercise)]), fakePython({ x: { error: fail("KeyError") } }));
    expect(exercise.traceback).toContain("KeyError");
  });

  it("replaces a ```traceback block in lesson text with the real traceback", async () => {
    const step: Step = { kind: "read", html: markdownToHtml("Look:\n\n```traceback\n{}['a']\n```") };
    await checkWithPython(courseWith([step]), fakePython({ "{}['a']": { error: fail("KeyError") } }));
    expect(step.kind === "read" && step.html).toContain('<pre class="code is-output"');
    expect(step.kind === "read" && step.html).toContain("KeyError");
  });
});
