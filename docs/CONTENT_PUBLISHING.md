# Publishing projects & products (no database)

Until Supabase is added, parisoftai.com runs **without a database**. Portfolio projects and
products are stored as JSON files in this repository (`content/`), and the admin panel at
`/admin` edits them by **committing to GitHub**. Vercel redeploys automatically on every commit,
so published changes are live after the deployment finishes (usually 1–3 minutes).

```
Admin (/admin) ──save──▶ GitHub commit (content/*.json + images) ──▶ Vercel build ──▶ live site
```

Why this design: a static site cannot permanently store edits made in a browser. Committing to
Git gives real persistence, version history (every edit is a commit you can revert), no database
to pay for or maintain, and pages that stay fully static and fast.

## What appears where

| Status | Public listing | Detail page | Homepage | Sitemap |
|---|---|---|---|---|
| Draft | — | 404 | — | — |
| Published | ✔ | ✔ | only if **Featured** | ✔ |
| Archived | — | 404 | — | — |

- Unpublishing (Published → Draft/Archived) removes the item everywhere after the next deployment.
- Changing the slug of a published item adds a permanent (308) redirect from the old URL.
- Files are named by a stable id, so editing never creates duplicate pages.
- **Client projects** can be published only after ticking *"The client has authorised publishing
  this project"*. Never publish invented clients, metrics or testimonials.
- With zero published items, `/work` and `/products` show capability content (platforms,
  technologies, process) and a call to action — never an empty grid or "coming soon".

## One-time setup (≈10 minutes)

1. **Create a GitHub token** — GitHub → Settings → Developer settings → *Fine-grained tokens* →
   Generate new token:
   - Repository access: *Only select repositories* → `paritysoft/parisoftai`
   - Permissions → Repository → **Contents: Read and write** (nothing else)
   - Set an expiry and a reminder to rotate it.
2. **Create the admin password hash** on your computer, in the project folder:
   ```bash
   npm run admin:hash-password
   ```
   It asks for a password (14+ characters — use a password manager) and prints
   `ADMIN_PASSWORD_HASH` and a random `ADMIN_SESSION_SECRET`. The password itself is never stored.
3. **Add environment variables in Vercel** → Project → Settings → Environment Variables, scope
   **Production** only:

   | Name | Value |
   |---|---|
   | `ADMIN_EMAIL` | the email you'll sign in with |
   | `ADMIN_PASSWORD_HASH` | from step 2 |
   | `ADMIN_SESSION_SECRET` | from step 2 |
   | `GITHUB_CONTENT_TOKEN` | token from step 1 |
   | `GITHUB_CONTENT_REPO` | `paritysoft/parisoftai` |
   | `GITHUB_CONTENT_BRANCH` | `main` (the branch Vercel deploys to production) |

4. Redeploy once (Vercel → Deployments → Redeploy) so the variables take effect.
5. Open `https://parisoftai.com/admin`, sign in, and add your first project or product.

Without these variables the public site works normally and `/admin` shows
"Admin is not configured" — there is no fallback password and no browser-only fake saving.

## Using the admin

- **Dashboard** — counts by status, publishing target, and warnings if a content file is invalid.
- **Projects / Products** — list, add, edit, delete. Set *Status* to Published and click
  *Save & publish*. Use *Featured on homepage* for items you want on the homepage.
- **Images** — Upload PNG, JPEG, WebP or AVIF up to 3.5 MB each (WebP recommended). Images are
  committed together with the item in a single commit. SVG uploads are not accepted.
- **SEO** — optional SEO title, meta description and social image per item; otherwise the
  title, short description and cover image are used.
- After saving, the editor shows when the change will be live. The admin always reads the latest
  commit on GitHub, so you see your change immediately even before the deployment finishes.

## Editing files by hand (optional)

You can also edit `content/**/*.json` directly (e.g. in an editor or on github.com). Run
`npm run content:check` before committing. An invalid file **fails the Vercel build**, and Vercel
keeps the previous deployment live until it is fixed — a broken file can never take the site down.

Local development: `npm run dev`, set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`ADMIN_SESSION_SECRET` in `.env.local`, and the admin saves straight to your local `content/`
folder (no GitHub token needed). Commit and push to publish.

## Security

- Credentials are server-side only (no `NEXT_PUBLIC_` prefix). The password is stored only as a
  scrypt hash; changing it signs out existing sessions.
- Session: signed (HS256), httpOnly, `Secure`, `SameSite=Strict` cookie, 8-hour lifetime.
- Every admin page and Server Action re-checks the session; Server Actions also get Next.js's
  built-in origin check. Login attempts are throttled (best-effort, per server instance).
- All input is validated with Zod on the server (slugs, https-only links, store-link domains,
  image type by magic bytes, sizes). Markdown is rendered without raw HTML.
- `/admin` sends `X-Robots-Tag: noindex` and `Cache-Control: no-store`; robots.txt also
  disallows it — but authentication is what protects it.
- The GitHub token can only write this one repository's contents. If the repository is
  **public**, draft files are visible on GitHub — keep the repository private.

## Moving to Supabase later

The original Supabase CMS (roles, leads CRM, media library, page editor, instant revalidation)
is still in the codebase. When `NEXT_PUBLIC_SUPABASE_URL` and a publishable key are set, the site
and `/admin` switch to it automatically. Apply all migrations in `supabase/migrations` (including
`20261008000400_content_fields.sql`, which adds the new project/product fields), then re-enter or
import the items from `content/`.
