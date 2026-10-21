# VowLink

VowLink is a full-stack wedding invitation platform for couples, guests, and venues. Couples can create digital invitations, manage RSVPs, customize public invite themes, send bulk WhatsApp invitations, collect gift contributions, and manage wedding details from an admin dashboard.

## Features

- Couple/admin authentication with JWT access and refresh tokens
- Wedding dashboard with countdown, guest stats, RSVP stats, and seating tools
- Invitation creation, editing, deletion, and public invite pages
- RSVP collection with meal preferences, plus-one policy, kids policy, and deadlines
- Bulk invitation import and WhatsApp bulk sending queue
- Theme and template customization, including uploaded and AI-generated backgrounds
- Default guest invite theme setting: dark, light, or system
- Public invite light/dark toggle with per-invite guest preference storage
- Music, gallery, slideshow, gift registry, wish wall, and share preview sections
- Venue owner portal with venue listings, photos, subscriptions, and inquiries
- Paystack integration for upgrades and guest gifts
- Cloudinary uploads for media and generated images
- OpenAI-powered message/background generation with plan-based credits

## Tech Stack

| Layer | Technology |
| --- | --- |
| Client | React 19, Vite 7, React Router, Tailwind CSS, React Hook Form, Zod |
| Server | Node.js, Express 5, Mongoose |
| Database | MongoDB |
| Auth | JWT, bcryptjs |
| Media | Cloudinary |
| Email | Brevo transactional HTTPS API |
| Payments | Paystack |
| AI | OpenAI |

## Project Structure

```text
VowLink/
  client/                 React/Vite frontend
    api/                  Vercel/serverless helper endpoint
    public/               Static public assets and templates
    src/
      components/         Shared UI and feature components
      context/            Settings provider and shared state
      pages/              Public, admin, and venue pages
      utils/              API client, schemas, template layout helpers
  server/                 Express backend
    middleware/           Auth middleware
    models/               Mongoose models
    routes/               Auth, invitations, RSVPs, venues, AI routes
    utils/                Email and credit helpers
  vercel.json             Root deployment/routing config
  README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB database
- Cloudinary account for uploads
- Brevo transactional API key and an approved custom-domain sender
- Paystack keys for payments
- OpenAI API key for AI features

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
PUBLIC_SITE_URL=http://localhost:5173
FRONTEND_URL=

BREVO_API_KEY=
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=VowLink
EMAIL_REPLY_TO=
EMAIL_ADMIN_ADDRESS=
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PAYSTACK_SECRET_KEY=your_paystack_secret_key
OPENAI_API_KEY=your_openai_api_key
# Optional alternative used by the AI route:
AI_API_SECRET_KEY=your_openai_api_key
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## Local Development

Install and run the backend:

```bash
cd server
npm install
npm run dev
```

Install and run the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```

Default local URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- API base: `http://localhost:5000/api`

## Scripts

Client:

```bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
```

Server:

```bash
cd server
npm run dev
npm start
```

## Deployment

Frontend is designed for Vercel. Set the client environment variables in Vercel and deploy the `client` app or use the repo deployment setup.

Backend can be deployed to Render, Railway, or another Node host. Set all server environment variables and use:

```bash
npm start
```

After deploying the server, update the frontend `VITE_API_URL` to point to the deployed API URL.

## Notes

- Do not commit `.env` files or secrets.
- Anything placed in `client/public` is shipped publicly.
- Public invite guest theme preferences are stored per invite in localStorage.
- Run `npm run lint` and `npm run build` in `client` before shipping frontend changes.

## CI checks

GitHub Actions runs `Backend checks` and `Frontend checks` on pull requests and
pushes to `master`, using Node.js 22 and separate npm caches for each lockfile.
The root package has no check scripts and is not installed by CI. No production
secrets are required: test setup supplies synthetic credentials and blocks external
network calls. CI does not start the server, deploy, send messages, or migrate data.
Vercel/Render settings are not modified. Requiring successful checks before
deployment is a separate repository/provider setting.

To run the same checks locally with Node.js 22, set `CI=true` (`export CI=true`
in Bash or `$env:CI = 'true'` in PowerShell), then run each block from the
repository root:

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

Frontend CI uses one worker, a 60-second per-test timeout, and a CI-only 10-second
Testing Library UI wait because worker startup and UI waits have intermittently
timed out under load. Backend tests use a 15-second per-test timeout. Assertions
are unchanged; failures are not retried or ignored. Unset `CI` afterward
(PowerShell: `Remove-Item Env:CI`). Future branch protection can require the two
job names above; this workflow does not change repository settings.


## Transactional email

Email uses Brevo HTTPS (`POST https://api.brevo.com/v3/smtp/email`), not SMTP.
Set `BREVO_API_KEY` and `EMAIL_FROM_ADDRESS` on the backend. The sender must be
approved in Brevo; there is no fallback sender. `EMAIL_FROM_NAME` defaults to
`VowLink`. `EMAIL_REPLY_TO` is optional. `EMAIL_ADMIN_ADDRESS` optionally overrides
the existing venue-admin recipient; leaving it blank preserves that recipient.
Never put the API key in frontend variables or commit it.

Production links use `PUBLIC_SITE_URL=https://vowlink.co`, falling back to
`CLIENT_URL`, then `FRONTEND_URL`, then the production URL. Local development
should use `PUBLIC_SITE_URL=http://localhost:5173`.

Requests time out after 10 seconds and are not automatically retried. Rate limits
are reported as `EMAIL_RATE_LIMITED`; operational logs omit email contents,
recipients, credentials, and provider response bodies. Account quotas and API-key
IP restrictions must be checked in Brevo before cutover.

Password resets retain their one-hour link and generic public response. RSVP
emails run after commit and cannot undo a saved RSVP. Wedding-day checks run on
startup and every 12 hours: the sent flag is set only after provider acceptance.
Acceptance does not guarantee inbox delivery. Failed or unconfigured sends remain
eligible for the next check; restart/multiple-instance or flag-save failures can
still cause duplicate wedding emails. There is no durable email queue or delivery
webhook in this migration. The venue-admin helper is retained without adding a
new trigger. Existing sent flags are not backfilled or reset during migration.
