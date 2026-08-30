import { useMemo, useRef, useState } from "react"
import { ArrowLeft, ExternalLink, MapPin, Play, RadioTower } from "lucide-react"

import type { Artist } from "@/domain/artists/api"
import type { Concert, SetlistEntry } from "@/domain/artists/concerts/api"
import { cn, formatDuration, formatTimestamp } from "@/lib/utils"
import { getYouTubeUrlAtTime } from "@/lib/youtube"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/lib/ui/primitives/accordion"
import { Badge } from "@/lib/ui/primitives/badge"
import { Button } from "@/lib/ui/primitives/button"
import { Separator } from "@/lib/ui/primitives/separator"
import { ConcertMeta } from "@/lib/ui/concert-meta"
import { VideoPlayer } from "@/lib/ui/video-player"

interface ArtistPageProps {
  artist: Artist
  concerts: readonly Concert[]
}

function originalUrlAtTime(concert: Concert, startAtSeconds?: number): string {
  return concert.source.platform === "youtube"
    ? getYouTubeUrlAtTime(concert.source.originalUrl, startAtSeconds)
    : concert.source.originalUrl
}

function Setlist({ entries, onSelect }: { entries: readonly SetlistEntry[]; onSelect: (entry: SetlistEntry) => void }) {
  const timedEntries = entries.filter((entry) => entry.startAtSeconds !== undefined).length

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="setlist" className="border-none">
        <AccordionTrigger>
          <span className="flex items-center gap-3">
            Setlist
            <Badge>{entries.length} tracks</Badge>
            {timedEntries > 0 ? <span className="hidden text-xs font-normal text-zinc-500 sm:inline">{timedEntries} playable timestamps</span> : null}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ol className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
            {entries.map((entry, index) => {
              const isPlayable = entry.startAtSeconds !== undefined
              const content = (
                <>
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-200">{entry.title}</span>
                    {entry.note ? <span className="mt-0.5 block text-xs text-zinc-600">{entry.note}</span> : null}
                  </span>
                  {isPlayable ? (
                    <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-amber-300">
                      <Play className="size-3 fill-current" />
                      {formatTimestamp(entry.startAtSeconds!)}
                    </span>
                  ) : null}
                </>
              )

              return (
                <li key={`${entry.title}-${index}`}>
                  {isPlayable ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-3 py-3.5 text-left outline-none transition hover:bg-white/5 focus-visible:bg-white/8 sm:px-4"
                      onClick={() => onSelect(entry)}
                      aria-label={`Play ${entry.title} at ${formatTimestamp(entry.startAtSeconds!)}`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 px-3 py-3.5 sm:px-4">{content}</div>
                  )}
                </li>
              )
            })}
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function ArtistPage({ artist, concerts }: ArtistPageProps) {
  const defaultConcert = concerts.find((concert) => concert.featured) ?? concerts[0]
  const [selectedConcertId, setSelectedConcertId] = useState(defaultConcert.id)
  const [startAtSeconds, setStartAtSeconds] = useState<number | undefined>()
  const playerRef = useRef<HTMLDivElement>(null)
  const selectedConcert = useMemo(
    () => concerts.find((concert) => concert.id === selectedConcertId) ?? defaultConcert,
    [concerts, defaultConcert, selectedConcertId],
  )

  function selectConcert(concert: Concert) {
    setSelectedConcertId(concert.id)
    setStartAtSeconds(undefined)
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function playSetlistEntry(entry: SetlistEntry) {
    setStartAtSeconds(entry.startAtSeconds)
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <a href="#/"><ArrowLeft /> Back to the collection</a>
      </Button>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge>{artist.origin}</Badge>
            <span className="text-xs font-medium text-zinc-500">{concerts.length} {concerts.length === 1 ? "recording" : "recordings"}</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">{artist.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">{artist.summary}</p>
        </div>
        <div className="hidden justify-end lg:flex">
          <span className="flex size-20 items-center justify-center rounded-full border border-amber-300/20 bg-amber-400/8 text-amber-300">
            <RadioTower className="size-8" aria-hidden="true" />
          </span>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0" ref={playerRef}>
          <div className="scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-black/50 p-1.5 sm:rounded-[2rem] sm:p-2">
            <VideoPlayer
              source={selectedConcert.source}
              title={selectedConcert.title}
              startAtSeconds={startAtSeconds}
              autoplay={startAtSeconds !== undefined}
            />
          </div>

          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-amber-400 uppercase">{selectedConcert.eventName}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{selectedConcert.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{selectedConcert.description}</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <a href={originalUrlAtTime(selectedConcert, startAtSeconds)} target="_blank" rel="noreferrer">
                Watch original <ExternalLink />
              </a>
            </Button>
          </div>

          <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <ConcertMeta concert={selectedConcert} />
            <div className="mt-4 flex items-start gap-2 text-sm text-zinc-500">
              <MapPin className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>{selectedConcert.venue.name}</span>
            </div>
            {selectedConcert.recordingNote ? (
              <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-5 text-zinc-600">Recording note: {selectedConcert.recordingNote}</p>
            ) : null}
          </div>

          {selectedConcert.setlist?.length ? (
            <div className="mt-5">
              <Setlist entries={selectedConcert.setlist} onSelect={playSetlistEntry} />
            </div>
          ) : null}
        </div>

        <aside aria-label="Recordings">
          <div className="xl:sticky xl:top-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recordings</h2>
              <span className="text-xs text-zinc-600">{concerts.length} total</span>
            </div>
            <div className="space-y-3">
              {concerts.map((concert) => {
                const selected = concert.id === selectedConcert.id
                return (
                  <button
                    key={concert.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400",
                      selected
                        ? "border-amber-300/30 bg-amber-400/8"
                        : "border-white/8 bg-zinc-900/50 hover:border-white/15 hover:bg-zinc-900",
                    )}
                    onClick={() => selectConcert(concert)}
                    aria-pressed={selected}
                  >
                    <span className={cn("text-sm font-semibold", selected ? "text-amber-200" : "text-zinc-200")}>{concert.title}</span>
                    <span className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-600">
                      <span>{concert.dateLabel}</span>
                      <span>{formatDuration(concert.durationSeconds)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
