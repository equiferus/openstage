# 🎶 Openstage

> A community-curated index of remarkable live concert recordings and setlists.

[**Watch on Openstage →**](https://equiferus.github.io/openstage/)

Openstage brings full live performances, event details, and setlists together in a focused single-page experience. Watch recordings without leaving the site, search the collection, or follow the link back to the original source.

## ✨ Highlights

- Embedded concert recordings with scrollable setlists
- Artist and concert search, plus curated recommendations
- Shareable concert links
- Fully static: no accounts, database, or backend

## 🎟️ Suggest a concert

Found a performance that belongs here? Select **Suggest a recording** on the [website](https://equiferus.github.io/openstage/), then provide the artist, recording URL, event details, and setlist if available. This creates a structured GitHub suggestion for review.

Prefer to contribute the change yourself? Fork the repository, add the artist or concert to the appropriate `data.ts` file under `src/domain/artists`, run the checks below, and open a pull request.

## 🛠️ Local development

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Before opening a PR:

```sh
npm run lint
npm test
npm run build
```

## 🧩 Built with

React, TypeScript, Vite, Tailwind CSS, shadcn-style UI primitives, TanStack Table, and Vitest. GitHub Actions deploys `main` to GitHub Pages.

---

Made for people who believe a great live set deserves to be easy to find. 💛
