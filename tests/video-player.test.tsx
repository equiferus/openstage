import { render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { synchronizedClock } from "@/lib/synchronized-playback"
import { VideoPlayer } from "@/lib/ui/video-player"
import { loadYouTubeIframeApi } from "@/lib/youtube-player-api"
import type {
  YouTubePlayer,
  YouTubePlayerApi,
  YouTubePlayerOptions,
} from "@/lib/youtube-player-api"

vi.mock("@/lib/youtube-player-api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/youtube-player-api")>()
  return {
    ...original,
    loadYouTubeIframeApi: vi.fn(),
  }
})

class FakeYouTubePlayer implements YouTubePlayer {
  currentTime = 0
  destroy = vi.fn()
  getCurrentTime = vi.fn(() => this.currentTime)
  getIframe = vi.fn(() => document.createElement("iframe"))
  getPlayerState = vi.fn(() => 1)
  mute = vi.fn()
  playVideo = vi.fn()
  seekTo = vi.fn()
}

describe("synchronized YouTube player", () => {
  let fakePlayer: FakeYouTubePlayer
  let playerOptions: YouTubePlayerOptions

  beforeEach(() => {
    fakePlayer = new FakeYouTubePlayer()
    playerOptions = undefined as unknown as YouTubePlayerOptions
    vi.spyOn(synchronizedClock, "nowMs").mockReturnValue(50_000)

    class PlayerConstructor {
      constructor(_element: HTMLElement, options: YouTubePlayerOptions) {
        playerOptions = options
        queueMicrotask(() => options.events.onReady({ target: fakePlayer }))
        return fakePlayer
      }
    }

    const api: YouTubePlayerApi = {
      Player: PlayerConstructor as unknown as YouTubePlayerApi["Player"],
      PlayerState: {
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        CUED: 5,
      },
    }
    vi.mocked(loadYouTubeIframeApi).mockResolvedValue(api)
  })

  it("starts at the shared position with muted autoplay and looping", async () => {
    const onLiveChange = vi.fn()
    const playerProps = {
      source: {
        platform: "youtube" as const,
        videoId: "abc",
        originalUrl: "https://youtu.be/abc",
        uploader: "Artist",
      },
      title: "Shared concert",
      durationSeconds: 100,
      liveSchedule: { startAtSeconds: 0, totalDurationSeconds: 100 },
      onLiveChange,
    }
    const view = render(
      <VideoPlayer
        {...playerProps}
        goLiveRequest={0}
      />,
    )

    await waitFor(() => expect(fakePlayer.seekTo).toHaveBeenCalledWith(50, true))
    expect(fakePlayer.mute).toHaveBeenCalledOnce()
    expect(fakePlayer.playVideo).toHaveBeenCalledOnce()
    expect(onLiveChange).toHaveBeenCalledWith(true)
    expect(playerOptions.playerVars).toMatchObject({
      autoplay: 1,
      loop: 0,
      mute: 1,
      start: 50,
    })
    expect(playerOptions.playerVars).not.toHaveProperty("playlist")

    onLiveChange.mockClear()
    view.rerender(
      <VideoPlayer
        {...playerProps}
        goLiveRequest={0}
        seekRequest={{ id: 1, startAtSeconds: 20 }}
      />,
    )
    expect(fakePlayer.seekTo).toHaveBeenLastCalledWith(20, true)
    expect(onLiveChange).toHaveBeenLastCalledWith(false)

    view.rerender(
      <VideoPlayer
        {...playerProps}
        goLiveRequest={1}
        seekRequest={{ id: 1, startAtSeconds: 20 }}
      />,
    )
    expect(fakePlayer.seekTo).toHaveBeenLastCalledWith(50, true)
    expect(onLiveChange).toHaveBeenLastCalledWith(true)

    fakePlayer.seekTo.mockClear()
    fakePlayer.playVideo.mockClear()
    onLiveChange.mockClear()
    fakePlayer.currentTime = 60
    playerOptions.events.onStateChange({ target: fakePlayer, data: 1 })
    expect(onLiveChange).toHaveBeenLastCalledWith(false)
    expect(fakePlayer.seekTo).not.toHaveBeenCalled()
    expect(fakePlayer.playVideo).not.toHaveBeenCalled()

    view.rerender(
      <VideoPlayer
        {...playerProps}
        goLiveRequest={2}
        seekRequest={{ id: 1, startAtSeconds: 20 }}
      />,
    )
    expect(onLiveChange).toHaveBeenLastCalledWith(true)

    fakePlayer.seekTo.mockClear()
    fakePlayer.playVideo.mockClear()
    playerOptions.events.onStateChange({ target: fakePlayer, data: 2 })
    expect(onLiveChange).toHaveBeenLastCalledWith(false)
    expect(fakePlayer.seekTo).not.toHaveBeenCalled()
    expect(fakePlayer.playVideo).not.toHaveBeenCalled()

    view.unmount()
    expect(fakePlayer.destroy).toHaveBeenCalledOnce()
  })

  it("starts non-live concerts on demand from the beginning", async () => {
    const onLiveChange = vi.fn()
    const view = render(
      <VideoPlayer
        source={{
          platform: "youtube",
          videoId: "other",
          originalUrl: "https://youtu.be/other",
          uploader: "Artist",
        }}
        title="On-demand concert"
        durationSeconds={100}
        goLiveRequest={0}
        onLiveChange={onLiveChange}
      />,
    )

    await waitFor(() => expect(fakePlayer.playVideo).toHaveBeenCalledOnce())
    expect(playerOptions.playerVars).toMatchObject({
      loop: 1,
      playlist: "other",
      start: 0,
    })
    expect(fakePlayer.seekTo).not.toHaveBeenCalled()
    expect(onLiveChange).not.toHaveBeenCalledWith(true)

    view.unmount()
  })
})
