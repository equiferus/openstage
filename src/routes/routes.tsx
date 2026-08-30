import { useEffect, useState } from "react"

import { SiteShell } from "@/lib/ui/site-shell"
import { ArtistRoute } from "@/routes/artist"
import { HomeRoute } from "@/routes/home"
import { NotFoundRoute } from "@/routes/not-found"

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, "")
  return (hash || "/").split("?")[0].replace(/\/+$/, "") || "/"
}

function useHashPath(): string {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onHashChange = () => setPath(currentPath())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  return path
}

export function Routes() {
  const path = useHashPath()
  const artistMatch = path.match(/^\/artists\/([^/]+)$/)

  let route = <NotFoundRoute />

  if (path === "/") {
    route = <HomeRoute />
  } else if (path === "/browse") {
    route = <HomeRoute browse />
  } else if (artistMatch) {
    route = <ArtistRoute slug={decodeURIComponent(artistMatch[1])} />
  }

  return <SiteShell>{route}</SiteShell>
}
