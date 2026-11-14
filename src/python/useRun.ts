import { useState } from "preact/hooks";
import { runPython, stopPython } from "./runner";
import type { RunResult } from "./types";

export interface RunState {
  running: boolean;
  result: RunResult | null;
  loadFailed: boolean; // Python itself could not be downloaded or started
  run: (code: string, check?: string) => Promise<RunResult | null>;
  stop: () => void;
  clear: () => void;
}

/** Run code from a component, tracking whether it is running and what came back. */
export function useRun(): RunState {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const run = async (code: string, check = ""): Promise<RunResult | null> => {
    setRunning(true);
    setLoadFailed(false);
    try {
      const next = await runPython(code, check);
      setResult(next);
      return next;
    } catch {
      setLoadFailed(true);
      setResult(null);
      return null;
    } finally {
      setRunning(false);
    }
  };

  return { running, result, loadFailed, run, stop: stopPython, clear: () => setResult(null) };
}
