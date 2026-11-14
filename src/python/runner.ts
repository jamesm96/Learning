// The page's side of running Python. Starts the worker on first use, sends code,
// enforces a time limit, and lets screens show whether Python is loading.

import { useEffect, useState } from "preact/hooks";
import { course } from "../content/course";
import type { RunPython, RunResult } from "./types";
import type { WorkerRequest, WorkerResponse } from "./worker";

/** How long code may run before it is stopped. Loading Python does not count. */
export const TIME_LIMIT_MS = 5000;

export type PythonStatus = "not-loaded" | "loading" | "ready" | "failed";

interface Pending {
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let status: PythonStatus = "not-loaded";
let nextId = 1;
const pending = new Map<number, Pending>();
const statusListeners = new Set<(status: PythonStatus) => void>();

const indexURL = new URL(`${import.meta.env.BASE_URL}pyodide/`, window.location.href).href;

function setStatus(next: PythonStatus): void {
  status = next;
  for (const listener of statusListeners) listener(status);
}

/** Start a fresh worker and listen to what it says. */
function startWorker(): Worker {
  const created = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  created.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;
    if (message.type === "ready") {
      setStatus("ready");
    } else if (message.type === "load-failed") {
      setStatus("failed");
      for (const job of pending.values()) job.reject(new Error(message.message));
      pending.clear();
    } else if (message.type === "started") {
      const job = pending.get(message.id);
      if (job) job.timer = setTimeout(() => stopPython(), TIME_LIMIT_MS);
    } else if (message.type === "result") {
      const job = pending.get(message.id);
      if (!job) return;
      clearTimeout(job.timer);
      pending.delete(message.id);
      job.resolve(message.result);
    }
  };
  return created;
}

/**
 * Run code (and optional hidden check code) in Python. The course's sample files, plus any
 * extra files, are written into a fresh working folder first. Rejects only if Python itself could not load.
 */
export const runPython: RunPython = (code, check = "", files = {}) => {
  if (!worker) {
    worker = startWorker();
  }
  if (status !== "ready") setStatus("loading");

  const id = nextId++;
  const request: WorkerRequest = { type: "run", id, code, check, files: JSON.stringify({ ...course.files, ...files }), indexURL };
  return new Promise<RunResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage(request);
  });
};

/** Stop whatever is running: end the worker and answer every waiting run with timedOut. Python reloads on the next run, from cache. */
export function stopPython(): void {
  worker?.terminate();
  worker = null;
  for (const job of pending.values()) {
    clearTimeout(job.timer);
    job.resolve({ stdout: "", error: null, checkError: null, timedOut: true });
  }
  pending.clear();
  setStatus("not-loaded");
}

/** Whether Python is loaded, loading or failed. The component re-renders when it changes. */
export function usePythonStatus(): PythonStatus {
  const [current, setCurrent] = useState(status);
  useEffect(() => {
    statusListeners.add(setCurrent);
    setCurrent(status);
    return () => {
      statusListeners.delete(setCurrent);
    };
  }, []);
  return current;
}
