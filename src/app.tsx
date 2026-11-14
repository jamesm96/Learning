import { useEffect, useState } from "preact/hooks";
import { tabFromHash, type TabId } from "./tabs";
import { TabBar } from "./components/TabBar";
import { TodayScreen } from "./screens/Today";
import { LearnScreen } from "./screens/Learn";
import { PracticeScreen } from "./screens/Practice";
import { MeScreen } from "./screens/Me";

/** Keep the current tab in sync with the URL hash, so Back and reload work. */
function useCurrentTab(): TabId {
  const [tab, setTab] = useState<TabId>(() => tabFromHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return tab;
}

/** The app shell: the current screen above a bottom tab bar. */
export function App() {
  const tab = useCurrentTab();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <div class="shell">
      <main class="screen" id="main">
        {tab === "today" && <TodayScreen />}
        {tab === "learn" && <LearnScreen />}
        {tab === "practice" && <PracticeScreen />}
        {tab === "me" && <MeScreen />}
      </main>
      <TabBar current={tab} />
    </div>
  );
}
