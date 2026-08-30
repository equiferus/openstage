# Openstage

Openstage is a community-curated index of remarkable live concert recordings and setlists. The site is a static Vite application: there is no database, account system, or backend service.

## Development

Use Node 24 and npm.

```sh
npm install
npm run dev
```

Quality checks:

```sh
npm run lint
npm test
npm run build
```

The local Vite URL includes the GitHub Pages base path: `http://localhost:5173/openstage/`.

## Project structure

- `src/routes` contains the Vite entry point and the single-page concert URL state.
- `src/lib/ui` contains all page, feature, and shadcn-style UI components and styles.
- `src/lib` contains non-visual formatting and video URL utilities.
- `src/domain/artists` and `src/domain/artists/concerts` each separate types, curated data, and function-based APIs.

Concerts can be shared with `#/?concert=<concert-id>`. Legacy Browse and artist hashes are normalized to the single-page concert view.

To add or correct an artist or concert, update the relevant `data.ts`. Keep UI code dependent on the query functions exported from `api.ts`, not on the data modules directly.

## Deployment

The production base path is `/openstage/`. The Pages workflow tests and builds pull requests, then deploys `main` to `https://equiferus.github.io/openstage/`.

Before the first deployment, open the repository's **Settings → Pages** and select **GitHub Actions** as the source. Future pushes to `main` deploy automatically.

Community suggestions use the recording issue form in `.github/ISSUE_TEMPLATE`.
