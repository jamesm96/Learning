import { updateSettings, type Settings } from "../../progress/progress";
import { updateProgress, useProgress } from "../../progress/store";

const THEMES: { value: Settings["theme"]; label: string }[] = [
  { value: "system", label: "Same as the phone" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Settings: the colour theme and the vibration after answers. */
export function SettingsPanel() {
  const { settings } = useProgress();
  const canVibrate = typeof navigator.vibrate === "function";

  return (
    <section class="panel" aria-labelledby="settings-heading">
      <h2 id="settings-heading">Settings</h2>
      <fieldset class="blank-choices">
        <legend>Theme</legend>
        <div class="chips">
          {THEMES.map((theme) => (
            <label key={theme.value} class="chip radio-chip">
              <input
                type="radio"
                name="theme"
                value={theme.value}
                checked={settings.theme === theme.value}
                onChange={() => updateProgress((p) => updateSettings(p, { theme: theme.value }))}
              />
              {theme.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label class="check-row">
        <input
          type="checkbox"
          checked={settings.haptics}
          onChange={(event) => updateProgress((p) => updateSettings(p, { haptics: event.currentTarget.checked }))}
        />
        <span>
          Vibrate after answers
          {!canVibrate && <span class="run-note"> (this device or browser does not support it; iPhones do not)</span>}
        </span>
      </label>
    </section>
  );
}
