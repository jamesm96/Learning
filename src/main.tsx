import { render } from "preact";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app";
import { initProgress } from "./progress/store";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/content.css";
import "./styles/lesson.css";
import "./styles/code.css";
import "./styles/exercises.css";

// Register the service worker so the app installs and works offline.
// New versions activate on the next launch.
registerSW({ immediate: true });

// Load saved progress first, so the first screen already shows it.
await initProgress();
render(<App />, document.getElementById("app")!);
