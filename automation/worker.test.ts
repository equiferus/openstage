import { describe, expect, test } from "bun:test"

import { agentTimeoutMs, collectAgentResponse, CONFIGS, parseAgentResponse, parseWorkerResult, selectIssue, type Role } from "./worker"
import type { GitHubIssue } from "./github"

function issue(number: number, labels: string[]): GitHubIssue {
  return { number, title: `Issue ${number}`, body: null, html_url: `https://example.test/${number}`, labels }
}

function productReview(decision: string, staticOnly = "YES") {
  return `## Product review

### Decision
${decision}

### User problem
Problem.

### Assessment
Assessment.

### Static architecture
STATIC-ONLY: ${staticOnly}

### Implementation scope
Scope.

### Risks
Risks.`
}

describe("worker issue selection", () => {
  test.each([
    ["concert", "automation: claimed"],
    ["pm", "pm: reviewing"],
    ["feature", "implementation: working"],
  ] as Array<[Role, string]>)("%s skips claimed work", (role, claimLabel) => {
    expect(selectIssue([issue(1, [claimLabel]), issue(2, [])], role)?.number).toBe(2)
  })

  test("each role defines at least one terminal state", () => {
    for (const config of Object.values(CONFIGS)) expect(config.terminalLabels.length).toBeGreaterThan(0)
  })

  test("uses bounded role-specific runtimes with validated environment overrides", () => {
    expect(agentTimeoutMs("concert", {})).toBe(8 * 60_000)
    expect(agentTimeoutMs("pm", { WORKER_PM_TIMEOUT_MS: "90000" })).toBe(90_000)
    expect(() => agentTimeoutMs("feature", { WORKER_FEATURE_TIMEOUT_MS: "invalid" })).toThrow("WORKER_FEATURE_TIMEOUT_MS")
    expect(() => agentTimeoutMs("feature", { WORKER_FEATURE_TIMEOUT_MS: "59999" })).toThrow("at least 60000")
  })

  test("prioritizes new work but retries failed work when the queue is otherwise empty", () => {
    expect(selectIssue([issue(1, ["automation: failed"]), issue(2, [])], "concert")?.number).toBe(2)
    expect(selectIssue([issue(1, ["automation: failed"])], "concert")?.number).toBe(1)
  })

  test("validates issue-bound pull request output", () => {
    expect(parseWorkerResult({
      issue: 42,
      outcome: "pr-opened",
      branch: "issue/42-search",
      title: "Add search",
      body: "Implements search. Closes #42",
    }, "feature", 42).outcome).toBe("pr-opened")
    expect(() => parseWorkerResult({ issue: 42, outcome: "approved", comment: "ok" }, "feature", 42)).toThrow()
    expect(() => parseWorkerResult({ issue: 41, outcome: "approved", comment: "ok" }, "pm", 42)).toThrow()
  })

  test("accepts raw JSON and one schema-valid JSON object in surrounding prose", () => {
    const response = JSON.stringify({
      issue: 42,
      outcome: "rejected",
      comment: "The recording is unavailable.",
    })
    expect(parseAgentResponse(response, "concert", 42).outcome).toBe("rejected")
    expect(parseAgentResponse(`Result: ${response}\nDone.`, "concert", 42).outcome).toBe("rejected")
    expect(() => parseAgentResponse("{bad json}", "concert", 42)).toThrow("Agent returned invalid JSON")
    expect(() => parseAgentResponse(`${response}\n${response}`, "concert", 42)).toThrow("multiple valid")
  })

  test("extracts the final text from OpenCode JSON events", async () => {
    const events = [
      JSON.stringify({ type: "tool_use", part: { type: "tool", tool: "read", state: { status: "completed" } } }),
      JSON.stringify({ type: "text", part: { type: "text", text: '{"issue":42,"outcome":"rejected","comment":"No."}' } }),
    ].join("\n")
    const stream = new Response(events).body
    if (!stream) throw new Error("Expected a response body")
    expect(await collectAgentResponse(stream)).toContain('"issue":42')
  })

  test.each([
    ["approved", "APPROVE"],
    ["rejected", "REJECT"],
    ["needs-human-review", "NEEDS HUMAN REVIEW"],
  ] as const)("requires a structured PM comment for %s", (outcome, decision) => {
    const result = parseWorkerResult({ issue: 42, outcome, comment: productReview(decision) }, "pm", 42)
    expect(result.outcome).toBe(outcome)
    expect(() => parseWorkerResult({ issue: 42, outcome, comment: "Decision only" }, "pm", 42)).toThrow("PM response is missing")
  })

  test("rejects a PM comment whose written decision disagrees with its outcome", () => {
    expect(() => parseWorkerResult({
      issue: 42,
      outcome: "approved",
      comment: productReview("REJECT"),
    }, "pm", 42)).toThrow("PM response must state decision APPROVE")
  })

  test("allows only rejected outcomes for non-static features", () => {
    expect(parseWorkerResult({
      issue: 42,
      outcome: "rejected",
      comment: productReview("REJECT", "NO"),
    }, "pm", 42).outcome).toBe("rejected")
    expect(() => parseWorkerResult({
      issue: 42,
      outcome: "approved",
      comment: productReview("APPROVE", "NO"),
    }, "pm", 42)).toThrow("A non-static feature must be rejected")
    expect(() => parseWorkerResult({
      issue: 42,
      outcome: "needs-human-review",
      comment: productReview("NEEDS HUMAN REVIEW", "NO"),
    }, "pm", 42)).toThrow("A non-static feature must be rejected")
  })
})
