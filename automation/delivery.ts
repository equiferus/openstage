import type { GitHubCheckRun, GitHubPullRequest, GitHubPullRequestFile } from "./github"

export type DeliveryCheckState = "pending" | "passed" | "cancelled" | "failed"

export function linkedIssueNumber(pull: GitHubPullRequest) {
  const branchMatch = /^issue\/(\d+)-/.exec(pull.head.ref)
  if (!branchMatch) return null
  const issueNumber = Number(branchMatch[1])
  const closingPattern = new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${issueNumber}\\b`, "i")
  return closingPattern.test(pull.body ?? "") ? issueNumber : null
}

export function deliveryCheckState(checkRuns: GitHubCheckRun[]): DeliveryCheckState {
  const build = checkRuns.find((check) => check.name === "build")
  if (!build || build.status !== "completed") return "pending"
  if (build.conclusion === "success") return "passed"
  if (build.conclusion === "cancelled") return "cancelled"
  return "failed"
}

export function pullRequestPatch(files: GitHubPullRequestFile[], maxCharacters = 120_000) {
  let remaining = maxCharacters
  const sections: string[] = []
  for (const file of files) {
    const header = `--- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}) ---\n`
    if (header.length >= remaining) break
    const patch = file.patch ?? "[Patch unavailable from GitHub; inspect the file in the repository if needed.]"
    const content = `${header}${patch.slice(0, remaining - header.length)}`
    sections.push(content)
    remaining -= content.length
    if (remaining <= 0) break
  }
  return sections.join("\n")
}
