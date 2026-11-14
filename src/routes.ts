// Where the app is, read from the URL hash. Pure, so it can be unit tested.
//   #/today              Today tab
//   #/learn              course map
//   #/learn/data         a module
//   #/learn/data/data-04 a lesson

import { tabFromHash, type TabId } from "./tabs";

export interface Route {
  tab: TabId;
  moduleId?: string;
  lessonId?: string;
}

/** Read the full route from a URL hash. Extra parts are only used on the Learn tab. */
export function parseRoute(hash: string): Route {
  const tab = tabFromHash(hash);
  if (tab !== "learn") return { tab };

  const [, moduleId, lessonId] = hash.replace(/^#\/?/, "").split("/");
  return {
    tab,
    moduleId: moduleId || undefined,
    lessonId: lessonId || undefined,
  };
}

/** Link to a module's page. */
export function moduleHash(moduleId: string): string {
  return `#/learn/${moduleId}`;
}

/** Link to a lesson. */
export function lessonHash(moduleId: string, lessonId: string): string {
  return `#/learn/${moduleId}/${lessonId}`;
}
