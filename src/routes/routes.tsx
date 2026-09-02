import { useEffect, useState } from "react"

import { getArtistBySlug } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"
import {
  getConcertById,
  getPrimaryConcertByArtistId,
  listConcerts,
} from "@/domain/artists/concerts/api"
import {
  createLiveSchedule,
  getLiveSchedulePosition,
  startSynchronizedClock,
  synchronizedClock,
} from "@/lib/synchronized-playback"
import { SiteShell } from "@/lib/ui/site-shell"
import { HomeRoute } from "@/routes/home"

const liveSchedule = createLiveSchedule(listConcerts())

interface HashResolution {
  concert: Concert
  isLiveRoute: boolean
  normalizedHash?: string
}

interface PlaybackRouteState {
  selectedConcertId: string
  isLiveRoute: boolean
  isLive: boolean
}

function currentLivePosition() {
  return getLiveSchedulePosition(synchronizedClock.nowMs(), liveSchedule)
}

function liveResolution(normalizedHash?: string): HashResolution {
  return {
    concert: currentLivePosition().item,
    isLiveRoute: true,
    normalizedHash,
  }
}

function concertHash(concert: Concert): string {
  return `#/?concert=${encodeURIComponent(concert.id)}`
}

function resolveHash(hash = window.location.hash): HashResolution {
  const hashValue = hash.replace(/^#/, "") || "/"
  const [rawPath, rawQuery = ""] = hashValue.split("?", 2)
  const path = rawPath.replace(/\/+$/, "") || "/"

  if (path === "/browse") {
    return liveResolution("#/")
  }

  const artistMatch = path.match(/^\/artists\/([^/]+)$/)
  if (artistMatch) {
    let artistSlug = artistMatch[1]
    try {
      artistSlug = decodeURIComponent(artistSlug)
    } catch {
      return liveResolution("#/")
    }

    const artist = getArtistBySlug(artistSlug)
    const concert = artist ? getPrimaryConcertByArtistId(artist.id) : undefined
    return concert
      ? { concert, isLiveRoute: false, normalizedHash: concertHash(concert) }
      : liveResolution("#/")
  }

  if (path !== "/") {
    return liveResolution("#/")
  }

  const concertId = new URLSearchParams(rawQuery).get("concert")
  if (!concertId) {
    return liveResolution()
  }

  const concert = getConcertById(concertId)
  return concert
    ? { concert, isLiveRoute: false }
    : liveResolution("#/")
}

function playbackStateFromResolution(resolution: HashResolution): PlaybackRouteState {
  return {
    selectedConcertId: resolution.concert.id,
    isLiveRoute: resolution.isLiveRoute,
    isLive: resolution.isLiveRoute,
  }
}

export function Routes() {
  const [playback, setPlayback] = useState<PlaybackRouteState>(() => playbackStateFromResolution(resolveHash()))
  const [goLiveRequest, setGoLiveRequest] = useState(0)
  const fallbackLiveConcert = currentLivePosition().item
  const selectedConcert = getConcertById(playback.selectedConcertId) ?? fallbackLiveConcert
  const selectedScheduleEntry = liveSchedule.entries.find((entry) => entry.item.id === selectedConcert.id)
  const selectedLiveSchedule = playback.isLiveRoute && selectedScheduleEntry
    ? {
        startAtSeconds: selectedScheduleEntry.startAtSeconds,
        totalDurationSeconds: liveSchedule.totalDurationSeconds,
      }
    : undefined

  useEffect(() => {
    const stopSynchronizedClock = startSynchronizedClock()

    function syncFromLocation() {
      const resolution = resolveHash()
      setPlayback(playbackStateFromResolution(resolution))

      if (resolution.normalizedHash && window.location.hash !== resolution.normalizedHash) {
        window.history.replaceState(null, "", resolution.normalizedHash)
      }
    }

    syncFromLocation()
    window.addEventListener("hashchange", syncFromLocation)
    window.addEventListener("popstate", syncFromLocation)

    return () => {
      stopSynchronizedClock()
      window.removeEventListener("hashchange", syncFromLocation)
      window.removeEventListener("popstate", syncFromLocation)
    }
  }, [])

  useEffect(() => {
    if (!playback.isLive) {
      return
    }

    function advanceLiveConcert() {
      const liveConcert = currentLivePosition().item
      setPlayback((current) => {
        if (!current.isLive || !current.isLiveRoute || current.selectedConcertId === liveConcert.id) {
          return current
        }

        return { ...current, selectedConcertId: liveConcert.id }
      })
    }

    advanceLiveConcert()
    const scheduleCheck = window.setInterval(advanceLiveConcert, 1_000)
    const unsubscribeClock = synchronizedClock.subscribe(advanceLiveConcert)

    return () => {
      window.clearInterval(scheduleCheck)
      unsubscribeClock()
    }
  }, [playback.isLive])

  function setLiveState(isLive: boolean) {
    setPlayback((current) => ({
      ...current,
      isLive: current.isLiveRoute && isLive,
    }))
  }

  function selectConcert(concert: Concert) {
    setPlayback({
      selectedConcertId: concert.id,
      isLiveRoute: false,
      isLive: false,
    })

    const nextHash = concertHash(concert)
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash)
    }

    window.requestAnimationFrame(() => {
      document.getElementById("concert-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  function goLive() {
    const liveConcert = currentLivePosition().item
    setPlayback({
      selectedConcertId: liveConcert.id,
      isLiveRoute: true,
      isLive: true,
    })
    setGoLiveRequest((request) => request + 1)

    if (window.location.hash !== "#/") {
      window.history.pushState(null, "", "#/")
    }

    window.requestAnimationFrame(() => {
      document.getElementById("concert-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  return (
    <SiteShell isLive={playback.isLive} onGoLive={goLive} onSelectConcert={selectConcert}>
      <HomeRoute
        key={selectedConcert.id}
        concert={selectedConcert}
        goLiveRequest={goLiveRequest}
        liveSchedule={selectedLiveSchedule}
        onLiveChange={setLiveState}
        onSelectConcert={selectConcert}
      />
    </SiteShell>
  )
}
