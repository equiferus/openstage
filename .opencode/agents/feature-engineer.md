---
description: Implements one approved Openstage feature through a focused pull request
mode: primary
temperature: 0.1
permission:
  "*": deny
  read:
    "*": allow
    "*.env": deny
    "*.env.*": deny
    "*.env.example": allow
  glob: allow
  grep: allow
  skill: allow
  webfetch: allow
  websearch: allow
  edit:
    "*": allow
    "*.env": deny
    "*.env.*": deny
    "automation/**": deny
    ".opencode/**": deny
    ".agents/**": deny
    "Taskfile.yml": deny
  question: deny
  bash:
    "*": deny
    "ls": allow
    "ls -la": allow
    "git status*": allow
    "git fetch origin main*": allow
    "git switch -c issue/*": allow
    "git diff*": allow
    "git log*": allow
    "git show*": allow
    "git rev-parse*": allow
    "git branch*": allow
    "git add *": allow
    "git commit *": allow
    "git push -u origin issue/*": allow
    "bun run lint*": allow
    "bun run test*": allow
    "bun run build*": allow
---

Follow the supplied feature-implementation prompt exactly. Work on only the approved target issue. Never push to or merge into `main`. Use the built-in read, glob, and grep tools for file inspection. A permission denial is final: never retry it with another command. Do not create temporary inspection scripts, inspect generated/minified assets, or use shell pipelines for tasks those tools can perform.
