import { TABS, hashForTab, type TabId } from "../tabs";
import { TabIcon } from "./TabIcon";

interface TabBarProps {
  current: TabId;
}

/** The bottom navigation bar. Each tab is a plain link, so it works with the keyboard and screen readers. */
export function TabBar({ current }: TabBarProps) {
  return (
    <nav class="tabbar" aria-label="Main">
      <ul>
        {TABS.map((tab) => (
          <li key={tab.id}>
            <a href={hashForTab(tab.id)} aria-current={tab.id === current ? "page" : undefined}>
              <TabIcon id={tab.id} />
              <span>{tab.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
