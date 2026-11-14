import { describe, expect, it } from "vitest";
import type { Course, Lesson } from "../content/schema";
import {
  completeLesson,
  emptyProgress,
  lessonScore,
  lessonState,
  migrate,
  saveExplanation,
  moduleCounts,
  nextStop,
  recordAnswer,
  saveStep,
  UnreadableProgressError,
} from "./progress";

const monday = new Date("2026-11-16T09:00:00Z");
const tuesday = new Date("2026-11-17T09:00:00Z");

/** A lesson with the given number of reading steps. */
const lesson = (id: string, stepCount: number): Lesson => ({
  id,
  title: `Lesson ${id}`,
  minutes: 5,
  steps: Array.from({ length: stepCount }, () => ({ kind: "read" as const, html: "" })),
});

const course: Course = {
  title: "Test",
  files: {},
  planned: [],
  modules: [
    { id: "start", label: "Start", title: "Start", summary: "", lessons: [lesson("start-01", 3)], checkHtml: [], apply: [], prompts: [] },
    {
      id: "data",
      label: "Module 1",
      title: "Data",
      summary: "",
      lessons: [lesson("data-01", 4), lesson("data-02", 4)],
      checkHtml: [],
      apply: [],
      prompts: [],
    },
  ],
};

describe("recordAnswer", () => {
  it("records a first answer", () => {
    const progress = recordAnswer(emptyProgress(), "q-1", false, monday);
    expect(progress.answers["q-1"]).toEqual({
      attempts: 1,
      firstTryCorrect: false,
      lastCorrect: false,
      lastAnsweredAt: monday.toISOString(),
    });
  });

  it("keeps the first-try result when a later attempt is right", () => {
    let progress = recordAnswer(emptyProgress(), "q-1", false, monday);
    progress = recordAnswer(progress, "q-1", true, tuesday);
    expect(progress.answers["q-1"]).toMatchObject({ attempts: 2, firstTryCorrect: false, lastCorrect: true });
  });

  it("does not change the progress it was given", () => {
    const before = emptyProgress();
    recordAnswer(before, "q-1", true, monday);
    expect(before.answers).toEqual({});
  });
});

describe("lesson progress", () => {
  it("goes from new, to started, to done", () => {
    let progress = emptyProgress();
    expect(lessonState(progress, "data-01")).toBe("new");
    progress = saveStep(progress, "data-01", 2);
    expect(lessonState(progress, "data-01")).toBe("started");
    progress = completeLesson(progress, "data-01", monday);
    expect(lessonState(progress, "data-01")).toBe("done");
  });

  it("keeps the first completion date when a lesson is finished again", () => {
    let progress = completeLesson(emptyProgress(), "data-01", monday);
    progress = saveStep(progress, "data-01", 1);
    progress = completeLesson(progress, "data-01", tuesday);
    expect(progress.lessons["data-01"]?.completedAt).toBe(monday.toISOString());
  });

  it("counts finished lessons in a module", () => {
    const progress = completeLesson(emptyProgress(), "data-02", monday);
    expect(moduleCounts(progress, course.modules[1]!)).toEqual({ done: 1, total: 2 });
  });
});

describe("saveExplanation", () => {
  it("keeps the latest text for a lesson", () => {
    let progress = saveExplanation(emptyProgress(), "data-01", "First go.", monday);
    progress = saveExplanation(progress, "data-01", "Second go.", tuesday);
    expect(progress.explanations["data-01"]).toEqual({ text: "Second go.", savedAt: tuesday.toISOString() });
  });
});

describe("lessonScore", () => {
  const quiz: Lesson = {
    id: "quiz",
    title: "Quiz",
    minutes: 3,
    steps: ["q-1", "q-2", "q-3"].map((id) => ({
      kind: "exercise" as const,
      introHtml: "",
      exercise: { type: "predict" as const, id, code: "", output: "", explainHtml: "" },
    })),
  };

  it("counts first-try answers only, among those answered", () => {
    let progress = recordAnswer(emptyProgress(), "q-1", true, monday);
    progress = recordAnswer(progress, "q-2", false, monday);
    progress = recordAnswer(progress, "q-2", true, tuesday); // a retry does not change the first-try score
    expect(lessonScore(progress, quiz)).toEqual({ right: 1, answered: 2 });
  });
});

describe("nextStop", () => {
  it("starts at the first lesson", () => {
    expect(nextStop(emptyProgress(), course)).toMatchObject({ lessonId: "start-01", step: 0, stepCount: 3 });
  });

  it("resumes at the saved step", () => {
    const progress = saveStep(emptyProgress(), "start-01", 2);
    expect(nextStop(progress, course)).toMatchObject({ lessonId: "start-01", step: 2 });
  });

  it("skips finished lessons, across modules", () => {
    const progress = completeLesson(emptyProgress(), "start-01", monday);
    expect(nextStop(progress, course)).toMatchObject({ moduleId: "data", lessonId: "data-01" });
  });

  it("never points past the last step, even if a lesson got shorter", () => {
    const progress = saveStep(emptyProgress(), "start-01", 99);
    expect(nextStop(progress, course)?.step).toBe(2);
  });

  it("returns null when everything is done", () => {
    let progress = emptyProgress();
    for (const id of ["start-01", "data-01", "data-02"]) progress = completeLesson(progress, id, monday);
    expect(nextStop(progress, course)).toBeNull();
  });
});

describe("migrate", () => {
  it("gives empty progress when nothing was stored", () => {
    expect(migrate(undefined)).toEqual(emptyProgress());
  });

  it("keeps current-version data as it is", () => {
    const stored = completeLesson(emptyProgress(), "data-01", monday);
    expect(migrate(stored)).toEqual(stored);
  });

  it("upgrades version 1 progress, keeping every lesson and answer", () => {
    const v1 = {
      version: 1,
      lessons: { "data-01": { step: 0, completedAt: monday.toISOString() } },
      answers: { "q-1": { attempts: 1, firstTryCorrect: true, lastCorrect: true, lastAnsweredAt: monday.toISOString() } },
    };
    const upgraded = migrate(v1, "2026-11-20");
    expect(upgraded).toMatchObject({ version: 3, lessons: v1.lessons, answers: v1.answers, explanations: {} });
  });

  it("upgrades version 2 progress, putting answered exercises into review due today", () => {
    const v2 = {
      version: 2,
      lessons: {},
      answers: { "q-1": { attempts: 1, firstTryCorrect: true, lastCorrect: true, lastAnsweredAt: monday.toISOString() } },
      explanations: { "data-01": { text: "Types matter.", savedAt: monday.toISOString() } },
    };
    const upgraded = migrate(v2, "2026-11-20");
    expect(upgraded.version).toBe(3);
    expect(upgraded.explanations).toEqual(v2.explanations);
    expect(upgraded.review).toEqual({ "q-1": { box: 1, due: "2026-11-20" } });
    expect(upgraded.settings).toEqual({ theme: "system", haptics: true });
    expect(upgraded.bugs).toEqual([]);
  });

  it("refuses data from a newer version rather than overwriting it", () => {
    expect(() => migrate({ version: 99 })).toThrow(UnreadableProgressError);
  });

  it("refuses data with no version", () => {
    expect(() => migrate({ lessons: {} })).toThrow(UnreadableProgressError);
  });
});
