/**
 * Builders for schema.org JSON-LD objects.
 * Pages pass the result to <BaseLayout jsonLd={[...]}> which renders one
 * <script type="application/ld+json"> per object.
 */
import { site } from '../data/site';
import type { FaqItem } from '../data/faq';
import type { PricingPlan } from '../data/pricing';

export type JsonLd = Record<string, unknown>;

const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;
const APP_ID = `${site.url}/#app`;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function organizationSchema(): JsonLd {
  const sameAs = site.social.map((s) => s.url).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.companyName,
    url: site.url,
    logo: absoluteUrl('/logo-512.png'),
    email: site.supportEmail,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: site.supportEmail,
      availableLanguage: ['English'],
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: site.url,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

export function softwareApplicationSchema(plans: PricingPlan[], currency: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: site.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Invoicing',
    operatingSystem: 'Web, Shopify',
    url: site.url,
    installUrl: site.appStoreUrl,
    description: site.description,
    image: absoluteUrl('/og-default.jpg'),
    publisher: { '@id': ORG_ID },
    offers: plans.map((plan) => offerSchema(plan, currency)),
  };
}

export function offerSchema(plan: PricingPlan, currency: string): JsonLd {
  return {
    '@type': 'Offer',
    name: `${plan.name} plan`,
    price: plan.priceMonthly.toFixed(2),
    priceCurrency: currency,
    url: site.appStoreUrl,
    availability: 'https://schema.org/InStock',
    category: plan.priceMonthly === 0 ? 'free' : 'subscription',
  };
}

export function faqPageSchema(items: FaqItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingSchema(post: {
  title: string;
  description: string;
  path: string;
  image: string;
  author: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: absoluteUrl(post.path),
    mainEntityOfPage: absoluteUrl(post.path),
    image: absoluteUrl(post.image),
    datePublished: post.pubDate.toISOString(),
    dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
    // "EZ Order team"-style bylines are an organisation, not a person.
    author: { '@type': /\bteam\b/i.test(post.author) ? 'Organization' : 'Person', name: post.author },
    publisher: { '@id': ORG_ID },
    keywords: post.tags.join(', '),
    inLanguage: 'en',
  };
}
