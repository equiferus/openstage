import type { GitHubPullRequest } from "./github"

function runGit(args: string[], cwd: string) {
  const result = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
  if (result.exitCode !== 0) {
    const detail = result.stderr.toString().trim() || result.stdout.toString().trim()
    throw new Error(`git ${args[0]} failed: ${detail.slice(0, 1_000)}`)
  }
  return result.stdout.toString().trim()
}

export function validateDeliveryBranch(branch: string, issueNumber: number) {
  if (!new RegExp(`^issue/${issueNumber}-[a-zA-Z0-9][a-zA-Z0-9._-]*$`).test(branch)) {
    throw new Error(`Unsafe delivery branch for issue #${issueNumber}: ${branch}`)
  }
  return branch
}

export function mergePullRequestViaGit(
  pull: GitHubPullRequest,
  issueNumber: number,
  repositoryRoot: string,
) {
  const branch = validateDeliveryBranch(pull.head.ref, issueNumber)
  const remoteRef = `refs/remotes/origin/${branch}`
  runGit(["fetch", "origin", "main", `refs/heads/${branch}:${remoteRef}`], repositoryRoot)
  const head = runGit(["rev-parse", remoteRef], repositoryRoot)
  if (head !== pull.head.sha) throw new Error(`PR #${pull.number} changed before its SSH merge`)
  const base = runGit(["rev-parse", "refs/remotes/origin/main"], repositoryRoot)
  const tree = runGit(["merge-tree", "--write-tree", base, head], repositoryRoot).split("\n")[0]?.trim()
  if (!/^[0-9a-f]{40,64}$/.test(tree)) throw new Error(`Could not create a clean merge tree for PR #${pull.number}`)
  const title = pull.title.replace(/\s+/g, " ").trim()
  const message = `Merge pull request #${pull.number} from ${branch}\n\n${title}\n\nCloses #${issueNumber}`
  const commit = runGit(["commit-tree", tree, "-p", base, "-p", head, "-m", message], repositoryRoot)
  runGit(["push", "origin", `${commit}:refs/heads/main`], repositoryRoot)
  return { merged: true, sha: commit, message: "Merged over authenticated Git SSH" }
}

export function deleteBranchViaGit(branch: string, issueNumber: number, repositoryRoot: string) {
  validateDeliveryBranch(branch, issueNumber)
  runGit(["push", "origin", "--delete", branch], repositoryRoot)
}
