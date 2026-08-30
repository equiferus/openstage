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
})
