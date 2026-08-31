export type AgentProvider = "codex" | "opencode"
export type AgentRole = "concert" | "pm" | "feature"

type RunnerOptions = {
  role: AgentRole
  opencodeAgent: string
  repositoryRoot: string
  prompt: string
  environment: Record<string, string | undefined>
}

type JsonEvent = Record<string, unknown>

function enabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "")
}

export function agentProvider(environment: Record<string, string | undefined> = Bun.env): AgentProvider {
  return enabled(environment.USE_OPENCODE) ? "opencode" : "codex"
}

export function requiredAgentCommand(environment: Record<string, string | undefined> = Bun.env) {
  return agentProvider(environment)
}

export function agentCommand(options: RunnerOptions) {
  if (agentProvider(options.environment) === "opencode") {
    return [
      "opencode",
      "run",
      "--agent",
      options.opencodeAgent,
      "--format",
      "json",
      "--dir",
      options.repositoryRoot,
      "--title",
      `Openstage ${options.role}`,
      options.prompt,
    ]
  }

  const rolePrefix = `CODEX_${options.role.toUpperCase()}`
  const model = options.environment[`${rolePrefix}_MODEL`]?.trim()
    || options.environment.CODEX_MODEL?.trim()
    || "gpt-5.6-luna"
  const reasoningEffort = options.environment[`${rolePrefix}_REASONING_EFFORT`]?.trim()
    || (options.role === "pm" ? "medium" : options.environment.CODEX_REASONING_EFFORT?.trim() || "low")
  const command = [
    "codex",
    "exec",
    "--json",
    "--ephemeral",
    "--model",
    model,
    "--config",
    `model_reasoning_effort=${JSON.stringify(reasoningEffort)}`,
    "--config",
    "web_search=\"live\"",
    "--cd",
    options.repositoryRoot,
  ]
  if (options.role === "pm") {
    command.push("--sandbox", "read-only")
  } else {
    command.push("--approve-for-me")
  }
  command.push(options.prompt)
  return command
}

function eventObject(line: string, provider: AgentProvider) {
  try {
    return JSON.parse(line) as JsonEvent
  } catch {
    console.log(`[${provider}] ${line.slice(0, 500)}`)
    return null
  }
}

function openCodeText(event: JsonEvent) {
  const part = event.part as Record<string, unknown> | undefined
  if (event.type === "text" && part?.type === "text" && typeof part.text === "string") return part.text
  if (event.type === "tool_use" && typeof part?.tool === "string") {
    const state = part.state as Record<string, unknown> | undefined
    const input = state?.input as Record<string, unknown> | undefined
    const status = String(state?.status ?? "finished")
    const command = typeof input?.command === "string" ? ` (${input.command})` : ""
    const error = typeof state?.error === "string" ? `: ${state.error.slice(0, 240)}` : ""
    console.log(`[opencode] ${part.tool}: ${status}${command}${error}`)
  }
  return null
}

function codexText(event: JsonEvent) {
  const item = event.item as Record<string, unknown> | undefined
  if (event.type === "item.completed" && item?.type === "agent_message" && typeof item.text === "string") {
    return item.text
  }
  if ((event.type === "item.started" || event.type === "item.completed") && typeof item?.type === "string") {
    const detail = typeof item.command === "string"
      ? ` (${item.command.slice(0, 300)})`
      : typeof item.name === "string"
        ? ` (${item.name})`
        : ""
    console.log(`[codex] ${item.type}: ${event.type === "item.started" ? "started" : "completed"}${detail}`)
  }
  if (event.type === "turn.failed") {
    const error = event.error as Record<string, unknown> | undefined
    console.log(`[codex] turn failed: ${String(error?.message ?? "unknown error").slice(0, 500)}`)
  }
  return null
}

export async function collectAgentResponse(
  stream: ReadableStream<Uint8Array>,
  provider: AgentProvider,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let pending = ""
  let finalResponse = ""

  function processLine(line: string) {
    if (!line.trim()) return
    const event = eventObject(line, provider)
    if (!event) return
    const text = provider === "opencode" ? openCodeText(event) : codexText(event)
    if (text) finalResponse = text
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    const lines = pending.split("\n")
    pending = lines.pop() ?? ""
    for (const line of lines) processLine(line)
  }
  pending += decoder.decode()
  processLine(pending)
  if (!finalResponse) throw new Error(`${provider} exited without a final text response`)
  return finalResponse
}
