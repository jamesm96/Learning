// Run Python at build time, in Node, with the same Pyodide and the same harness the phone uses.
// Used by content-plugin.ts and scripts/check-content.ts.

import { readFileSync } from "node:fs";
import { loadPyodide, type PyodideAPI } from "pyodide";
import type { RunPython, RunResult } from "./src/python/types.ts";

let pyodide: Promise<PyodideAPI> | null = null;

/** Load Pyodide once and reuse it; loading takes a couple of seconds. */
async function getPyodide(): Promise<PyodideAPI> {
  pyodide ??= (async () => {
    const py = await loadPyodide();
    py.FS.writeFile("/home/pyodide/harness.py", readFileSync("src/python/harness.py", "utf-8"));
    py.FS.writeFile("/home/pyodide/simulated.py", readFileSync("src/python/simulated.py", "utf-8"));
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import harness");
    return py;
  })();
  return pyodide;
}

/** A RunPython function backed by Pyodide in Node. */
export const runPythonInNode: RunPython = async (code, check = "", files = {}) => {
  const py = await getPyodide();
  let stdout = "";
  const capture = {
    write: (bytes: Uint8Array) => {
      stdout += new TextDecoder().decode(bytes);
      return bytes.length;
    },
  };
  py.setStdout(capture);
  py.setStderr(capture);

  const run = py.globals.get("harness").run;
  const result = run(code, check, JSON.stringify(files)).toJs({ dict_converter: Object.fromEntries }) as Omit<
    RunResult,
    "stdout" | "timedOut" | "checkError"
  > & { check_error: RunResult["checkError"] };
  // Python's None arrives as undefined; the shared type uses null.
  return { stdout, error: result.error ?? null, checkError: result.check_error ?? null, timedOut: false };
};
