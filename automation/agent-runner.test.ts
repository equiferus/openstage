import { describe, expect, test } from "bun:test"

import { agentCommand, agentProvider, collectAgentResponse, requiredAgentCommand } from "./agent-runner"

const options = {
  role: "concert" as const,
  opencodeAgent: "concert-curator",
  repositoryRoot: "/repo",
  prompt: "Do the work",
}

describe("agent runner", () => {
  test("uses Codex with Luna low by default", () => {
    expect(agentProvider({})).toBe("codex")
    expect(requiredAgentCommand({})).toBe("codex")
    expect(agentCommand({ ...options, environment: {} })).toEqual(expect.arrayContaining([
      "codex",
      "gpt-5.6-luna",
      "model_reasoning_effort=\"low\"",
      "--approve-for-me",
    ]))
  })

  test.each(["1", "true", "TRUE", "yes", "on"])("USE_OPENCODE=%s selects OpenCode", (value) => {
    const environment = { USE_OPENCODE: value }
    expect(agentProvider(environment)).toBe("opencode")
    expect(requiredAgentCommand(environment)).toBe("opencode")
    expect(agentCommand({ ...options, environment })[0]).toBe("opencode")
  })

  test("supports Codex model and reasoning overrides", () => {
    const command = agentCommand({
      ...options,
      environment: { CODEX_MODEL: "gpt-custom", CODEX_REASONING_EFFORT: "medium" },
    })
    expect(command).toEqual(expect.arrayContaining(["gpt-custom", "model_reasoning_effort=\"medium\""]))
  })

  test("keeps the PM read-only", () => {
    const command = agentCommand({ ...options, role: "pm", environment: {} })
    expect(command).toEqual(expect.arrayContaining(["--sandbox", "read-only"]))
    expect(command).not.toContain("--approve-for-me")
  })

  test("extracts the final Codex agent message", async () => {
    const events = [
      JSON.stringify({ type: "thread.started", thread_id: "thread" }),
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: '{"issue":42}' } }),
      JSON.stringify({ type: "turn.completed", usage: {} }),
    ].join("\n")
    const stream = new Response(events).body
    if (!stream) throw new Error("Expected a response body")
    expect(await collectAgentResponse(stream, "codex")).toBe('{"issue":42}')
  })
})
