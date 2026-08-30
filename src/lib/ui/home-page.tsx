import { useRef, useState } from "react"
import { ExternalLink, MapPin, VolumeX } from "lucide-react"

import { getArtistById } from "@/domain/artists/api"
import type { Concert, SetlistEntry } from "@/domain/artists/concerts/api"
import { listConcertSuggestions, listOtherConcertsByArtistId } from "@/domain/artists/concerts/api"
import { getYouTubeUrlAtTime } from "@/lib/youtube"
import { Badge } from "@/lib/ui/primitives/badge"
import { Button } from "@/lib/ui/primitives/button"
import { ConcertCarousel } from "@/lib/ui/concert-carousel"
import { ConcertMeta } from "@/lib/ui/concert-meta"
import { Setlist } from "@/lib/ui/setlist"
import { VideoPlayer } from "@/lib/ui/video-player"

interface HomePageProps {
  concert: Concert
  onSelectConcert: (concert: Concert) => void
}

function originalUrlAtTime(concert: Concert, startAtSeconds?: number): string {
  return concert.source.platform === "youtube"
    ? getYouTubeUrlAtTime(concert.source.originalUrl, startAtSeconds)
    : concert.source.originalUrl
}

export function HomePage({ concert, onSelectConcert }: HomePageProps) {
  const artist = getArtistById(concert.artistId)
  const [startAtSeconds, setStartAtSeconds] = useState<number | undefined>()
  const playerRef = useRef<HTMLDivElement>(null)
  const recommendations = listConcertSuggestions(concert.artistId, 10)
  const moreFromArtist = listOtherConcertsByArtistId(concert.artistId, concert.id, 10)
  const hasSetlist = Boolean(concert.setlist?.length)

  function playSetlistEntry(entry: SetlistEntry) {
    setStartAtSeconds(entry.startAtSeconds)
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <section className="relative overflow-clip border-b border-white/8">
      <div className="absolute top-0 right-0 -z-10 size-[36rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="mx-auto grid max-w-[100rem] grid-cols-[minmax(0,1fr)] gap-x-6 px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16 xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div
          className={`mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end ${
            hasSetlist ? "xl:col-start-2" : "xl:col-[1/3]"
          }`}
        >
          <div>
            <Badge className="mb-5 border-amber-300/20 bg-amber-400/10 text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgb(252_211_77_/_0.6)]" />
              Now on stage
            </Badge>
            <p className="text-sm font-semibold text-amber-300">{artist?.name}</p>
            <h1 className="mt-2 max-w-4xl text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-white sm:text-6xl">
              {concert.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">{concert.eventName}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 lg:pb-2">
            <VolumeX className="size-4 text-amber-400" aria-hidden="true" />
            Playback starts muted. Turn it up when you're ready.
          </div>
        </div>

        <div
          ref={playerRef}
          id="concert-player"
          className={`scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-black/50 p-1.5 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-2 xl:row-start-2 ${
            hasSetlist ? "xl:col-start-2" : "xl:col-[1/3]"
          }`}
        >
          <VideoPlayer
            source={concert.source}
            title={concert.title}
            startAtSeconds={startAtSeconds}
            autoplay
            muted
          />
        </div>

        {concert.setlist?.length ? (
          <aside
            className="mt-6 self-start rounded-2xl border border-white/8 bg-white/[0.025] xl:sticky xl:top-24 xl:col-start-1 xl:row-start-2 xl:row-span-2 xl:mt-0 xl:self-stretch xl:overflow-hidden"
            aria-label="Concert setlist"
          >
            <div className="p-4 xl:absolute xl:inset-0 xl:overflow-hidden">
              <Setlist entries={concert.setlist} onSelect={playSetlistEntry} />
            </div>
          </aside>
        ) : null}

        <div
          className={`mt-6 grid min-w-0 gap-6 xl:row-start-3 xl:grid-cols-[minmax(0,1fr)_18rem] ${
            hasSetlist ? "xl:col-start-2" : "xl:col-[1/3]"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">{concert.description}</p>
            <Button variant="outline" asChild className="shrink-0">
              <a href={originalUrlAtTime(concert, startAtSeconds)} target="_blank" rel="noreferrer">
                Watch original <ExternalLink />
              </a>
            </Button>
          </div>

          <aside className="rounded-2xl border border-white/8 bg-white/[0.025] p-5" aria-label="Concert details">
            <ConcertMeta concert={concert} />
            <div className="mt-4 flex items-start gap-2 text-sm text-zinc-500">
              <MapPin className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>{concert.venue.name}</span>
            </div>
            {concert.recordingNote ? (
              <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-5 text-zinc-600">Recording note: {concert.recordingNote}</p>
            ) : null}
          </aside>
        </div>

        <div
          className={`space-y-16 py-16 sm:py-20 xl:row-start-4 ${
            hasSetlist ? "xl:col-start-2" : "xl:col-[1/3]"
          }`}
        >
          <ConcertCarousel
            title="Recommended concerts"
            description="Explore performances from across the rest of the Openstage collection."
            concerts={recommendations}
            onSelectConcert={onSelectConcert}
          />

          {moreFromArtist.length ? (
            <ConcertCarousel
              title={`More from ${artist?.name ?? "this artist"}`}
              description="Keep listening with another recording from the same artist."
              concerts={moreFromArtist}
              onSelectConcert={onSelectConcert}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
