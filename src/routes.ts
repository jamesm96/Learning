// Where the app is, read from the URL hash. Pure, so it can be unit tested.
//   #/today              Today tab
//   #/learn              course map
//   #/learn/data         a module
//   #/learn/data/data-04 a lesson
//   #/today/review       a review session
//   #/practice/drills/x  a drill session, #/practice/bugs/x one bug-hunt snippet

import { tabFromHash, type TabId } from "./tabs";

export interface Route {
  tab: TabId;
  moduleId?: string;
  lessonId?: string;
  review?: boolean; // #/today/review: a review session
  reviewLimit?: number; // #/today/review/5: at most this many cards
  drill?: string; // #/practice/drills/drills-data: a drill session on one topic
  bug?: string; // #/practice/bugs/bug-hunt-easy-get-default: one bug-hunt snippet
}

/** Read the full route from a URL hash. Extra parts are only used on the Learn tab. */
export function parseRoute(hash: string): Route {
  const tab = tabFromHash(hash);
  const review = /^#\/?today\/review(?:\/(\d+))?/.exec(hash);
  if (tab === "today" && review) return review[1] ? { tab, review: true, reviewLimit: Number(review[1]) } : { tab, review: true };
  if (tab === "practice") {
    const [, kind, id] = hash.replace(/^#\/?/, "").split("/");
    if (kind === "drills" && id) return { tab, drill: id };
    if (kind === "bugs" && id) return { tab, bug: id };
  }
  if (tab !== "learn") return { tab };

  const [, moduleId, lessonId] = hash.replace(/^#\/?/, "").split("/");
  return {
    tab,
    moduleId: moduleId || undefined,
    lessonId: lessonId || undefined,
  };
}

/** True on screens where time counts as practice: a lesson, a review session or the Scratchpad. */
export function isPracticeRoute(hash: string): boolean {
  const route = parseRoute(hash);
  return route.review === true || route.tab === "practice" || (route.tab === "learn" && route.lessonId !== undefined);
}

/** Link to a review session, optionally limited to a number of cards. */
export function reviewHash(limit?: number): string {
  return limit ? `#/today/review/${limit}` : "#/today/review";
}

/** Link to a drill session on one topic. */
export function drillHash(topicId: string): string {
  return `#/practice/drills/${topicId}`;
}

/** Link to one bug-hunt snippet. */
export function bugHash(exerciseId: string): string {
  return `#/practice/bugs/${exerciseId}`;
}

/** Link to a module's page. */
export function moduleHash(moduleId: string): string {
  return `#/learn/${moduleId}`;
}

/** Link to a lesson. */
export function lessonHash(moduleId: string, lessonId: string): string {
  return `#/learn/${moduleId}/${lessonId}`;
}
