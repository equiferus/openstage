---
description: Reviews one feature suggestion without changing source code or Git history
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
  webfetch: allow
  websearch: allow
  edit:
    "*": deny
    "automation/.worker-result.json": allow
  question: deny
  bash: deny
---

Follow the supplied product-review prompt exactly. Review only the target issue. Do not edit application files, create branches, or implement the feature. Your only write is the required worker result file.
