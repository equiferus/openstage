import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, Play } from "lucide-react"

import type { RecordingSource } from "@/domain/artists/concerts/api"
import {
  getPlaybackDriftSeconds,
  getScheduledVideoPosition,
  PLAYBACK_DRIFT_TOLERANCE_SECONDS,
  PLAYBACK_SYNC_INTERVAL_MS,
  synchronizedClock,
} from "@/lib/synchronized-playback"
import { getYouTubeEmbedUrl } from "@/lib/youtube"
import {
  loadYouTubeIframeApi,
  type YouTubePlayer,
  type YouTubePlayerApi,
  YOUTUBE_PLAYER_STATE,
} from "@/lib/youtube-player-api"
import { AspectRatio } from "@/lib/ui/primitives/aspect-ratio"
import { Button } from "@/lib/ui/primitives/button"

export interface VideoSeekRequest {
  id: number
  startAtSeconds: number
}

export interface VideoLiveSchedule {
  startAtSeconds: number
  totalDurationSeconds: number
}

interface VideoPlayerProps {
  source: RecordingSource
  title: string
  durationSeconds: number
  goLiveRequest: number
  liveSchedule?: VideoLiveSchedule
  seekRequest?: VideoSeekRequest
  onLiveChange: (isLive: boolean) => void
}

interface YouTubeVideoPlayerProps extends Omit<VideoPlayerProps, "source"> {
  videoId: string
}

function YouTubeVideoPlayer({
  videoId,
  title,
  durationSeconds,
  goLiveRequest,
  liveSchedule,
  seekRequest,
  onLiveChange,
}: YouTubeVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackIframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<YouTubePlayer | undefined>(undefined)
  const liveStateRef = useRef(false)
  const onLiveChangeRef = useRef(onLiveChange)
  const seekRequestRef = useRef(seekRequest)
  const handledSeekRequestRef = useRef<number | undefined>(undefined)
  const previousGoLiveRequestRef = useRef(goLiveRequest)
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false)
  const liveScheduleStart = liveSchedule?.startAtSeconds
  const liveScheduleDuration = liveSchedule?.totalDurationSeconds
  const isLiveStream = liveScheduleStart !== undefined && liveScheduleDuration !== undefined
  const getExpectedLivePosition = useCallback(() => {
    if (liveScheduleStart === undefined || liveScheduleDuration === undefined) {
      return 0
    }

    return getScheduledVideoPosition(synchronizedClock.nowMs(), liveScheduleStart, liveScheduleDuration)
  }, [liveScheduleDuration, liveScheduleStart])
  const initialPosition = useMemo(
    () => isLiveStream ? getExpectedLivePosition() : 0,
    [getExpectedLivePosition, isLiveStream],
  )
  const fallbackUrl = getYouTubeEmbedUrl(videoId, {
    autoplay: true,
    loop: true,
    muted: true,
    startAtSeconds: initialPosition,
  })

  useEffect(() => {
    onLiveChangeRef.current = onLiveChange
  }, [onLiveChange])

  const setLiveState = useCallback((isLive: boolean) => {
    if (liveStateRef.current === isLive) {
      return
    }

    liveStateRef.current = isLive
    onLiveChangeRef.current(isLive)
  }, [])

  const joinLive = useCallback(() => {
    const player = playerRef.current
    if (!player || !isLiveStream) {
      return
    }

    const expectedTime = getExpectedLivePosition()
    player.seekTo(expectedTime, true)
    player.playVideo()
    setLiveState(true)
  }, [getExpectedLivePosition, isLiveStream, setLiveState])

  const evaluateLiveState = useCallback(() => {
    const player = playerRef.current
    if (!player) {
      return
    }

    if (!isLiveStream) {
      setLiveState(false)
      return
    }

    const currentTime = player.getCurrentTime()
    const expectedTime = getExpectedLivePosition()
    const playerState = player.getPlayerState()

    if (
      expectedTime < 0 ||
      expectedTime >= durationSeconds ||
      playerState === YOUTUBE_PLAYER_STATE.ENDED
    ) {
      return
    }

    const outsideCatalogDuration = currentTime < 0 || currentTime >= durationSeconds
    const drift = Number.isFinite(currentTime)
      ? getPlaybackDriftSeconds(currentTime, expectedTime, durationSeconds)
      : Number.POSITIVE_INFINITY

    const isPlaying = playerState === YOUTUBE_PLAYER_STATE.PLAYING
    setLiveState(isPlaying && !outsideCatalogDuration && drift <= PLAYBACK_DRIFT_TOLERANCE_SECONDS)
  }, [durationSeconds, getExpectedLivePosition, isLiveStream, setLiveState])

  const playSeekRequest = useCallback((request: VideoSeekRequest) => {
    const player = playerRef.current
    if (!player) {
      return false
    }

    handledSeekRequestRef.current = request.id
    player.seekTo(request.startAtSeconds, true)
    player.playVideo()
    setLiveState(false)
    return true
  }, [setLiveState])

  useEffect(() => {
    seekRequestRef.current = seekRequest

    if (seekRequest && handledSeekRequestRef.current !== seekRequest.id) {
      if (useFallbackEmbed) {
        handledSeekRequestRef.current = seekRequest.id
        if (fallbackIframeRef.current) {
          fallbackIframeRef.current.src = getYouTubeEmbedUrl(videoId, {
            autoplay: true,
            loop: true,
            muted: true,
            startAtSeconds: seekRequest.startAtSeconds,
          })
        }
        setLiveState(false)
      } else {
        playSeekRequest(seekRequest)
      }
    }
  }, [playSeekRequest, seekRequest, setLiveState, useFallbackEmbed, videoId])

  useEffect(() => {
    if (previousGoLiveRequestRef.current === goLiveRequest) {
      return
    }

    previousGoLiveRequestRef.current = goLiveRequest
    if (!isLiveStream) {
      setLiveState(false)
      return
    }

    if (useFallbackEmbed) {
      const expectedTime = getExpectedLivePosition()
      if (fallbackIframeRef.current) {
        fallbackIframeRef.current.src = getYouTubeEmbedUrl(videoId, {
          autoplay: true,
          loop: true,
          muted: true,
          startAtSeconds: expectedTime,
        })
      }
      setLiveState(true)
    } else {
      joinLive()
    }
  }, [getExpectedLivePosition, goLiveRequest, isLiveStream, joinLive, setLiveState, useFallbackEmbed, videoId])

  useEffect(() => {
    if (useFallbackEmbed) {
      return
    }

    let cancelled = false
    let api: YouTubePlayerApi | undefined
    let syncInterval: number | undefined
    let unsubscribeClock: (() => void) | undefined
    const container = containerRef.current

    if (!container) {
      return
    }

    const mountPoint = document.createElement("div")
    mountPoint.className = "size-full"
    container.replaceChildren(mountPoint)

    void loadYouTubeIframeApi()
      .then((loadedApi) => {
        if (cancelled) {
          return
        }

        api = loadedApi
        playerRef.current = new loadedApi.Player(mountPoint, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            controls: 1,
            loop: isLiveStream ? 0 : 1,
            mute: 1,
            origin: window.location.origin,
            ...(isLiveStream ? {} : { playlist: videoId }),
            playsinline: 1,
            rel: 0,
            start: Math.floor(initialPosition),
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return
              }

              playerRef.current = event.target
              event.target.getIframe().title = `${title} video player`
              event.target.mute()

              const pendingSeek = seekRequestRef.current
              if (pendingSeek && handledSeekRequestRef.current !== pendingSeek.id) {
                playSeekRequest(pendingSeek)
              } else if (isLiveStream) {
                joinLive()
              } else {
                event.target.playVideo()
                setLiveState(false)
              }

              if (isLiveStream) {
                syncInterval = window.setInterval(evaluateLiveState, PLAYBACK_SYNC_INTERVAL_MS)
                unsubscribeClock = synchronizedClock.subscribe(() => {
                  if (liveStateRef.current) {
                    joinLive()
                  }
                })
              }
            },
            onStateChange: (event) => {
              if (cancelled) {
                return
              }

              playerRef.current = event.target
              if (event.data === api?.PlayerState.PAUSED) {
                setLiveState(false)
              } else if (event.data === api?.PlayerState.PLAYING) {
                evaluateLiveState()
              } else if (event.data === api?.PlayerState.ENDED && !isLiveStream) {
                setLiveState(false)
              }
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          setUseFallbackEmbed(true)
        }
      })

    return () => {
      cancelled = true
      if (syncInterval !== undefined) {
        window.clearInterval(syncInterval)
      }
      unsubscribeClock?.()
      playerRef.current?.destroy()
      playerRef.current = undefined
      container.replaceChildren()
    }
  }, [evaluateLiveState, initialPosition, isLiveStream, joinLive, playSeekRequest, setLiveState, title, useFallbackEmbed, videoId])

  return (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 sm:rounded-3xl">
      {useFallbackEmbed ? (
        <iframe
          ref={fallbackIframeRef}
          className="size-full border-0"
          src={fallbackUrl}
          title={`${title} video player`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div
          ref={containerRef}
          className="size-full"
          role="group"
          aria-label={`${title} video player`}
        />
      )}
    </AspectRatio>
  )
}

export function VideoPlayer({
  source,
  title,
  durationSeconds,
  goLiveRequest,
  liveSchedule,
  seekRequest,
  onLiveChange,
}: VideoPlayerProps) {
  if (source.platform === "youtube") {
    return (
      <YouTubeVideoPlayer
        key={source.videoId}
        videoId={source.videoId}
        title={title}
        durationSeconds={durationSeconds}
        goLiveRequest={goLiveRequest}
        liveSchedule={liveSchedule}
        seekRequest={seekRequest}
        onLiveChange={onLiveChange}
      />
    )
  }

  if (!source.embedUrl) {
    return (
      <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-3xl border border-white/10 bg-zinc-900">
        <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-amber-400 text-zinc-950">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
          <p className="text-sm leading-6 text-zinc-400">
            This recording is available on {source.provider}, but it cannot be embedded here.
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
        className="size-full border-0"
        src={source.embedUrl}
        title={`${title} video player`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </AspectRatio>
  )
}
