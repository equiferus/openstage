import { artists } from "@/domain/artists/data"
import type { Artist } from "@/domain/artists/types"

export type { Artist, ArtistId } from "@/domain/artists/types"

export function listArtists(): readonly Artist[] {
  return artists
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((artist) => artist.slug === slug)
}
