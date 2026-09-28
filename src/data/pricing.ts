/**
 * Typed access to pricing data.
 * Values live in `pricing.json` (editable in Pages CMS). Prices must match the
 * Shopify App Store listing — the listing is the source of truth for billing.
 */
import pricingJson from './pricing.json';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  /** Monthly price in `currency`. 0 = free. */
  priceMonthly: number;
  /** Monthly-equivalent price when billed yearly. Only used when `yearlyBilling` is on. */
  priceYearly: number;
  priceNote: string;
  highlight: boolean;
  ctaLabel: string;
  features: string[];
}

export interface ComparisonRow {
  feature: string;
  /** One value per plan, in plan order: "yes", "no", or a short label ("14", "On request"). */
  values: string[];
}

export interface PricingData {
  currency: string;
  yearlyBilling: boolean;
  notice: { enabled: boolean; label: string; title: string; body: string };
  plans: PricingPlan[];
  comparison: { group: string; rows: ComparisonRow[] }[];
  faq: { question: string; answer: string }[];
}

export const pricing: PricingData = pricingJson;

/** Format a price with Intl so separators and symbols follow the currency. */
export function formatPrice(amount: number, currency = pricing.currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
