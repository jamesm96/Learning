import { useEffect, useState } from "preact/hooks";
import { findLesson, findModule } from "./content/course";
import { parseRoute, type Route } from "./routes";
import { TabBar } from "./components/TabBar";
import { KeyboardBar } from "./editor/KeyboardBar";
import { LessonPlayer } from "./lesson/LessonPlayer";
import { TodayScreen } from "./screens/Today";
import { LearnScreen } from "./screens/Learn";
import { ModuleScreen } from "./screens/ModuleScreen";
import { PracticeScreen } from "./screens/Practice";
import { MeScreen } from "./screens/Me";

/** Keep the route in sync with the URL hash, so Back and reload work. */
function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** The app shell: the current screen above a bottom tab bar. Lessons take the whole screen. */
export function App() {
  const route = useRoute();
  const module = route.moduleId ? findModule(route.moduleId) : undefined;
  const lesson = module && route.lessonId ? findLesson(module, route.lessonId) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.tab, route.moduleId, route.lessonId]);

  if (module && lesson) {
    // The key makes a fresh player for each lesson, so one lesson's step never leaks into the next.
    return (
      <main class="screen screen-lesson" id="main">
        <LessonPlayer key={lesson.id} module={module} lesson={lesson} />
        <KeyboardBar />
      </main>
    );
  }

  return (
    <div class="shell">
      <main class="screen" id="main">
        {route.tab === "today" && <TodayScreen />}
        {route.tab === "learn" && (module ? <ModuleScreen module={module} /> : <LearnScreen />)}
        {route.tab === "practice" && <PracticeScreen />}
        {route.tab === "me" && <MeScreen />}
      </main>
      <TabBar current={route.tab} />
      <KeyboardBar />
    </div>
  );
}
