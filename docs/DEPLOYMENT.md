# Deployment guide — Vercel + Supabase

This covers everything needed to take the site live at **https://parisoftai.com**. Nothing has been deployed yet; follow these steps when you're ready.

## 0. Current setup: no database (recommended until Supabase is added)

1. Vercel → import the repository (framework: Next.js, default build command). No env vars are required for the public site.
2. Add `NEXT_PUBLIC_SITE_URL=https://parisoftai.com`.
3. **Contact form** — create a free Resend account, verify the `parisoftai.com` domain (DNS records Resend shows), then set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (e.g. `ParitySoft AI <notifications@parisoftai.com>`) and `CONTACT_NOTIFICATION_EMAIL`. Without them the contact page shows "Online inquiries are temporarily unavailable" (plus `CONTACT_PUBLIC_EMAIL` if set) instead of a form that cannot send.
4. **Admin** — follow [CONTENT_PUBLISHING.md](CONTENT_PUBLISHING.md) (GitHub token + admin credentials).
5. **Domain** — Vercel → Domains: add `parisoftai.com` (primary) and `www.parisoftai.com` → redirect to `parisoftai.com` (the app also 308-redirects `www`). HTTPS certificates are automatic.
6. After deploy, check `https://parisoftai.com/robots.txt` and `/sitemap.xml` return 200, then submit the sitemap in Google Search Console.

Sections 1–8 below describe the Supabase setup for later.

## 1. Environments

Use **two Supabase projects** so preview deployments can never touch live data:

| Vercel environment | Supabase project | Notes |
|---|---|---|
| Production | `parisoftai-prod` | Real leads and content |
| Preview + Development | `parisoftai-staging` | Safe to experiment |

As a second safety net, set `SUPABASE_PRODUCTION_PROJECT_REF=<prod ref>` in the **Preview** and **Development** environments. If a non-production deployment is ever configured with the production URL, every admin write is refused and a read-only banner is shown.

## 2. Supabase setup (repeat for each project)

1. **Create the project** at supabase.com (choose a region close to your visitors).
2. **Apply the schema.** Either:
   - CLI: `supabase link --project-ref <ref>` then `supabase db push` (runs everything in `supabase/migrations`), then run `supabase/seed.sql` in the SQL editor; or
   - Dashboard: open **SQL Editor** and run, in order, `20261008000100_core_schema.sql`, `20261008000200_rls_policies.sql`, `20261008000300_storage.sql`, then `supabase/seed.sql`.
3. **Auth → Sign In / Providers**: keep Email enabled and **turn off "Allow new users to sign up"**. Admin accounts are created only by invitation or the bootstrap script.
4. **Auth → URL Configuration**
   - Site URL: `https://parisoftai.com` (staging: your preview domain)
   - Redirect URLs: `https://parisoftai.com/auth/confirm` (staging: add your preview URL pattern, e.g. `https://*-<your-team>.vercel.app/auth/confirm`)
5. **Auth → Email Templates**: change the link in two templates so they work with server-side session handling:
   - *Invite user*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/account/password`
   - *Reset password*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/account/password`
6. **Auth → SMTP** (production): configure a custom SMTP sender. Supabase's built-in email is rate-limited and meant for testing.
7. **Storage**: the `media` bucket and its policies are created by the migration (public read, staff upload, admin delete, 5 MB, images only). Nothing to do manually.
8. **API keys** (Project Settings → API Keys): copy the **publishable** key and the **secret** key. (The legacy `anon` / `service_role` keys also work.)
9. **Backups**: daily backups are included on paid plans; enable Point-in-Time Recovery for production if you need finer-grained restores.

## 3. First Super Admin

From your own machine (never commit these values):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SECRET_KEY=<secret key> \
npm run admin:bootstrap -- --email you@parisoftai.com --name "Your Name"
```

It prompts for a password (not echoed), creates a confirmed user and grants Super Admin. Use `--invite` instead to receive an email link. The script refuses to run once a super admin exists (`--force` overrides). Further users are invited from **/admin/users**.

## 4. Vercel

1. Push the repository to GitHub and **Import** it in Vercel (framework preset: Next.js; build command `next build`; Node 20+).
2. **Environment variables** (Settings → Environment Variables) — see `.env.example` for descriptions:

| Variable | Production | Preview / Development |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://parisoftai.com` | leave unset on Preview (defaults are fine) or your staging URL |
| `NEXT_PUBLIC_SUPABASE_URL` | prod URL | staging URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod publishable key | staging publishable key |
| `SUPABASE_SECRET_KEY` | prod secret key (Sensitive) | staging secret key (Sensitive) |
| `SUPABASE_PRODUCTION_PROJECT_REF` | — | prod project ref |
| `RESEND_API_KEY` | yes (Sensitive) | optional |
| `CONTACT_FROM_EMAIL` | e.g. `ParitySoft AI <notifications@parisoftai.com>` | optional |
| `CONTACT_NOTIFICATION_EMAIL` | fallback inbox | optional |
| `RATE_LIMIT_SALT` | `openssl rand -hex 32` | any random value |
| `ANALYTICS_DASHBOARD_URL` | optional | optional |

3. **Analytics**: Project → Analytics → enable Web Analytics. The site already includes `@vercel/analytics` and sends an `inquiry_submitted` event (service name only — no personal data).
4. Deploy. Public pages are pre-rendered at build time from the database, so **apply migrations and the seed before the first production build**.

Content edits made in the admin are pushed to the live site immediately through on-demand revalidation — no redeploy is needed. Pages also refresh at least hourly.

## 5. Domain & HTTPS

1. Vercel → Project → Settings → Domains → add `parisoftai.com` and `www.parisoftai.com`.
2. Vercel shows the exact DNS records to create at your registrar (or offers Vercel nameservers). Use the values Vercel displays for your project — they can differ per account, so they aren't copied here.
3. Set `www.parisoftai.com` to **redirect** to `parisoftai.com` in the Domains screen. (The app also redirects `www` → apex as a fallback.)
4. HTTPS certificates are issued automatically once DNS resolves. HSTS is sent by the app.

## 6. Email (Resend)

1. Create a Resend account, add the domain `parisoftai.com`, and create the DNS records Resend shows (SPF/DKIM). Wait for verification.
2. Create an API key with sending access → `RESEND_API_KEY`.
3. Set `CONTACT_FROM_EMAIL` on the verified domain and add recipients in **/admin/settings → Notifications**.
4. Submit a test inquiry. In **/admin/leads**, the lead's notification status should read `sent`. If it reads `failed`, the error is shown and you can **Retry notification** — the lead itself is never lost or duplicated.

## 7. Go-live checklist

- [ ] Migrations + seed applied to production Supabase
- [ ] Sign-ups disabled, redirect URLs and email templates configured, custom SMTP set
- [ ] Super Admin bootstrapped; other users invited with the least role they need
- [ ] All Vercel env vars set per environment; secrets marked Sensitive
- [ ] Production build succeeds on Vercel
- [ ] Domain + `www` redirect live, HTTPS active
- [ ] Contact form tested end-to-end (lead stored, email received)
- [ ] Admin login, drafting, preview and publishing tested on production
- [ ] Signed-out access to `/admin` redirects to login
- [ ] Business content reviewed (see `CONTENT_REQUIREMENTS.md`), unverified statistics left hidden
- [ ] Privacy Policy and Terms reviewed by a legal professional, draft notice removed
- [ ] Real contact email / social links entered in Settings
- [ ] Search Console: submit `https://parisoftai.com/sitemap.xml`

## 8. Operations

- **Monitoring**: Vercel → Logs for server errors (look for `[contact]`, `[admin action]`, `[db]` prefixes). An error tracker such as Sentry can be added later; it is not included.
- **Data retention**: Settings → Contact form sets the retention period; Settings → Data retention deletes older inquiries. Keep this aligned with the Privacy Policy.
- **Rotating keys**: rotate Supabase/Resend keys in their dashboards, update Vercel env vars, redeploy.
- **Rate limiting** relies on the client IP from Vercel's `x-real-ip` header. If you host elsewhere, ensure the proxy sets a trustworthy client-IP header.
