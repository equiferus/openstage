import type { ArtistId } from "@/domain/artists/types"
import { listArtists } from "@/domain/artists/api"
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

export function getPrimaryConcertByArtistId(artistId: ArtistId): Concert | undefined {
  const artistConcerts = getConcertsByArtistId(artistId)
  return artistConcerts.find((concert) => concert.featured) ?? artistConcerts[0]
}

export function listConcertSuggestions(artistId: ArtistId, limit = 10): readonly Concert[] {
  const concertGroups = listArtists()
    .filter((artist) => artist.id !== artistId)
    .map((artist) => getConcertsByArtistId(artist.id))
  const suggestions: Concert[] = []

  for (let index = 0; suggestions.length < limit; index += 1) {
    let addedConcert = false

    for (const group of concertGroups) {
      const concert = group[index]
      if (concert) {
        suggestions.push(concert)
        addedConcert = true
      }

      if (suggestions.length === limit) {
        break
      }
    }

    if (!addedConcert) {
      break
    }
  }

  return suggestions
}

export function listOtherConcertsByArtistId(
  artistId: ArtistId,
  excludedConcertId: string,
  limit = 10,
): readonly Concert[] {
  return getConcertsByArtistId(artistId)
    .filter((concert) => concert.id !== excludedConcertId)
    .slice(0, limit)
}
