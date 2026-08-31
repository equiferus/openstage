import { describe, expect, test } from "bun:test"

import { deliveryCheckState, linkedIssueNumber, pullRequestPatch, workflowRunId } from "./delivery"
import type { GitHubCheckRun, GitHubPullRequest } from "./github"

function pull(overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest {
  return {
    number: 9,
    title: "Implement issue",
    html_url: "https://github.test/pull/9",
    state: "open",
    draft: false,
    head: { ref: "issue/7-concert", sha: "abc" },
    base: { ref: "main" },
    body: "Implements it. Closes #7",
    ...overrides,
  }
}

function check(overrides: Partial<GitHubCheckRun> = {}): GitHubCheckRun {
  return {
    id: 1,
    name: "build",
    status: "completed",
    conclusion: "success",
    details_url: "https://github.com/equiferus/openstage/actions/runs/123/job/456",
    ...overrides,
  }
}

describe("delivery orchestration", () => {
  test("links only issue branches with a matching closing keyword", () => {
    expect(linkedIssueNumber(pull())).toBe(7)
    expect(linkedIssueNumber(pull({ body: "Mentions #7" }))).toBeNull()
    expect(linkedIssueNumber(pull({ body: "Closes #8" }))).toBeNull()
    expect(linkedIssueNumber(pull({ head: { ref: "feature/freeform", sha: "abc" } }))).toBeNull()
  })

  test("requires the build check to complete successfully", () => {
    expect(deliveryCheckState([])).toBe("pending")
    expect(deliveryCheckState([check({ status: "in_progress", conclusion: null })])).toBe("pending")
    expect(deliveryCheckState([check()])).toBe("passed")
    expect(deliveryCheckState([check({ conclusion: "cancelled" })])).toBe("cancelled")
    expect(deliveryCheckState([check({ conclusion: "failure" })])).toBe("failed")
  })

  test("extracts a workflow run id from check details", () => {
    expect(workflowRunId([check()])).toBe(123)
    expect(workflowRunId([check({ details_url: null })])).toBeNull()
  })

  test("bounds patch context supplied to the PM", () => {
    const text = pullRequestPatch([{
      filename: "src/large.ts",
      status: "modified",
      additions: 100,
      deletions: 0,
      changes: 100,
      patch: "x".repeat(1_000),
    }], 100)
    expect(text.length).toBeLessThanOrEqual(100)
    expect(text).toContain("src/large.ts")
  })
})
