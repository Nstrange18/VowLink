# VowLink engineering handoff

Updated: 22 September 2026. This document summarizes the work and decisions from the previous chat so a new chat can continue safely. Historical test results below are the last verified results, not a claim that tests were rerun when this document was created.

## Start here in the new chat

Read this document and the repository instructions before working. Check the current branch, working tree, and recent history. VowLink is a live product: preserve production behavior and work on one explicitly approved task at a time. Do not automatically implement the remaining roadmap.

The immediate unresolved issue is failed production WhatsApp invitation sends. Diagnostic logging has been added, tested, committed, and pushed, but the actual Meta rejection has not yet been captured. First establish whether Render is running the diagnostic commit and inspect any available sanitized failure logs. Do not retry a send or change code without a new instruction from the user.

Suggested opening message to paste into a new chat:

> Read VOWLINK_HANDOFF.md in C:\Projects\VowLink and inspect the current Git state. Continue from this handoff. Do not implement another phase, retry WhatsApp sends, or change production behavior yet. Summarize the current state and help me inspect the newly available WhatsApp diagnostics first.

## Repository and deployment context

- Local repository: `C:\Projects\VowLink`.
- Branch used throughout this work: `master`, explicitly authorized by the user.
- Remote: `origin`, `https://github.com/Nstrange18/VowLink.git`.
- Tracking branch: `origin/master`.
- Production website: `https://vowlink.co`.
- Backend logs: Render service named `vowLink-backend`.
- Latest engineering commit: `57d082b939bf8d11f0b90a8e46529e9f50cedb20`.
- The latest authorized push succeeded: `e218147..57d082b master -> master`.
- The working tree was clean before creating this handoff. This document is a new local file; it has not been committed or pushed by this task.
- Pushing is not proof that the corresponding Render deployment is live. Deployment status has not been verified.

## Working rules agreed with the user

- Harden the existing application gradually; do not rewrite it.
- Preserve authentication, invitations, guest management, RSVP, WhatsApp sending, imports, seating, customization, Paystack, dashboards, public links, and existing integrations.
- Inspect and propose a small change before implementation when requested; wait for approval.
- Test before major refactoring. Use focused, meaningful regression tests rather than implementation-detail tests.
- Keep changes independently reviewable. Do not mix formatting, features, refactors, and fixes.
- Do not touch unrelated files or local edits.
- Do not install dependencies without explaining the reason.
- Do not expose credentials, reset tokens, private links, customer data, or provider request bodies in output or logs.
- Tests must not call MongoDB, Meta, Paystack, email services, OpenAI, Cloudinary, or other external services.
- Do not import the real server entry point in tests: it can connect to the database and start scheduled jobs.
- Do not commit or push unless explicitly requested for the current work. Never force-push, amend, squash, merge, or manufacture history without explicit authorization.
- Stop after the approved task. Do not automatically advance to CI, refactoring, or another security finding.

## Completed work and real commit history

These entries were confirmed against Git history when this document was created.

| Commit | Message | Outcome |
| --- | --- | --- |
| `46e4084` | `test: add backend auth middleware regression coverage` | Jest/Supertest foundation and 13 authentication middleware tests. |
| `7e34ee4` | `fix: restrict dev admin seeding to development` | Explicit development-only guard and 15 additional tests; backend total 28. |
| `61c8067` | `fix: fail closed on invalid WhatsApp webhook verification` | Verifier-only correction and 23 additional tests; total 51. |
| `1e4c52a` | `fix: remove sensitive data from password-reset logs` | Static operational logs and 15 additional tests; total 66. |
| `13d1df3` | `test: add frontend invitation regression coverage` | Frontend harness and seven invitation regression tests. |
| `994200f` | `fix: clear frontend lint baseline` | Four narrowly scoped lint fixes; zero errors and warnings. |
| `b60beb2` | `fix: update WhatsApp contact information in LandingFooter` | Contact-number update, committed separately from lint cleanup. |
| `57d082b` | `fix: retain sanitized WhatsApp send failure diagnostics` | Bulk-send failure diagnostics and 19 additional backend tests; total 85. |

### Backend authentication foundation

- Backend uses CommonJS, Jest, and Supertest.
- `server/package.json`: `npm test` runs `jest --runInBand`.
- Configuration: `server/jest.config.cjs`.
- Shared isolation: `server/tests/setup.cjs`.
- Authentication tests: `server/tests/auth.test.cjs`.
- Covers missing, malformed, expired, incorrectly signed, and valid JWTs, plus existing middleware behavior. Does not add role restrictions to the authentication middleware.
- Synthetic identities and test-only JWT secret are used.
- A test-only Express app mounts middleware/routes. Network guards allow only the registered loopback test server and block external fetch/TCP access unless fetch is explicitly mocked.

### Development admin endpoint

- `/make-admin-dev` is allowed only when `NODE_ENV === "development"`.
- Production, staging, test, missing, and unrecognized environment values return HTTP 403 with:

```json
{"message":"Development admin seeding is disabled."}
```

- The guard runs before MongoDB access or other endpoint side effects.
- Existing development behavior was preserved, without adding authentication to that path.
- Regression file: `server/tests/make-admin-dev.test.cjs`.

### WhatsApp webhook verification

- Missing, empty, or whitespace-only selected secrets fail closed.
- Existing precedence remains: `WHATSAPP_APP_SECRET`, then `META_APP_SECRET`, then `FACEBOOK_APP_SECRET`.
- Existing truthy fallback semantics remain: empty values can fall through; a selected whitespace-only value is rejected.
- `x-hub-signature-256` must be exactly `sha256=` followed by 64 hexadecimal characters.
- HMAC-SHA256 and timing-safe comparison are preserved.
- Invalid verification returns HTTP 403 plain text `Forbidden` before database/webhook side effects.
- GET webhook verification was not changed.
- Regression file: `server/tests/whatsapp-webhook.test.cjs`.

### Password-reset log privacy

- Changes limited to reset-related logging in `server/routes/authRoutes.js` and its regression tests.
- Removed full reset links/tokens, recipient emails, provider error messages, and whole error objects from the covered logging paths.
- Unconfigured SendGrid produces a static configuration warning instead of dumping a reset URL.
- Static request/token-storage/delivery/failure events preserve operational visibility.
- Token generation, expiry, URL construction, database operations, email contents/delivery, API responses, and completion behavior were preserved.
- `server/tests/password-reset-logging.test.cjs`: 12 privacy tests and three behavior tests, 15 total.

### Frontend invitation foundation

- Stack: Vitest, React Testing Library, user-event, jsdom.
- Files: `client/package.json`, `client/package-lock.json`, `client/vitest.config.js`, `client/src/test/setup.js`, `client/src/pages/InvitePage.test.jsx`.
- Tests mount existing invitation/RSVP pages with router behavior preserved; API/services are mocked.
- Seven tests cover loading, successful loading/theme behavior, not-found state, invalid RSVP data, yes/no submissions, and failed submission/retry interaction.
- No component extraction, styling changes, or production behavior changes were needed.
- Harness versions include Vitest `~4.0.18` and jsdom `^26.1.0`, selected for the existing environment. Do not casually upgrade them as part of unrelated work.

### Frontend lint cleanup

- `client/eslint.config.js`: API override uses ES module source type while preserving Node globals.
- `client/src/components/ColorPicker.jsx`: selected color is derived as a string before `useMemo`, which depends on that string.
- `client/src/pages/admin/AdminSettingsPage.jsx`: removed only the unused `isPro` binding.
- `client/src/pages/admin/SuperAdminDashboardPage.jsx`: `fetchData` wrapped in `useCallback([analyticsRange])`; effect depends on `fetchData`. Initial load, range changes, and manual refresh remain intact.
- No lint rules disabled. No broad formatting or refactoring.
- Last verified frontend result: zero lint errors/warnings, seven tests pass, production build passes.

### Contact number

- User supplied new public contact number: `09116443591`.
- Landing footer WhatsApp link: `https://wa.me/2349116443591`.
- Display number: `+234 911 644 3591`.
- This edit was excluded from the lint commit and later committed separately as `b60beb2`.
- It is no longer an outstanding uncommitted edit.

## Current WhatsApp send investigation

### Observed failure and limits of the evidence

- User reported a failed send on deployed `vowlink.co`, with status changing to “Could not send” after about three seconds.
- Screenshot showed the bulk sender result: “0 invites submitted, 2 failed.”
- Render screenshot showed startup messages and Mongoose deprecation warnings, not a Meta rejection.
- The exact Meta HTTP status, error code, subcode, type, original message, and billing restriction status were NOT established.
- A three-second delay does not prove that Meta received the request.
- No real send was retried during diagnosis or implementation.
- An attached backend terminal was unavailable; browser access to Render could not be established. Do not assume the next chat has connected log access.

### Why the original failure could not be diagnosed

- Sender: `server/utils/whatsappCloud.js`, `sendInvitationTemplate`.
- Uses fetch to POST to the Graph API `/messages` endpoint.
- Previously converted a failed response into a plain Error using `error_data.details`, then `error.message`, then a status fallback. Structured fields were discarded.
- Individual failures inside `/send-bulk` were caught without logging the original error. The route stored/returned the public failure message.
- The outer “Bulk send failed” log only applies to errors escaping that individual handler.
- A completed bulk request can return HTTP 200 containing failed results. This is the application's HTTP status, not Meta's status.
- Earlier advice to search for “Single invite failed” did not apply to the screenshot's bulk request.

### Diagnostic improvement now committed and pushed

Exactly four files changed in `57d082b`:

- `server/utils/whatsappCloud.js`
- `server/utils/whatsappSendDiagnostics.js`
- `server/routes/whatsappRoutes.js`
- `server/tests/whatsapp-send-diagnostics.test.cjs`

The individual bulk handler now logs this event before refund/save processing:

```text
[WHATSAPP SEND] Individual bulk send failed.
```

Approved diagnostic fields, where available and safe:

```text
failureSource
httpStatus
metaCode
metaSubcode
metaType
metaMessage
fbtrace_id
```

Failure categories:

| Category | Meaning |
| --- | --- |
| `meta_http_error` | Meta returned an unsuccessful HTTP response. |
| `no_http_response` | Fetch failed without an HTTP response; whether Meta received the request is unknown. |
| `application_before_meta_response` | Application-side failure with no retained Meta response metadata. |
| `application_after_meta_acceptance` | Processing failed after the sender returned acceptance. |
| `application_after_meta_http_response` | A successful HTTP response could not be parsed; acceptance is unknown. |

- Metadata is kept in a WeakMap separately from the Error.message used by existing public error mapping.
- Provider message handling is deliberately conservative: only a small allowlist of non-personal messages is retained; other text becomes a static privacy fallback.
- Type/trace fields are format-checked and checked against known sensitive values. Trace values containing long digit sequences are withheld as potentially phone-like.
- No full errors, headers, requests, payloads, or response bodies are added to these new logs.
- This was not a global logging cleanup. Existing unrelated logs were outside scope.
- UI/API response shape and messages, counts, refunds, payloads, templates, billing/WABA configuration, and webhook verification were unchanged.
- Regression tests preserve the existing unusual case where a save failure after acceptance can increment both submitted and failed counts; no accounting redesign was attempted.
- Nineteen new tests cover structured 4xx/5xx errors, fields and trace retention, privacy, malformed/non-JSON responses, network/application errors, accepted-send processing failures, unchanged responses/refunds, and no retries.

### Next diagnostic step (requires user direction; not yet performed)

1. Read-only check whether Render has deployed commit `57d082b` or a descendant containing it.
2. Inspect any naturally occurring failure logs for the event above. Do not initiate or retry sends merely to generate a log.
3. Report only sanitized fields and clearly distinguish application HTTP status from Meta HTTP status.
4. Determine billing/payment restriction only from actual evidence; do not assume a code such as 131042 because it appears in synthetic tests.
5. Propose the smallest correction if evidence supports one, and wait for approval before changing behavior.

The new instrumentation cannot retroactively recover structured fields discarded for the old failed sends.

## Verification commands and latest results

Run from the indicated package directory:

```powershell
cd C:\Projects\VowLink\server
npm test
```

- Final pre-commit run: five backend suites, **85 tests passed**, no failures.
- Existing suites: authentication 13, dev admin 15, webhook 23, password-reset 15.
- New diagnostics suite: 19 tests.
- A prior sandbox run timed out in one existing password-reset test. A rerun outside the sandbox passed all tests, as did the final pre-commit run. Do not alter production code or weaken unrelated tests to hide environment timeouts.

```powershell
cd C:\Projects\VowLink\client
npm run lint
npm test
npm run build
```

- Last frontend verification: zero lint errors/warnings, **seven tests passed**, build passed.
- Run these sequentially; concurrent verification previously caused timing contention.
- Existing build warning: circular chunk relationship `vendor -> react-vendor -> vendor`. It was not fixed in this work.
- Frontend checks were not rerun for the backend-only diagnostic commit.
- No deployment or real external-service end-to-end test is implied by these unit/integration results.

## Remaining engineering roadmap

The original assessment covered missing tests/CI, large files, duplicated helpers, weak linting, missing environment examples, inconsistent logging/error handling, setup reproducibility, and unfocused history. The roadmap is only partially complete. Reinspect current code before each phase; earlier audit findings are not automatically current defects.

1. **Phase 0: audit — completed historically.** Inspected frontend/backend structure, scripts/build, lint/tests, large files, utilities, errors/logging, environment references, README, clean-install/build, independent startup, and refactor risks. InvitePage was roughly 4,900 lines at audit time. Exact counts should be remeasured. Audit was followed by explicit task approvals rather than a blanket implementation approval.
2. **Phase 1: broader safety net — partially complete.** Foundations above exist. Still consider signup/login routes, invitation fetch/create, additional RSVP behavior, WhatsApp request validation, health endpoint coverage when approved, and more invitation customization coverage. Mock external services. Do not mistake middleware tests for complete authentication-route coverage.
3. **Phase 2: CI — not started.** Proposed GitHub Actions on push and pull_request with deterministic installs, client lint/tests/build and backend lint/tests. Backend lint needs an approved setup before requiring it. No automatic deployment addition.
4. **Phase 3: lint/format — partly complete.** Frontend baseline is clean. Backend lint and possible formatting scripts remain. Prettier has not been added. Keep broad formatting separate from functional changes.
5. **Phase 4: environment documentation — not implemented here.** Inventory all referenced variables, create placeholder-only `client/.env.example` and `server/.env.example`, update README setup. Cover MongoDB/JWT/Meta/Paystack/OpenAI/email and public URLs where actually used. Never copy real secrets.
6. **Phase 5: duplicated utilities — not started.** Inspect `resolveWeddingColors`, color/luminance/contrast helpers, and `getSpotifyEmbedUrl`. Characterize current behavior with tests, extract shared helpers, replace callers, rerun tests/build. No behavior changes during extraction.
7. **Phase 6: large-component extraction — not started.** Do not rewrite InvitePage. Extract one logical section at a time, preserving state/props/routes/API calls/UI. Possible boundaries include hero, event details, RSVP, ornaments, story, gifts, Spotify, gallery, footer, hooks/utilities. Use tests/build for each focused change.
8. **Phase 7: global error handling/logging — not started broadly.** Password-reset privacy and bulk-send diagnostics are isolated completed improvements. A central lightweight logger, Express error middleware, compatible response handling, and a tested GET /health remain proposals. Avoid leaking secrets or personal data. Do not standardize API shapes without compatibility review.
9. **Phase 8: fresh-clone reproducibility — final validation remains.** Earlier audit reported a tracked snapshot could install/build; this is not proof that all setup documentation and independent startup are now complete. Revalidate clone/install/configure/test/build/start steps after approved setup changes. Docker only if materially useful and explicitly scoped.
10. **Phase 9: engineering discipline — ongoing.** Continue genuine focused commits with matching tests and clear purpose. Never invent contributors/issues/PRs, backdate commits, split historical commits artificially, or create meaningless tests/commits.

## Areas requiring special caution later

- Database connection and scheduled jobs are coupled to real server startup; maintain test isolation.
- WhatsApp credit reservation/refund and post-acceptance processing are production-sensitive. Do not change them as a side effect of logging work.
- Do not infer a Meta payment problem from the application's own allowance checks or HTTP 402/500 responses.
- InvitePage/customization behavior has many variants and must be characterized before extraction.
- README runtime requirements and setup guidance need fresh review; do not rely on an old Node 18 recommendation for the current frontend stack.
- Earlier audit noted server Axios dependency reliance and root/client preview endpoint differences. Reinspect and request a separate scope before acting; neither was addressed here.
- The eventual definition of done includes passing installs/build/tests/lint/CI, documented environment setup, reliable backend startup, critical-flow coverage, gradual component/utility improvements, safe structured errors, and preservation of live behavior. That full objective has not yet been completed.
