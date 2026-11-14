import { describe, expect, it } from "vitest";
import { loadCourse } from "./load-course";
import { ContentError } from "./parse-lesson";

/** A fake content folder held in memory. */
function reader(files: Record<string, string>) {
  return (path: string) => {
    const text = files[path];
    if (text === undefined) throw new Error(`no such file: ${path}`);
    return text;
  };
}

const courseYaml = [
  "title: Test course",
  "modules:",
  "  - folder: 01-data",
  "  - planned: { id: git, label: Module 4, title: Git, summary: Later. }",
].join("\n");

const moduleYaml = [
  "id: data",
  "label: Module 1",
  "title: Data",
  "summary: Shapes.",
  "lessons: [01-values.md]",
  "check: ['Is `.get()` hiding a missing key?']",
].join("\n");

const lessonMd = (exerciseId: string) =>
  `---\nid: data-01\ntitle: Values\nminutes: 5\n---\nText.\n\n---\n\n\`\`\`exercise predict\nid: ${exerciseId}\ncode: print(1)\noutput: '1'\nexplain: One.\n\`\`\``;

describe("loadCourse", () => {
  it("assembles modules, lessons and planned modules", () => {
    const course = loadCourse(
      reader({
        "course.yaml": courseYaml,
        "modules/01-data/module.yaml": moduleYaml,
        "modules/01-data/01-values.md": lessonMd("data-01-predict"),
      }),
    );
    expect(course.title).toBe("Test course");
    expect(course.modules[0]?.lessons[0]?.steps).toHaveLength(2);
    expect(course.modules[0]?.checkHtml[0]).toBe("Is <code>.get()</code> hiding a missing key?");
    expect(course.planned[0]?.title).toBe("Git");
  });

  it("rejects an exercise id that repeats a lesson id", () => {
    const files = {
      "course.yaml": courseYaml,
      "modules/01-data/module.yaml": moduleYaml,
      "modules/01-data/01-values.md": lessonMd("data-01"),
    };
    expect(() => loadCourse(reader(files))).toThrow(/Duplicate id "data-01"/);
  });

  it("names the file that is broken", () => {
    const files = {
      "course.yaml": courseYaml,
      "modules/01-data/module.yaml": moduleYaml,
      "modules/01-data/01-values.md": "no frontmatter",
    };
    expect(() => loadCourse(reader(files))).toThrow(ContentError);
    expect(() => loadCourse(reader(files))).toThrow(/modules\/01-data\/01-values\.md/);
  });
});
