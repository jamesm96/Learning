import { describe, expect, it } from "vitest";
import { bugHash, drillHash, isPracticeRoute, lessonHash, moduleHash, parseRoute } from "./routes";

describe("parseRoute", () => {
  it("reads a plain tab", () => {
    expect(parseRoute("#/me")).toEqual({ tab: "me" });
  });

  it("reads the course map", () => {
    expect(parseRoute("#/learn")).toEqual({ tab: "learn", moduleId: undefined, lessonId: undefined });
  });

  it("reads a module and a lesson", () => {
    expect(parseRoute("#/learn/data/data-04")).toEqual({ tab: "learn", moduleId: "data", lessonId: "data-04" });
  });

  it("ignores extra parts on other tabs", () => {
    expect(parseRoute("#/today/anything")).toEqual({ tab: "today" });
  });

  it("round-trips the link builders", () => {
    expect(parseRoute(lessonHash("data", "data-01"))).toMatchObject({ moduleId: "data", lessonId: "data-01" });
    expect(parseRoute(moduleHash("start"))).toMatchObject({ moduleId: "start", lessonId: undefined });
  });
});

describe("review sessions and practice time", () => {
  it("reads a review session", () => {
    expect(parseRoute("#/today/review")).toEqual({ tab: "today", review: true });
    expect(parseRoute("#/today/review/5")).toEqual({ tab: "today", review: true, reviewLimit: 5 });
  });

  it("counts lessons, review and the Scratchpad as practice, but not menus", () => {
    expect(isPracticeRoute("#/learn/data/data-01")).toBe(true);
    expect(isPracticeRoute("#/today/review")).toBe(true);
    expect(isPracticeRoute("#/practice")).toBe(true);
    expect(isPracticeRoute("#/learn/data")).toBe(false);
    expect(isPracticeRoute("#/me")).toBe(false);
  });
});

describe("practice routes", () => {
  it("reads drill sessions and bug-hunt snippets", () => {
    expect(parseRoute(drillHash("drills-data"))).toEqual({ tab: "practice", drill: "drills-data" });
    expect(parseRoute(bugHash("bug-hunt-easy-x"))).toEqual({ tab: "practice", bug: "bug-hunt-easy-x" });
    expect(parseRoute("#/practice")).toEqual({ tab: "practice" });
  });
});
