import { describe, expect, test } from "bun:test"

import { youtubeOEmbedUrl } from "./concert-source"

describe("concert source metadata", () => {
  test("builds a bounded YouTube oEmbed request", () => {
    const endpoint = youtubeOEmbedUrl("https://www.youtube.com/watch?v=KhoA2quW-kM")
    expect(endpoint.origin + endpoint.pathname).toBe("https://www.youtube.com/oembed")
    expect(endpoint.searchParams.get("url")).toBe("https://www.youtube.com/watch?v=KhoA2quW-kM")
    expect(endpoint.searchParams.get("format")).toBe("json")
  })

  test("rejects non-YouTube and non-HTTPS URLs", () => {
    expect(() => youtubeOEmbedUrl("https://example.com/video")).toThrow("Only HTTPS YouTube URLs")
    expect(() => youtubeOEmbedUrl("http://youtube.com/watch?v=x")).toThrow("Only HTTPS YouTube URLs")
    expect(() => youtubeOEmbedUrl("not a url")).toThrow("Expected a valid YouTube URL")
  })
})
