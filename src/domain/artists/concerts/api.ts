import type { ArtistId } from "@/domain/artists/types"
import { concerts } from "@/domain/artists/concerts/data"
import type { Concert } from "@/domain/artists/concerts/types"

export type {
  Concert,
  RecordingSource,
  SetlistEntry,
  Venue,
} from "@/domain/artists/concerts/types"

export function listConcerts(): readonly Concert[] {
  return concerts
}

export function getFeaturedConcert(): Concert {
  const featuredConcert = concerts.find((concert) => concert.featured)

  if (!featuredConcert) {
    throw new Error("Openstage requires one featured concert")
  }

  return featuredConcert
}

export function getConcertById(id: string): Concert | undefined {
  return concerts.find((concert) => concert.id === id)
}

export function getConcertsByArtistId(artistId: ArtistId): readonly Concert[] {
  return concerts.filter((concert) => concert.artistId === artistId)
}
