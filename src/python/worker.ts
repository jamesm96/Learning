// Runs Python in a Web Worker, so slow or stuck code never freezes the screen.
// The page talks to this file through runner.ts; nothing else should use it directly.

import type { PyodideAPI } from "pyodide";
import harnessSource from "./harness.py?raw";
import type { RunResult } from "./types";

export type WorkerRequest = { type: "run"; id: number; code: string; check: string; indexURL: string };

export type WorkerResponse =
  | { type: "ready" }
  | { type: "load-failed"; message: string }
  | { type: "started"; id: number }
  | { type: "result"; id: number; result: RunResult };

const scope = self as unknown as DedicatedWorkerGlobalScope;
let pyodide: Promise<PyodideAPI> | null = null;
let output = "";

/** Load Pyodide from this site's own /pyodide/ folder, once. */
function getPyodide(indexURL: string): Promise<PyodideAPI> {
  pyodide ??= (async () => {
    const { loadPyodide } = (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)) as typeof import("pyodide");
    const py = await loadPyodide({ indexURL });
    const capture = {
      write: (bytes: Uint8Array) => {
        output += new TextDecoder().decode(bytes);
        return bytes.length;
      },
    };
    py.setStdout(capture);
    py.setStderr(capture);
    py.FS.writeFile("/home/pyodide/harness.py", harnessSource);
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide'); import harness");
    return py;
  })();
  return pyodide;
}

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  let py: PyodideAPI;
  try {
    py = await getPyodide(request.indexURL);
  } catch (error) {
    pyodide = null; // allow a retry, for example once back online
    scope.postMessage({ type: "load-failed", message: String(error) } satisfies WorkerResponse);
    return;
  }
  scope.postMessage({ type: "ready" } satisfies WorkerResponse);

  // The page starts its timeout from here, so loading time never counts against the code.
  scope.postMessage({ type: "started", id: request.id } satisfies WorkerResponse);
  output = "";
  const run = py.globals.get("harness").run;
  const raw = run(request.code, request.check).toJs({ dict_converter: Object.fromEntries }) as {
    error?: RunResult["error"];
    check_error?: RunResult["checkError"];
  };
  const result: RunResult = {
    stdout: output,
    error: raw.error ?? null,
    checkError: raw.check_error ?? null,
    timedOut: false,
  };
  scope.postMessage({ type: "result", id: request.id, result } satisfies WorkerResponse);
};
