# ezorder.io — EZ Order Printer PDF Invoice website

Marketing site for **EZ Order Printer PDF Invoice**, the Shopify app for branded invoices, packing slips, refunds, return slips and draft-order quotes. Static, fast, SEO-first; links visitors to the Shopify App Store listing.

| | |
|---|---|
| Framework | Astro 7 (static output), TypeScript |
| Styling | Tailwind CSS 4 + `@tailwindcss/typography`, CSS-variable design tokens |
| Content | Astro Content Collections (Markdown/MDX) |
| CMS | [Pages CMS](https://app.pagescms.org) via `.pages.yml` |
| Search | Pagefind (indexed at build time, runs in the browser) |
| Hosting | AWS S3 (private) + CloudFront, deployed by GitHub Actions (OIDC) |
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

`npm run preview` does not apply the CloudFront URL rewrite or security headers; those live in `infra/cloudformation-website-hosting.yml`.

## Project structure

```
.pages.yml                 Pages CMS config (blog, pricing, site settings)
.github/workflows/        build on every push/PR, deploy main to S3 + CloudFront
infra/                     CloudFormation: S3, CloudFront (URL rewrite, headers), GitHub OIDC role
astro.config.mjs           site URL, i18n, sitemap, self-hosted fonts
public/
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
  pages/                   index, pricing, faq, about, privacy-policy, terms, 404, blog/…, rss.xml
  styles/global.css        Tailwind + design tokens (light/dark)
```

## Editing content

| What | Where | CMS |
|---|---|---|
| Name, tagline, App Store URL, support email, docs URL, socials | `src/data/site.json` | Site settings |
| FAQ page (`/faq/`) | home FAQ + pricing billing FAQ | — |
| Plans, prices, early-adopter banner, comparison table, billing FAQ | `src/data/pricing.json` | Pricing |
| Blog posts | `src/content/blog/*.md` | Blog |
| Feature grid, document types, how-it-works | `src/data/features.ts` | — |
| Home FAQ (also FAQPage JSON-LD) | `src/data/faq.ts` | — |
| Email trigger list | `src/data/email-automation-triggers.ts` | — |
| Testimonials | `src/data/testimonials.ts` | — |

`site.json` and `pricing.json` are validated with zod at build time (`src/data/site.ts`, `src/data/pricing.ts`): a missing price, a bad currency code or a comparison row with the wrong number of values fails the build with a readable message instead of shipping broken pages. Empty optional blog fields saved by the CMS (`''`/`null`) are treated as "not set". The canonical origin comes from `site` in `astro.config.mjs` only.

**Docs links** (header, footer, CTA, About) appear only when `docsUrl` is set. It is empty for now because `docs.ezorder.io` currently serves another product's documentation.

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
4. Every save is a commit to the selected branch. On `main`, GitHub Actions builds and deploys it (about 3 minutes). On any other branch the workflow only builds, which is a safe way to check an edit before merging.

**Media choice:** uploads go to `src/assets/uploads` (not `public/`), and are written into frontmatter as `../../assets/uploads/<file>` (relative to the post). That keeps them compatible with `astro:assets`, so covers are converted to AVIF/WebP, resized per screen and lazy-loaded. Images in `public/` would be served unoptimised.

If you add a field to the blog schema, update both `src/content.config.ts` and `.pages.yml`.

**Before handing the CMS to editors, test once end to end:** upload a cover and an inline image, open and re-save an existing post (the EU post has a table and a blockquote), then check the build. Pages CMS documents absolute media outputs; the relative `../../assets/uploads` output is required by `astro:assets` and should be confirmed on a branch.

**Trust:** Markdown allows raw HTML and the CSP permits inline scripts, so give CMS access only to trusted editors. JSON-LD output is escaped so CMS text can't break out of its `<script>`. A stricter hash-based CSP (Astro's `security.csp`) is a possible follow-up once the inline scripts are moved to bundled scripts.

## Deploy: GitHub + AWS S3/CloudFront

```
Editor ─► Pages CMS ─► commit to GitHub (main)
                              │
               GitHub Actions: npm ci → check → build
                              │  OIDC → IAM role (no stored AWS keys)
               aws s3 sync ───┴──► CloudFront invalidation
                                            │
       Route 53 ALIAS (ezorder.io, www) ──► CloudFront ──► S3 bucket (private, OAC)
```

One-time setup, in this order. Nothing touches the live domain until step 7.

**Doing it by hand in the AWS console?** Follow the step-by-step guide (Vietnamese) in [`docs/deploy-aws-console/`](docs/deploy-aws-console/README.md). It is the manual equivalent of the CloudFormation stack in step 3, plus GitHub, Pages CMS, DNS cutover and troubleshooting. Use one approach, not both.

### 1. GitHub repository

1. Create a repository (private is fine), e.g. `dungfv/ezorder-branding`, then push:
   ```bash
   git remote add origin git@github.com:<owner>/<repo>.git
   git push -u origin main
   ```
2. Keep `main` writable for editors: do **not** require pull requests on `main`, or Pages CMS saves will be rejected. Protect against force-pushes and deletion only.
3. The **Build and deploy** workflow runs on the push; the build job passes, the deploy job fails until step 4. That is expected.

### 2. TLS certificate (ACM, region us-east-1)

1. AWS console → Certificate Manager → switch region to **N. Virginia (us-east-1)** (CloudFront only accepts certificates from there).
2. Request a public certificate for `ezorder.io` **and** `www.ezorder.io`, DNS validation.
3. Add the two validation CNAME records where DNS lives **today** (GoDaddy). Keep these records forever: renewal uses them, so they must also be copied to Route 53 in step 7.
4. Wait for status **Issued**, copy the certificate ARN.

### 3. CloudFormation stack

AWS console → CloudFormation → Create stack → upload `infra/cloudformation-website-hosting.yml` (any region, e.g. the app's `us-west-1`). Parameters:

| Parameter | Value |
|---|---|
| `DomainName` | `ezorder.io` |
| `AcmCertificateArn` | ARN from step 2 |
| `GitHubRepository` | `<owner>/<repo>` from step 1 |
| `DeployEnvironment` | `production` (GitHub environment of the deploy job) |
| `ExistingGitHubOidcProviderArn` | empty, **unless** the account already has an IAM identity provider for `token.actions.githubusercontent.com` (IAM → Identity providers); then paste its ARN |

Acknowledge IAM resource creation and create. The stack builds: a private S3 bucket, CloudFront with Origin Access Control, a CloudFront Function (`www` → apex, `/about` → `/about/`, `/about/` → `index.html`), a response-headers policy (CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), 403/404 → `/404.html`, and an IAM role that only the `production` environment of your repo can assume. CLI alternative:

```bash
aws cloudformation deploy --stack-name ezorder-website \
  --template-file infra/cloudformation-website-hosting.yml --capabilities CAPABILITY_IAM \
  --parameter-overrides AcmCertificateArn=<arn> GitHubRepository=<owner>/<repo>
```

### 4. GitHub environment and variables

The deploy job runs in the GitHub environment **`production`**, so the IAM role trusts that environment's OIDC subject. GitHub now issues it with immutable IDs, `repo:<owner>@<owner_id>/<repo>@<repo_id>:environment:production` (this repo: `repo:dungfv@22865175/ezorder-branding@1392203605:environment:production`); older repositories may still get `repo:<owner>/<repo>:environment:production`. When unsure, print the claim once (see `docs/deploy-aws-console/06-iam-deploy-role.md`, section 6.6) and pass the repository part as `GitHubRepository`.

1. Repository → Settings → **Environments** → New environment `production`.
2. **Deployment branches and tags** → Selected branches → add `main`. This is what limits deploys to `main` (the role trusts the environment, not the branch).
3. Optional: **Required reviewers** to approve each deploy (CMS saves then wait for approval too).
4. **Environment variables** (not secrets; none of these are sensitive):

| Variable | Value |
|---|---|
| `AWS_REGION` | region of the stack |
| `AWS_DEPLOY_ROLE_ARN` | stack output `DeployRoleArn` |
| `S3_BUCKET` | stack output `BucketName` |
| `CLOUDFRONT_DISTRIBUTION_ID` | stack output `DistributionId` |

Then Actions → **Build and deploy** → Run workflow (branch `main`).

The deploy uploads `/_astro/*` first with `Cache-Control: immutable` (1 year), then pages/RSS/sitemap/search index with `max-age=0, s-maxage=1 year`, deletes removed pages, and invalidates `/*`. Browsers always revalidate HTML; CloudFront serves it from cache until the next deploy.

### 5. Test on the CloudFront domain

Open `https://<DistributionDomainName>` (stack output) and check: pages load, `/about` redirects to `/about/`, an unknown URL shows the 404 page with status 404, blog search returns results, and the response carries `content-security-policy` and `strict-transport-security` headers (`curl -I`).

### 6. Pages CMS

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Install the **Pages CMS** GitHub App, granting access to **only this repository**.
3. Open the repository in Pages CMS. It reads `.pages.yml` and shows **Blog**, **Pricing** and **Site settings**.
4. Invite editors (Pages CMS collaborators, by email; they don't need a GitHub account).
5. Do one test on a branch before editors start: in Pages CMS switch to a new branch (e.g. `cms-test`), edit a post, upload a cover image, save. The workflow builds that branch; if it's green, merge on GitHub and delete the branch.

### 7. DNS cutover (GoDaddy → Route 53)

CloudFront needs an ALIAS at the apex, which GoDaddy DNS cannot do, so the zone moves to Route 53. The domain stays registered at GoDaddy; only the nameservers change. **Current records to preserve (Sep 2026):** `app` (CNAME → AWS load balancer of the app), `cdn` and `docs` (CloudFront), MX + SPF (GoDaddy email), `_dmarc`, and every `_…` validation CNAME (ACM for this site and for the app/CDN certificates).

1. GoDaddy → DNS → **Export zone file**. If DNSSEC is on, turn it off first.
2. Route 53 → Create hosted zone `ezorder.io` → Import zone file. Check every record from the export is there.
3. Replace the imported apex and `www` records with **A + AAAA ALIAS** records to the CloudFront distribution (for both `ezorder.io` and `www.ezorder.io`).
4. Merge the two `_dmarc` TXT records into one (two DMARC records invalidate DMARC).
5. A day before switching, lower TTLs at GoDaddy (e.g. 300 s).
6. GoDaddy → Nameservers → **Custom** → the four Route 53 nameservers of the new zone.
7. After propagation: `app.ezorder.io` still loads inside Shopify admin, email still arrives, `https://ezorder.io/`, `https://www.ezorder.io/` (redirects) and `https://ezorder.io/faq/` work.
8. Google Search Console → add `ezorder.io` (DNS TXT in Route 53) → submit `https://ezorder.io/sitemap-index.xml`.

Coordinate with the pending SES setup for `mailer.ezorder.io`: add its DKIM/SPF records in whichever DNS is authoritative at that moment, not in the middle of the switch.

### Operations

- **Publish:** save in Pages CMS or push to `main`; live in ~3 minutes.
- **Roll back:** revert the commit on `main`, or re-run the deploy job of an earlier successful workflow run (build artifacts are kept 7 days).
- **Old assets:** `/_astro/*` files are never deleted by deploys (cached pages may still reference them). Clean up occasionally if the bucket grows.
- **Cost:** S3 + CloudFront + Route 53 for a marketing site is typically a few USD per month (Route 53 zone $0.50). CloudFront invalidations: 1,000 paths/month free; each deploy uses one (`/*`).
- **Changing security headers / CSP:** edit `SecurityHeadersPolicy` in the template and update the stack (e.g. when adding a form provider or analytics).

## Contact form

`src/components/contact/ContactForm.astro` is configured in `src/data/contact-form.ts`.

- **`mailto` (current):** opens the visitor's email client with subject and body pre-filled, addressed to `supportEmail`. Zero backend, but depends on the visitor having a mail client.
- **Formspree:** create a form, set `provider: 'formspree'` and `endpoint: 'https://formspree.io/f/<id>'`.
- **Web3Forms:** get an access key, set `provider: 'web3forms'` and `web3formsAccessKey`.
- **Own endpoint (AWS):** set `provider: 'endpoint'` and `endpoint` to e.g. a Lambda function URL that validates the POST and sends it with SES. Add that origin to `form-action` in the CloudFront CSP.

Non-mailto providers include a honeypot field. The CSP `form-action` (CloudFront headers policy) already allows Formspree and Web3Forms.

## Live chat (Crisp)

`src/components/layout/ChatWidget.astro` holds the Crisp embed (website ID inside) and is rendered on every page by `BaseLayout`. The CloudFront CSP allows Crisp's domains (`*.crisp.chat`, `wss://*.relay.crisp.chat`, `*.crisp.help`, per Crisp's CSP guide). To remove the widget, delete `<ChatWidget />` from `BaseLayout`.

## SEO

- `<SEO>` component on every page: title template (`Page | EZ Order Printer`), description, canonical, `hreflang` + `x-default`, Open Graph, Twitter card, per-post OG image.
- JSON-LD: `Organization` + `WebSite` (all pages), `SoftwareApplication` + `FAQPage` (home), `Product`/`AggregateOffer` + `FAQPage` + `BreadcrumbList` (pricing), `BlogPosting` + `BreadcrumbList` (posts), `BreadcrumbList` (other pages).
- `@astrojs/sitemap` → `/sitemap-index.xml` (404 and the draft `/terms/` excluded; remove the terms filter in `astro.config.mjs` once final), referenced from `robots.txt`. Noindex pages emit no canonical/hreflang.
- Paginated pages get their own canonical URL and a `Blog – Page N` title.
- One `h1` per page, landmarks (`header`/`nav`/`main`/`footer`), skip link, `alt` text on every meaningful image.
- All URLs end with `/` (`trailingSlash: 'always'`), matching how the CloudFront function serves `index.html` files.

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
| `/faq/` (after review fixes) | 100 / 100 / 100 / 100 | — |

Also verified: no horizontal scroll at 360 px and 768 px on every page in light and dark mode; no console errors with the production CSP (the same policy now set by CloudFront); Pagefind search works under that CSP.

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
- **Bulk printing** is advertised as "up to 100 orders" (the app's `MAX_BULK_ORDERS`); the App Store listing's "hundreds" should be aligned too.
- **Email triggers** list only events the app actually subscribes to ("Order edited" is omitted — see app notes below).
- **POS copy** matches the POS extension: staff **print** invoice/receipt, packing slip, refund and return slip from the order screen. Download/email from POS is not claimed.
- **Languages:** "29 languages" — the app ships 31 translation files, which are 29 distinct languages (Portuguese has pt, pt_BR, pt_PT). Older docs and the listing images say 12.
- **"Made for Shopify"** strip instead of the "Built for Shopify" wording or badge, which may only be shown once the app earns it. No Shopify logos are used.
- **Privacy policy** (`/privacy-policy/`) is the canonical policy for the app and this site. `app.ezorder.io/privacy-policy` 301-redirects here (legal module in the app repo) and the App Store listing should use this URL. The old `/privacy/` URL redirects here too.
- **Search UI** is a small custom component on Pagefind's JS API (matches the design, loads nothing until used) instead of Pagefind's default widget.
- **Blog covers** were generated from the brand palette + real renders; replace them freely via the CMS.

## TODO — information needed

- [ ] **App Store URL** — assumed `https://apps.shopify.com/ez-order-printer` (from the app handle). Confirm.
- [ ] **Docs URL** — `docs.ezorder.io` currently shows "Uppush Order Limit" docs, so `docsUrl` is empty and Docs links are hidden. Set it in Site settings once EZ Order docs exist.
- [ ] **Support email** — assumed `support@ezorder.io` (used in the app). Confirm, and confirm the "reply within one business day" promise on `/about/`.
- [ ] **Pricing** — confirm the Free plan wording, the early-adopter banner text, and whether any usage limits apply. Update when paid plans launch (must match the listing).
- [ ] **Testimonials** — real App Store reviews (with permission) for `src/data/testimonials.ts`.
- [ ] **Brand** — confirm colours/logo usage; the listing images still say "OZ ORDER".
- [ ] **Company / legal** — registered company name and address; final **Terms of service** (current page is a draft); `companyName` in `site.json`.
- [ ] **Team & mission** — real About page copy (current text is placeholder).
- [ ] **Social links** and X/Twitter handle (`site.json`; empty links are hidden).
- [ ] **Contact form provider** — keep `mailto` or pick Formspree / Web3Forms / Pages Function.
- [ ] **Languages** — which locales to add to the website, if any.
- [ ] **Language count** — confirm "29 languages" for marketing (vs "12" in older materials).
- [ ] **"Powered by EZ Order Printer" PDF footer** — shown by default (`brandingRemoved` flag in the app). Decide whether removal is part of the Free plan and whether the site should say so.
- [ ] **Bulk limit** — confirm 100 orders per job (or raise it in the app) and align the App Store listing.

## Notes for the app repo (found while writing site copy)

- `orders/edited` and `orders/delete` are not in `EMAIL_TRIGGER_TOPICS` (`app/src/utils/webhook.utils.ts`), yet the automation UI offers "Order edited" / "Order deleted". For edits, `extractOrderId` should read `order_edit.order_id`.
- `webhook-trigger-map.ts` logs the full `returns/update` payload (customer personal data) with `console.log`.
- [ ] **Custom template service** — confirm "we'll build it for you / On request" is an offer you want to advertise.
