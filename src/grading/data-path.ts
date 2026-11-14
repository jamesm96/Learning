// Paths into nested data, written the Python way: scene["assets"][2]["materials"][1].

import type { PathPart } from "../content/schema.ts";

/** Read a typed path like `scene["assets"][2]` into its parts. Returns an error message if it cannot be read. */
export function parsePath(text: string, name: string): PathPart[] | { error: string } {
  const trimmed = text.trim();
  if (!trimmed.startsWith(name)) return { error: `Start the path with ${name}.` };
  let rest = trimmed.slice(name.length);
  const parts: PathPart[] = [];
  const step = /^\[\s*(?:"([^"]*)"|'([^']*)'|(-?\d+))\s*\]/;
  while (rest.length > 0) {
    const match = step.exec(rest);
    if (!match) return { error: 'Each step looks like ["key"] or [2].' };
    if (match[3] !== undefined) parts.push(Number(match[3]));
    else parts.push(match[1] ?? match[2] ?? "");
    rest = rest.slice(match[0].length).trimStart();
  }
  return parts;
}

/** Write path parts back out, for example scene["assets"][2]. */
export function formatPath(name: string, parts: PathPart[]): string {
  return name + parts.map((part) => (typeof part === "number" ? `[${part}]` : `["${part}"]`)).join("");
}

export type Resolved = { found: true; value: unknown; parts: PathPart[] } | { found: false; error: string };

/**
 * Follow a path into data, as Python would. Negative list indexes count from the end;
 * the returned parts have them turned into ordinary indexes, so two paths to one value compare equal.
 */
export function resolvePath(data: unknown, parts: PathPart[]): Resolved {
  let current: unknown = data;
  const normalised: PathPart[] = [];
  for (const part of parts) {
    if (Array.isArray(current)) {
      if (typeof part !== "number") return { found: false, error: `A list needs a number index, not "${part}" (TypeError in Python).` };
      const index = part < 0 ? current.length + part : part;
      if (index < 0 || index >= current.length) return { found: false, error: `Index ${part} is out of range (IndexError in Python).` };
      current = current[index];
      normalised.push(index);
    } else if (current !== null && typeof current === "object") {
      if (typeof part !== "string") return { found: false, error: `A dictionary needs a key in quotes, not [${part}].` };
      if (!(part in current)) return { found: false, error: `There is no key "${part}" (KeyError in Python).` };
      current = (current as Record<string, unknown>)[part];
      normalised.push(part);
    } else {
      return { found: false, error: "That value has nothing inside it to index." };
    }
  }
  return { found: true, value: current, parts: normalised };
}

/** True when two paths lead to the same place. */
export function samePath(a: PathPart[], b: PathPart[]): boolean {
  return a.length === b.length && a.every((part, index) => part === b[index]);
}
