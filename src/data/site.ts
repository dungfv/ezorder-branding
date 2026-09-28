/**
 * Site-wide settings.
 * Values live in `site.json` so non-developers can edit them in Pages CMS; they
 * are validated with zod at build time so a bad CMS edit fails with a clear message.
 * The canonical origin comes from `site` in astro.config.mjs (single source of truth).
 */
import { z } from 'astro/zod';
import siteJson from './site.json';

/** Empty strings / nulls from the CMS become "not set". */
const optionalText = z.preprocess((v) => (v == null ? '' : v), z.string().trim());
const optionalUrl = optionalText.refine((v) => v === '' || /^(https?:\/\/|mailto:)/.test(v), {
  message: 'must be empty or start with https://',
});

const SiteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  appStoreUrl: z.url(),
  appUrl: optionalUrl,
  /** Empty = no docs site yet: Docs links are hidden everywhere. */
  docsUrl: optionalUrl,
  supportEmail: z.email(),
  companyName: z.string().min(1),
  twitterHandle: optionalText,
  social: z
    .preprocess((v) => v ?? [], z.array(z.object({ label: optionalText, url: optionalUrl })))
    .default([]),
});

export type SiteSettings = z.infer<typeof SiteSchema> & { url: string };

export const site: SiteSettings = {
  ...SiteSchema.parse(siteJson),
  url: (import.meta.env.SITE ?? 'https://ezorder.io').replace(/\/$/, ''),
};

/** Social profiles with an actual URL (empty entries are hidden). */
export const socialLinks = site.social.filter((link) => link.url !== '');

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

const docsLink: NavItem[] = site.docsUrl ? [{ label: 'Docs', href: site.docsUrl, external: true }] : [];

export const mainNav: NavItem[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Blog', href: '/blog/' },
  ...docsLink,
  { label: 'About', href: '/about/' },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/#features' },
      { label: 'Documents', href: '/#documents' },
      { label: 'Email automation', href: '/#automation' },
      { label: 'Pricing', href: '/pricing/' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Blog', href: '/blog/' },
      { label: 'FAQ', href: '/faq/' },
      ...(site.docsUrl ? [{ label: 'Documentation', href: site.docsUrl, external: true }] : []),
      { label: 'Shopify App Store', href: site.appStoreUrl, external: true },
      { label: 'RSS feed', href: '/rss.xml' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About & contact', href: '/about/' },
      { label: 'Privacy Policy', href: '/privacy-policy/' },
      { label: 'Terms', href: '/terms/' },
    ],
  },
];

/** Attributes for links that open in a new tab. */
export const externalLinkAttrs = { target: '_blank', rel: 'noopener' } as const;
