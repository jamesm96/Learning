import { describe, expect, it } from "vitest";
import { lessonHash, moduleHash, parseRoute } from "./routes";

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
