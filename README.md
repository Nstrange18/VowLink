# VowLink

Wedding invitations, guest management, RSVPs, seating/check-in, customization,
WhatsApp invitations and manual RSVP reminders, gifts, and couple dashboards.
The frontend uses React 19/Vite 7; the backend uses Express 5/Mongoose.

## Prerequisites

- Git and access to this GitHub repository.
- Node.js **22.12 or newer within the 22.x line** (CI uses 22.x), with npm 10.
  Node 18 is insufficient for the current Vite/Mongoose dependencies. Lockfiles
  use format 3; use `npm ci` for reproducible installs.
- A separate development MongoDB database. Prefer MongoDB Atlas or a local replica
  set so RSVP transactions behave like production. Production requires a replica
  set or sharded cluster with transaction support.
- A browser and two terminals. Docker, a global Vite/nodemon installation, and
  local MongoDB tools are not required when using Atlas.

External accounts are needed only for their respective features; unit tests do
not need any provider credentials or a running database.

## Project structure

```text
client/
  .env.example             Public frontend settings + Vercel preview aliases
  public/                  Assets published unchanged; never store secrets here
  api/share-preview.js     Preview function for a client-root Vercel project
  src/
    components/            Shared UI, settings, RSVP reminder panel
    context/               Shared application state
    pages/                 Guest invitation and admin pages
    utils/                 API client, public URL and display helpers
    test/setup.js          Vitest/Testing Library setup; tests also live beside UI
server/
  .env.example             Backend-only configuration template
  server.js                Express entry point, DB connection, email scheduler
  models/                  Users, invitations, RSVPs, reminder history, etc.
  middleware/              Authentication/authorization
  routes/                  HTTP endpoints
  services/                RSVP persistence, reminders, Brevo, wedding emails
  utils/                   Email content, WhatsApp payloads/credits, transactions
  tests/                   Jest/Supertest regressions and network guards
  RSVP_OPERATIONS.md       Transactions, legacy data, reconciliation/rollback
api/share-preview.js       Preview function for a repo-root Vercel project
.github/workflows/ci.yml   Validation only; no deployment
vercel.json                Existing repo-root build/routing configuration
```

The root package is not an npm workspace and has no run/check scripts. Install
and run the client and server independently; no root install is needed for the
local commands below. Keep both package lockfiles committed.

## Clone, configure, and run locally

```sh
git clone https://github.com/Nstrange18/VowLink.git
cd VowLink
```

Copy the examples without overwriting an existing local configuration:

```powershell
# PowerShell, from the repository root (new clone only)
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

On Bash, use `cp server/.env.example server/.env` and
`cp client/.env.example client/.env` instead.

Before starting the server, set `MONGO_URI` to your **development** database and
fill both JWT secrets with independent strong random values. Leave optional
provider credentials blank until deliberately testing those integrations. The
example's local MongoDB URI assumes you already have MongoDB running; copying it
does not provision a database. Use `NODE_ENV=development` only locally.

Terminal 1, from the repository root:

```sh
cd server
npm ci
npm run dev
```

Terminal 2, from the repository root:

```sh
cd client
npm ci
npm run dev
```

Run `npm start` **inside `server/`** for the normal Node entry point without
nodemon. Frontend `npm run preview` serves an existing build locally; it does not
run the backend or Vercel functions. Restart the backend after environment
changes; restart Vite locally or rebuild after changing `VITE_` values.

### URLs and local behavior

| Service | Default URL |
| --- | --- |
| Frontend | `http://localhost:5173` (use the port Vite prints if busy) |
| Backend | `http://localhost:5000` |
| API base | `http://localhost:5000/api` |

`VITE_API_URL` must include `/api`; `PUBLIC_SITE_URL` and the frontend site URL
must be origins without `/api`. The browser falls back to the localhost API when
on localhost; production otherwise falls back to `/api`, so set `VITE_API_URL`
explicitly for the separately hosted Render API. Vite also proxies `/api` to
localhost:5000. Vercel share-preview functions are not served by `npm run dev`.

CORS currently accepts localhost/127.0.0.1, HTTPS `*.vercel.app`, and the VowLink
domains, plus configured site origins and comma-separated `FRONTEND_URLS` /
`ALLOWED_ORIGINS`. An additional custom frontend domain needs the corresponding
backend origin setting. CORS is not authentication.

The server starts listening before its DB connection completes and currently
tries `mongodb://127.0.0.1:27017/vowlink` if the configured connection fails.
A listening port alone does not prove database readiness; check the connection
log. This existing fallback is not a substitute for a valid production URI.
Wedding-day email checks start after DB connection and repeat every 12 hours;
use an isolated DB and no live provider credentials for ordinary development.

For the standalone loopback RSVP development fallback and production index /
rollback requirements, read [RSVP operations](server/RSVP_OPERATIONS.md). Do not
run maintenance scripts, repairs, or index changes as part of routine setup.

## Environment reference

Use [server/.env.example](server/.env.example) and
[client/.env.example](client/.env.example). Blank secrets are intentional
placeholders. **Required** means needed for the stated feature, not that every
integration must be configured to run tests or start the UI.

### Backend core and URLs

| Variable | Requirement / behavior |
| --- | --- |
| `MONGO_URI` | Required for database-backed functionality; isolated DB locally, Atlas in production. |
| `JWT_SECRET` | Required for access tokens and invitation authentication; no auth fallback. |
| `JWT_REFRESH_SECRET` | Required for refresh tokens; separate secret, no auth fallback. |
| `NODE_ENV` | Set `development` locally and `production` on Render. Development enables development-only routes/fallbacks; never use it in production. Tests set `test` themselves. |
| `PORT` | Optional; default 5000 locally. Respect Render's supplied port. |
| `PUBLIC_SITE_URL` | Set explicitly: localhost:5173 locally, `https://vowlink.co` in production. Used for reset/email/invitation links and CORS. |
| `CLIENT_URL`, `FRONTEND_URL` | Optional compatibility aliases, in that fallback order after `PUBLIC_SITE_URL`; also CORS origins. One origin per variable. |
| `FRONTEND_URLS`, `ALLOWED_ORIGINS` | Optional comma-separated extra CORS origins; empty by default. |

Link helpers use `PUBLIC_SITE_URL` → `CLIENT_URL` → `FRONTEND_URL`. Email/reset
fallback is `https://vowlink.co`; WhatsApp route fallback is localhost:5173.
Set the canonical origin explicitly to avoid either unintended fallback.

### Brevo / transactional email

| Variable | Requirement / behavior |
| --- | --- |
| `BREVO_API_KEY` | Required for email; backend-only transactional API key. |
| `EMAIL_FROM_ADDRESS` | Required for email; verified Brevo sender. |
| `EMAIL_FROM_NAME` | Optional; default `VowLink`. |
| `EMAIL_REPLY_TO` | Optional; omitted when blank. |
| `EMAIL_ADMIN_ADDRESS` | Optional venue-admin recipient override; blank retains the existing recipient. Set to a controlled test inbox when testing that helper. |

Transport: Brevo HTTPS API, not SMTP; there is no Gmail/provider fallback.
Requests time out after 10 seconds without automatic retries; 429 is reported
as `EMAIL_RATE_LIMITED`. Check account quotas and key IP restrictions.
Password resets remain one-hour links with generic public responses. RSVP
emails run after commit and cannot undo the RSVP. Wedding-day flags are set
only after provider acceptance, which does not prove inbox delivery. Failed or
unconfigured sends remain eligible at the next scheduler check; multiple server
instances, restarts, or flag-save failures can still duplicate wedding emails.
There is no durable email queue/delivery webhook. The venue-admin helper remains
available without a newly added trigger; existing sent flags are not backfilled.

### Paystack

| Variable | Requirement / behavior |
| --- | --- |
| `PAYSTACK_SECRET_KEY` | Backend-only; required for payment initialization, verification, and payment webhook signatures. Use test credentials locally. |
| `VITE_PAYSTACK_PUBLIC_KEY` | Frontend; required for checkout. Public key from the same Paystack mode/account as the secret key. |

These are the only Paystack environment variables referenced by the application.
Plan prices are application constants; purchases use raw amounts, not a configured
Paystack Plan ID. Do not edit historical payment records during setup.

### WhatsApp Cloud API (backend only)

| Variable | Requirement / default |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Required for automated sends; credential authorized for the configured phone/WABA. |
| `WHATSAPP_PHONE_NUMBER_ID` | Required for automated sends; Meta phone ID, not a public support phone number. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Required by the application's configured-status gate. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Required for webhook GET challenge setup; choose a private matching value in Meta. |
| `WHATSAPP_APP_SECRET` | Required for signed POST webhooks, unless an alias below supplies it. Missing/blank/whitespace-only selected secrets reject requests. |
| `META_APP_SECRET`, `FACEBOOK_APP_SECRET` | Optional signing aliases: `WHATSAPP_APP_SECRET` → `META_APP_SECRET` → `FACEBOOK_APP_SECRET`. An earlier truthy whitespace value blocks a later alias; leave unused aliases empty. |
| `WHATSAPP_GRAPH_API_VERSION` | Optional; code default `v20.0`. Match the supported version in your Meta setup; this task does not upgrade it. |
| `WHATSAPP_INVITE_TEMPLATE_NAME` | Optional; default `vowlink_invitation`. |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Optional; invitation default `en`. |
| `WHATSAPP_GUEST_NAME_PARAMETER` | Optional; invitation default `guest_name`. |
| `WHATSAPP_INVITE_MESSAGE_PARAMETER` | Optional; invitation default `invite_message`. |
| `WHATSAPP_INVITE_LINK_PARAMETER` | Legacy fallback for the body parameter **name** above, not a link value; used only if the message parameter setting is unset. |
| `WHATSAPP_URL_BUTTON_INDEX` | Optional; invitation default `0`. |
| `WHATSAPP_URL_BUTTON_VALUE_MODE` | Optional; default `slug`. Keep `slug` for the approved `https://vowlink.co/invite/` prefix. Invalid slugs fail before sending; other legacy modes are not appropriate for this template. |
| `WHATSAPP_USAGE_HASH_SECRET` | Optional stable usage-fingerprint secret; falls back to `JWT_SECRET`, then a built-in value. Review usage deduplication before rotation. |

The invitation template expects an IMAGE header, named body parameters
`guest_name` / `invite_message`, and URL button 0 with the slug only. Header
images use suitable public Cloudinary couple photos, otherwise the public
`/vowlink-logo.jpg` asset; there is no header-image environment variable.

Manual RSVP reminders reuse the credentials/webhook and credit system above.
Their template `vowlink_rsvp_reminder`, language `en`, body names `guest_name`,
`couple_names`, `rsvp_deadline`, button index 0, and slug-only value are code
constants, not extra environment variables. No automatic reminder scheduler exists.

### Other backend integrations

| Variable | Requirement / behavior |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required for uploads/media management; configure the same Cloudinary account. Keep keys server-side. |
| `AI_API_SECRET_KEY`, `OPENAI_API_KEY` | Optional/reserved; first takes precedence. AI generation is currently locked in code; setting a key does not enable it. Neither is required for normal setup/tests. |

### Frontend and Vercel share previews

| Variable | Requirement / behavior |
| --- | --- |
| `VITE_API_URL` | Local or deployed backend base including `/api`; required for production API calls/share previews. |
| `VITE_PUBLIC_SITE_URL` | Optional; browser defaults to its current origin. Set `https://vowlink.co` in production for canonical share links. |
| `VITE_PAYSTACK_PUBLIC_KEY` | Feature-required public checkout key; see Paystack above. |
| `API_URL` | Optional Vercel function alias when `VITE_API_URL` is unset; also includes `/api`. |
| `PUBLIC_SITE_URL`, `SITE_URL` | Optional Vercel function site aliases after `VITE_PUBLIC_SITE_URL`; otherwise functions use the request host. These are separate host settings from Render's variables. |

Vite exposes `VITE_` values in the browser build. Vercel functions also need
their applicable values in Vercel's environment settings; a local frontend
`.env` does not configure a deployed function. Vite's `MODE`/`DEV`/`PROD` and
GitHub Actions' `CI` are tool-provided flags, not provider credentials.

## Secret safety

- Never commit `.env` or paste production keys into source, tests, screenshots,
  issue bodies, or logs. `.env.example` must contain placeholders only.
- Root `.gitignore` already ignores `.env` at any depth, explicit client/server
  `.env`, `.env.local`, and `.env.*.local`. Other names such as `.env.production`
  are **not** covered: use the documented `.env` names locally and host settings
  in production. Ignoring a file does not untrack an already committed secret.
- Never put secrets in any `VITE_` value or `client/public/` asset.
- If a credential is exposed, revoke/rotate it with the provider and replace
  the host configuration. Deleting it from a later commit is insufficient.

## Tests and CI checks

GitHub Actions runs **Backend checks** and **Frontend checks** on pull requests
and pushes to `master`, using Node 22.x and separate npm caches. It validates
only: no deploy, production API calls, messages, migrations, or real DB startup.
Tests use synthetic identities/secrets and mock providers/databases; network
guards block unexpected external calls. No local `.env` or production secrets
are required for these unit/regression suites.

Set `CI=true` first (`$env:CI = 'true'` in PowerShell; `export CI=true` in Bash),
then run each block from the repository root to match the workflow:

```sh
cd server
npm ci
node --check server.js
node --check routes/authRoutes.js
npm test -- --testTimeout=15000
cd ..
```

```sh
cd client
npm ci
npm test -- --pool=threads --maxWorkers=1 --testTimeout=60000
npm run lint
npm run build
cd ..
```

Backend has no lint or syntax-check npm script; the two `node --check` commands
above are exactly the workflow's syntax checks and do not execute the server.
For normal test runs, `npm test` works in either package. Client also provides
`npm run preview` after building. Frontend CI limits workers and uses a 60-second
test timeout with a CI-only 10-second Testing Library wait because startup/UI
waits have intermittently timed out under load. Backend timeout is 15 seconds.
Assertions are unchanged and failures are not retried/ignored. Unset `CI` afterward
(`Remove-Item Env:CI` in PowerShell; `unset CI` in Bash).

## Deployment overview and service checklist

Current hosting: **frontend → Vercel**, **backend → Render**, **database → MongoDB
Atlas**, with public domain/DNS managed through Cloudflare/Vercel. Keep the
existing Git integrations, production branch, build/start commands, and rewrites.
The repo has both root and client Vercel configurations; preserve the project's
existing root-directory setting rather than creating a second deployment.

Before a reviewed deployment:

1. **Atlas:** separate production database/user, suitable permissions, allowed
   network access for Render, and transaction-capable topology. Review
   [RSVP operations](server/RSVP_OPERATIONS.md) for index and rollback safety.
2. **Render:** backend root `server/`, existing start script `npm start`;
   configure backend-only credentials, `NODE_ENV=production`, and canonical site
   origin. Never copy development defaults wholesale into production.
3. **Vercel:** production `VITE_API_URL` with the Render HTTPS API + `/api`,
   `VITE_PUBLIC_SITE_URL=https://vowlink.co`, and the public Paystack key. Check
   function environment values for share previews. Rebuild for Vite changes.
4. **Brevo:** verified sender/custom domain with required DNS authentication,
   transactional API access, correct sender/reply-to/admin inbox, and sufficient
   quota. No SMTP/Gmail credentials are used.
5. **Paystack:** matching public/secret keys and mode, configured payment callback
   and webhook URLs for the existing routes. Use test mode outside production;
   never reuse live payments as a setup check.
6. **WhatsApp:** registered Cloud API phone/WABA, authorized token, approved
   matching templates/language/components, HTTPS webhook at
   `/api/whatsapp/webhook`, matching verify token/app secret, and the `messages`
   subscription for delivery statuses. Account billing/eligibility must be ready.
   Automated sender credentials are separate from the public human-support number.
7. **Cloudinary:** valid upload credentials when media features are used.
   Keep public image assets accessible to Meta/social crawlers.

CI does not change Vercel/Render deployments or gate them automatically. Required
status checks and provider deployment gating are separate settings; future branch
protection can require the two CI job names above. No account IDs, credentials,
DNS record values, or production data are needed in this README. Provider-console
permissions, current DNS records, and live quotas must be checked by an authorized
maintainer; they are not reproducible from code.
