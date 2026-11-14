import type { ComponentChildren } from "preact";

interface PlaceholderProps {
  title: string;
  phase: number;
  children: ComponentChildren;
}

/** A section that marks where a feature will go, and which phase builds it. */
export function Placeholder({ title, phase, children }: PlaceholderProps) {
  return (
    <section class="placeholder">
      <h2>{title}</h2>
      <p>{children}</p>
      <p class="placeholder-phase">Arrives in phase {phase}</p>
    </section>
  );
}
