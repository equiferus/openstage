export interface YouTubePlayer {
  destroy(): void
  getCurrentTime(): number
  getIframe(): HTMLIFrameElement
  getPlayerState(): number
  mute(): void
  playVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
}

export interface YouTubePlayerEvent {
  target: YouTubePlayer
}

export interface YouTubePlayerStateEvent extends YouTubePlayerEvent {
  data: number
}

export interface YouTubePlayerOptions {
  videoId: string
  host?: string
  playerVars: Record<string, string | number>
  events: {
    onReady: (event: YouTubePlayerEvent) => void
    onStateChange: (event: YouTubePlayerStateEvent) => void
  }
}

export const YOUTUBE_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export interface YouTubePlayerApi {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
  PlayerState: {
    ENDED: number
    PLAYING: number
    PAUSED: number
    CUED: number
  }
}

declare global {
  interface Window {
    YT?: YouTubePlayerApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const SCRIPT_ID = "youtube-iframe-api"
let loadingPromise: Promise<YouTubePlayerApi> | undefined

export function loadYouTubeIframeApi(): Promise<YouTubePlayerApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (loadingPromise) {
    return loadingPromise
  }

  const promise = new Promise<YouTubePlayerApi>((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()

      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        reject(new Error("YouTube iframe API loaded without a player constructor"))
      }
    }

    const existingScript = document.getElementById(SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener("error", () => reject(new Error("Unable to load the YouTube iframe API")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.addEventListener("error", () => reject(new Error("Unable to load the YouTube iframe API")), {
      once: true,
    })
    document.head.appendChild(script)
  })

  loadingPromise = promise.catch((error: unknown) => {
    loadingPromise = undefined
    throw error
  })
  return loadingPromise
}
