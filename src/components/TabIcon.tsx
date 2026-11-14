import type { TabId } from "../tabs";

interface TabIconProps {
  id: TabId;
}

/** Line icons for the tab bar. Decorative: the label next to each one carries the meaning. */
export function TabIcon({ id }: TabIconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      {id === "today" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2" />
        </>
      )}
      {id === "learn" && (
        <>
          <path d="M4 5.5h6a2 2 0 0 1 2 2V19a1.5 1.5 0 0 0-1.5-1.5H4z" />
          <path d="M20 5.5h-6a2 2 0 0 0-2 2V19a1.5 1.5 0 0 1 1.5-1.5H20z" />
        </>
      )}
      {id === "practice" && (
        <>
          <path d="M5 8l4 4-4 4" />
          <path d="M12 16h7" />
        </>
      )}
      {id === "me" && (
        <>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
        </>
      )}
    </svg>
  );
}
