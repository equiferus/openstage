import { ExternalLink, Play } from "lucide-react"

import type { RecordingSource } from "@/domain/artists/concerts/api"
import { getYouTubeEmbedUrl } from "@/lib/youtube"
import { AspectRatio } from "@/lib/ui/primitives/aspect-ratio"
import { Button } from "@/lib/ui/primitives/button"

interface VideoPlayerProps {
  source: RecordingSource
  title: string
  autoplay?: boolean
  muted?: boolean
  startAtSeconds?: number
}

export function VideoPlayer({ source, title, autoplay = false, muted = false, startAtSeconds }: VideoPlayerProps) {
  const embedUrl =
    source.platform === "youtube"
      ? getYouTubeEmbedUrl(source.videoId, { autoplay, muted, startAtSeconds })
      : source.embedUrl

  if (!embedUrl) {
    return (
      <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-3xl border border-white/10 bg-zinc-900">
        <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-amber-400 text-zinc-950">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
          <p className="text-sm leading-6 text-zinc-400">
            This recording is available on {source.platform === "external" ? source.provider : "YouTube"}, but it cannot be embedded here.
          </p>
          <Button asChild>
            <a href={source.originalUrl} target="_blank" rel="noreferrer">
              Open original <ExternalLink />
            </a>
          </Button>
        </div>
      </AspectRatio>
    )
  }

  return (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 sm:rounded-3xl">
      <iframe
        key={`${source.originalUrl}-${startAtSeconds ?? 0}-${autoplay}`}
        className="size-full border-0"
        src={embedUrl}
        title={`${title} video player`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </AspectRatio>
  )
}
