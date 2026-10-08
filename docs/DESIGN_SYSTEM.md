# Design system

## Concept
"Parity": the same product, equally good on every platform. The hero shows one app on a desktop window and a phone with an identical chart (the shared cyan bar ties them together), with a glass orb and orbit ring behind. The logo mark is two equal, offset bars.

## Colour tokens (`src/app/globals.css`)
| Token | Value | Use |
|---|---|---|
| `ink-950` | `#090F1E` | page background |
| `ink-900` | `#0F172A` | secondary background, admin cards |
| `ink-800` | `#151E35` | cards |
| `line` / `line-strong` | `#273449` / `#34445F` | borders |
| `fg` / `fg-2` / `fg-3` | `#F8FAFC` / `#CBD5E1` / `#94A3B8` | text |
| `accent` | `#6366F1` (configurable) | primary actions |
| `accent-2` | `#8B5CF6` (configurable) | gradient partner |
| `glow` | `#22D3EE` (configurable) | small highlights, focus ring |

Brand colours can be changed in Admin → Settings → Branding (injected as CSS variables).

## Typography
- Display: **Manrope** (700–800, tight tracking) · Body: **Inter** · Technical labels (tech stack chips, step numbers): **JetBrains Mono**
- Fluid sizes: hero `clamp(2.25rem … 4.75rem)`, sections `clamp(2rem … 3rem)`, lead `clamp(1.0625rem … 1.1875rem)`; body 16–17px.
- Fonts are self-hosted with `next/font/local` (Latin subsets from Fontsource, OFL) — preloaded, with metric-matched fallbacks; no third-party font requests.

## Layout
- Max width 1280px; gutters 16 / 24 / 32px; 8px spacing rhythm; section padding `clamp(4rem … 7.5rem)`.
- Radii by hierarchy: cards 20px, controls 12px, chips 8px, CTA panel 28px.
- Breakpoints: Tailwind defaults (`sm` 640, `lg` 1024, `xl` 1280); verified at 320–1920px.

## Motion (`src/components/motion`, `globals.css`)
Tokens: fast 0.2s, normal 0.35s, reveal 0.55s, stagger 0.08s, ease `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out-expo`).
- One orchestrated moment: the hero's supporting elements and device visual rise in (CSS, staggered); slow float on the devices; pointer parallax on fine pointers only.
- The headline and description are **not** animated: they are the LCP element and paint immediately.
- The Motion library was used initially and then removed: the same effects in CSS + a ~30-line rAF parallax cut mobile Total Blocking Time from ~380 ms to ~150 ms (Lighthouse, devtools throttling). It can be re-added for future interactive components.
- Section reveals only for content that starts off-screen, so nothing is hidden before JS loads.
- Stats count up once; process timeline draws once.
- `prefers-reduced-motion`: all of the above disabled; CSS animations neutralised globally.

## Components
`ui/` Button, ButtonLink, Badge, SectionHeader, Breadcrumbs (+JSON-LD), EmptyState, Markdown (safe), SmartImage, ServiceIcon · `layout/` SiteHeader (glass on scroll, accessible drawer), SiteFooter, Logo · `website/` ServiceCard, ProjectCard, ProductCard, StoreLinks, PlatformBadges, TechList, Gallery, Faq, PageHero, BlockRenderer, Notice · `home/` Hero, HeroVisual, ProcessTimeline, section components, CtaPanel · `admin/` shell, tables, form controls, list editors, media picker, editors.
