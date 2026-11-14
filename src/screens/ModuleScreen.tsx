import type { Module } from "../content/schema";
import { Html } from "../components/Html";
import { PromptCard } from "../components/PromptCard";
import { ApplyTask } from "../components/ApplyTask";
import { lessonState } from "../progress/progress";
import { useProgress } from "../progress/store";
import { lessonHash } from "../routes";

interface ModuleScreenProps {
  module: Module;
}

const STATE_TEXT = { new: "Not started", started: "In progress", done: "Done" } as const;

/** One module: its lessons with progress, then the review checklist, the C#/C++ bridge and the Apply tasks. */
export function ModuleScreen({ module }: ModuleScreenProps) {
  const progress = useProgress();

  return (
    <>
      <header class="screen-header">
        <a class="back-link" href="#/learn">
          Course map
        </a>
        <p class="eyebrow">{module.label}</p>
        <h1>{module.title}</h1>
      </header>

      {module.introHtml && <Html html={module.introHtml} />}

      <ol class="lesson-list" aria-label="Lessons">
        {module.lessons.map((lesson, index) => {
          const state = lessonState(progress, lesson.id);
          return (
            <li key={lesson.id}>
              <a class={`lesson-link is-${state}`} href={lessonHash(module.id, lesson.id)}>
                <span class="lesson-number" aria-hidden="true">
                  {state === "done" ? "✓" : index + 1}
                </span>
                <span class="lesson-body">
                  <span class="lesson-title">{lesson.title}</span>
                  <span class="lesson-meta">
                    {STATE_TEXT[state]} · {lesson.minutes} min
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      {module.checkHtml.length > 0 && (
        <section class="panel">
          <h2>When Claude writes this, check</h2>
          <ul>
            {module.checkHtml.map((html, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </ul>
        </section>
      )}

      {module.prompts.length > 0 && (
        <section class="panel">
          <h2>Prompts for Claude</h2>
          {module.prompts.map((prompt) => (
            <PromptCard key={prompt.title} title={prompt.title} text={prompt.text} />
          ))}
        </section>
      )}

      {module.bridgeHtml && (
        <details class="panel">
          <summary>The same ideas in C# and C++</summary>
          <Html html={module.bridgeHtml} />
        </details>
      )}

      {module.apply.length > 0 && (
        <section class="panel">
          <h2>Apply it, at your desk</h2>
          <ul class="apply-list">
            {module.apply.map((task) => (
              <ApplyTask key={task.id} id={task.id} tier={task.tier} html={task.html} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
