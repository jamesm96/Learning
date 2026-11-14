// The four tabs of the app, and how they map to the URL hash.
// Kept free of UI code so it can be unit tested.

export type TabId = "today" | "learn" | "practice" | "me";

export interface Tab {
  id: TabId;
  label: string;
}

export const TABS: readonly Tab[] = [
  { id: "today", label: "Today" },
  { id: "learn", label: "Learn" },
  { id: "practice", label: "Practice" },
  { id: "me", label: "Me" },
];

export const DEFAULT_TAB: TabId = "today";

/** Build the URL hash for a tab, for example "#/learn". */
export function hashForTab(id: TabId): string {
  return `#/${id}`;
}

/** Read the tab id from a URL hash such as "#/learn". Unknown or empty hashes give Today. */
export function tabFromHash(hash: string): TabId {
  const name = hash.replace(/^#\/?/, "").split("/")[0] ?? "";
  const match = TABS.find((tab) => tab.id === name);
  return match ? match.id : DEFAULT_TAB;
}
