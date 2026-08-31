---
name: github-issue-delivery
description: Deliver GitHub issues through isolated branches and pull requests that close the issue on merge. Use when asked to implement, fix, or complete a numbered GitHub issue, including addressing review suggestions and verifying closure.
---

# GitHub Issue Delivery

Use a branch and pull request for every issue. Do not implement an issue directly on the default branch.

## Workflow

1. Read the issue, its comments, linked discussions, and current state. Confirm the requested work is not already complete or superseded.
2. Inspect the repository instructions and working tree. Preserve unrelated user changes.
3. Fetch the remote default branch and create a new branch from its latest commit. Name it `issue/<number>-<short-slug>` unless the repository defines another convention.
4. Implement only the issue's scope. Keep claims traceable to the issue or an authoritative source; do not invent missing content.
5. Run checks proportional to the change, including the repository's formatter, lint, tests, and build when available. Fix failures caused by the branch before opening a pull request.
6. Review the complete diff against the default branch. Remove debugging artifacts and unrelated edits.
7. Commit and push the issue branch. Open a pull request that:
   - explains the outcome and validation;
   - includes `Closes #<number>` in the pull-request body;
   - links external evidence when the implementation depends on it.
8. Read every review, inline comment, automated suggestion, and failed check. Apply valid changes on the same branch, rerun affected checks, and respond with evidence. Do not mark unresolved feedback as handled.
9. Merge only when required checks pass, review feedback is resolved, and the user has authorized merging or repository policy clearly provides automatic merge authorization. Never bypass branch protection.
10. After the merge reaches the default branch, verify the issue is closed and the deployed result when deployment is part of the issue. Report the pull request, merge commit, checks, issue state, and deployment state.

## Failure handling

- If authenticated GitHub access is unavailable, push the branch when authorized and provide the pull-request creation URL. State that the PR, merge, or closure remains pending; never claim it happened.
- If the implementation already reached the default branch without a closing pull request, verify the implementation commit and close the issue with a concise reference to that commit when authorized. Do not create a fake code change merely to manufacture a pull request.
- If the issue cannot close automatically after a correctly linked merge, verify that the PR targeted the default branch, then close it manually only when authorized and explain why automation did not close it.
