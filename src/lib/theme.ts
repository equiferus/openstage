export type Theme = "dark" | "light"

export const THEME_STORAGE_KEY = "openstage:theme"
export const THEME_CHANGE_EVENT = "openstage:theme-change"
export const DEFAULT_THEME: Theme = "dark"
export const THEME_TOKENS: Record<Theme, string> = {
  dark: "#09090b",
  light: "#fafaf9",
}

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light"
}

export function getStoredTheme(): Theme | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  }
  return DEFAULT_THEME
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", THEME_TOKENS[theme])
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }))
  }
}

export function persistTheme(theme: Theme): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable (private mode, disabled cookies, etc.); ignore.
  }
}

export function toggleTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark"
}