import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { consumeWorkerWake, signalWorkerWake, waitForWorkerWake } from "./wake"

let stateRoot: string | undefined

afterEach(async () => {
  if (stateRoot) await rm(stateRoot, { recursive: true, force: true })
  delete Bun.env.OPENSTAGE_STATE_ROOT
  stateRoot = undefined
})

describe("worker wake signals", () => {
  test("signals are consumed exactly once", async () => {
    stateRoot = await mkdtemp(join(tmpdir(), "openstage-worker-wake-"))
    Bun.env.OPENSTAGE_STATE_ROOT = stateRoot
    await signalWorkerWake("feature")
    expect(await consumeWorkerWake("feature")).toBe(true)
    expect(await consumeWorkerWake("feature")).toBe(false)
  })

  test("an existing signal interrupts the idle wait", async () => {
    stateRoot = await mkdtemp(join(tmpdir(), "openstage-worker-wake-"))
    Bun.env.OPENSTAGE_STATE_ROOT = stateRoot
    await signalWorkerWake("concert")
    expect(await waitForWorkerWake("concert", 5_000, 10)).toBe(true)
  })
})
