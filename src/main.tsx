import { render } from "preact";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";

// Register the service worker so the app installs and works offline.
// New versions activate on the next launch.
registerSW({ immediate: true });

render(<App />, document.getElementById("app")!);
