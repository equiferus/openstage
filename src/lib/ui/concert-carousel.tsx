import { MapPin, Play } from "lucide-react"

import { getArtistById } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"
import { getVenueLabel } from "@/lib/concert"
import { formatDuration } from "@/lib/utils"
import { getYouTubeThumbnailUrl } from "@/lib/youtube"
import { Card } from "@/lib/ui/primitives/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/lib/ui/primitives/carousel"

interface ConcertCarouselProps {
  title: string
  description: string
  concerts: readonly Concert[]
  onSelectConcert: (concert: Concert) => void
}

function ConcertCard({ concert, onSelect }: { concert: Concert; onSelect: () => void }) {
  const artist = getArtistById(concert.artistId)
  const thumbnail = concert.source.platform === "youtube"
    ? getYouTubeThumbnailUrl(concert.source.videoId)
    : concert.source.thumbnailUrl

  return (
    <button
      type="button"
      className="group block h-full w-full rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
      onClick={onSelect}
      aria-label={`Play ${concert.title} by ${artist?.name ?? "artist"}`}
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
          <span className="absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition group-hover:scale-105 group-hover:bg-amber-400 group-hover:text-zinc-950">
            <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold text-amber-300">{artist?.name}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold tracking-tight text-white">{concert.title}</h3>
          <p className="mt-2 truncate text-xs text-zinc-600">{concert.eventName}</p>
          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate">{getVenueLabel(concert)}</span>
            </span>
            <span className="shrink-0">{formatDuration(concert.durationSeconds)}</span>
          </div>
        </div>
      </Card>
    </button>
  )
}

export function ConcertCarousel({ title, description, concerts, onSelectConcert }: ConcertCarouselProps) {
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`

  return (
    <section aria-labelledby={titleId}>
      <div className="mb-7 pr-24">
        <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      <Carousel options={{ slidesToScroll: 1 }} aria-label={title}>
        <CarouselContent>
          {concerts.map((concert) => (
            <CarouselItem key={concert.id}>
              <ConcertCard concert={concert} onSelect={() => onSelectConcert(concert)} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  )
}
