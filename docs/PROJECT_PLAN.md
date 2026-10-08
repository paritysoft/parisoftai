# Project plan

## Starting point
The `parisoftai` folder was empty, so this is a new project. The two master prompts (website + admin/CMS) were merged into one Next.js application.

## Key decisions
| Decision | Why |
|---|---|
| Single Next.js 16 app (App Router) for site + admin | Shared content models, one deployment, no separate backend server |
| Supabase (Postgres, Auth, Storage, RLS) instead of Prisma | Required by the admin spec; RLS keeps permissions enforced in the database for every admin query |
| Server Actions for admin mutations, Route Handlers for contact/export/preview | Every action re-checks role server-side via `withPermission` |
| Public pages statically generated (ISR) + `revalidatePath` on publish | Fast pages; edits go live without redeploys |
| Draft mode for previews | Drafts are visible only to signed-in staff |
| Seed content in TypeScript (`src/content`) → generated `seed.sql` | Same copy powers the DB seed and a no-database dev fallback |
| CSS/SVG hero visual, no Three.js; Motion library removed after measuring | Better performance (mobile Lighthouse 91–96); static fallback for reduced motion |
| No shadcn CLI / Radix | Registry not reachable from the build environment; small hand-written components in the same style keep dependencies minimal |
| Resend via HTTP (no SDK) | One fewer dependency |

## Phases (all completed)
1. Audit & plan → 2. Foundation (design tokens, layout, nav, footer) → 3. Homepage → 4. Inner pages → 5. Supabase schema, RLS, storage → 6. Contact pipeline → 7. Admin auth & CMS modules → 8. SEO, a11y, security headers → 9. Tests (unit, RLS, E2E, axe) → 10. Docs & deployment prep.

## Out of scope / future
- Blog (listed in the project description but not in either master prompt's route list) — the block-based page system and Markdown renderer make it a small addition.
- Error tracking (Sentry), image transformations via Supabase, multi-language.
