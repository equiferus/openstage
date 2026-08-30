import { useEffect } from "react"

import { NotFoundPage } from "@/lib/ui/not-found-page"

export function NotFoundRoute() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  return <NotFoundPage />
}
