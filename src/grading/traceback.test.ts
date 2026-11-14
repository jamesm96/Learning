import { describe, expect, it } from "vitest";
import { parseTraceback } from "./traceback";

// Real tracebacks, as Pyodide (Python 3.14) prints them through src/python/harness.py.
const twoFrames = `Traceback (most recent call last):
  File "main.py", line 4, in <module>
    print(f(0))
          ~^^^
  File "main.py", line 2, in f
    return 10 / n
           ~~~^~~
ZeroDivisionError: division by zero
`;

const syntaxError = `  File "main.py", line 1
    print("ok"
         ^
SyntaxError: '(' was never closed`;

describe("parseTraceback", () => {
  it("splits frames, keeping each frame's source and marker lines", () => {
    const parsed = parseTraceback(twoFrames);
    expect(parsed.header).toBe("Traceback (most recent call last):");
    expect(parsed.frames).toHaveLength(2);
    expect(parsed.frames[1]).toMatchObject({ file: "main.py", line: 2, functionName: "f" });
    expect(parsed.frames[1]?.lines).toEqual([
      '  File "main.py", line 2, in f',
      "    return 10 / n",
      "           ~~~^~~",
    ]);
    expect(parsed.exceptionLines).toEqual(["ZeroDivisionError: division by zero"]);
  });

  it("names the deepest frame as the failing one", () => {
    expect(parseTraceback(twoFrames).failingFrame).toBe(1);
  });

  it("prefers the learner's own file over library frames below it", () => {
    const text = `Traceback (most recent call last):
  File "main.py", line 3, in <module>
    json.loads(text)
  File "/lib/python3.14/json/__init__.py", line 352, in loads
    return _default_decoder.decode(s)
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`;
    expect(parseTraceback(text).failingFrame).toBe(0);
  });

  it("handles a SyntaxError, which has no header and no function name", () => {
    const parsed = parseTraceback(syntaxError);
    expect(parsed.header).toBeNull();
    expect(parsed.frames[0]).toMatchObject({ line: 1, functionName: null });
    expect(parsed.exceptionLines).toEqual(["SyntaxError: '(' was never closed"]);
  });
});
