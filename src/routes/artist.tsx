import { useEffect } from "react"

import { getArtistBySlug } from "@/domain/artists/api"
import { getConcertsByArtistId } from "@/domain/artists/concerts/api"
import { ArtistPage } from "@/lib/ui/artist-page"
import { NotFoundPage } from "@/lib/ui/not-found-page"

interface ArtistRouteProps {
  slug: string
}

export function ArtistRoute({ slug }: ArtistRouteProps) {
  const artist = getArtistBySlug(slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [slug])

  if (!artist) {
    return <NotFoundPage />
  }

  return <ArtistPage key={artist.id} artist={artist} concerts={getConcertsByArtistId(artist.id)} />
}
