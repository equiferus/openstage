# Openstage automation workers

Three unattended OpenCode workers process suggestion issues:

- `concert-curator` validates concert submissions and opens focused data PRs.
- `product-manager` performs a read-only product review and approves, rejects, or requests human review.
- `feature-engineer` implements approved feature issues and opens PRs.

Workers check GitHub every 15 minutes and process at most one issue per role per cycle. Concert and feature agents follow the repository's `github-issue-delivery` skill and may push only `issue/*` branches. The trusted supervisor creates PRs from validated agent output; nothing pushes directly to or merges into `main`. Each worker gets an isolated Git worktree under `.worker-state/worktrees`, preventing concurrent agents from changing the same checkout.

## Host prerequisites

Install these once on the VM:

- [Bun](https://bun.sh/) 1.3 or newer
- [OpenCode](https://opencode.ai/docs/)
- [Task](https://taskfile.dev/)
- Git and tmux

Authenticate OpenCode with the model provider that should run the workers:

```sh
opencode auth login
opencode auth list
```

## GitHub token

Create a fine-grained personal access token scoped only to `equiferus/openstage` with:

- Contents: read and write
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

Transient labels (`automation: claimed`, `pm: reviewing`, and `implementation: working`) are separate from terminal outcomes. A failed run removes its claim, adds `automation: failed`, and comments with the error. Fix the cause and remove `automation: failed` to retry.

The PM cannot edit application files or run shell commands; it can write only the ignored worker-result file. Implementation agents can edit application code and run only checked-in Git and Bun command patterns. GitHub credentials are removed from every OpenCode child process. Agents return a validated JSON decision to the trusted Bun supervisor, which alone comments, labels, closes issues, and creates PRs. No worker merges its own pull request.

Every successful PM outcome must contain the complete `## Product review` response. The supervisor posts that response before adding an approval/rejection label or closing the issue. If the PM agent fails to produce a valid review, the supervisor posts an automation-failure comment and leaves the product decision unapplied.

Static deployment is a hard product boundary. The PM must reject suggestions requiring databases, backends, servers or serverless functions, accounts/authentication, server-side persistence, browser-exposed secrets, or remote application-data writes. Every review declares `STATIC-ONLY: YES` or `STATIC-ONLY: NO`; the supervisor accepts `NO` only with a rejection. The feature engineer independently blocks any implementation that would violate this boundary.
