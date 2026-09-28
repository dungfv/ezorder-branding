/**
 * Pricing data.
 * Values live in `pricing.json` (editable in Pages CMS) and are validated with
 * zod at build time, so an empty price or a bad currency code fails the build
 * with a readable error instead of shipping broken JSON-LD. Prices must match
 * the Shopify App Store listing — the listing is the source of truth for billing.
 */
import { z } from 'astro/zod';
import pricingJson from './pricing.json';

const text = z.preprocess((v) => (v == null ? '' : v), z.string());
const list = <T extends z.ZodType>(item: T) => z.preprocess((v) => v ?? [], z.array(item));

const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: text,
  /** Monthly price in `currency`. 0 = free. */
  priceMonthly: z.number().min(0),
  /** Monthly-equivalent price when billed yearly. Only used when `yearlyBilling` is on. */
  priceYearly: z.preprocess((v) => v ?? 0, z.number().min(0)),
  priceNote: text,
  highlight: z.preprocess((v) => v ?? false, z.boolean()),
  ctaLabel: z.string().min(1),
  features: list(z.string()),
});

const PricingSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'use a 3-letter ISO code such as USD'),
    yearlyBilling: z.preprocess((v) => v ?? false, z.boolean()),
    notice: z.object({
      enabled: z.preprocess((v) => v ?? false, z.boolean()),
      label: text,
      title: text,
      body: text,
    }),
    plans: z.array(PlanSchema).min(1, 'add at least one plan'),
    comparison: list(
      z.object({
        group: z.string().min(1),
        rows: list(z.object({ feature: z.string().min(1), values: list(z.string()) })),
      }),
    ),
    faq: list(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  })
  .superRefine((data, ctx) => {
    // Every comparison row needs one value per plan, otherwise cells silently read "not included".
    for (const group of data.comparison) {
      for (const row of group.rows) {
        if (row.values.length !== data.plans.length) {
          ctx.addIssue({
            code: 'custom',
            message: `comparison row "${row.feature}" has ${row.values.length} values for ${data.plans.length} plans`,
          });
        }
      }
    }
  });

export type PricingData = z.infer<typeof PricingSchema>;
export type PricingPlan = PricingData['plans'][number];

export const pricing: PricingData = PricingSchema.parse(pricingJson);

/** Format a price with Intl so separators and symbols follow the currency. */
export function formatPrice(amount: number, currency = pricing.currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
