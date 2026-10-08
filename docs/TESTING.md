# Testing

| Suite | Command | What it covers |
|---|---|---|
| Lint / types | `npm run lint`, `npm run typecheck` | ESLint (Next core-web-vitals + TS), strict TypeScript |
| Unit | `npm test` | Lead submission logic (validation, honeypot, timing, rate limit, idempotency, storage/email failure paths), URL & redirect safety, CSV injection, HTML escaping, image sniffing & SVG safety, permission matrix, content schemas, seed validity |
| RLS | `npm run test:rls` | Applies every migration to a throwaway PostgreSQL and checks 59 rules for anon, signed-in non-staff, deactivated admin, editor, admin, super admin and service role, plus slug-redirect and `updated_by` triggers |
| E2E | `npm run test:e2e:local` | Starts PostgreSQL + PostgREST + a small Supabase-compatible gateway (auth + storage, test-only), builds the app, then runs Playwright: public pages, SEO, headers, responsiveness at 7 widths, mobile drawer focus handling, reduced motion, contact form (validation, storage, duplicates, spam, rate limit), admin login/redirects, role restrictions (incl. tampered requests), publishing & revalidation, slug redirects, leads CRM & CSV, page drafts/preview/publish, SEO noindex, settings, last-super-admin protection, media upload verification, audit log, sign-out; axe accessibility scans on 9 pages |

Requirements for RLS/E2E: PostgreSQL 15+ server binaries (`PG_BIN` if not auto-detected) and, for E2E, a PostgREST binary (`POSTGREST_BIN`). Set `PW_CHROMIUM_PATH` to use an existing Chromium, otherwise run `npx playwright install chromium`.

The test gateway (`tests/integration/stack.mjs`) emulates only what the app uses from Supabase Auth/Storage; it is a test harness, not a production component. Before launch, also run the manual checks in DEPLOYMENT.md §7 against real Supabase.
