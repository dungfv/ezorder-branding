# ezorder.io — EZ Order Printer PDF Invoice website

Marketing site for **EZ Order Printer PDF Invoice**, the Shopify app for branded invoices, packing slips, refunds, return slips and draft-order quotes. Static, fast, SEO-first; links visitors to the Shopify App Store listing.

| | |
|---|---|
| Framework | Astro 7 (static output), TypeScript |
| Styling | Tailwind CSS 4 + `@tailwindcss/typography`, CSS-variable design tokens |
| Content | Astro Content Collections (Markdown/MDX) |
| CMS | [Pages CMS](https://app.pagescms.org) via `.pages.yml` |
| Search | Pagefind (indexed at build time, runs in the browser) |
| Hosting | Cloudflare Pages (Git integration) |
| Client JS | None by default. Tiny inline scripts only: mobile-menu close, contact form mailto, blog search |

---

## Quick start

Requires Node.js **22.12+** (see `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:4321 — drafts visible, search disabled
npm run check     # astro check (types, templates) — must report 0 errors / 0 warnings
npm run build     # astro build + pagefind index → dist/
npm run preview   # serve dist/ locally (search works here)
```

To reproduce Cloudflare behaviour locally (headers, redirects, trailing slashes):

```bash
npm run build && npx wrangler pages dev ./dist
```

## Project structure

```
.pages.yml                 Pages CMS config (blog, pricing, site settings)
astro.config.mjs           site URL, i18n, sitemap, self-hosted fonts
public/
  _headers                 Cloudflare cache + security headers (CSP, HSTS…)
  _redirects               Cloudflare redirects (/faq → docs)
  robots.txt, favicons, og-default.jpg, logo-512.png
src/
  assets/docs/             Real document renders from the app (hero, galleries)
  assets/uploads/          CMS media (blog covers) — optimised by astro:assets
  assets/fonts/            Inter + Bricolage Grotesque variable (latin), self-hosted
  components/
    layout/                Header, Footer, Logo (vector EZ monogram)
    seo/SEO.astro          title, description, canonical, hreflang, OG, Twitter, JSON-LD
    home/                  Home page sections
    pricing/               Plan cards (+ CSS-only Monthly/Yearly toggle), comparison table
    blog/                  PostCard, PaginationNav, TableOfContents, BlogSearch, listing view
    contact/ContactForm    Form ready for mailto / Formspree / Web3Forms / Pages Function
    ui/                    Icon set, ButtonLink, SectionHeading, PageHeader, FaqList
  content/blog/            Blog posts (.md / .mdx)
  content.config.ts        Blog frontmatter schema
  data/                    site.json, pricing.json (CMS-editable), features, faq, testimonials…
  layouts/                 BaseLayout, BlogPostLayout, LegalLayout
  lib/                     blog helpers, JSON-LD builders, screenshot loader
  pages/                   index, pricing, about, privacy, terms, 404, blog/…, rss.xml
  styles/global.css        Tailwind + design tokens (light/dark)
```

## Editing content

| What | Where | CMS |
|---|---|---|
| Name, tagline, App Store URL, support email, docs URL, socials | `src/data/site.json` | Site settings |
| Plans, prices, early-adopter banner, comparison table, billing FAQ | `src/data/pricing.json` | Pricing |
| Blog posts | `src/content/blog/*.md` | Blog |
| Feature grid, document types, how-it-works | `src/data/features.ts` | — |
| Home FAQ (also FAQPage JSON-LD) | `src/data/faq.ts` | — |
| Email trigger list | `src/data/email-automation-triggers.ts` | — |
| Testimonials | `src/data/testimonials.ts` | — |

**Pricing must always match the Shopify App Store listing.** Plans render as one wide card when there is a single plan and as a grid otherwise. Setting `yearlyBilling: true` shows the Monthly/Yearly toggle (pure CSS, no JavaScript) and uses each plan's `priceYearly`. Comparison `values` are one entry per plan, in plan order: `yes`, `no` or a short label.

**Testimonials** marked `placeholder: true` show in `npm run dev` only and are stripped from production builds, so sample quotes never go live. The section disappears entirely until real reviews are added.

## Writing blog posts

Create `src/content/blog/<url-slug>.md` (the file name becomes the URL `/blog/<url-slug>/`):

```markdown
---
title: 'How to …'                     # ≤ 120 chars, becomes the H1
description: 'One or two sentences.'  # ≤ 220 chars, meta description + card text
pubDate: 2026-10-01
updatedDate: 2026-10-15               # optional
author: 'EZ Order team'
tags: ['Invoices', 'Guides']
cover:                                # optional; 1200×630 recommended
  src: '../../assets/uploads/my-cover.webp'
  alt: 'Describe the image'
draft: false                          # true = visible in dev, excluded from production
---

Body in Markdown. Use ## and ### headings — they build the table of contents.
```

- Rename to `.mdx` to use components inside a post.
- The cover doubles as the social sharing image (resized to 1200×630 JPEG automatically).
- Reading time, related posts (by shared tags), tag pages, RSS, sitemap and search index update automatically on build.
- Listings paginate at 10 posts per page (`POSTS_PER_PAGE` in `src/lib/blog-posts.ts`): `/blog/`, `/blog/2/`…, and `/blog/tag/<tag>/`, `/blog/tag/<tag>/2/`…

## Pages CMS

1. Push this repo to GitHub.
2. Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub and install the Pages CMS GitHub App on this repository.
3. Open the repo in Pages CMS; it reads `.pages.yml` and shows **Blog**, **Pricing** and **Site settings**.
4. Every save is a commit to the selected branch → Cloudflare Pages rebuilds and deploys automatically. Edit on a branch to get a preview URL before merging to `main`.

**Media choice:** uploads go to `src/assets/uploads` (not `public/`), and are written into frontmatter as `../../assets/uploads/<file>` (relative to the post). That keeps them compatible with `astro:assets`, so covers are converted to AVIF/WebP, resized per screen and lazy-loaded. Images in `public/` would be served unoptimised.

If you add a field to the blog schema, update both `src/content.config.ts` and `.pages.yml`.

## Deploy to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose the GitHub repo.
2. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build` (runs `astro build` then `pagefind --site dist`)
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. Production branch: `main`. Every other branch and every pull request gets its own preview URL automatically.
4. Add the custom domain `ezorder.io` (and redirect `www` to it) under **Custom domains**.

`public/_headers` sets long-term immutable caching for fingerprinted `/_astro/*` files, a short cache for the Pagefind index, and security headers (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `nosniff`). If you add a third-party script or form provider, extend the CSP there. `public/_redirects` sends the old `/faq/` path to the docs site.

## Contact form

`src/components/contact/ContactForm.astro` is configured in `src/data/contact-form.ts`.

- **`mailto` (current):** opens the visitor's email client with subject and body pre-filled, addressed to `supportEmail`. Zero backend, but depends on the visitor having a mail client.
- **Formspree:** create a form, set `provider: 'formspree'` and `endpoint: 'https://formspree.io/f/<id>'`.
- **Web3Forms:** get an access key, set `provider: 'web3forms'` and `web3formsAccessKey`.
- **Cloudflare Pages Function:** set `provider: 'pages-function'`, `endpoint: '/api/contact'`, and add `functions/api/contact.ts` that validates the POST body and forwards it to an email API (e.g. Resend or Postmark) using a secret stored in Cloudflare environment variables. Add a Turnstile widget if spam appears.

Non-mailto providers include a honeypot field. The CSP `form-action` already allows Formspree and Web3Forms.

## SEO

- `<SEO>` component on every page: title template (`Page | EZ Order Printer`), description, canonical, `hreflang` + `x-default`, Open Graph, Twitter card, per-post OG image.
- JSON-LD: `Organization` + `WebSite` (all pages), `SoftwareApplication` + `FAQPage` (home), `Product`/`AggregateOffer` + `FAQPage` + `BreadcrumbList` (pricing), `BlogPosting` + `BreadcrumbList` (posts), `BreadcrumbList` (other pages).
- `@astrojs/sitemap` → `/sitemap-index.xml` (404 excluded), referenced from `robots.txt`.
- Paginated pages get their own canonical URL and a `Blog – Page N` title.
- One `h1` per page, landmarks (`header`/`nav`/`main`/`footer`), skip link, `alt` text on every meaningful image.
- All URLs end with `/` (`trailingSlash: 'always'`), matching how Cloudflare Pages serves `index.html` files.

### Adding a language later

i18n routing is already configured (`defaultLocale: 'en'`, no URL prefix for English). To add e.g. German: add `'de'` to `i18n.locales` in `astro.config.mjs` and to `LOCALES` in `src/components/seo/SEO.astro` (drives `hreflang`), add it to the sitemap `i18n.locales` map, then create pages under `src/pages/de/`. `BaseLayout` already sets `lang` and switches to `dir="rtl"` for Arabic, Hebrew, Persian and Urdu.

## Performance & quality

Lighthouse 12 on the production build (`npm run build && npm run preview`), 28 Sep 2026:

| Page | Mobile (Perf / A11y / BP / SEO) | Desktop |
|---|---|---|
| `/` | 100 / 100 / 100 / 100 — LCP 1.7 s, CLS 0 | 100 / 100 / 100 / 100 — LCP 0.4 s |
| `/pricing/` | 100 / 100 / 100 / 100 — LCP 1.5 s, CLS 0 | 100 / 100 / 100 / 100 |
| `/about/` | 100 / 100 / 100 / 100 — LCP 1.5 s, CLS 0 | 100 / 100 / 100 / 100 |
| `/blog/` | 100 / 100 / 100 / 100 — LCP 1.7 s, CLS 0 | 100 / 100 / 100 / 100 |
| Blog post | 100 / 100 / 100 / 100 — LCP 1.7 s, CLS 0 | 100 / 100 / 100 / 100 |

Also verified: no horizontal scroll at 360 px and 768 px on every page in light and dark mode; no console errors with the production CSP (via `wrangler pages dev`); Pagefind search works under the CSP.

Run it yourself:

```bash
npm run build && npm run preview
npx lighthouse http://localhost:4321/ --view                  # mobile
npx lighthouse http://localhost:4321/ --preset=desktop --view # desktop
```

Re-check after deploy with [PageSpeed Insights](https://pagespeed.web.dev/) (real network and field data).

What keeps it fast: static HTML, no framework runtime, self-hosted variable fonts with preload and metric-matched fallbacks, images as AVIF with WebP fallback at several widths, lazy loading below the fold, eager + `fetchpriority="high"` on the hero image, and Pagefind loaded only when the search field gets focus.

## Design tokens

Defined as CSS variables in `src/styles/global.css` and exposed to Tailwind (`bg-surface`, `text-muted`, `bg-brand`, `bg-mint`…). Light and dark values switch with `prefers-color-scheme`.

- **Brand forest** `#022515` — from the app logo; hero, CTA bands.
- **Mint** `#2cd97f` — primary buttons (text `#022515`, 8.9:1).
- **Paper** `#f8f7f3` / **ink** `#0d1c15` in light mode; `#06120c` / `#e9f1ec` in dark mode.
- Muted text `#4b5a52` (6.8:1 on paper) / `#a3b6ac` (9:1 dark). Accent text `#0a7442` (5.5:1) / `#5fe39c` (11.8:1). All text pairs meet WCAG AA.
- Type: Bricolage Grotesque (display), Inter (body), system monospace for receipt-style labels.
- Logo: the app's EZ monogram (`app/frontend/public/logo_large.png` in the app repo), traced to a 1.5 KB vector in `Logo.astro` and `public/favicon.svg`.

## Decisions (where the brief left room)

- **Product name:** "EZ Order Printer PDF Invoice" (full), "EZ Order Printer" in the header and page titles.
- **Pricing:** a single **Free** plan with an "early adopter" banner, as requested. Toggle and comparison table stay data-driven for future plans.
- **Screenshots:** real document renders from the app's App Store assets (sample store "Northbeam Supply Co."), not placeholders. The listing's feature images were not used because they carry an "OZ ORDER" wordmark.
- **POS copy** matches the POS extension: staff **print** invoice/receipt, packing slip, refund and return slip from the order screen. Download/email from POS is not claimed.
- **Languages:** "30+" — the app ships 31 document translation files (`translation/seeders`), although older docs and the listing images say 12.
- **"Made for Shopify"** strip instead of the "Built for Shopify" wording or badge, which may only be shown once the app earns it. No Shopify logos are used.
- **Privacy page** covers the website and links to the app's canonical policy (`app.ezorder.io/privacy-policy`) instead of duplicating it.
- **Search UI** is a small custom component on Pagefind's JS API (matches the design, loads nothing until used) instead of Pagefind's default widget.
- **Blog covers** were generated from the brand palette + real renders; replace them freely via the CMS.

## TODO — information needed

- [ ] **App Store URL** — assumed `https://apps.shopify.com/ez-order-printer` (from the app handle). Confirm.
- [ ] **Docs domain** — assumed `https://docs.ezorder.io`. Confirm, and confirm the `/faq/` redirect target in `public/_redirects` (the app's email-verification page links to `https://ezorder.io/faq/`).
- [ ] **Support email** — assumed `support@ezorder.io` (used in the app). Confirm, and confirm the "reply within one business day" promise on `/about/`.
- [ ] **Pricing** — confirm the Free plan wording, the early-adopter banner text, and whether any usage limits apply. Update when paid plans launch (must match the listing).
- [ ] **Testimonials** — real App Store reviews (with permission) for `src/data/testimonials.ts`.
- [ ] **Brand** — confirm colours/logo usage; the listing images still say "OZ ORDER".
- [ ] **Company / legal** — registered company name and address; final **Terms of service** (current page is a draft); `companyName` in `site.json`.
- [ ] **Team & mission** — real About page copy (current text is placeholder).
- [ ] **Social links** and X/Twitter handle (`site.json`; empty links are hidden).
- [ ] **Contact form provider** — keep `mailto` or pick Formspree / Web3Forms / Pages Function.
- [ ] **Languages** — which locales to add to the website, if any.
- [ ] **Language count** — confirm "30+" for marketing (vs "12" in older materials).
- [ ] **Custom template service** — confirm "we'll build it for you / On request" is an offer you want to advertise.
