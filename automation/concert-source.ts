const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"])

export function youtubeOEmbedUrl(value: string) {
  let source: URL
  try {
    source = new URL(value)
  } catch {
    throw new Error("Expected a valid YouTube URL")
  }
  if (source.protocol !== "https:" || !YOUTUBE_HOSTS.has(source.hostname)) {
    throw new Error("Only HTTPS YouTube URLs are supported")
  }
  const endpoint = new URL("https://www.youtube.com/oembed")
  endpoint.searchParams.set("url", source.toString())
  endpoint.searchParams.set("format", "json")
  return endpoint
}

export async function fetchConcertSource(value: string) {
  const response = await fetch(youtubeOEmbedUrl(value), {
    headers: { "User-Agent": "openstage-concert-curator" },
  })
  if (!response.ok) throw new Error(`YouTube metadata request failed with HTTP ${response.status}`)
  const metadata = await response.json() as Record<string, unknown>
  return {
    provider: "YouTube",
    sourceUrl: value,
    title: metadata.title,
    authorName: metadata.author_name,
    authorUrl: metadata.author_url,
    thumbnailUrl: metadata.thumbnail_url,
  }
}

if (import.meta.main) {
  const sourceUrl = Bun.argv[2]
  if (!sourceUrl) throw new Error("Usage: bun automation/concert-source.ts <youtube-url>")
  console.log(JSON.stringify(await fetchConcertSource(sourceUrl), null, 2))
}
