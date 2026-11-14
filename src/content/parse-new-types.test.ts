// Parsing the phase 3 exercise types: shape, parsons, split, diff and git, plus the lesson recap.
import { describe, expect, it } from "vitest";
import { ContentError, parseExercise, parseLesson } from "./parse-lesson";

describe("shape", () => {
  const yaml = (answer: string) =>
    ["id: s-1", "question: Find rope.", "name: scene", 'data: \'{"assets": [{"m": ["wood", "rope"]}]}\'', `answer: '${answer}'`, "explain: E"].join("\n");

  it("stores the parsed data and the answer as path parts", () => {
    expect(parseExercise("shape", yaml('scene["assets"][0]["m"][-1]'))).toMatchObject({
      data: { assets: [{ m: ["wood", "rope"] }] },
      answer: ["assets", 0, "m", 1],
    });
  });

  it("rejects an answer path that does not lead anywhere", () => {
    expect(() => parseExercise("shape", yaml('scene["assets"][3]'))).toThrow(/IndexError/);
  });
});

describe("parsons", () => {
  it("splits the code into lines with indent levels", () => {
    const ex = parseExercise("parsons", "id: p-1\nprompt: P\ncode: |\n  def f(x):\n      if x:\n          return 1\ncheck: assert f(1) == 1\nexplain: E");
    expect(ex).toMatchObject({
      lines: [
        { text: "def f(x):", indent: 0 },
        { text: "if x:", indent: 1 },
        { text: "return 1", indent: 2 },
      ],
    });
  });

  it("rejects indentation that is not a multiple of four spaces", () => {
    const yaml = "id: p-1\nprompt: P\ncode: |\n  def f(x):\n    return 1\n  f(1)\ncheck: assert True\nexplain: E";
    expect(() => parseExercise("parsons", yaml)).toThrow(/multiples of four/);
  });
});

describe("split", () => {
  const yaml = (lines: string) =>
    [
      "id: sp-1",
      "prompt: P",
      "code: |\n  a = 1\n  b = 2\n  print(a + b)",
      "jobs:\n  - { id: load, name: load, description: Load }\n  - { id: show, name: show, description: Show }",
      `answer:\n  - { job: load, lines: "1-2" }\n  - { job: show, lines: "${lines}" }`,
      "model: code",
      "explain: E",
    ].join("\n");

  it("reads line ranges", () => {
    expect(parseExercise("split", yaml("3"))).toMatchObject({
      answer: [
        { job: "load", from: 1, to: 2 },
        { job: "show", from: 3, to: 3 },
      ],
    });
  });

  it("rejects a line given to two jobs, and lines past the end", () => {
    expect(() => parseExercise("split", yaml("2-3"))).toThrow(/two jobs/);
    expect(() => parseExercise("split", yaml("3-9"))).toThrow(/outside the code/);
  });
});

describe("diff", () => {
  const diff = "diff: |\n  --- a/b.py\n  +++ b/b.py\n  -if tris > budget:\n  +if tris >= budget:\n   print(x)";

  it("turns flags into line indexes", () => {
    const ex = parseExercise("diff", `id: d-1\ntask: T\n${diff}\nflags: ["+if tris >= budget:"]\nexplain: E`);
    expect(ex).toMatchObject({ flags: [3] });
  });

  it("rejects a flag that is not a changed line", () => {
    expect(() => parseExercise("diff", `id: d-1\ntask: T\n${diff}\nflags: [" print(x)"]\nexplain: E`)).toThrow(ContentError);
  });
});

describe("git", () => {
  const scenario = (solution: string) =>
    [
      "id: g-1",
      "task: Commit only the budget change.",
      "start:",
      "  commits:",
      '    - { message: "Start", files: { "budget.py": "B = 1", "export.py": "x" } }',
      '  working: { "budget.py": "B = 2", "export.py": "y" }',
      'goal:\n  - committed: { "budget.py": "B = 2", "export.py": "x" }',
      `solution: ${solution}`,
      "explain: E",
    ].join("\n");

  it("accepts a solution that reaches the goal in the simulator", () => {
    expect(parseExercise("git", scenario('["git add budget.py", "git commit -m \\"Budget\\""]'))).toMatchObject({ type: "git" });
  });

  it("rejects a solution that does not reach the goal", () => {
    expect(() => parseExercise("git", scenario('["git add .", "git commit -m \\"All\\""]'))).toThrow(/does not meet the goal/);
  });

  it("rejects a solution step the simulator refuses", () => {
    expect(() => parseExercise("git", scenario('["git commit -m \\"Nothing staged\\""]'))).toThrow(/failed/);
  });
});

describe("recap", () => {
  it("adds an explain-it-back step at the end of the lesson", () => {
    const lesson = parseLesson("---\nid: l-1\ntitle: T\nminutes: 3\nrecap: Two sentences.\n---\nText.");
    expect(lesson.steps.at(-1)).toEqual({ kind: "explain", modelHtml: "<p>Two sentences.</p>" });
  });
});
