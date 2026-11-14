import { describe, expect, it } from "vitest";
import { markDiffReview, partners } from "./diff-review";

// Two edits with no context between them: one asked for (the units), one not (the rounding).
const diff = [
  "--- a/report.py",
  "+++ b/report.py",
  "@@ -1,3 +1,3 @@",
  '-    value = r["temp_c"]', // 3
  '-    return f"{value:.2f} C"', // 4
  '+    value = r["temp_c"] * 9 / 5 + 32', // 5
  '+    return f"{value:.1f} F"', // 6
  "     log(value)",
  "+    try:", // 8
];

describe("partners", () => {
  it("pairs each removed line with the most similar added line", () => {
    const pairs = partners(diff);
    expect(pairs[3]).toBe(5);
    expect(pairs[4]).toBe(6);
    expect(pairs[6]).toBe(4);
  });

  it("leaves lines with no similar partner unpaired", () => {
    expect(partners(diff)[8]).toBe(-1);
  });
});

describe("markDiffReview", () => {
  it("accepts either half of a pair, whichever the lesson listed", () => {
    expect(markDiffReview(diff, [6], new Set([4])).correct).toBe(true);
    expect(markDiffReview(diff, [4, 6], new Set([6])).correct).toBe(true);
    expect(markDiffReview(diff, [6], new Set([4, 6])).correct).toBe(true);
  });

  it("keeps neighbouring edits apart: flagging the asked-for edit is an extra flag", () => {
    expect(markDiffReview(diff, [6], new Set([5, 6]))).toEqual({ correct: false, missed: [], extra: [5] });
  });

  it("reports a missed line", () => {
    expect(markDiffReview(diff, [6], new Set())).toEqual({ correct: false, missed: [6], extra: [] });
  });

  it("accepts flagging nothing when nothing goes beyond the task", () => {
    expect(markDiffReview(diff, [], new Set()).correct).toBe(true);
  });
});
