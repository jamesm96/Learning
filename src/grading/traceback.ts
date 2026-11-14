// Split a Python traceback into its parts, so each frame can be tapped and the failing one found.

export interface TracebackFrame {
  file: string; // for example "main.py"
  line: number;
  functionName: string | null; // "<module>" for top-level code; null for a SyntaxError
  lines: string[]; // the "File ..." line, the source line, and any ^^^ marker lines
}

export interface ParsedTraceback {
  header: string | null; // "Traceback (most recent call last):", absent for a SyntaxError
  frames: TracebackFrame[];
  exceptionLines: string[]; // the final "KeyError: 'b'" part (can be more than one line)
  failingFrame: number; // index of the frame where it failed: the last one in the learner's file
}

const FRAME_START = /^ {2}File "([^"]+)", line (\d+)(?:, in (.+))?$/;

/** Parse traceback text. The failing frame is the last frame in `learnerFile`, falling back to the last frame. */
export function parseTraceback(text: string, learnerFile = "main.py"): ParsedTraceback {
  const lines = text.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  let header: string | null = null;
  const frames: TracebackFrame[] = [];
  const exceptionLines: string[] = [];

  for (const line of lines) {
    const start = FRAME_START.exec(line);
    if (line.startsWith("Traceback (most recent call last)")) {
      header = line;
    } else if (start) {
      frames.push({
        file: start[1] ?? "",
        line: Number(start[2]),
        functionName: start[3] ?? null,
        lines: [line],
      });
    } else if (line.startsWith("    ") && frames.length > 0 && exceptionLines.length === 0) {
      frames[frames.length - 1]!.lines.push(line); // source line or ^^^ marker under the current frame
    } else {
      exceptionLines.push(line);
    }
  }

  let failingFrame = frames.length - 1;
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i]!.file === learnerFile) {
      failingFrame = i;
      break;
    }
  }
  return { header, frames, exceptionLines, failingFrame };
}
