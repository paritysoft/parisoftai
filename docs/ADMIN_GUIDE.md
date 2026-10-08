# Admin guide

Sign in at **/admin/login**. Accounts are invitation-only.

## Roles

| | Editor | Admin | Super Admin |
|---|:-:|:-:|:-:|
| Create and edit **drafts** (pages, services, portfolio, products) | ✓ | ✓ | ✓ |
| Upload media, edit alt text | ✓ | ✓ | ✓ |
| Publish, archive, delete, reorder content; edit published items | | ✓ | ✓ |
| Upload SVG files, delete media | | ✓ | ✓ |
| Leads (view, update, notes, export, delete), Analytics | | ✓ | ✓ |
| SEO, Settings, Users, Audit log | | | ✓ |

Permissions are enforced on the server and in the database, not just hidden in the menu.

## Publishing workflow

**Services, Portfolio, Products** each have a **Status**:
- **Draft** — visible only in the admin and in preview. Editors can only save drafts.
- **Published** — live on the website. Saving asks you to confirm.
- **Archived** — hidden from the website but kept.

Editing a *published* item and saving updates the live site immediately. To stage bigger changes, set it back to Draft first, or duplicate the content into a new draft.

**Pages** (Home, About, Contact, Privacy, Terms) use drafts and revisions:
1. Edit, then **Save draft** — the live page is unchanged.
2. **Preview latest saved draft** opens the website showing your draft (only you see it; a banner lets you exit preview).
3. **Publish** (admins) replaces the live page. Every save is kept in **Revision history**; **Load** brings an older version back into the editor.

You'll be warned before leaving a page with unsaved changes.

## Content guidance

- **Never** publish invented clients, testimonials, ratings, metrics or results. Portfolio entries need permission to be shown; use the *Attribution* field (e.g. "Shown with permission of …" or "Client name withheld under NDA").
- **Statistics** on the homepage show only when **Verified** is switched on. Label founder-level experience as such (the note field shows under the number).
- **Testimonials** only appear when **Approved for publication** is on. Without approved testimonials, the section shows the *Highlights* instead.
- Homepage sections without content (e.g. no published products) hide automatically.
- Add **alt text** to every image (media library flags images without it).
- Links: use `/path` for pages on this site, `https://…` for external sites. Other link types are rejected.
- Rich text fields use Markdown (`## Heading`, `**bold**`, `- list`, `[link](https://…)`). HTML is not rendered.

## Common tasks

**Add a product** — Products → Add product → name, category, one-sentence description, platforms, store links (only filled links are shown), icon and screenshots → Status: Published → Save & publish. It appears on `/products`, its own page `/products/<slug>`, the homepage (if *Featured* or if no product is featured) and the footer.

**Add a case study** — Portfolio → Add project. Choose *Client project* or *Company-owned product* carefully; they are labeled differently on the site.

**Change a URL (slug)** — edit the slug and save. Old URLs of published items redirect automatically.

**Edit homepage hero/sections** — Pages → Home. Reorder sections with the arrows, toggle visibility, then Save draft → Preview → Publish.

**Handle a lead** — Leads → open it (it's marked read). Set status (New → Contacted → Qualified → Proposal sent → Won/Lost), assign it, add internal notes. If the email notification failed, use **Retry notification**. Select rows and **Export** for CSV.

**SEO** — SEO → pick a page → set title/description/social image. *Hide from search engines* adds `noindex` and removes the page from the sitemap. Defaults live in Settings → SEO defaults.

**Invite a colleague** — Users → Invite a user → choose the lowest role they need. They receive an email to set a password. Deactivate users who leave; there must always be at least one active Super Admin.

**Contact details & social links** — Settings → General. Leave empty to keep them hidden; placeholders are never shown.

**Budget/timeline options and consent text** — Settings → Contact form.

## Audit log

Super Admins can see who did what in **Audit Logs** (sign-ins, publishing, deletions, lead status changes, role changes, settings). Entries cannot be edited or deleted from the app.

## Updating content in code (developers)

The seed content in `src/content/` is only used to initialise a new database and as a fallback when no database is configured. After launch, edit content in the admin. If you change the seed files, run `npm run db:seed:generate` to refresh `supabase/seed.sql` (existing rows are never overwritten by the seed).
