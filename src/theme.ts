export type Theme = "light" | "dark";

const storageKey = "folio.theme";

export function getInitialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Browsers with disabled storage can still use the theme for this visit.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Keep the current theme even when storage is unavailable.
  }
}
