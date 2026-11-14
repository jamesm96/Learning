// Check all course content without building the app: schema, then every runnable exercise in real Python.
// Run with: npm run check:content
// The build runs the same checks; this is the quick way to check while writing lessons.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCourse } from "../src/content/load-course.ts";
import { checkWithPython } from "../src/content/python-checks.ts";
import { runPythonInNode } from "../python-node.ts";

const course = loadCourse((path) => readFileSync(join("content", path), "utf-8"));
const problems = await checkWithPython(course, runPythonInNode);

let exercises = 0;
for (const module of course.modules) {
  for (const lesson of module.lessons) {
    const count = lesson.steps.filter((step) => step.kind === "exercise").length;
    exercises += count;
    console.log(`${lesson.id.padEnd(12)} ${String(lesson.steps.length).padStart(2)} steps, ${count} exercises  ${lesson.title}`);
  }
}

for (const [name, files] of [["drills", course.practice.drills], ["bug hunt", course.practice.bugHunt]] as const) {
  for (const file of files) {
    exercises += file.steps.length;
    console.log(`${file.id.padEnd(17)} ${String(file.steps.length).padStart(2)} ${name} exercises  ${file.title}`);
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n\n${problems.join("\n\n")}`);
  process.exit(1);
}
console.log(`\nAll ${exercises} exercises are valid, and every runnable one checks out in Python.`);
