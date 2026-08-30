import type { Concert } from "@/domain/artists/concerts/api"

export function getVenueLabel(concert: Concert): string {
  return [concert.venue.city, concert.venue.region, concert.venue.country].filter(Boolean).join(", ")
}
