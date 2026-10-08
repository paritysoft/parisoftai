# Implementation report

## Update — empty states, Git-backed publishing, SEO (8 October 2026)

### Issues found (audit of the repository and the live site)
1. `/products` showed only "Product listings are coming soon"; `/work` showed "Case studies are on the way" — oversized placeholder panels as the primary content.
2. Without Supabase (the live configuration) the admin could not be used at all, and portfolio/product lists were hard-coded to `[]` — there was **no way to publish anything**.
3. The live contact form returned **503 "temporarily unavailable"** in production because it required Supabase.
4. Homepage showed *non-featured* items when nothing was featured; no technology-expertise section.
5. Sitemap omitted `/work` and `/products`, had no `lastmod`; Service JSON-LD duplicated the organisation; no `WebSite` schema; `og:locale` missing.
6. Product model had a single category; projects lacked key features, store links, project URL, OG image, publication date and a client-authorisation flag; platforms lacked Flutter/AI.
7. `npm run typecheck` failed on a clean checkout (needed `next typegen`).
8. Section spacing up to 120 px top + bottom per section; 8 services in a 3-column grid left an orphan row.

### Completed changes
- **Empty states**: `/products` and `/work` now present compact, real content when empty — platforms & technologies linked to each service page, the delivery process (on `/work`) and a CTA. No grids, placeholders or "coming soon". Copy adapts once items are published.
- **Populated states**: responsive grids sized to the number of items (1 item → single card, not a stretched grid); platform/category (and on `/work` company vs client) filters appear only with ≥ 4 items; long names wrap; descriptions clamp; client vs company work is badged.
- **Homepage**: order is hero → verified founder stats → services → why us → **technology expertise (new)** → process → featured projects → featured products → founder-led experience → CTA. Featured sections render only when published *and* featured items exist.
- **Git-backed CMS** (`/admin` when Supabase is not configured): env-based single-admin login (scrypt hash, signed httpOnly cookie), projects & products CRUD reusing the existing editors, Draft/Published/Archived, featured, display order, publication date, SEO title/description/OG image, uploads committed with the item in one GitHub commit → Vercel redeploy. Slug uniqueness, stale-edit detection, automatic 308 redirects on slug change, client-authorisation required to publish client work, store-link domain validation. Invalid content fails the build (previous deployment stays live). Details: [CONTENT_PUBLISHING.md](CONTENT_PUBLISHING.md).
- **Supabase path kept**: new fields added to mappers + migration `20261008000400_content_fields.sql` (RLS suite re-run: 59/59).
- **Contact form**: works without a database by emailing inquiries via Resend (success shown only if the email was actually sent). With nothing configured, the page shows an honest notice instead of a form that cannot send.
- **SEO**: per-page titles/descriptions (homepage title/description as specified), canonical, OG (+ locale) and Twitter on every page, `Organization` + `WebSite` sitewide, `Service`, `SoftwareApplication` (published products only, no ratings), `CreativeWork`, `BreadcrumbList`, `FAQPage`. Sitemap includes `/work`, `/products`, published items with real `lastmod`; drafts/archived/admin excluded. robots disallows admin/API/auth.
- **Layout**: section spacing reduced (max 96 px), consistent page bottoms, services grid 4×2 at desktop.

### Verified results (run in this session)
| Check | Result |
|---|---|
| `npm run lint` | ✅ 0 problems |
| `npm run typecheck` (clean checkout) | ✅ |
| `npm test` (Vitest) | ✅ 69/69 (22 new: publishing service, GitHub client, password, filters, redirects, email-only contact) |
| `npm run test:rls` (real PostgreSQL incl. new migration) | ✅ 59/59 |
| `npm run build` with no env vars | ✅ 26 pages, 0 warnings |
| `npm run test:e2e:git-cms` (admin → GitHub-style publish → rebuild → verify) | ✅ 54/54, run twice |
| Playwright public suite + axe (email delivery configured) | ✅ 32 passed, 4 Supabase-only skipped |
| Horizontal overflow at 320/375/390/768/1024/1440/1920 px, 8 pages | ✅ none; one `<h1>` per page |
| Lighthouse desktop: `/`, `/products`, `/work` | Perf 99–100 · A11y 100 · BP 96 · SEO 100 |
| Lighthouse mobile (simulated, in a 2-CPU container) | A11y 100 · SEO 100 · Perf 64–90 — same range as the unmodified code measured side-by-side here (70–78 on `/`); CLS 0 |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |

Scenarios covered by the E2E run: zero products/projects, one and multiple products, draft excluded, unpublish after publish (404 + gone from listing/sitemap/home), featured project on homepage, project without cover image, long title/description, direct navigation, refresh after publish (rebuild), metadata/JSON-LD in initial HTML, admin not indexable/accessible when signed out, invalid store link, duplicate slug, client work without authorisation.

### Not verified / requires external configuration
- **Not deployed**; a real GitHub commit + Vercel redeploy was not exercised (the GitHub client is unit-tested against a simulated API; the flow was tested end-to-end with local file writes + rebuilds).
- **Contact form needs Resend** env vars on Vercel, otherwise it shows the "temporarily unavailable" notice.
- **Admin needs** `ADMIN_*` and `GITHUB_CONTENT_*` env vars.
- Mobile Lighthouse ≥ 90 not confirmed in this environment (CPU-limited container; measure on the deployed site with PageSpeed Insights).
- Real company contact email, social profiles and logo are still unknown, so they are not in structured data.

---


_Date: 8 October 2026 · Status: built and tested locally; **not deployed**._

## 1. Features completed

**Public website**
- Homepage: sticky glass header with active indicator and accessible mobile drawer; hero with original "parity" device visual (CSS/SVG, pointer parallax, reduced-motion fallback); verified-only statistics with count-up; 8 service cards; featured work; company products (visually distinct); "why choose us" bento grid; 5-step process timeline (horizontal → vertical stepper); testimonials that fall back to factual highlights; gradient CTA; footer with dynamic year and no placeholder contact details.
- 8 service pages with unique copy: problems solved, capabilities, tech stack, benefits, approach, related work (when available), FAQ (+ FAQPage schema), CTA, other services.
- Portfolio (`/work`) with platform/category filters (only filters that have content), case-study pages with gallery and links; empty state until projects are published.
- Products (`/products`) and product pages with store links shown only when configured; related products.
- About (mission/vision + blocks), Contact, Privacy, Terms (drafts flagged for legal review).
- Contact form: RHF + Zod, accessible errors and focus management, server-confirmed success, configurable budget/timeline options, consent, honeypot, minimum fill time, IP-hash rate limiting, same-origin check, idempotency key (no duplicates on retry), Resend notification with failure recording + retry, analytics event without personal data.
- SEO: per-page titles/descriptions/canonicals, Open Graph + Twitter cards, generated OG image, Organization / Service / SoftwareApplication / CreativeWork / BreadcrumbList / FAQPage JSON-LD, sitemap (published + indexable only), robots (admin/API disallowed; previews fully disallowed).
- Security headers: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP; `X-Powered-By` removed; admin `noindex` + `no-store`.

**Admin panel / CMS**
- Supabase Auth login, logout, password reset, invite acceptance, set-password; no public sign-up; bootstrap script for the first Super Admin.
- Roles Super Admin / Admin / Editor enforced in Server Actions (`withPermission`) and in Postgres RLS; deactivation; last-super-admin protection.
- Dashboard: real counts, inquiries-per-week and by-status charts, recent content/inquiries/admin activity, quick actions; honest "traffic lives in Vercel" state.
- Pages CMS: homepage hero + section visibility/order/headings/items; block editor (heading, paragraph, rich text, image, CTA, feature grid, stats, FAQ, testimonial) for About/Contact/legal; draft → preview → publish with confirmation; revision history with restore; unsaved-changes warning.
- Services, Portfolio, Products CRUD with status (draft/published/archived), ordering, featured flags, galleries, store links, SEO fields, slug-change redirects.
- Leads CRM: search, filters, sort, pagination, detail view (auto-marks read), status, assignment, internal notes, CSV export (selected or all, formula-injection safe), delete, notification retry, retention purge.
- Media library: direct-to-storage upload, server-side verification (magic bytes, size, SVG safety; SVG admin-only), alt text/title, search, usage check before delete.
- SEO manager (per-path overrides incl. noindex/canonical/OG), Settings (general, branding colours, SEO defaults, notification recipients, contact form, retention), Users (invite, roles, activate/deactivate), Audit log (append-only).
- On-demand revalidation: publishing updates the live site without redeploying; preview deployments guarded against writing to production data.

## 2. Routes implemented
See [SITE_MAP.md](SITE_MAP.md): 11 public page routes (8 service pages pre-rendered at build), sitemap/robots/OG image/icon, 20 admin pages + 3 auth pages, and 5 API/auth handlers.

## 3. Tests executed and results (all run in this session)

| Check | Result |
|---|---|
| `npm run lint` (ESLint, Next core-web-vitals + TypeScript) | ✅ 0 errors, 0 warnings |
| `npm run typecheck` (strict TS) | ✅ pass |
| `npm test` (Vitest unit) | ✅ **47/47** |
| `npm run test:rls` (real PostgreSQL 16, all migrations + seed) | ✅ **59/59** policy checks |
| `npm run build` without Supabase (CI path) | ✅ pass |
| `npm run build` against the local Supabase-compatible stack | ✅ pass |
| `npm run test:e2e:local` (Playwright, fresh DB each run) | ✅ **53/53** — public 20, contact 7, admin 17, axe 9 |
| axe-core (WCAG 2.0/2.1/2.2 A+AA) on 9 pages | ✅ 0 serious/critical violations |
| Lighthouse (mobile, devtools throttling) — Home / Service / Contact | Performance 95 / 96 / 95 · Accessibility 100 · Best Practices 93–96 · SEO 100 |
| Lighthouse (mobile, simulated throttling) — Home / Service / Contact | Performance 91 / 92 / 96 · LCP 3.2 / 3.1 / 2.5 s (simulated) |
| Lighthouse (desktop) | Performance 99–100 |
| Layout shift (PerformanceObserver, 1350 & 412 px) | CLS 0.000 |
| Real LCP, 4× CPU throttle | 236 ms (= first contentful paint) |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities in production dependencies |

Notes on the measurements:
- Lighthouse ran against a local production build inside a container; field data on Vercel will differ. Simulated-throttling LCP is a model estimate; the real browser LCP was measured separately.
- `npm audit` (including dev dependencies) reports 5 "high" findings in `braces` via `eslint-config-next` → `fast-glob`. They affect lint tooling only (not shipped); the suggested fix downgrades to Next 14's config, so it was not applied.
- The E2E suite uses a test-only gateway that emulates the parts of Supabase Auth/Storage the app calls, in front of real PostgreSQL + PostgREST with the real RLS policies. It cannot prove behaviour of Supabase's hosted Auth emails (invites, resets) — verify those manually after setup.

Issues found and fixed during testing: page content streaming in after the hero (CLS 0.24) → removed the public `loading.tsx`; hero headline hidden until JS ran (slow mobile LCP) → headline/description now render immediately; Motion library hydration cost → replaced with CSS + rAF; accented filenames producing broken slugs; toggle-knob misalignment; duplicated "Privacy Policy" in the consent label; lower-cased service names in CTAs.

## 4. Remaining limitations
- **Not deployed** and not yet run against a hosted Supabase project; follow DEPLOYMENT.md, then run the go-live checklist.
- **Blog** (mentioned in the Claude Project description) is not built — it was not in either master prompt's route list. The data/block/markdown infrastructure makes it a straightforward addition.
- Editors cannot modify published items (only admins can) — a deliberate simplification of "draft changes to live content". Admins' edits to published collection items go live on save; page content has full draft/publish.
- Vercel Web Analytics data is viewed in Vercel, not inside the admin (no data is fabricated).
- Rich text is Markdown with preview rather than a WYSIWYG editor (safe by construction: raw HTML is never rendered).
- No error-tracking service (e.g. Sentry) integrated.
- Rate limiting trusts Vercel's `x-real-ip`; review if hosting elsewhere.
- shadcn/ui was not installed (its registry was unreachable from the build environment); components were written in the same style without the dependency.

## 5. Missing business content
See [CONTENT_REQUIREMENTS.md](CONTENT_REQUIREMENTS.md) — notably: contact email, notification recipients, legal review, real products and portfolio items, verification of the 24.2K users / 200+ subscribers figures (currently hidden), testimonials (none shown until approved), social links, confirmation of budget ranges.

## 6. Required environment variables
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `…_ANON_KEY`), `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), `RATE_LIMIT_SALT`; optional `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`, `SUPABASE_PRODUCTION_PROJECT_REF`, `ANALYTICS_DASHBOARD_URL`. Details in `.env.example`.

## 7. Deployment steps (summary)
1. Create production + staging Supabase projects; apply `supabase/migrations/*` and `supabase/seed.sql`.
2. Disable sign-ups, set redirect URLs, update Invite/Reset email templates, configure SMTP.
3. Bootstrap the first Super Admin.
4. Import the repo into Vercel, set env vars per environment, enable Web Analytics, deploy.
5. Add `parisoftai.com` + `www` redirect using the DNS records Vercel shows.
6. Verify Resend domain; test the contact form and admin flows on production.
Full instructions: [DEPLOYMENT.md](DEPLOYMENT.md).
