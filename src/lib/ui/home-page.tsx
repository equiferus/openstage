import { ArrowRight, ExternalLink, Headphones, MapPin, VolumeX } from "lucide-react"

import type { Artist } from "@/domain/artists/api"
import { getArtistBySlug, listArtists } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"
import { getConcertsByArtistId, getFeaturedConcert } from "@/domain/artists/concerts/api"
import { getVenueLabel } from "@/lib/concert"
import { getYouTubeThumbnailUrl } from "@/lib/youtube"
import { Badge } from "@/lib/ui/primitives/badge"
import { Button } from "@/lib/ui/primitives/button"
import { Card } from "@/lib/ui/primitives/card"
import { ConcertMeta } from "@/lib/ui/concert-meta"
import { VideoPlayer } from "@/lib/ui/video-player"

function ArtistCard({ artist, concerts, rank }: { artist: Artist; concerts: readonly Concert[]; rank: number }) {
  const primaryConcert = concerts.find((concert) => concert.featured) ?? concerts[0]
  const thumbnail =
    primaryConcert.source.platform === "youtube"
      ? getYouTubeThumbnailUrl(primaryConcert.source.videoId)
      : primaryConcert.source.thumbnailUrl

  return (
    <a
      href={`#/artists/${artist.slug}`}
      className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
      aria-label={`View ${artist.name} recordings`}
    >
      <Card className="h-full overflow-hidden transition duration-300 group-hover:-translate-y-1 group-hover:border-amber-300/30 group-hover:bg-zinc-900">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
          {thumbnail ? (
            <img
              className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
              src={thumbnail}
              alt=""
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          <span className="absolute top-4 left-4 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-xs font-bold text-white backdrop-blur">
            {String(rank).padStart(2, "0")}
          </span>
          <span className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur">
            {concerts.length} {concerts.length === 1 ? "recording" : "recordings"}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">{artist.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{primaryConcert.title}</p>
            </div>
            <ArrowRight className="mt-1 size-5 shrink-0 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-amber-300" aria-hidden="true" />
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
            <MapPin className="size-3.5 text-amber-400" aria-hidden="true" />
            <span className="truncate">{getVenueLabel(primaryConcert)}</span>
          </div>
        </div>
      </Card>
    </a>
  )
}

export function HomePage() {
  const artists = listArtists()
  const featuredConcert = getFeaturedConcert()
  const featuredArtist = getArtistBySlug(featuredConcert.artistId)

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute top-0 right-0 -z-10 size-[36rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mb-8 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <Badge className="mb-5 border-amber-300/20 bg-amber-400/10 text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgb(252_211_77_/_0.6)]" />
                Featured performance
              </Badge>
              <h1 className="max-w-4xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                David Guetta turns the desert into a stage.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                The Monolith at AlUla opens Openstage: a hand-picked home for full concert films, the places behind them, and every track along the way.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 lg:pb-2">
              <VolumeX className="size-4 text-amber-400" aria-hidden="true" />
              Starts muted. Turn it up when you're ready.
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-black/50 p-1.5 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:p-2">
            <VideoPlayer source={featuredConcert.source} title={featuredConcert.title} autoplay muted />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-amber-300">{featuredArtist?.name}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{featuredConcert.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{featuredConcert.description}</p>
              <div className="mt-5">
                <ConcertMeta concert={featuredConcert} compact />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <a href={`#/artists/${featuredArtist?.slug}`}>Explore the setlist <Headphones /></a>
              </Button>
              <Button variant="outline" asChild>
                <a href={featuredConcert.source.originalUrl} target="_blank" rel="noreferrer">Watch original <ExternalLink /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="browse" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-amber-400 uppercase">The opening collection</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Concert films worth pressing play on.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500">Selected for the sound, the setting, and the feeling that you were there.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} concerts={getConcertsByArtistId(artist.id)} rank={index + 1} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
