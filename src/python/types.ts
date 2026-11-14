// The result of running Python, shared by the phone (Web Worker) and the build (Node).

/** An exception raised while running code, formatted the way Python prints it. */
export interface PythonError {
  type: string; // for example "KeyError"
  message: string;
  traceback: string; // the full text, starting "Traceback (most recent call last):"
}

export interface RunResult {
  stdout: string; // everything printed, including error output
  error: PythonError | null; // raised by the learner's code
  checkError: PythonError | null; // raised by the hidden check code, for example a failed assert
  timedOut: boolean; // stopped because it ran too long, or because Stop was pressed
}

/** Run code, then optional hidden check code in the same namespace. */
export type RunPython = (code: string, check?: string) => Promise<RunResult>;
