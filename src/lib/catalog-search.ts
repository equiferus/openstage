import type { Artist, ArtistId } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"

export type CatalogSearchKind = "artist" | "concert"

export interface CatalogSearchRow {
  id: string
  kind: CatalogSearchKind
  artistId: ArtistId
  artistName: string
  title: string
  context: string
  searchText: string
  concertId?: string
}

export function createCatalogSearchRows(
  artists: readonly Artist[],
  concerts: readonly Concert[],
): readonly CatalogSearchRow[] {
  return artists.flatMap((artist) => {
    const artistRow: CatalogSearchRow = {
      id: `artist-${artist.id}`,
      kind: "artist",
      artistId: artist.id,
      artistName: artist.name,
      title: artist.name,
      context: artist.origin,
      searchText: [artist.name, artist.origin, artist.summary].join(" "),
    }
    const concertRows = concerts
      .filter((concert) => concert.artistId === artist.id)
      .map<CatalogSearchRow>((concert) => ({
        id: `concert-${concert.id}`,
        kind: "concert",
        artistId: artist.id,
        artistName: artist.name,
        title: concert.title,
        context: [concert.eventName, concert.dateLabel, concert.venue.name, concert.venue.city, concert.venue.country].join(" · "),
        searchText: [
          artist.name,
          concert.title,
          concert.eventName,
          concert.dateLabel,
          concert.recordedOn,
          concert.venue.name,
          concert.venue.city,
          concert.venue.region,
          concert.venue.country,
          concert.description,
        ]
          .filter(Boolean)
          .join(" "),
        concertId: concert.id,
      }))

    return [artistRow, ...concertRows]
  })
}
