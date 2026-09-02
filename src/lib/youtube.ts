export interface YouTubeEmbedOptions {
  autoplay?: boolean
  enableJsApi?: boolean
  loop?: boolean
  muted?: boolean
  origin?: string
  startAtSeconds?: number
}

export function getYouTubeEmbedUrl(
  videoId: string,
  {
    autoplay = false,
    enableJsApi = false,
    loop = false,
    muted = false,
    origin,
    startAtSeconds,
  }: YouTubeEmbedOptions = {},
): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    controls: "1",
    playsinline: "1",
    rel: "0",
  })

  if (muted) {
    params.set("mute", "1")
  }

  if (loop) {
    params.set("loop", "1")
    params.set("playlist", videoId)
  }

  if (enableJsApi) {
    params.set("enablejsapi", "1")
    if (origin) {
      params.set("origin", origin)
    }
  }

  if (startAtSeconds !== undefined && startAtSeconds > 0) {
    params.set("start", String(Math.floor(startAtSeconds)))
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function getYouTubeUrlAtTime(originalUrl: string, startAtSeconds?: number): string {
  if (startAtSeconds === undefined || startAtSeconds <= 0) {
    return originalUrl
  }

  const url = new URL(originalUrl)
  url.searchParams.set("t", String(Math.floor(startAtSeconds)))
  return url.toString()
}
