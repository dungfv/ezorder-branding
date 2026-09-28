/**
 * Typed access to site-wide settings.
 * The values live in `site.json` so non-developers can edit them in Pages CMS.
 */
import siteJson from './site.json';

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  appStoreUrl: string;
  appUrl: string;
  docsUrl: string;
  privacyPolicyUrl: string;
  supportEmail: string;
  companyName: string;
  twitterHandle: string;
  social: SocialLink[];
}

export const site: SiteSettings = siteJson;

/** Social profiles with an actual URL (empty entries are hidden). */
export const socialLinks = site.social.filter((link) => link.url.trim() !== '');

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const mainNav: NavItem[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Docs', href: site.docsUrl, external: true },
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
      { label: 'Documentation', href: site.docsUrl, external: true },
      { label: 'Shopify App Store', href: site.appStoreUrl, external: true },
      { label: 'RSS feed', href: '/rss.xml' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About & contact', href: '/about/' },
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Terms', href: '/terms/' },
    ],
  },
];
