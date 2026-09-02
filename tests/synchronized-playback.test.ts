import { describe, expect, it, vi } from "vitest"

import {
  createLiveSchedule,
  getLiveSchedulePosition,
  getPlaybackDriftSeconds,
  getScheduledVideoPosition,
  getSynchronizedPlaybackPosition,
  SynchronizedClock,
} from "@/lib/synchronized-playback"

describe("synchronized playback", () => {
  it("maps Unix time into a repeating recording", () => {
    expect(getSynchronizedPlaybackPosition(0, 100)).toBe(0)
    expect(getSynchronizedPlaybackPosition(99_000, 100)).toBe(99)
    expect(getSynchronizedPlaybackPosition(100_000, 100)).toBe(0)
    expect(getSynchronizedPlaybackPosition(251_500, 100)).toBe(51.5)
    expect(() => getSynchronizedPlaybackPosition(0, 0)).toThrow(RangeError)
  })

  it("measures drift across the loop boundary", () => {
    expect(getPlaybackDriftSeconds(99, 1, 100)).toBe(2)
    expect(getPlaybackDriftSeconds(10, 20, 100)).toBe(10)
  })

  it("moves through every recording before looping the live channel", () => {
    const schedule = createLiveSchedule([
      { id: "first", durationSeconds: 10 },
      { id: "second", durationSeconds: 20 },
    ])

    expect(schedule.totalDurationSeconds).toBe(30)
    expect(getLiveSchedulePosition(0, schedule)).toMatchObject({
      item: { id: "first" },
      positionSeconds: 0,
      remainingSeconds: 10,
    })
    expect(getLiveSchedulePosition(10_000, schedule)).toMatchObject({
      item: { id: "second" },
      positionSeconds: 0,
      remainingSeconds: 20,
    })
    expect(getLiveSchedulePosition(29_000, schedule)).toMatchObject({
      item: { id: "second" },
      positionSeconds: 19,
      remainingSeconds: 1,
    })
    expect(getLiveSchedulePosition(30_000, schedule)).toMatchObject({
      item: { id: "first" },
      positionSeconds: 0,
    })
    expect(getScheduledVideoPosition(15_000, 10, 30)).toBe(5)
  })

  it("calibrates UTC with half of the clock request round trip", async () => {
    let monotonicTime = 100
    const serverTimeMs = Date.parse("2026-09-02T12:00:00.000Z")
    const listener = vi.fn()
    const fetchImpl = vi.fn(async () => {
      monotonicTime = 300
      return new Response(null, { headers: { date: "Wed, 02 Sep 2026 12:00:00 GMT" } })
    }) as unknown as typeof fetch
    const clock = new SynchronizedClock({
      fetchImpl,
      deviceNow: () => 123,
      monotonicNow: () => monotonicTime,
      clockUrl: () => "https://example.com/openstage/",
    })
    clock.subscribe(listener)

    await expect(clock.calibrate()).resolves.toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith("https://example.com/openstage/", {
      method: "HEAD",
      cache: "no-store",
    })
    expect(clock.nowMs()).toBe(serverTimeMs + 100)
    expect(listener).toHaveBeenCalledOnce()

    monotonicTime = 800
    expect(clock.nowMs()).toBe(serverTimeMs + 600)
  })

  it("keeps the device-clock basis when calibration is unavailable", async () => {
    let monotonicTime = 50
    const fetchImpl = vi.fn(async () => new Response(null)) as unknown as typeof fetch
    const clock = new SynchronizedClock({
      fetchImpl,
      deviceNow: () => 10_000,
      monotonicNow: () => monotonicTime,
      clockUrl: () => "https://example.com/openstage/",
    })

    monotonicTime = 100
    await expect(clock.calibrate()).resolves.toBe(false)
    expect(clock.nowMs()).toBe(10_050)
  })
})
