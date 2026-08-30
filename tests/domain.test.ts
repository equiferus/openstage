import { describe, expect, it } from "vitest"

import { getArtistBySlug, listArtists } from "@/domain/artists/api"
import {
  getConcertById,
  getConcertsByArtistId,
  getFeaturedConcert,
  listConcerts,
} from "@/domain/artists/concerts/api"

describe("curated catalog", () => {
  it("exposes the expected artists in homepage order", () => {
    const artists = listArtists()

    expect(artists).toHaveLength(6)
    expect(artists.map((artist) => artist.name)).toEqual([
      "David Guetta",
      "Hans Zimmer",
      "RÜFÜS DU SOL",
      "Fred again..",
      "ODESZA",
      "Armin van Buuren",
    ])
    expect(artists.map((artist) => artist.homeRank)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("contains eight valid recordings and one featured performance", () => {
    const artists = listArtists()
    const concerts = listConcerts()

    expect(concerts).toHaveLength(8)
    expect(new Set(concerts.map((concert) => concert.id)).size).toBe(concerts.length)
    expect(concerts.filter((concert) => concert.featured)).toHaveLength(1)
    expect(getFeaturedConcert().id).toBe("david-guetta-monolith-alula")

    for (const concert of concerts) {
      expect(artists.some((artist) => artist.id === concert.artistId)).toBe(true)
      expect(concert.source.originalUrl).toMatch(/^https:\/\//)
      expect(concert.durationSeconds).toBeGreaterThan(0)
      expect(concert.setlist?.length).toBeGreaterThan(0)
      for (const entry of concert.setlist ?? []) {
        if (entry.startAtSeconds !== undefined) {
          expect(entry.startAtSeconds).toBeGreaterThanOrEqual(0)
          expect(entry.startAtSeconds).toBeLessThan(concert.durationSeconds)
        }
      }
    }
  })

  it("queries artists and concerts without exposing data mutations", () => {
    const david = getArtistBySlug("david-guetta")

    expect(david?.name).toBe("David Guetta")
    expect(david && getConcertsByArtistId(david.id)).toHaveLength(3)
    expect(getConcertById("rufus-du-sol-live-joshua-tree")?.venue.city).toBe("Joshua Tree")
    expect(getConcertsByArtistId("hans-zimmer")).toHaveLength(1)
    expect(getArtistBySlug("missing")).toBeUndefined()
  })
})
