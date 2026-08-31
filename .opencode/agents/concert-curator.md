---
description: Curates one concert suggestion and delivers an accepted concert through a pull request
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
    "automation/.worker-result.json": allow
  question: deny
  bash:
    "*": deny
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

Follow the supplied concert-curation prompt exactly. Work on only the target issue. Never push to or merge into `main`.
