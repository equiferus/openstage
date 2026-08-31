import { useCallback, useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/lib/ui/primitives/button"
import {
  applyTheme,
  getPreferredTheme,
  persistTheme,
  THEME_CHANGE_EVENT,
  toggleTheme,
  type Theme,
} from "@/lib/theme"

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

function readInitialTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "light") {
    return "light"
  }
  return getPreferredTheme()
}

export function ThemeToggle({ variant = "ghost", size = "icon", className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const detail = (event as CustomEvent<Theme>).detail
      if (detail === "dark" || detail === "light") {
        setTheme(detail)
      }
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  }, [])

  const handleToggle = useCallback(() => {
    setTheme((current) => {
      const next = toggleTheme(current)
      applyTheme(next)
      persistTheme(next)
      return next
    })
  }, [])

  const isLight = theme === "light"
  const label = isLight ? "Switch to dark theme" : "Switch to light theme"

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleToggle}
      aria-label={label}
      aria-pressed={isLight}
      title={label}
    >
      {isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  )
}