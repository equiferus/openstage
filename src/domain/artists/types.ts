export type ArtistId =
  | "david-guetta"
  | "hans-zimmer"
  | "rufus-du-sol"
  | "fred-again"
  | "odesza"
  | "armin-van-buuren"

export interface Artist {
  id: ArtistId
  slug: string
  name: string
  summary: string
  origin: string
  homeRank: number
}
