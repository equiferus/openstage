import { describe, expect, test } from "bun:test"

import { CONFIGS, parseWorkerResult, selectIssue, type Role } from "./worker"
import type { GitHubIssue } from "./github"

function issue(number: number, labels: string[]): GitHubIssue {
  return { number, title: `Issue ${number}`, body: null, html_url: `https://example.test/${number}`, labels }
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
})
