import { describe, expect, test } from "bun:test"

import { CONFIGS, parseWorkerResult, selectIssue, type Role } from "./worker"
import type { GitHubIssue } from "./github"

function issue(number: number, labels: string[]): GitHubIssue {
  return { number, title: `Issue ${number}`, body: null, html_url: `https://example.test/${number}`, labels }
}

function productReview(decision: string) {
  return `## Product review

### Decision
${decision}

### User problem
Problem.

### Assessment
Assessment.

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
})
