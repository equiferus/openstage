import { useEffect, useState } from "react"

import { getArtistBySlug } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"
import { getConcertById, getFeaturedConcert, getPrimaryConcertByArtistId } from "@/domain/artists/concerts/api"
import { SiteShell } from "@/lib/ui/site-shell"
import { HomeRoute } from "@/routes/home"

interface HashResolution {
  concert: Concert
  normalizedHash?: string
}

function concertHash(concert: Concert): string {
  return `#/?concert=${encodeURIComponent(concert.id)}`
}

function resolveHash(hash = window.location.hash): HashResolution {
  const featuredConcert = getFeaturedConcert()
  const hashValue = hash.replace(/^#/, "") || "/"
  const [rawPath, rawQuery = ""] = hashValue.split("?", 2)
  const path = rawPath.replace(/\/+$/, "") || "/"

  if (path === "/browse") {
    return { concert: featuredConcert, normalizedHash: "#/" }
  }

  const artistMatch = path.match(/^\/artists\/([^/]+)$/)
  if (artistMatch) {
    let artistSlug = artistMatch[1]
    try {
      artistSlug = decodeURIComponent(artistSlug)
    } catch {
      return { concert: featuredConcert, normalizedHash: "#/" }
    }

    const artist = getArtistBySlug(artistSlug)
    const concert = artist ? getPrimaryConcertByArtistId(artist.id) : undefined
    return concert
      ? { concert, normalizedHash: concertHash(concert) }
      : { concert: featuredConcert, normalizedHash: "#/" }
  }

  if (path !== "/") {
    return { concert: featuredConcert, normalizedHash: "#/" }
  }

  const concertId = new URLSearchParams(rawQuery).get("concert")
  if (!concertId) {
    return { concert: featuredConcert }
  }

  const concert = getConcertById(concertId)
  return concert
    ? { concert }
    : { concert: featuredConcert, normalizedHash: "#/" }
}

export function Routes() {
  const [selectedConcertId, setSelectedConcertId] = useState(() => resolveHash().concert.id)
  const selectedConcert = getConcertById(selectedConcertId) ?? getFeaturedConcert()

  useEffect(() => {
    function syncFromLocation() {
      const resolution = resolveHash()
      setSelectedConcertId(resolution.concert.id)

      if (resolution.normalizedHash && window.location.hash !== resolution.normalizedHash) {
        window.history.replaceState(null, "", resolution.normalizedHash)
      }
    }

    syncFromLocation()
    window.addEventListener("hashchange", syncFromLocation)
    window.addEventListener("popstate", syncFromLocation)

    return () => {
      window.removeEventListener("hashchange", syncFromLocation)
      window.removeEventListener("popstate", syncFromLocation)
    }
  }, [])

  function selectConcert(concert: Concert) {
    setSelectedConcertId(concert.id)

    const nextHash = concertHash(concert)
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash)
    }

    window.requestAnimationFrame(() => {
      document.getElementById("concert-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  return (
    <SiteShell onSelectConcert={selectConcert}>
      <HomeRoute key={selectedConcert.id} concert={selectedConcert} onSelectConcert={selectConcert} />
    </SiteShell>
  )
}
