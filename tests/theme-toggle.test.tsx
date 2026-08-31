import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ThemeToggle } from "@/lib/ui/theme-toggle"
import { THEME_STORAGE_KEY } from "@/lib/theme"

describe("ThemeToggle", () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.dataset.theme = ""
    document.documentElement.style.colorScheme = ""
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", "#09090b")
  })

  it("renders a button with an accessible label and an initial light-mode label when stored theme is light", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light")
    render(<ThemeToggle />)

    const button = screen.getByRole("button", { name: "Switch to dark theme" })
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("renders a dark-to-light label when no stored preference exists", () => {
    render(<ThemeToggle />)

    const button = screen.getByRole("button", { name: "Switch to light theme" })
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("cycles to light, persists the choice, and updates the document root", () => {
    render(<ThemeToggle />)
    const button = screen.getByRole("button", { name: "Switch to light theme" })

    fireEvent.click(button)

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument()
  })

  it("cycles back to dark after the user has switched to light", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light")
    render(<ThemeToggle />)

    const button = screen.getByRole("button", { name: "Switch to dark theme" })
    fireEvent.click(button)

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument()
  })

  it("stays in sync when another toggle on the page changes the theme", () => {
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    )
    const [first, second] = screen.getAllByRole("button", { name: "Switch to light theme" })

    fireEvent.click(first)

    expect(second).toHaveAccessibleName("Switch to dark theme")
    expect(second).toHaveAttribute("aria-pressed", "true")
  })
})