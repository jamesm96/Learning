import { describe, expect, it } from "vitest";
import { highlightPython, highlightPythonToHtml } from "./highlight";

describe("highlightPython", () => {
  it("keeps every character of the code, in order", () => {
    const code = 'for a in assets:\n    print(a, "<b>")  # done';
    expect(highlightPython(code).map((token) => token.text).join("")).toBe(code);
  });

  it("marks keywords, strings, numbers and comments", () => {
    const classes = new Map(highlightPython('if x: y = "s" + 1  # c').map((t) => [t.text, t.className]));
    expect(classes.get("if")).toContain("tok-keyword");
    expect(classes.get('"s"')).toContain("tok-string");
    expect(classes.get("1")).toContain("tok-number");
    expect(classes.get("# c")).toContain("tok-comment");
  });
});

describe("highlightPythonToHtml", () => {
  it("escapes HTML inside code", () => {
    expect(highlightPythonToHtml('"<b>"')).toBe('<span class="tok-string">"&lt;b&gt;"</span>');
  });
});
