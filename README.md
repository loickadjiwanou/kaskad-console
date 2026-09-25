# Kaskad — Admin console

The web console used by the Kaskad team to manage the catalog: app pages, versions, security scan review, publishing and download statistics.
Anyone can **create a developer account** (sign up, then confirm the email address) and invite their team. Publications are reviewed by the platform admin before going live, like Google Play Console.

## Features

- **Dashboard:** published apps, total downloads, versions waiting for review, downloads chart, most downloaded apps, latest releases
- **Apps:** create and edit app pages (texts, categories, target platforms, featured flag, Android package name), icon and screenshots (drag to reorder), status (draft / published / unpublished), preview of the page as shown in the client app
- **Release management:** beta channel with a list of testers (email addresses of Kaskad app accounts, at least 3 before a beta can be submitted or published; each new tester gets an invitation email), promotion of a beta to production, scheduled releases (date chosen by the developer or the platform admin), listings and release notes in French and English
- **API keys** (account owner, *Team* page): publish from continuous integration — a key uploads versions and submits them for review; a GitHub Actions example is shown when a key is created
- **Versions:** upload with a metadata form (version number, version code, platform, format, release notes), upload progress, live security scan status (queued / scanning / passed / rejected), full scan report, **manual publishing only after the scan has passed**, archive, rescan, download
- **Ratings & reviews** (app page tab): rating summary and distribution, reviews with filters, public developer replies (the reviewer is emailed); the platform admin hides or restores reviews
- **Public page:** shareable link of each published app's web page, which opens the app in Kaskad when it is installed
- **Moderation** (platform admin): review requests from developers (approve / reject with a reason), queue of versions being scanned, ready or rejected, **app reports** from users (dismiss, handle, unpublish) and **reported user reviews**
- **Categories:** create, edit (name + icon), reorder by drag and drop, delete (apps are moved to another category), move apps between categories
- **Statistics:** downloads by period (preset or custom range, daily / weekly / monthly), per app and per version, breakdown by platform and format, CSV export
- **Activity log** (account owner and platform admin): who did what and when in the account — members' actions, review decisions and scan results — filtered by type or member (and by account for the platform admin)
- **Team** (account owner): invite members by email, change roles (developer / viewer), deactivate access, rename the account
- **Developer accounts** (platform admin): every registered account with its owner, members and apps; suspend an account (with a reason emailed to the owner) or reactivate it
- Themes: Light, Midnight (dark blue), Black (pure black, for OLED screens) or System, like the mobile app
- **Material Design** option (*My account › Preferences*): Google's Material Design 3 across the whole console — tonal color roles generated from the Kaskad blue (`@material/material-color-utilities`), Roboto typography, M3 shapes (pill buttons and navigation indicator, 28 px dialogs, side sheets), segmented buttons, switches, chips, snackbars and ripple effects; works with all three themes
- French and English

### Accounts, roles and review workflow

- **Sign up** creates a developer account; its creator is the **owner**. A confirmation email (Brevo) is sent in the console's current language; the link signs the user in. *Forgot password?* on the sign-in page emails a reset link.
- **Follow-up emails:** the platform admin is emailed for each new review request; members are emailed when their request is approved or rejected (with the reason), in their console language.
- **Team** (owner): invite people by email as **Developer** (creates and edits apps, uploads versions, submits for review) or **Viewer** (read-only). The invitation email uses the console's language at the time of sending; the link opens a page where the person chooses a name and password.
- Each account only sees its own apps, statistics, moderation queue and activity log.
- The **platform admin** (the backend's `ADMIN_EMAIL`, unique, never assignable) sees every account. Only they see the *Moderation*, *Categories* and *Developer accounts* menus.

Nothing goes live without the platform admin:

- **Versions:** once the security scan has passed, a developer clicks *Submit for review*; the admin *approves and publishes* or *rejects* it with a reason.
- **App status:** developers *request* publishing / unpublishing; the admin approves or rejects.
- **Listing of a live app:** changes are saved as a *listing draft*, invisible to users, with a preview; the admin publishes or rejects it.
- The platform admin works from **Moderation** (review requests and security scan queue). Developers follow their requests directly on each app: *In review* / *Rejected* banners with the reason, version tags and scan status.

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
