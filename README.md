# Kaskad — Admin console

The web console used by the Kaskad team to manage the catalog: app pages, versions, security scan review, publishing and download statistics.
Access is restricted to team accounts created in the console (there is no public sign-up).

## Features

- **Dashboard:** published apps, total downloads, versions waiting for review, downloads chart, most downloaded apps, latest releases
- **Apps:** create and edit app pages (texts, categories, target platforms, featured flag, Android package name), icon and screenshots (drag to reorder), status (draft / published / unpublished), preview of the page as shown in the client app
- **Versions:** upload with a metadata form (version number, version code, platform, format, release notes), upload progress, live security scan status (queued / scanning / passed / rejected), full scan report, **manual publishing only after the scan has passed**, archive, rescan, download
- **Moderation:** review requests from editors (approve / reject with a reason) and queue of versions being scanned, ready or rejected
- **Categories:** create, edit (name + icon), reorder by drag and drop, delete (apps are moved to another category), move apps between categories
- **Statistics:** downloads by period (preset or custom range, daily / weekly / monthly), per app and per version, breakdown by platform and format, CSV export
- **Activity log:** who did what and when, filtered by type or member
- **Team** (full admins only): add members, change roles (full admin / content editor), deactivate accounts, reset passwords
- Light / dark / system theme, French and English

### Roles and review workflow

| Role | Access |
|---|---|
| Full admin | Everything: approves and publishes, manages the team. The first one is the backend's `ADMIN_EMAIL` account |
| Content editor | Prepares apps, listings and versions, and **submits them for review**; no access to the Team page |

Like Google Play Console, nothing goes live without a full admin:

- **Versions:** once the security scan has passed, an editor clicks *Submit for review*. A full admin *approves and publishes* or *rejects* it with a reason.
- **App status:** editors *request* publishing / unpublishing; a full admin approves or rejects the request.
- **Listing of a live app:** an editor's changes (texts, icon, screenshots, categories…) are saved as a *listing draft*, invisible to users, with a preview. The editor submits it; a full admin publishes or rejects it.
- The **Moderation › Review requests** tab lists every pending and rejected request. Editors see the rejection reason, fix the item and submit again.

Full admins publish directly: their action is the approval.

## Getting started

Requirements: Node.js 20+, Yarn 1.x, and a running `kaskad-backend` (see its README).

```bash
yarn install
cp .env.example .env
yarn dev
```

Open http://localhost:5173 and sign in with the backend's first admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in the backend's `.env`).

`VITE_API_URL` in `.env` is the backend address (default `http://localhost:8000`). The console's address must be listed in the backend's `CORS_ORIGINS` (`http://localhost:5173` is allowed by default).

## Scripts

```bash
yarn dev        # development server with hot reload (port 5173)
yarn build      # production build in dist/
yarn preview    # serve the production build locally
yarn lint       # ESLint
```

## Deployment

`yarn build` produces a static site in `dist/`. Host it on any static host (Nginx, S3 + CloudFront, Netlify…), with two requirements:

- `VITE_API_URL` is embedded at build time: set it to the production API address before building.
- It is a single-page app: configure the host to serve `index.html` for unknown paths (e.g. Nginx `try_files $uri /index.html;`).

Add the console's production URL to the backend's `CORS_ORIGINS`, and serve both over HTTPS.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Unable to reach the server" on sign-in | Check that the backend is running and that `VITE_API_URL` points to it. Restart `yarn dev` after changing `.env`. |
| CORS error in the browser console | Add the console's address to the backend's `CORS_ORIGINS`. |
| A version can't be published | Publishing is only possible once the security scan has passed. Open the version to read the scan report, fix the file and upload it again, or run the scan again. |
| Images or downloads don't load | Set the backend's `PUBLIC_BASE_URL` to an address the browser can reach. |
