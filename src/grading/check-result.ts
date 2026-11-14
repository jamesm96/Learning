// Turn the result of running code plus its hidden check into a plain-words verdict.

import type { RunResult } from "../python/types";
import { parseTraceback } from "./traceback";

export interface CheckVerdict {
  passed: boolean;
  message: string; // shown to the learner
  showTraceback: boolean; // true when the learner's own code raised, so the traceback helps
}

/** Explain what happened when code ran against its hidden check. */
export function describeCheck(result: RunResult): CheckVerdict {
  if (result.timedOut) {
    return { passed: false, message: "Stopped: the code ran for too long. Look for a loop that never ends.", showTraceback: false };
  }
  if (result.error) {
    return {
      passed: false,
      message: `Not yet. Your code raised ${result.error.type}, so the check never ran.`,
      showTraceback: true,
    };
  }
  const failure = result.checkError;
  if (!failure) {
    return { passed: true, message: "Goal met.", showTraceback: false };
  }
  if (failure.type === "AssertionError") {
    if (failure.message) return { passed: false, message: `Not yet. ${failure.message}`, showTraceback: false };
    const parsed = parseTraceback(failure.traceback, "check.py");
    const source = parsed.frames[parsed.failingFrame]?.lines[1]?.trim();
    return { passed: false, message: `Not yet. This check failed: ${source ?? "an assert"}`, showTraceback: false };
  }
  return {
    passed: false,
    message: `Not yet. The check could not run: ${failure.type}: ${failure.message}. Is a name missing or spelled differently?`,
    showTraceback: false,
  };
}
