export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const storageKey = "folio.theme.preference";
const systemQuery = "(prefers-color-scheme: dark)";

export function getThemePreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // A disabled storage API still allows the system preference to work.
  }
  return "system";
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return window.matchMedia(systemQuery).matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setThemePreference(preference: ThemePreference): Theme {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, preference);
    }
  } catch {
    // Apply the choice for this visit even when storage is unavailable.
  }
  const theme = resolveTheme(preference);
  applyTheme(theme);
  return theme;
}

export function watchSystemTheme(onChange: (theme: Theme) => void) {
  const query = window.matchMedia(systemQuery);
  const listener = () => onChange(query.matches ? "dark" : "light");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
