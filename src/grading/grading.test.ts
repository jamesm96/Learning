import { describe, expect, it } from "vitest";
import type { ChoiceExercise, ClozeExercise } from "../content/schema";
import { gradeChoice, gradeCloze, shuffle } from "./grading";

const choice: ChoiceExercise = {
  type: "choice",
  id: "q-1",
  tag: "Quick check",
  questionHtml: "",
  options: [
    { id: "fifteen", html: "15" },
    { id: "joined", html: '"123"' },
    { id: "error", html: "An error" },
  ],
  answer: "joined",
  explainHtml: "",
};

const cloze: ClozeExercise = {
  type: "cloze",
  id: "c-1",
  promptHtml: "",
  code: 'with open(path, ___, encoding="utf-8") as f:\n    ___ = f.read()',
  blanks: [
    { options: ['"r"', '"w"'], answer: '"r"' },
    { options: ["text", "path"], answer: "text" },
  ],
  explainHtml: "",
};

describe("gradeChoice", () => {
  it("accepts the right option id", () => {
    expect(gradeChoice(choice, "joined")).toBe(true);
  });

  it("rejects any other option", () => {
    expect(gradeChoice(choice, "fifteen")).toBe(false);
  });
});

describe("gradeCloze", () => {
  it("is correct only when every blank is right", () => {
    expect(gradeCloze(cloze, ['"r"', "text"])).toEqual({ correct: true, blanks: [true, true] });
  });

  it("marks each blank separately", () => {
    expect(gradeCloze(cloze, ['"w"', "text"])).toEqual({ correct: false, blanks: [false, true] });
  });

  it("treats an unfilled blank as wrong", () => {
    expect(gradeCloze(cloze, ['"r"', null]).correct).toBe(false);
  });
});

describe("shuffle", () => {
  it("keeps every item", () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffle(items).sort()).toEqual(items);
  });

  it("does not change the original list", () => {
    const items = [1, 2, 3];
    shuffle(items);
    expect(items).toEqual([1, 2, 3]);
  });

  it("is predictable with a fixed random function", () => {
    // random() always 0 moves each item to the front in turn: a rotation.
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
