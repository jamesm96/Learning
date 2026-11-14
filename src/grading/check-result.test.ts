import { describe, expect, it } from "vitest";
import type { PythonError, RunResult } from "../python/types";
import { describeCheck } from "./check-result";

const result = (overrides: Partial<RunResult>): RunResult => ({
  stdout: "",
  error: null,
  checkError: null,
  timedOut: false,
  ...overrides,
});

const error = (type: string, message: string, traceback = ""): PythonError => ({ type, message, traceback });

describe("describeCheck", () => {
  it("passes when nothing raised", () => {
    expect(describeCheck(result({}))).toMatchObject({ passed: true, message: "Goal met." });
  });

  it("uses the assert message when there is one", () => {
    const verdict = describeCheck(result({ checkError: error("AssertionError", "over should list both assets") }));
    expect(verdict).toMatchObject({ passed: false, message: "Not yet. over should list both assets" });
  });

  it("quotes the failing assert when it has no message", () => {
    const traceback = `Traceback (most recent call last):
  File "check.py", line 1, in <module>
    assert total == 32170
           ^^^^^^^^^^^^^^
AssertionError`;
    const verdict = describeCheck(result({ checkError: error("AssertionError", "", traceback) }));
    expect(verdict.message).toBe("Not yet. This check failed: assert total == 32170");
  });

  it("explains a check that could not run", () => {
    const verdict = describeCheck(result({ checkError: error("NameError", "name 'over' is not defined") }));
    expect(verdict.message).toContain("NameError: name 'over' is not defined");
  });

  it("points at the learner's own error, with its traceback", () => {
    const verdict = describeCheck(result({ error: error("KeyError", "'lod'") }));
    expect(verdict).toMatchObject({ passed: false, showTraceback: true });
    expect(verdict.message).toContain("KeyError");
  });

  it("explains a timeout", () => {
    expect(describeCheck(result({ timedOut: true })).message).toContain("loop");
  });
});
