import { describe, expect, it } from "vitest";
import { compareOutput, normaliseOutput } from "./compare-output";

describe("normaliseOutput", () => {
  it("ignores trailing spaces, trailing blank lines and Windows line endings", () => {
    expect(normaliseOutput("a  \r\nb\n\n\n")).toEqual(["a", "b"]);
  });

  it("keeps blank lines in the middle", () => {
    expect(normaliseOutput("a\n\nb")).toEqual(["a", "", "b"]);
  });
});

describe("compareOutput", () => {
  it("matches identical output", () => {
    expect(compareOutput("4820\n0", "4820\n0\n").match).toBe(true);
  });

  it("does not care about trailing whitespace", () => {
    expect(compareOutput("True   \n", "True").match).toBe(true);
  });

  it("does care about leading whitespace and case", () => {
    expect(compareOutput(" True", "True").match).toBe(false);
    expect(compareOutput("true", "True").match).toBe(false);
  });

  it("points at the first character that differs", () => {
    const result = compareOutput("['rock_01', 'rock_02']", "['rock_01', 'rock_03']");
    expect(result.lines[0]).toMatchObject({ same: false, firstDifference: 19 });
  });

  it("marks missing and extra lines", () => {
    const short = compareOutput("a", "a\nb");
    expect(short.match).toBe(false);
    expect(short.lines[1]).toMatchObject({ expected: "b", predicted: "", same: false });

    const long = compareOutput("a\nb", "a");
    expect(long.lines[1]).toMatchObject({ expected: "", predicted: "b", same: false });
  });

  it("treats a predicted empty line as different from a missing line", () => {
    expect(compareOutput("a\n\nb", "a\nb").match).toBe(false);
  });
});
