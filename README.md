# ParitySoft AI — Website & CMS

Corporate website and admin panel for **ParitySoft AI** (parisoftai.com), built as a single Next.js application backed by Supabase.

- **Public site**: Home, Services (+8 service pages), Our Work (case studies), Products, About, Contact, Privacy, Terms — premium dark design, restrained animations with reduced-motion support, statically generated with on-publish revalidation.
- **Admin CMS** (`/admin`): dashboard, page content (homepage sections, About, legal pages) with drafts/preview/publish/revisions, services, portfolio, products, leads CRM with CSV export, media library, SEO, analytics, users & roles, settings, audit log.
- **Security**: Supabase Auth (no public sign-up), role-based access (Super Admin / Admin / Editor) enforced in Server Actions **and** Postgres Row Level Security, validated server-side with Zod, rate-limited + spam-protected contact form, strict security headers.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, self-hosted Manrope / Inter / JetBrains Mono via `next/font/local` |
| Animation | CSS keyframes + small IntersectionObserver / rAF utilities (no animation library on the public site — see DESIGN_SYSTEM.md) |
| Forms | React Hook Form + Zod (shared client/server schemas) |
| Data | Supabase Postgres + Auth + Storage, SQL migrations with RLS |
| Email | Resend HTTP API (optional) |
| Analytics | Vercel Web Analytics |
| Tests | Vitest (unit), custom RLS suite (real Postgres), Playwright + axe (E2E/a11y) |

> **Why Supabase rather than Prisma?** The admin spec calls for Supabase Auth, Storage and Row Level Security. Querying through `supabase-js` keeps RLS in force for every admin request (the database itself refuses an editor's attempt to publish), which an ORM connection with a privileged role would bypass.

## Quick start (no database needed)

```bash
npm install
npm run dev          # http://localhost:3000
```

Without Supabase variables the public site runs on the bundled seed content (`src/content/*`) and the contact form validates but reports that nothing was stored. The admin panel needs Supabase.

## Full local setup with Supabase

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker, then:
   ```bash
   supabase init        # once; keeps the existing supabase/migrations
   supabase start
   supabase db reset    # applies migrations + supabase/seed.sql
   ```
2. Copy `.env.example` to `.env.local` and fill in the URL and keys printed by `supabase start`.
3. Create your first admin: `npm run admin:bootstrap -- --email you@example.com --name "Your Name"`
4. `npm run dev` and sign in at http://localhost:3000/admin/login

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint, `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rls` | Applies all migrations to a throwaway PostgreSQL cluster and checks 59 RLS rules per role |
| `npm run test:e2e:local` | Fresh Postgres + PostgREST + test gateway → build → Playwright (53 tests incl. axe). Needs PostgreSQL server binaries and a PostgREST binary (`POSTGREST_BIN`) |
| `npm run test:e2e` | Playwright against an already-running app (`E2E_BASE_URL`) |
| `npm run db:seed:generate` | Regenerates `supabase/seed.sql` from `src/content/*` |
| `npm run admin:bootstrap` | Creates the first Super Admin |

## Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Supabase, Vercel, domain, email, go-live checklist
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — using the CMS, roles, publishing, content updates
- [docs/CONTENT_REQUIREMENTS.md](docs/CONTENT_REQUIREMENTS.md) — business content still needed before launch
- [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md) — what was built, tests run, limitations
- [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/SITE_MAP.md](docs/SITE_MAP.md), [docs/TESTING.md](docs/TESTING.md)

## Project structure

```
src/
  app/
    (website)/        public pages (ISR)          (admin)/admin/   CMS (dynamic, auth-guarded)
    (admin-auth)/     login, reset, set password  api/             contact, preview, CSV export
    auth/confirm/     Supabase email-link handler sitemap.ts, robots.ts, opengraph-image.tsx
  actions/            Server Actions (all wrapped in withPermission)
  components/         ui/ layout/ home/ website/ forms/ motion/ admin/
  content/            seed content (source of supabase/seed.sql + no-DB fallback)
  lib/                supabase clients, auth, permissions, validation, content repository, leads, media
  proxy.ts            session refresh + /admin redirect (Next 16 "proxy", formerly middleware)
supabase/migrations/  schema, RLS policies, storage bucket
scripts/              RLS tests, E2E orchestrator, seed generator, admin bootstrap
tests/                unit/, rls/, e2e/, integration/ (local Supabase-compatible test stack)
```
