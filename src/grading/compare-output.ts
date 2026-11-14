// Compare a predicted output with the real one, line by line.
// Used to mark predictions on the phone and to check expected outputs at build time.

export interface LineComparison {
  expected: string; // the real output line ("" if the prediction had extra lines)
  predicted: string; // the predicted line ("" if the prediction was short)
  same: boolean;
  firstDifference: number; // index of the first differing character, or -1 when same
}

export interface OutputComparison {
  match: boolean;
  lines: LineComparison[];
}

/** Trailing spaces on a line, blank lines at the end and Windows line endings never count. */
export function normaliseOutput(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, ""));
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** Compare predicted output with the real output and say where each line first differs. */
export function compareOutput(predicted: string, actual: string): OutputComparison {
  const predictedLines = normaliseOutput(predicted);
  const actualLines = normaliseOutput(actual);
  const count = Math.max(predictedLines.length, actualLines.length);

  const lines: LineComparison[] = [];
  for (let i = 0; i < count; i++) {
    const expected = actualLines[i] ?? "";
    const guess = predictedLines[i] ?? "";
    const missing = i >= actualLines.length || i >= predictedLines.length;
    const same = !missing && expected === guess;
    lines.push({ expected, predicted: guess, same, firstDifference: same ? -1 : firstDifference(expected, guess) });
  }
  return { match: lines.every((line) => line.same), lines };
}

/** Index of the first character where two strings differ. */
function firstDifference(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}
