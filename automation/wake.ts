import { mkdir, unlink } from "node:fs/promises"
import { join } from "node:path"

import type { Role } from "./worker"

function wakeDirectory() {
  const stateRoot = Bun.env.OPENSTAGE_STATE_ROOT ?? join(import.meta.dir, "..", ".worker-state")
  return join(stateRoot, "wake")
}

function wakePath(role: Role) {
  return join(wakeDirectory(), role)
}

export async function signalWorkerWake(role: Role) {
  await mkdir(wakeDirectory(), { recursive: true })
  await Bun.write(wakePath(role), `${Date.now()}\n`)
}

export async function consumeWorkerWake(role: Role) {
  const path = wakePath(role)
  if (!await Bun.file(path).exists()) return false
  try {
    await unlink(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}

export async function waitForWorkerWake(role: Role, interval: number, pollInterval = 1_000) {
  const deadline = Date.now() + interval
  while (Date.now() < deadline) {
    if (await consumeWorkerWake(role)) return true
    await Bun.sleep(Math.min(pollInterval, deadline - Date.now()))
  }
  return false
}
