# Changelog

All notable changes to Bahia AI are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [2.0.0] - 2026-08-24

### Security
- **CRITICAL:** removed a real JWT secret leaked via `.env.example`; server now refuses to start in production with missing/known-insecure secrets (`config/env.js`). **Action required: rotate the `JWT_SECRET` on your hosting provider.**
- Rate limiting on `/api/auth/*` (20 attempts / 15 min) against credential brute force.
- Stack traces and library internals are never returned to clients; errors return a stable message plus an `errorId` for support lookup.
- CORS no longer accepts wildcard origins with credentials; explicit origins only.
- Structured audit events (auth, checkout) logged for compliance review.

### Fixed
- dotenv was loaded *after* module-level env reads due to ESM import hoisting — CORS origins and `ML_SERVICE_URL` silently ignored `.env` values. Env now loads first.
- Legacy `Doctor`/`Researcher` accounts are auto-upgraded to `Admin` at login and on each authenticated request.
- Evaluation page no longer displays fabricated ROC/precision-recall curves; shows real stored metrics only.
- History page: filters are functional; NaN confidence guarded; loading/error states added.
- Prediction page: paywall banner reflects credit state; errors surface actionable messages.

### Added
- Frontend `ErrorBoundary` — crashes show a recovery screen instead of a white page.
- API client: 45s timeout, automatic retries on idempotent GETs, normalized error messages.
- Sentry monitoring behind optional `SENTRY_DSN` env var.
- Patient consent capture required at registration (medical disclaimer + data storage).
- Test suite: `npm test` (unit) and `npm run smoke <base-url>` (end-to-end flow usable against Railway).
- Role-aware dashboards: separate patient portal vs clinical console.

### Known limitations
- The "Simple" risk check maps questionnaire answers onto lab-feature ranges heuristically; results are screening estimates only, never diagnostic.
- Audit logs currently ship to stdout — for HIPAA-grade compliance, forward them to append-only storage with retention policies.
- Payments are mocked ("preview mode"); Stripe Checkout integration point is marked in `payment.controller.js`.

## [1.x]
Initial platform: multi-model training workbench (KNN/SVM/DT/RF), dataset upload workflow, dashboards, Supabase/Mongo persistence, SaaS plan scaffolding.
