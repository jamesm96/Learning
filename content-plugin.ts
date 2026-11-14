// Vite plugin: lets the app write `import course from "virtual:course"`.
// At build (and on every edit in dev) it reads content/, validates it and
// hands the app plain data. Any content mistake stops the build with a clear message.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";
import { loadCourse } from "./src/content/load-course.ts";

const VIRTUAL_ID = "virtual:course";
const RESOLVED_ID = "\0virtual:course";

export function contentPlugin(contentDir = "content"): Plugin {
  const root = resolve(contentDir);

  return {
    name: "code-literacy-content",

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },

    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const read = (relativePath: string) => {
        const fullPath = join(root, relativePath);
        this.addWatchFile(fullPath); // re-run when this file changes in dev
        return readFileSync(fullPath, "utf-8");
      };
      const course = loadCourse(read);
      return `export default ${JSON.stringify(course)};`;
    },

    // In dev, any change under content/ (including new files) reloads the page with fresh content.
    configureServer(server) {
      server.watcher.add(root);
      server.watcher.on("all", (_event, path) => {
        if (!resolve(path).startsWith(root)) return;
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
