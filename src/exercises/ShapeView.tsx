import { useState } from "preact/hooks";
import type { PathPart, ShapeExercise } from "../content/schema";
import { formatPath, parsePath, resolvePath, samePath } from "../grading/data-path";
import { Feedback } from "../components/Feedback";

interface ShapeViewProps {
  exercise: ShapeExercise;
  onAnswer: (correct: boolean) => void;
}

/** Shape it: tap through nested data to build the path to one value, or type the path. */
export function ShapeView({ exercise, onAnswer }: ShapeViewProps) {
  const [path, setPath] = useState<PathPart[]>([]);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState(`${exercise.name}`);
  const [typedError, setTypedError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean | null>(null);
  const locked = checked !== null;

  const check = () => {
    let chosen = path;
    if (typing) {
      const parts = parsePath(typed, exercise.name);
      if ("error" in parts) return setTypedError(parts.error);
      const resolved = resolvePath(exercise.data, parts);
      if (!resolved.found) return setTypedError(resolved.error);
      chosen = resolved.parts;
      setPath(chosen);
    }
    const correct = samePath(chosen, exercise.answer);
    setChecked(correct);
    onAnswer(correct);
  };

  const value = resolvePath(exercise.data, path);

  return (
    <div class="exercise">
      <p class="exercise-tag">Shape it</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.questionHtml }} />

      {!typing && (
        <div class="tree" role="tree" aria-label={`The data in ${exercise.name}`}>
          <TreeNode label={exercise.name} value={exercise.data} path={[]} selected={path} onSelect={locked ? () => {} : setPath} />
        </div>
      )}

      {typing ? (
        <label class="field">
          <span class="field-label">Type the path</span>
          <input
            class="code-input"
            value={typed}
            disabled={locked}
            onInput={(event) => {
              setTyped(event.currentTarget.value);
              setTypedError(null);
            }}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck={false}
          />
          {typedError && <span class="task-verdict">{typedError}</span>}
        </label>
      ) : (
        <p class="path-display">
          <span class="field-label">Your path </span>
          <code>{formatPath(exercise.name, path)}</code>
          {value.found && path.length > 0 && <span class="path-value"> → {pythonRepr(value.value, 40)}</span>}
        </p>
      )}

      {!locked && (
        <div class="run-buttons">
          <button type="button" class="button-run" onClick={check} disabled={!typing && path.length === 0}>
            Check this path
          </button>
          <button type="button" class="link-button" onClick={() => setTyping(!typing)}>
            {typing ? "Tap through the data instead" : "Type the path instead"}
          </button>
        </div>
      )}

      {checked !== null && (
        <Feedback correct={checked} explainHtml={exercise.explainHtml}>
          {!checked && (
            <p>
              The path is <code>{formatPath(exercise.name, exercise.answer)}</code>.
            </p>
          )}
        </Feedback>
      )}
    </div>
  );
}

interface TreeNodeProps {
  label: string;
  value: unknown;
  path: PathPart[];
  selected: PathPart[];
  onSelect: (path: PathPart[]) => void;
}

/** One entry in the data tree. Tapping it selects its path and opens it if it holds more data. */
function TreeNode({ label, value, path, selected, onSelect }: TreeNodeProps) {
  const isContainer = value !== null && typeof value === "object";
  const isSelected = samePath(path, selected);
  // Open the root, and every node on the way to the current selection.
  const onSelectedRoute = path.length <= selected.length && samePath(path, selected.slice(0, path.length));
  const [open, setOpen] = useState(path.length === 0);
  const expanded = isContainer && (open || (onSelectedRoute && path.length < selected.length));

  const children: [PathPart, unknown][] = Array.isArray(value)
    ? value.map((item, index) => [index, item])
    : isContainer
      ? Object.entries(value as Record<string, unknown>)
      : [];

  const select = () => {
    if (path.length > 0) onSelect(path);
    if (isContainer) setOpen(!expanded);
  };

  return (
    <div class="tree-node" role="treeitem" aria-expanded={isContainer ? expanded : undefined} aria-selected={isSelected}>
      <button type="button" class={`tree-row ${isSelected ? "is-selected" : ""}`} onClick={select}>
        {isContainer && <span class="tree-arrow" aria-hidden="true">{expanded ? "▾" : "▸"}</span>}
        <code class="tree-key">{label}</code>
        <span class="tree-summary">{summarise(value)}</span>
      </button>
      {expanded && (
        <div class="tree-children" role="group">
          {children.map(([key, child]) => (
            <TreeNode
              key={String(key)}
              label={typeof key === "number" ? `[${key}]` : `"${key}"`}
              value={child}
              path={[...path, key]}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A short description of a value: "list of 3", "dict of 2 keys", or the value itself. */
function summarise(value: unknown): string {
  if (Array.isArray(value)) return `list of ${value.length}`;
  if (value !== null && typeof value === "object") {
    const count = Object.keys(value).length;
    return `dict, ${count} ${count === 1 ? "key" : "keys"}`;
  }
  return pythonRepr(value, 28);
}

/** Show a JSON value the way Python would print it, shortened if long. */
function pythonRepr(value: unknown, max: number): string {
  let text: string;
  if (value === null) text = "None";
  else if (value === true) text = "True";
  else if (value === false) text = "False";
  else if (typeof value === "string") text = `'${value}'`;
  else if (typeof value === "number") text = String(value);
  else if (Array.isArray(value)) text = `[${value.map((item) => pythonRepr(item, max)).join(", ")}]`;
  else text = `{${Object.entries(value as Record<string, unknown>).map(([k, v]) => `'${k}': ${pythonRepr(v, max)}`).join(", ")}}`;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
