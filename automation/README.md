# Openstage automation workers

Three unattended AI workers process suggestion issues through one provider-neutral runner:

- `concert-curator` validates concert submissions and opens focused data PRs.
- `product-manager` is the autonomous orchestrator: it reviews suggestions, monitors implementation PRs and CI, performs a read-only delivery review, requests corrections, and merges approved work.
- `feature-engineer` implements approved feature issues and opens PRs.

Workers check GitHub every 5 minutes and process exactly one item at a time per role. After finishing an item, a worker checks again immediately and drains its queue serially. PM approvals wake the feature worker, and new implementation PRs wake the PM. A role never starts another item until its current agent run and all supervisor actions finish. Dirty partial work is always resumed before a newer queue item. Concert and feature agents follow the repository's `github-issue-delivery` skill and may push only `issue/*` branches. The trusted supervisor creates PRs from validated agent output. Only the PM supervisor may squash-merge into `main`, and only after successful CI plus a commit-bound Luna-medium delivery review. Each worker gets an isolated Git worktree under `.worker-state/worktrees`, preventing concurrent agents from changing the same checkout.

Agent runs are bounded so a confused model cannot occupy a queue forever: concert curation has an 8-minute deadline, PM review 5 minutes, and feature implementation 20 minutes. A timed-out run is stopped, its partial worktree changes are preserved, and the issue is retried serially after the cooldown. Advanced operators can override these with `WORKER_CONCERT_TIMEOUT_MS`, `WORKER_PM_TIMEOUT_MS`, and `WORKER_FEATURE_TIMEOUT_MS` (minimum 60000).

## Host prerequisites

Install these once on the VM:

- [Bun](https://bun.sh/) 1.3 or newer
- [Codex CLI](https://developers.openai.com/codex/cli/) (default), or [OpenCode](https://opencode.ai/docs/)
- [Task](https://taskfile.dev/)
- Git and tmux

Authenticate Codex once on the VM:

```sh
codex login
codex login status
```

Codex defaults to `gpt-5.6-luna` with low reasoning effort for concert and feature implementation. The PM defaults to `gpt-5.6-luna` with medium reasoning effort. To use OpenCode instead, authenticate it and set `USE_OPENCODE=true` in `.env`:

```sh
opencode auth login
opencode auth list
```

Switching back requires only `USE_OPENCODE=false` followed by `task workers:restart`. `CODEX_MODEL` and `CODEX_REASONING_EFFORT` control implementation workers. `CODEX_PM_MODEL` and `CODEX_PM_REASONING_EFFORT` independently control the PM and default to Luna medium.

## GitHub token

Create a fine-grained personal access token scoped only to `equiferus/openstage` with:

- Actions: read (inspect CI)
- Contents: read and write (merge PRs and remove merged issue branches)
- Issues: read and write
- Pull requests: read and write
- Metadata: read

The VM's existing Git credentials must also be able to push `issue/*` branches. Branch protection should prevent direct changes to `main`.

Configure the checkout:

```sh
git pull --ff-only
bun install --frozen-lockfile
cp .env.example .env
```

Put the token in `.env`, then validate the complete setup and start all workers:

```sh
task workers:setup
task workers:start
task workers:status
```

The preflight verifies the local tools and GitHub token, creates any missing workflow labels, prepares isolated worktrees, and installs their locked dependencies. `.env` and `.worker-state` are ignored by Git.

## Operations

```sh
task concert:log
task pm:log
task feature:log
task concert:start
task concert:stop
task pm:start
task pm:stop
task feature:start
task feature:stop
task workers:wake
task concert:wake
task pm:wake
task feature:wake
task workers:restart
task workers:stop
```

The role-specific `start`, `stop`, `status`, `attach`, and `log` tasks let each worker be operated independently. A standalone start performs the same setup checks as starting the full worker group.

After each `git pull`, run `task workers:restart` so all isolated checkouts and running processes use the new repository revision.

To start workers after a reboot, add this entry with `crontab -e`, replacing the path if the checkout lives elsewhere:

```cron
@reboot cd /home/domas/git/openstage && mkdir -p .worker-state && /path/to/task workers:start >> .worker-state/reboot.log 2>&1
```

Use `command -v task` for the exact Task binary path. tmux keeps the workers available for inspection; the reboot entry restores them after the host restarts.

## State and recovery

Transient labels (`automation: claimed`, `pm: reviewing`, and `implementation: working`) are separate from terminal outcomes. On startup, each worker releases stale claims left by an interrupted process. A failed run removes its claim, adds `automation: failed`, and comments with the error. New work is attempted first; failed work is retried after the five-minute cooldown when no new item is waiting. Use a role-specific `*:wake` task to interrupt an idle wait without restarting or losing unfinished files.

The PM agent runs in a read-only sandbox. Codex implementation agents run in a workspace-write sandbox with automatic approval review; OpenCode retains its checked-in command allowlists. The concert agent uses the repository's bounded YouTube oEmbed helper instead of downloading and parsing huge watch pages. GitHub credentials are removed from every child process. Agents return raw JSON through their provider's event stream; the trusted Bun supervisor validates it and alone performs GitHub mutations.

For every managed `issue/<number>-*` PR, the PM waits for the exact commit's `build` check. It retriggers cancelled checks once, returns failed/conflicting/changes-requested work to the correct implementation worker, and reviews green diffs against the linked issue and static-only policy. A validated `MERGE` decision is posted on the PR before the supervisor squash-merges it, deletes the branch, and lets `Closes #N` close the issue. The PM therefore continues orchestrating delivery instead of stopping at an open PR. Product-review comments and delivery-review comments are mandatory and persisted on GitHub.

Every successful PM outcome must contain the complete `## Product review` response. The supervisor posts that response before adding an approval/rejection label or closing the issue. If the PM agent fails to produce a valid review, the supervisor posts an automation-failure comment and leaves the product decision unapplied.

Static deployment is a hard product boundary. The PM must reject suggestions requiring databases, backends, servers or serverless functions, accounts/authentication, server-side persistence, browser-exposed secrets, or remote application-data writes. Every review declares `STATIC-ONLY: YES` or `STATIC-ONLY: NO`; the supervisor accepts `NO` only with a rejection. The feature engineer independently blocks any implementation that would violate this boundary.
