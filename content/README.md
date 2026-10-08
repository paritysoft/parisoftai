# Website content (Git-backed)

Portfolio projects and products shown on parisoftai.com live here as JSON files.

- `projects/<id>.json` → `/work/<slug>`
- `products/<id>.json` → `/products/<slug>`
- `redirects.json` → old URLs that permanently redirect after a slug change

**Normally you don't edit these by hand** — use the admin panel at `/admin`, which validates
every field and commits the change to GitHub. Vercel then redeploys automatically
(usually 1–3 minutes).

Only items with `"status": "published"` appear on the public site and in the sitemap.
`draft` and `archived` items are kept in the repository but never rendered.

If you do edit a file by hand, run `npm run content:check` before committing — an invalid file
fails the build, and Vercel keeps the previous deployment live until it is fixed.
See `docs/CONTENT_PUBLISHING.md` for details and examples.
