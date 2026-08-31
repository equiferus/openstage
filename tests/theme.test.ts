import { afterEach, describe, expect, it, vi } from "vitest"

import {
  applyTheme,
  DEFAULT_THEME,
  getPreferredTheme,
  getStoredTheme,
  persistTheme,
  THEME_STORAGE_KEY,
  THEME_TOKENS,
  toggleTheme,
} from "@/lib/theme"

function setMatchMedia(theme: "light" | "dark" | null) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: theme === "light" && query === "(prefers-color-scheme: light)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("theme module", () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.dataset.theme = ""
    document.documentElement.style.colorScheme = ""
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", "#09090b")
    setMatchMedia(null)
  })

  it("uses the documented storage key and defaults", () => {
    expect(THEME_STORAGE_KEY).toBe("openstage:theme")
    expect(DEFAULT_THEME).toBe("dark")
    expect(THEME_TOKENS.dark).toBe("#09090b")
    expect(THEME_TOKENS.light).toBe("#fafaf9")
  })

  it("toggles between themes", () => {
    expect(toggleTheme("dark")).toBe("light")
    expect(toggleTheme("light")).toBe("dark")
  })

  it("returns undefined when localStorage has no stored preference", () => {
    expect(getStoredTheme()).toBeUndefined()
  })

  it("ignores invalid stored values", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "blue")
    expect(getStoredTheme()).toBeUndefined()
  })

  it("falls back to prefers-color-scheme: light when no stored choice exists", () => {
    setMatchMedia("light")
    expect(getPreferredTheme()).toBe("light")
  })

  it("falls back to dark when prefers-color-scheme is dark or unavailable", () => {
    setMatchMedia("dark")
    expect(getPreferredTheme()).toBe("dark")
    setMatchMedia(null)
    expect(getPreferredTheme()).toBe("dark")
  })

  it("prefers a stored choice over system preference", () => {
    setMatchMedia("light")
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
    expect(getPreferredTheme()).toBe("dark")
  })

  it("persists theme choices under the versioned key", () => {
    persistTheme("light")
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    persistTheme("dark")
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
  })

  it("applies the chosen theme to the document root, color-scheme, and theme-color meta", () => {
    applyTheme("light")
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(document.documentElement.style.colorScheme).toBe("light")
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(THEME_TOKENS.light)

    applyTheme("dark")
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(THEME_TOKENS.dark)
  })
})