const API_ROOT = "https://api.github.com"

export type GitHubLabel = { name: string }

export type GitHubIssue = {
  number: number
  title: string
  body: string | null
  html_url: string
  labels: Array<GitHubLabel | string>
  pull_request?: unknown
}

export type GitHubPullRequest = {
  number: number
  title: string
  html_url: string
  head: { ref: string }
  body: string | null
}

export const AUTOMATION_LABELS = [
  { name: "suggestion: concert", color: "d97706", description: "A concert proposed for the Openstage collection" },
  { name: "suggestion: feature", color: "8b5cf6", description: "A proposed improvement to the Openstage app" },
  { name: "automation: claimed", color: "1d76db", description: "Claimed by an automation worker" },
  { name: "automation: failed", color: "b60205", description: "Automation stopped and requires attention" },
  { name: "pm: reviewing", color: "fbca04", description: "Under autonomous product review" },
  { name: "pm: rejected", color: "d93f0b", description: "Rejected during product review" },
  { name: "pm: needs-human-review", color: "e99695", description: "Requires a human product decision" },
  { name: "ready-for-production", color: "0e8a16", description: "Approved and ready for implementation" },
  { name: "implementation: working", color: "0052cc", description: "Being implemented by automation" },
  { name: "implementation: pr-opened", color: "5319e7", description: "Implementation pull request is open" },
  { name: "implementation: blocked", color: "b60205", description: "Implementation is blocked" },
  { name: "curation: rejected", color: "d93f0b", description: "Concert suggestion did not pass curation" },
  { name: "curation: needs-info", color: "fbca04", description: "Concert suggestion needs more information" },
] as const

function repository() {
  const slug = Bun.env.OPENSTAGE_REPO ?? "equiferus/openstage"
  if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) throw new Error(`Invalid OPENSTAGE_REPO: ${slug}`)
  return slug
}

function token() {
  const value = Bun.env.GITHUB_TOKEN
  if (!value) throw new Error("GITHUB_TOKEN is required; copy .env.example to .env and add a fine-grained token")
  return value
}

export async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ROOT}/repos/${repository()}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "openstage-automation",
      ...init.headers,
    },
  })

  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!response.ok) throw new Error(`GitHub ${response.status} ${init.method ?? "GET"} ${path}: ${text}`)
  return text ? JSON.parse(text) as T : undefined as T
}

export function labelNames(issue: GitHubIssue) {
  return issue.labels.map((label) => typeof label === "string" ? label : label.name)
}

export async function listOpenIssues(label: string) {
  const query = new URLSearchParams({
    state: "open",
    labels: label,
    sort: "created",
    direction: "asc",
    per_page: "100",
  })
  const issues = await github<GitHubIssue[]>(`/issues?${query}`)
  return issues.filter((issue) => !issue.pull_request)
}

export async function getIssue(number: number) {
  return github<GitHubIssue>(`/issues/${number}`)
}

export async function checkRepository() {
  return github<{ full_name: string }>("")
}

export async function getIssueContext(number: number) {
  const [issue, comments, openPullRequests] = await Promise.all([
    getIssue(number),
    github<Array<{ user: { login: string }, body: string | null, created_at: string }>>(`/issues/${number}/comments?per_page=100`),
    github<GitHubPullRequest[]>("/pulls?state=open&per_page=100"),
  ])
  const relatedPullRequests = openPullRequests.filter((pull) =>
    pull.head.ref.startsWith(`issue/${number}-`) || pull.body?.includes(`#${number}`),
  )
  return { issue, comments, openPullRequests: relatedPullRequests }
}

export async function addLabels(number: number, labels: string[]) {
  return github(`/issues/${number}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  })
}

export async function removeLabel(number: number, label: string) {
  try {
    await github(`/issues/${number}/labels/${encodeURIComponent(label)}`, { method: "DELETE" })
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("GitHub 404")) throw error
  }
}

export async function comment(number: number, body: string) {
  return github(`/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export async function closeIssue(number: number) {
  return github(`/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  })
}

export async function createPullRequest(head: string, title: string, body: string) {
  return github("/pulls", {
    method: "POST",
    body: JSON.stringify({ head, base: "main", title, body }),
  })
}

export async function ensureLabels() {
  for (const label of AUTOMATION_LABELS) {
    try {
      await github("/labels", { method: "POST", body: JSON.stringify(label) })
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("GitHub 422")) throw error
    }
  }
}
