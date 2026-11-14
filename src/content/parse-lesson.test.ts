import { describe, expect, it } from "vitest";
import { ContentError, parseExercise, parseLesson, splitFrontmatter, splitSteps } from "./parse-lesson";

const lesson = (body: string) => `---\nid: data-01\ntitle: Values\nminutes: 5\n---\n${body}`;

describe("splitFrontmatter", () => {
  it("separates the YAML from the body", () => {
    const { frontmatter, body } = splitFrontmatter("---\nid: a\n---\nHello");
    expect(frontmatter).toBe("id: a");
    expect(body).toBe("Hello");
  });

  it("handles Windows line endings", () => {
    expect(splitFrontmatter("---\r\nid: a\r\n---\r\nHello").body).toBe("Hello");
  });

  it("rejects a file without frontmatter", () => {
    expect(() => splitFrontmatter("Hello")).toThrow(ContentError);
  });
});

describe("splitSteps", () => {
  it("splits at --- lines", () => {
    expect(splitSteps("One\n\n---\n\nTwo")).toEqual(["One", "Two"]);
  });

  it("ignores --- inside a code fence", () => {
    const body = "```diff\n---\n```\n\n---\n\nTwo";
    expect(splitSteps(body)).toEqual(["```diff\n---\n```", "Two"]);
  });

  it("drops empty steps", () => {
    expect(splitSteps("---\nOne\n---\n---\n")).toEqual(["One"]);
  });
});

describe("parseExercise", () => {
  it("parses a choice exercise and renders its Markdown", () => {
    const ex = parseExercise(
      "choice",
      [
        "id: q-1",
        'question: What does `"12" + "3"` give?',
        "options:",
        "  - { id: fifteen, text: '15' }",
        "  - { id: joined, text: '\"123\"' }",
        "answer: joined",
        "explain: Both are strings.",
      ].join("\n"),
    );
    expect(ex.type).toBe("choice");
    if (ex.type !== "choice") return;
    expect(ex.questionHtml).toBe("What does <code>&quot;12&quot; + &quot;3&quot;</code> give?");
    expect(ex.tag).toBe("Quick check");
    expect(ex.answer).toBe("joined");
  });

  it("rejects a choice whose answer is not one of its options", () => {
    const yaml = "id: q-1\nquestion: Q\noptions:\n  - { id: a, text: A }\n  - { id: b, text: B }\nanswer: c\nexplain: E";
    expect(() => parseExercise("choice", yaml)).toThrow(/answer must be the id of one of the options/);
  });

  it("rejects a cloze where the blanks and ___ markers do not match", () => {
    const yaml = "id: c-1\nprompt: P\ncode: open(path, ___)\nblanks: []\nexplain: E";
    expect(() => parseExercise("cloze", yaml)).toThrow(ContentError);
  });

  it("trims the trailing newline from predict code and output", () => {
    const ex = parseExercise("predict", "id: p-1\ncode: |\n  print(1)\noutput: |\n  1\nexplain: One.");
    expect(ex).toMatchObject({ code: "print(1)", output: "1" });
  });

  it("rejects an unknown exercise type", () => {
    expect(() => parseExercise("essay", "id: x")).toThrow(/unknown exercise type/);
  });

  it("rejects unknown fields, which are usually typos", () => {
    const yaml = "id: p-1\ncode: x\noutput: ''\nexplain: E\nexplian: typo";
    expect(() => parseExercise("predict", yaml)).toThrow(ContentError);
  });
});

describe("parseLesson", () => {
  it("turns text into reading steps and exercise steps", () => {
    const parsed = parseLesson(
      lesson("Some **text**.\n\n---\n\nPredict this.\n\n```exercise predict\nid: p-1\ncode: print(1)\noutput: '1'\nexplain: One.\n```"),
    );
    expect(parsed.id).toBe("data-01");
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0]).toEqual({ kind: "read", html: "<p>Some <strong>text</strong>.</p>" });
    expect(parsed.steps[1]).toMatchObject({ kind: "exercise", introHtml: "<p>Predict this.</p>" });
  });

  it("says which step is broken", () => {
    const text = lesson("Fine.\n\n---\n\n```exercise choice\nid: q-1\n```");
    expect(() => parseLesson(text)).toThrow(/step 2:/);
  });

  it("rejects two exercises in one step", () => {
    const block = "```exercise predict\nid: p-1\ncode: x\noutput: ''\nexplain: E\n```";
    expect(() => parseLesson(lesson(`${block}\n\n${block}`))).toThrow(/only one exercise/);
  });
});
