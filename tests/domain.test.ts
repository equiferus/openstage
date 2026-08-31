import { describe, expect, it } from "vitest"

import { getArtistById, getArtistBySlug, listArtists } from "@/domain/artists/api"
import {
  getConcertById,
  getConcertsByArtistId,
  getFeaturedConcert,
  getPrimaryConcertByArtistId,
  listConcerts,
  listConcertSuggestions,
  listOtherConcertsByArtistId,
} from "@/domain/artists/concerts/api"
import { createCatalogSearchRows } from "@/lib/catalog-search"

describe("curated catalog", () => {
  it("exposes the expected artists in homepage order", () => {
    const artists = listArtists()

    expect(artists).toHaveLength(7)
    expect(artists.map((artist) => artist.name)).toEqual([
      "David Guetta",
      "Hans Zimmer",
      "RÜFÜS DU SOL",
      "Fred again..",
      "ODESZA",
      "Armin van Buuren",
      "DJ M-Zone",
    ])
    expect(artists.map((artist) => artist.homeRank)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("contains nine valid recordings and one featured performance", () => {
    const artists = listArtists()
    const concerts = listConcerts()

    expect(concerts).toHaveLength(9)
    expect(new Set(concerts.map((concert) => concert.id)).size).toBe(concerts.length)
    expect(concerts.filter((concert) => concert.featured)).toHaveLength(1)
    expect(getFeaturedConcert().id).toBe("david-guetta-monolith-alula")

    for (const concert of concerts) {
      expect(artists.some((artist) => artist.id === concert.artistId)).toBe(true)
      expect(concert.source.originalUrl).toMatch(/^https:\/\//)
      expect(concert.durationSeconds).toBeGreaterThan(0)
      if (concert.setlist) {
        expect(concert.setlist.length).toBeGreaterThan(0)
      }
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
    expect(getConcertsByArtistId("dj-m-zone")).toHaveLength(1)
    expect(getConcertById("dj-m-zone-doncaster-warehouse-1992")?.durationSeconds).toBe(9282)
    expect(getArtistById("hans-zimmer")?.name).toBe("Hans Zimmer")
    expect(getArtistBySlug("missing")).toBeUndefined()
  })

  it("builds deterministic recommendation rails", () => {
    expect(listConcertSuggestions("david-guetta").map((concert) => concert.artistId)).toEqual([
      "hans-zimmer",
      "rufus-du-sol",
      "fred-again",
      "odesza",
      "armin-van-buuren",
      "dj-m-zone",
    ])
    expect(listConcertSuggestions("hans-zimmer").map((concert) => concert.id)).toEqual([
      "david-guetta-monolith-alula",
      "rufus-du-sol-live-joshua-tree",
      "fred-again-fuji-rock-2025",
      "odesza-finale-gorge",
      "armin-van-buuren-best-of-armin-only",
      "dj-m-zone-doncaster-warehouse-1992",
      "david-guetta-nye-louvre-abu-dhabi",
      "david-guetta-united-at-home-dubai",
    ])
    expect(listConcertSuggestions("hans-zimmer", 3)).toHaveLength(3)
    expect(listOtherConcertsByArtistId("david-guetta", "david-guetta-monolith-alula")).toHaveLength(2)
    expect(listOtherConcertsByArtistId("rufus-du-sol", "rufus-du-sol-live-joshua-tree")).toHaveLength(0)
    expect(getPrimaryConcertByArtistId("david-guetta")?.featured).toBe(true)
  })

  it("creates searchable artist and concert rows", () => {
    const rows = createCatalogSearchRows(listArtists(), listConcerts())

    expect(rows).toHaveLength(16)
    expect(rows.filter((row) => row.kind === "artist")).toHaveLength(7)
    expect(rows.find((row) => row.concertId === "rufus-du-sol-live-joshua-tree")?.searchText).toContain("Joshua Tree")
  })
})
