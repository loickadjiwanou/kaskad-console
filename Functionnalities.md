# Kaskad Console — Functionalities

Complete list of what the web console does. This file is updated every time a feature is added or changed.

The console is the publishing tool of the Kaskad store, modeled on Google Play Console: developer accounts manage their apps, and the **platform admin** reviews and publishes everything.

---

## 1. Roles

| Role | Who | Can do |
|---|---|---|
| **Platform admin** | The backend's `ADMIN_EMAIL` account. Unique, never assignable | Everything, across every developer account: approve / reject / publish, manage categories, see and suspend developer accounts. Also owns the platform's own account ("Kaskad") |
| **Owner** | The person who signed up and created a developer account | Manage apps and versions, submit them for review, manage the team (invitations, roles, access), rename the account, create API keys, see the account's activity log |
| **Developer** | Invited by the owner | Create and edit apps, upload versions, submit them for review, manage beta testers |
| **Viewer** | Invited by the owner | Read-only: apps, versions, statistics. A "Read-only" badge is shown in the header; every editing control is hidden |

Nobody can grant the platform admin or owner role.

### Menu per role

| Menu | Platform admin | Owner | Developer | Viewer |
|---|:-:|:-:|:-:|:-:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Apps | ✓ | ✓ | ✓ | ✓ |
| Statistics | ✓ (whole platform) | ✓ (own account) | ✓ | ✓ |
| Activity log | ✓ (whole platform) | ✓ (own account) | — | — |
| Team | ✓ (platform account) | ✓ | — | — |
| Moderation | ✓ | — | — | — |
| Categories | ✓ | — | — | — |
| Accounts | ✓ | — | — | — |
| My account | ✓ | ✓ | ✓ | ✓ |

Pages outside a role's menu redirect to the dashboard when opened directly, and the API refuses the matching requests.

---

## 2. Authentication and account lifecycle

### Sign in
- Email + password.
- Clear error messages (wrong credentials, disabled account, unconfirmed email, suspended account, too many attempts).
- "Forgot password?" link.
- Language switch (FR / EN) on every public page.

### Sign up (developer account)
- Name, developer account name (studio, company or developer name), email, password + confirmation.
- Creates the developer account; the person becomes its **owner**.
- A confirmation email is sent (Brevo), in the console's current language.
- "Check your inbox" screen with "Resend email".
- Signing in before confirming shows a warning with a "Resend email" action.

### Email confirmation
- The emailed link (valid 48 h, single use) confirms the address and signs the user in directly.
- Invalid or expired link: explanation + form to get a new link.

### Forgot / reset password
- "Forgot password" page: enter an email → a reset link is emailed (same answer whether the address exists or not).
- The link (valid 1 hour, single use) opens "New password" (password + confirmation), then signs the user in; other sessions are signed out.
- Expired link: "Request a new link" action.

### Invitations (joining a team)
- The invitation link opens "Join «account»": who invited you, your role and what it allows.
- Choose a name and password → the account is created and signed in.
- Handled cases: link already used / expired / revoked, address already registered, already signed in with another account (sign-out button).

### Sessions
- Access token + single-use refresh token, renewed automatically; the user is signed out when the session can't be renewed (account disabled, suspended, password reset).

---

### Two-step verification
- Sign-in in two steps when it's on: 6-digit code (auto-submitted when complete) or a recovery code; also after a password reset.
- **Required setup screen** (platform admin, or members of an account that requires it): full-page wizard, the console is locked until it's done; sign-out available.
- Setup wizard: password → QR code (or key to type, copyable) and first code → 10 recovery codes (copy, download .txt, "I've saved them" checkbox).

## 3. Layout and preferences

- Collapsible side menu (automatic on small screens), header with theme switch, language switch (FR / EN) and account menu (My account, Sign out).
- The header shows the member's name, account name and role.
- **Themes:** Light, System (follows the computer), Midnight (dark blue), Black (pure black, for OLED screens) — same as the mobile app.
- **Material Design mode** (My account › Preferences): Google Material Design 3 across the whole console — tonal colors generated from the Kaskad blue, Roboto font, pill-shaped buttons and navigation indicator, rounded dialogs and side sheets, M3 switches, chips, snackbars at the bottom, ripple effects, soft field outlines. Works with the four themes; filters keep the normal segmented style.
- Scrollbars hidden everywhere (scrolling still works).
- Preferences are remembered in the browser.
- Fully bilingual interface (French / English); dates and numbers follow the language.
- **Sidebar footer:** "My account" and "Sign out" pinned at the very bottom of the sidebar (also in the header user menu).

---

## 4. Dashboard

- Greeting with the member's first name; subtitle adapted to the scope (the account, or the whole platform for the admin).
- Key figures: published apps (+ drafts / unpublished), total downloads, downloads over the last 30 days (with page views and conversion rate), and:
  - platform admin: **requests to review** (opens Moderation);
  - members: **pending versions** (opens Apps).
- Downloads chart with period selector (7 days, 30 days, 90 days, 12 months).
- Most downloaded apps.
- Latest releases (links to the version list of each app).

---

## 5. Apps

### App list
- Filters: All / Published / Drafts / Unpublished, search by name, category filter.
- Columns: app (icon, name, short description), developer account (platform admin only), status, platforms, categories, latest version, **rating** (average ★ and number of ratings), downloads, pending versions, last update.
- Pagination; click a row to open the app.
- "New app" (name, short description, categories, target platforms) — hidden for viewers.

### App page (tabs)
Header: icon, name, status tag, short description, **"Public page"** button, "Preview" button and the status action.

**Public page** (popover and card in the Ratings tab): the shareable link of the app's public web page (copy, open in a new tab), with an explanation (opens the app in Kaskad when installed); disabled until the app is published.

**Status actions**
- Platform admin: Publish / Unpublish / Move back to draft (confirmation explains the effect).
- Owner / developer: *Request* publishing / unpublishing / move to draft (optional note) → review request. Banners show a pending request (withdraw) or a rejected one (with the reason, dismiss).

**Details tab (listing)**
- Name, **main language** of the listing (French or English), short and long descriptions in **French and English tabs** (the translation is optional: missing texts fall back to the main language).
- Categories, target platforms, featured flag, Android package name (checked on every APK).
- "Unsaved changes" indicator, Cancel / Save.
- For a live app: changes go to a **listing draft** (not visible in the store) — see Review workflow.

**Media tab**
- Icon upload / replacement (PNG, JPEG, WebP, 10 MB max) with progress.
- Screenshots: add several at once (12 max), reorder by drag and drop, delete.

**Versions tab** — see section 6.

**Ratings & reviews tab** (counter of ratings in the tab label)
- Rating summary: average, stars, number of ratings, 5 → 1 star distribution bars — clicking a bar filters the reviews by that rating.
- Reviews list: author initial avatar, name, stars, date (with "edited"), version, language, text, developer reply; tags *Hidden* (with the reason) and *N reports* (with reasons).
- Filters: All / Unanswered / Answered, stars; pagination.
- **Reply** / **Edit reply** / **Delete reply** (members except viewers): the reply is public, signed with the developer account name; the reviewer is notified by email.
- Platform admin: **Hide** (optional reason; the review leaves the client app and the rating) and **Restore** / **Keep (dismiss reports)**.
- Public page card.

**Statistics tab** — the statistics panel restricted to the app (by version, platform, format, period, CSV export).

**Preview tab** — the app page exactly as shown in the client app, in a phone frame; switch between "Live" and "With changes" when a listing draft exists.

---

## 6. Versions and releases

### Upload
- Drawer with drag-and-drop file zone (APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM); platform and format detected from the extension.
- Version number (semantic version checked), version code (suggested: next number), platform, format (only valid combinations).
- **Channel:** Production or Beta.
- **Release notes in French and English** (tabs; main language marked).
- Upload progress, then automatic security scan.

### Version list
- Version, platform · format, size, scan status (queued / scanning / passed / rejected), status (not published / scheduled with date / published / archived), **Beta** tag, review tag (in review / approved / rejected), downloads, upload date.
- "Show archived" switch.
- Banners: versions ready to submit / to publish, submissions waiting for approval (admin).
- Row menu: details, download, scan again, archive (published versions: admin only).

### Version drawer
- All metadata: platform, code, status, channel, scan, file name, size, SHA-256 (copyable), upload / publish dates, downloads.
- Review banner (pending / approved / rejected with reason).
- Release notes in both languages; edit (version number, channel while not live, notes FR / EN).
- Full security scan report: rejection reasons, warnings, antivirus engines, format check, APK details (package, version, certificate continuity, permissions), Authenticode signature (signed, verdict, issuer).
- Download the file; scan again.

### Primary action (depends on state and role)
| Version state | Platform admin | Owner / developer |
|---|---|---|
| Scan not finished / rejected | Disabled (explanation) | Disabled (explanation) |
| Passed, draft | **Publish** — now or at a chosen date (pre-filled with the date requested by the developer) | **Submit for review** — optional note and requested release date |
| Submitted | Approve and publish / Reject (reason required) | Withdraw request |
| Rejected | Publish | Submit again |
| Scheduled | Publish now / Cancel schedule | Cancel schedule |
| Live beta | **Promote to production** (approves a promotion request) / Reject | Request promotion to production |
| Beta with fewer than 3 testers | Publish disabled (explanation) | Submit disabled (explanation) |

### Beta channel and testers
- "Beta testers" card: email addresses of Kaskad app accounts that see beta versions (tags input, validation of addresses, save).
- **At least 3 testers** are required before a beta can be submitted or published (warning with the current count).
- Every newly added tester receives an **invitation email** explaining how to access the beta; the console confirms how many invitations were sent.

### Scheduled releases
- Date and time chosen by the developer (at submission) or by the admin (at publication); the version is shown as "Scheduled · date".
- The server publishes it automatically at that time; "Publish now" and "Cancel schedule" remain available.

---

## 7. Review workflow (platform admin approval)

Nothing goes live without the platform admin:
- **Versions:** submitted after the security scan; approved (published now or scheduled) or rejected with a reason.
- **App status:** publish / unpublish / draft requests.
- **Listing of a live app:** edits (texts, languages, icon, screenshots, categories…) are saved in a listing draft with a banner ("Unpublished listing changes"), previewable, then submitted; the admin publishes or rejects them. The draft can be discarded; editing a submitted item cancels the submission.
- **Beta promotion:** request to move a live beta to production.
- Rejections always carry a reason; the author can fix and submit again.
- Follow-up emails: the admin is emailed for each new request; the author is emailed on approval, rejection (with reason), scheduling and publication.

---

## 8. Moderation (platform admin)

- **Review requests** tab: every pending and rejected request across all accounts — versions (with platform, beta tag, promotion request, requested date), status requests and listing changes — with the submitter, date and note. Actions: approve / approve and publish, reject (reason), open. Filters: To review / Rejected, with counters.
- **Security scan** tab: versions being scanned, ready, scheduled or rejected by the scan, with the first rejection reason; filters All / Ready / Scanning / Rejected; scan again; open the version drawer.
- **App reports** tab: reports sent from the client app (reason tag, details, reporter email or "User without an account", date, app status). Actions: **Dismiss** or **Take action** (internal note, option to **unpublish the app**); every open report of the same app is closed together. Filters Open / Closed; closed reports show the outcome, the admin and the note. Emails notify the platform admin of new reports.
- **User reviews** tab: reported reviews across the platform (with app name and reasons), hidden reviews, or all reviews; hide, restore or keep (dismiss reports).
- Tab badges and menu badge: requests to review + open app reports + reported reviews; automatic refresh.

---

## 9. Categories (platform admin)

- List with icon, name and number of apps.
- Create / edit (name + icon picker with ~35 Material icons).
- Reorder by drag and drop (keyboard accessible) — defines the order in the client app.
- Move all apps of a category to another one.
- Delete (a replacement category is required when apps use it).

---

## 10. Statistics

- Period: 7 days, 30 days, 90 days, 12 months or custom date range; interval daily / weekly / monthly.
- Filters: developer account (platform admin), app, version.
- **Funnel cards:** page views (Kaskad app + public web page), unique visitors, downloads, conversion rate (downloads ÷ views).
- **Page views and downloads over time** (two series on the same chart).
- **By country** (downloads or views): flag, localized country name, count and share; "Unknown" when the server has no geolocation.
- **Where page views come from:** Kaskad app or public web page.
- **Versions actually installed:** active devices per app (click to open the app), or for one app per version and platform with share and the "Latest" tag, plus the share of devices on the latest version.
- Breakdown by platform and by file format.
- Most downloaded apps with views and conversion, or — for one app — downloads per version with share (click to filter).
- CSV export (one line per download, with account, app, version, platform, format, country).
- Scope: members see only their account's apps; the platform admin sees the whole platform.

---

## 11. Activity log (owner, platform admin)

- Who did what and when: member (or "System" / "API · key name"), action, details (app, version, reason, requester, channel, scheduled date…), with links to apps.
- Filters: type (apps, versions, categories, team, account, reviews, reports), member, developer account (platform admin).
- Review and report actions: reply to a review, reply deleted, review hidden / restored (with the stars), report dismissed / handled (with the reason and the note).
- Pagination with page size choice.
- Owners see everything that happens in their account: their members' actions, the platform admin's decisions on their apps, automatic scan results, API key actions.

---

## 12. Team (owner, platform admin for the platform account)

- Members: name, email, role, access switch (deactivate / reactivate, signs the member out), last sign-in, member since. Change role between Developer and Viewer.
- **Invite a member:** email + role (Developer / Viewer, with explanation). The invitation email is sent in the console's current language; pending invitations can be resent (new link) or revoked; expired invitations are marked.
- Rename the developer account.
- **Security:** switch "Require two-step verification for all members" (the owner must have it on first), with the number of active members who haven't set it up; **two-step verification column** per member (on / off) and **Reset** for a member who lost their phone (signs them out, emails them).
- **API keys** (continuous integration): create (name) → the key is shown **once** with a copy button and a ready-to-use GitHub Actions example; list (name, key prefix, creator, creation date, last use); revoke. A key acts as a developer: it uploads versions and submits them for review (`submit=true` submits automatically after the scan), but never publishes, manages the team or creates keys.

---

## 13. Developer accounts (platform admin)

- Every registered account: name (platform account tagged), owner (with "email not confirmed" warning), members, apps, creation date, state (Active / Suspended with reason).
- Search by account or owner.
- Expand an account to see its members and suspend / reactivate a member's access.
- **Suspend an account** (optional reason): its apps disappear from the store, its members are signed out and can't sign in, its invitations can't be accepted; the owner is emailed with the reason. **Reactivate** restores everything (owner emailed).

---

## 14. My account

- Profile: email, role, member since; edit the name.
- Change password (current password required).
- **Two-step verification card:** status (on since, recovery codes left), turn on (wizard), turn off (password + code, hidden when it's required), new recovery codes (code from the app).
- Preferences: theme (4 options), Material Design switch, language.

---

## 15. Emails sent from console actions

All emails are sent through Brevo, in French or English:

| Email | Recipient | Language |
|---|---|---|
| Email confirmation (sign up, resend) | New owner | Console language at sending |
| Password reset | Member | Console language at sending |
| Team invitation | Invited person | Console language at sending |
| Beta tester invitation | New tester | Console language at sending |
| "To review" | Platform admin | Admin's console language |
| Version published / rejected / scheduled, request approved / rejected, listing published / rejected | Author of the request | Author's console language |
| Account suspended / reactivated | Owner | Owner's console language |
| Reply to a review | Reviewer (client app user) | Language of the review |
| App reported | Platform admin | Admin's console language |

---

## 16. Quality and accessibility

- Responsive layout (desktop to phone width).
- Keyboard navigation (drag and drop included), visible focus, accessible labels on icon buttons.
- Confirmation dialogs for every destructive or publishing action.
- All errors come from the API already translated.
