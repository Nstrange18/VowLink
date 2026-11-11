# Local Wedding FAQ QA

From `server/`, run `node scripts/faq-local-qa.cjs`. It uses the cached Windows
MongoDB executable when present. Otherwise pass an installed `mongod` path as
the first argument. No dependency installation is required.

The launcher never loads `.env` or starts `server.js`. It creates a fresh,
synthetic database in the OS temporary directory, binds MongoDB to
`127.0.0.1:27027`, and runs existing auth and invitation handlers on
`127.0.0.1:5055`. It blocks external backend connections and exposes only login,
refresh, profile GET/PUT, and the test invitation's public reads. Email,
WhatsApp, payment routes, and the wedding-day scheduler are unavailable.
Vite uses port 5188 with an explicit local API override. Existing servers and
environment files remain untouched. Occupied QA ports cause startup to fail.

1. Open <http://localhost:5188/admin/login> in a separate browser profile or
   private window so your usual local session remains intact.
2. Sign in with `faq-qa@example.test` / `FaqLocalOnly123!` (synthetic local-only
   credentials). The couple is **Local & QA Couple**, tier Pro.
3. Open Settings → Wedding FAQ. Edit questions, publish, and save.
4. Open <http://localhost:5188/invite/local-faq-qa>. This is the real InvitePage,
   using the real public endpoint and Mongoose models. Refresh after saves.
5. Verify inline errors for blank questions/answers, dirty/saving/success states,
   keyboard focus, 10-item limits, mobile layout, and light/dark themes.
6. Disable publishing and save; refresh the guest page and confirm FAQ omission.

Startup checks login → authenticated FAQ save → database → public projection,
including disabled-content omission, then leaves a published sample FAQ.
These checks fail startup if persistence or projection fails. No production
records or credentials are used. This limited QA server is for FAQ verification;
use the normal isolated development setup for other product features.

Ctrl+C stops the launcher and child processes. Each launch creates a new dataset;
temporary database files can be removed after shutdown. Changes are intentionally
not persistent between QA sessions. The launcher does not inspect your existing
browser account or any configured remote database.
