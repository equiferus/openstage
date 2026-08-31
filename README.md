# 🎶 Openstage

> A community-curated index of remarkable live concert recordings and setlists.

[**Watch on Openstage →**](https://equiferus.github.io/openstage/)

Openstage brings full live performances, event details, and setlists together in a focused single-page experience. Watch recordings without leaving the site, search the collection, or follow the link back to the original source.

## ✨ Highlights

- Embedded concert recordings with scrollable setlists
- Artist and concert search, plus curated recommendations
- Shareable concert links
- Fully static: no accounts, database, or backend

## 🎟️ Make a suggestion

Select **+ Suggest** on the [website](https://equiferus.github.io/openstage/) to add a concert or propose an app feature. Each choice opens a separate structured GitHub issue form and is routed to its own labeled review queue.

Prefer to contribute the change yourself? Fork the repository, add the artist or concert to the appropriate `data.ts` file under `src/domain/artists`, run the checks below, and open a pull request.

## 🤖 Suggestion automation

The repository includes three permission-separated AI workers for concert curation, product review, and approved feature implementation. A provider-neutral wrapper uses Codex (`gpt-5.6-luna`, low reasoning) by default and can switch to OpenCode with one environment flag. See [automation/README.md](automation/README.md) for VM setup, provider selection, GitHub token permissions, startup, logs, and recovery.

## 🛠️ Local development

Requires Bun 1.3+.

```sh
bun install --frozen-lockfile
bun run dev
```

Before opening a PR:

```sh
bun run lint
bun run test
bun run build
```

## 🧩 Built with

React, TypeScript, Vite, Tailwind CSS, shadcn-style UI primitives, TanStack Table, and Vitest. GitHub Actions deploys `main` to GitHub Pages.

---

Made for people who believe a great live set deserves to be easy to find. 💛
