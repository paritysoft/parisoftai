# Site map

## Public (statically generated, revalidated on publish)
| Route | Content source | In sitemap |
|---|---|---|
| `/` | Pages → Home + services/projects/products | yes |
| `/services` | Services | yes |
| `/services/[slug]` (8 seeded) | Services | when published |
| `/work`, `/work/[slug]` | Portfolio | only when ≥1 published |
| `/products`, `/products/[slug]` | Products | only when ≥1 published |
| `/about`, `/contact`, `/privacy`, `/terms` | Pages | yes |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/icon.svg` | generated | — |

Pages with an SEO `noindex` override are removed from the sitemap. Renamed slugs of published items 301-redirect.

## Admin (dynamic, noindex, auth required)
`/admin/login`, `/admin/forgot-password`, `/admin/account/password`, `/admin`, `/admin/pages[/id]`, `/admin/services[/new|/id]`, `/admin/portfolio[/new|/id]`, `/admin/products[/new|/id]`, `/admin/leads[/id]`, `/admin/media`, `/admin/seo`, `/admin/analytics`, `/admin/users`, `/admin/settings`, `/admin/audit-logs`

## API / auth
| Route | Purpose | Auth |
|---|---|---|
| `POST /api/contact` | Store inquiry | Public; validated, same-origin, rate-limited, honeypot |
| `GET /api/preview?path=` / `/api/preview/disable` | Draft preview | Staff only to enable |
| `GET /api/admin/leads/export` | CSV export | Admin+ |
| `GET /auth/confirm` | Invite / reset email links | Token |
