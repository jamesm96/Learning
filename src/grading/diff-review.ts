// Marking a diff review, line by line.
// A changed line usually comes as a pair: the removed "before" (-) and the added "after" (+).
// Flagging either half of a pair counts for both, so lesson authors may list either or both,
// and the learner may tap whichever line caught their eye.

/** True for a + or - line that is a change, not a file header. */
export function isChangeLine(line: string): boolean {
  return /^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line);
}

/** Similarity of two lines from 0 to 1 (Dice coefficient on pairs of characters). */
function similarity(a: string, b: string): number {
  const pairs = (text: string) => {
    const clean = text.slice(1).trim();
    const list: string[] = [];
    for (let i = 0; i < clean.length - 1; i++) list.push(clean.slice(i, i + 2));
    return list;
  };
  const left = pairs(a);
  const right = pairs(b);
  if (left.length === 0 || right.length === 0) return 0;
  const remaining = [...right];
  let shared = 0;
  for (const pair of left) {
    const index = remaining.indexOf(pair);
    if (index >= 0) {
      shared += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * shared) / (left.length + right.length);
}

const PAIR_THRESHOLD = 0.5;

/**
 * For each line, the index of its partner: the most similar line of the opposite sign
 * in the same run of changes, if similar enough. -1 when it has none.
 */
export function partners(lines: string[]): number[] {
  const result = lines.map(() => -1);
  let start = 0;
  while (start < lines.length) {
    if (!isChangeLine(lines[start]!)) {
      start++;
      continue;
    }
    let end = start;
    while (end < lines.length && isChangeLine(lines[end]!)) end++;
    const run = Array.from({ length: end - start }, (_, i) => start + i);
    const removed = run.filter((i) => lines[i]![0] === "-");
    const added = run.filter((i) => lines[i]![0] === "+");
    // Greedy: pair the most similar lines first, each line at most once.
    const candidates = removed
      .flatMap((r) => added.map((a) => ({ r, a, score: similarity(lines[r]!, lines[a]!) })))
      .filter((c) => c.score >= PAIR_THRESHOLD)
      .sort((x, y) => y.score - x.score);
    for (const { r, a } of candidates) {
      if (result[r] === -1 && result[a] === -1) {
        result[r] = a;
        result[a] = r;
      }
    }
    start = end;
  }
  return result;
}

export interface DiffReviewResult {
  correct: boolean;
  missed: number[]; // expected lines (neither half of their pair flagged)
  extra: number[]; // flagged lines that were part of the task
}

/** Compare the lines the learner flagged with the lines the lesson expects. */
export function markDiffReview(lines: string[], flagLines: number[], flagged: Set<number>): DiffReviewResult {
  const partner = partners(lines);
  const expected = new Set(flagLines);
  const covered = (index: number, set: Set<number>) => set.has(index) || (partner[index]! >= 0 && set.has(partner[index]!));
  const missed = flagLines.filter((index) => !covered(index, flagged));
  const extra = [...flagged].filter((index) => !covered(index, expected)).sort((a, b) => a - b);
  return { correct: missed.length === 0 && extra.length === 0, missed, extra };
}
