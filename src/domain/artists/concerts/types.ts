import type { ArtistId } from "@/domain/artists/types"

export interface Venue {
  name: string
  city: string
  region?: string
  country: string
}

export interface SetlistEntry {
  title: string
  startAtSeconds?: number
  note?: string
}

export type RecordingSource =
  | {
      platform: "youtube"
      videoId: string
      originalUrl: string
      uploader: string
    }
  | {
      platform: "external"
      provider: string
      originalUrl: string
      embedUrl?: string
      thumbnailUrl?: string
      uploader?: string
    }

export interface Concert {
  id: string
  artistId: ArtistId
  title: string
  eventName: string
  recordedOn: string
  dateLabel: string
  venue: Venue
  durationSeconds: number
  source: RecordingSource
  description: string
  recordingNote?: string
  featured?: boolean
  setlist?: readonly SetlistEntry[]
}
