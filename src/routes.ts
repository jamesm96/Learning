// Where the app is, read from the URL hash. Pure, so it can be unit tested.
//   #/today              Today tab
//   #/learn              course map
//   #/learn/data         a module
//   #/learn/data/data-04 a lesson
//   #/today/review       a review session

import { tabFromHash, type TabId } from "./tabs";

export interface Route {
  tab: TabId;
  moduleId?: string;
  lessonId?: string;
  review?: boolean; // #/today/review: a review session
  reviewLimit?: number; // #/today/review/5: at most this many cards
}

/** Read the full route from a URL hash. Extra parts are only used on the Learn tab. */
export function parseRoute(hash: string): Route {
  const tab = tabFromHash(hash);
  const review = /^#\/?today\/review(?:\/(\d+))?/.exec(hash);
  if (tab === "today" && review) return review[1] ? { tab, review: true, reviewLimit: Number(review[1]) } : { tab, review: true };
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

/** Link to a module's page. */
export function moduleHash(moduleId: string): string {
  return `#/learn/${moduleId}`;
}

/** Link to a lesson. */
export function lessonHash(moduleId: string, lessonId: string): string {
  return `#/learn/${moduleId}/${lessonId}`;
}
