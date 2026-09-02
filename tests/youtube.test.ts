import { describe, expect, it } from "vitest"

import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeUrlAtTime,
} from "@/lib/youtube"

describe("YouTube utilities", () => {
  it("builds privacy-enhanced muted autoplay embeds", () => {
    const url = getYouTubeEmbedUrl("M6tLJTwcp1g", { autoplay: true, muted: true })

    expect(url).toContain("youtube-nocookie.com/embed/M6tLJTwcp1g")
    expect(url).toContain("autoplay=1")
    expect(url).toContain("mute=1")
  })

  it("supports embedded and original timestamp links", () => {
    expect(getYouTubeEmbedUrl("abc", { startAtSeconds: 75 })).toContain("start=75")
    expect(getYouTubeUrlAtTime("https://youtu.be/abc?si=test", 75)).toContain("t=75")
    expect(getYouTubeThumbnailUrl("abc")).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg")
  })

  it("builds controllable single-video loops", () => {
    const url = getYouTubeEmbedUrl("abc", {
      enableJsApi: true,
      loop: true,
      origin: "https://example.com",
    })

    expect(url).toContain("loop=1")
    expect(url).toContain("playlist=abc")
    expect(url).toContain("enablejsapi=1")
    expect(url).toContain(`origin=${encodeURIComponent("https://example.com")}`)
  })
})
