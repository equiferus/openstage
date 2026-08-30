import type { Artist } from "@/domain/artists/types"

export const artists = [
  {
    id: "david-guetta",
    slug: "david-guetta",
    name: "David Guetta",
    summary:
      "A global dance-music force whose landmark broadcasts turn extraordinary places into luminous stages.",
    origin: "Paris, France",
    homeRank: 1,
  },
  {
    id: "hans-zimmer",
    slug: "hans-zimmer",
    name: "Hans Zimmer",
    summary:
      "A film composer who brings some of cinema's most recognisable scores to life with orchestra, band, choir, and soloists.",
    origin: "Frankfurt, Germany",
    homeRank: 2,
  },
  {
    id: "rufus-du-sol",
    slug: "rufus-du-sol",
    name: "RÜFÜS DU SOL",
    summary:
      "An Australian electronic trio pairing widescreen production with intimate, slow-burning live performances.",
    origin: "Sydney, Australia",
    homeRank: 3,
  },
  {
    id: "fred-again",
    slug: "fred-again",
    name: "Fred again..",
    summary:
      "A London producer and performer who transforms field recordings, pop fragments, and club energy into communal live sets.",
    origin: "London, United Kingdom",
    homeRank: 4,
  },
  {
    id: "odesza",
    slug: "odesza",
    name: "ODESZA",
    summary:
      "An electronic duo known for cinematic arrangements, a live drumline, and meticulously staged audiovisual finales.",
    origin: "Bellingham, Washington, USA",
    homeRank: 5,
  },
  {
    id: "armin-van-buuren",
    slug: "armin-van-buuren",
    name: "Armin van Buuren",
    summary:
      "A Dutch trance pioneer whose marathon arena shows trace decades of euphoric dance music.",
    origin: "Leiden, Netherlands",
    homeRank: 6,
  },
] as const satisfies readonly Artist[]
