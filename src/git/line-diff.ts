// A small line-by-line diff (longest common subsequence). Enough for the short files in Git exercises.

export interface DiffLine {
  op: " " | "-" | "+"; // unchanged, removed, added
  text: string;
}

/** Compare two texts line by line, as `git diff` does. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");

  // lengths[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lengths: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i]![j] = a[i] === b[j] ? lengths[i + 1]![j + 1]! + 1 : Math.max(lengths[i + 1]![j]!, lengths[i]![j + 1]!);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ op: " ", text: a[i]! });
      i++;
      j++;
    } else if (lengths[i + 1]![j]! >= lengths[i]![j + 1]!) {
      result.push({ op: "-", text: a[i]! });
      i++;
    } else {
      result.push({ op: "+", text: b[j]! });
      j++;
    }
  }
  while (i < a.length) result.push({ op: "-", text: a[i++]! });
  while (j < b.length) result.push({ op: "+", text: b[j++]! });
  return result;
}
