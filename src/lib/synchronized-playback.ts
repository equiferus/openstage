const CLOCK_REFRESH_INTERVAL_MS = 15 * 60 * 1000

export const PLAYBACK_SYNC_INTERVAL_MS = 2_000
export const PLAYBACK_DRIFT_TOLERANCE_SECONDS = 3

interface SchedulableRecording {
  durationSeconds: number
}

export interface LiveScheduleEntry<T extends SchedulableRecording> {
  item: T
  startAtSeconds: number
  endAtSeconds: number
}

export interface LiveSchedule<T extends SchedulableRecording> {
  entries: readonly LiveScheduleEntry<T>[]
  totalDurationSeconds: number
}

export interface LiveSchedulePosition<T extends SchedulableRecording> extends LiveScheduleEntry<T> {
  positionSeconds: number
  remainingSeconds: number
}

interface ClockBasis {
  unixTimeMs: number
  monotonicTimeMs: number
}

interface SynchronizedClockOptions {
  fetchImpl?: typeof fetch
  deviceNow?: () => number
  monotonicNow?: () => number
  clockUrl?: () => string
}

type ClockListener = () => void

function defaultClockUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

export class SynchronizedClock {
  private readonly fetchImpl: typeof fetch
  private readonly deviceNow: () => number
  private readonly monotonicNow: () => number
  private readonly clockUrl: () => string
  private readonly listeners = new Set<ClockListener>()
  private basis: ClockBasis
  private pendingCalibration?: Promise<boolean>

  constructor({
    fetchImpl = (...args) => fetch(...args),
    deviceNow = () => Date.now(),
    monotonicNow = () => performance.now(),
    clockUrl = defaultClockUrl,
  }: SynchronizedClockOptions = {}) {
    this.fetchImpl = fetchImpl
    this.deviceNow = deviceNow
    this.monotonicNow = monotonicNow
    this.clockUrl = clockUrl
    this.basis = {
      unixTimeMs: this.deviceNow(),
      monotonicTimeMs: this.monotonicNow(),
    }
  }

  nowMs(): number {
    return this.basis.unixTimeMs + (this.monotonicNow() - this.basis.monotonicTimeMs)
  }

  calibrate(): Promise<boolean> {
    if (this.pendingCalibration) {
      return this.pendingCalibration
    }

    this.pendingCalibration = this.performCalibration().finally(() => {
      this.pendingCalibration = undefined
    })

    return this.pendingCalibration
  }

  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private async performCalibration(): Promise<boolean> {
    const requestStartedAt = this.monotonicNow()

    try {
      const response = await this.fetchImpl(this.clockUrl(), {
        method: "HEAD",
        cache: "no-store",
      })
      const requestFinishedAt = this.monotonicNow()
      const serverDate = response.headers.get("date")
      const serverTimeMs = serverDate ? Date.parse(serverDate) : Number.NaN

      if (!Number.isFinite(serverTimeMs)) {
        return false
      }

      this.basis = {
        unixTimeMs: serverTimeMs + (requestFinishedAt - requestStartedAt) / 2,
        monotonicTimeMs: requestFinishedAt,
      }
      this.listeners.forEach((listener) => listener())
      return true
    } catch {
      return false
    }
  }
}

export const synchronizedClock = new SynchronizedClock()

export function startSynchronizedClock(clock = synchronizedClock): () => void {
  void clock.calibrate()

  const refreshInterval = window.setInterval(() => {
    void clock.calibrate()
  }, CLOCK_REFRESH_INTERVAL_MS)

  function refreshWhenVisible() {
    if (document.visibilityState === "visible") {
      void clock.calibrate()
    }
  }

  document.addEventListener("visibilitychange", refreshWhenVisible)

  return () => {
    window.clearInterval(refreshInterval)
    document.removeEventListener("visibilitychange", refreshWhenVisible)
  }
}

export function getSynchronizedPlaybackPosition(nowMs: number, durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("Synchronized playback requires a positive duration")
  }

  const unixSeconds = nowMs / 1_000
  return ((unixSeconds % durationSeconds) + durationSeconds) % durationSeconds
}

export function createLiveSchedule<T extends SchedulableRecording>(items: readonly T[]): LiveSchedule<T> {
  if (items.length === 0) {
    throw new RangeError("Live playback requires at least one recording")
  }

  let elapsedSeconds = 0
  const entries = items.map((item) => {
    if (!Number.isFinite(item.durationSeconds) || item.durationSeconds <= 0) {
      throw new RangeError("Live playback requires positive recording durations")
    }

    const entry = {
      item,
      startAtSeconds: elapsedSeconds,
      endAtSeconds: elapsedSeconds + item.durationSeconds,
    }
    elapsedSeconds = entry.endAtSeconds
    return entry
  })

  return {
    entries,
    totalDurationSeconds: elapsedSeconds,
  }
}

export function getLiveSchedulePosition<T extends SchedulableRecording>(
  nowMs: number,
  schedule: LiveSchedule<T>,
): LiveSchedulePosition<T> {
  const timelinePosition = getSynchronizedPlaybackPosition(nowMs, schedule.totalDurationSeconds)
  const entry = schedule.entries.find((candidate) => timelinePosition < candidate.endAtSeconds)
    ?? schedule.entries[schedule.entries.length - 1]

  return {
    ...entry,
    positionSeconds: timelinePosition - entry.startAtSeconds,
    remainingSeconds: entry.endAtSeconds - timelinePosition,
  }
}

export function getScheduledVideoPosition(
  nowMs: number,
  videoStartAtSeconds: number,
  totalDurationSeconds: number,
): number {
  return getSynchronizedPlaybackPosition(nowMs, totalDurationSeconds) - videoStartAtSeconds
}

export function getPlaybackDriftSeconds(
  currentTimeSeconds: number,
  expectedTimeSeconds: number,
  durationSeconds: number,
): number {
  const normalizedCurrent = getSynchronizedPlaybackPosition(currentTimeSeconds * 1_000, durationSeconds)
  const normalizedExpected = getSynchronizedPlaybackPosition(expectedTimeSeconds * 1_000, durationSeconds)
  const directDistance = Math.abs(normalizedCurrent - normalizedExpected)
  return Math.min(directDistance, durationSeconds - directDistance)
}
