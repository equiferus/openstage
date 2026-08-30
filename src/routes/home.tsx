import { useEffect } from "react"

import { HomePage } from "@/lib/ui/home-page"

interface HomeRouteProps {
  browse?: boolean
}

export function HomeRoute({ browse = false }: HomeRouteProps) {
  useEffect(() => {
    if (browse) {
      document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [browse])

  return <HomePage />
}
