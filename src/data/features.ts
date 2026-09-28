/**
 * Product facts used across the home page.
 * Every claim here maps to shipped behaviour in the EZ Order Printer app
 * (template types, email triggers, admin/POS extensions, storefront button).
 * Roadmap items are flagged with `roadmap: true` and must never read as available.
 */
import type { IconName } from '../components/ui/Icon.astro';

export interface Feature {
  icon: IconName;
  title: string;
  body: string;
  roadmap?: boolean;
}

export const features: Feature[] = [
  {
    icon: 'template',
    title: 'Template management',
    body: 'Start from 14 ready-made designs, then set your logo, colours, fonts and legal details once. The live preview re-renders as you type.',
  },
  {
    icon: 'files',
    title: 'Every document an order needs',
    body: 'Invoices and receipts, packing slips, return slips, refunds and credit notes, and draft-order quotes — all from one branded template set.',
  },
  {
    icon: 'printer',
    title: 'Print & download PDF',
    body: 'Render any document from live order data, print it, or save it as a PDF. Select up to 100 orders and get one file in a single job.',
  },
  {
    icon: 'mail',
    title: 'Email with the PDF attached',
    body: 'Send invoices for orders and quotes for draft orders straight from the admin, with the document attached and your own sender address.',
  },
  {
    icon: 'zap',
    title: 'Automatic emails on Shopify events',
    body: 'Pick the moment — order paid, fulfilled, refunded, return approved — filter by tags, and the right document goes out on its own.',
  },
  {
    icon: 'globe',
    title: 'Multi-currency, multi-language',
    body: 'Documents follow the customer: the currency they paid in, with correct separators, and labels in 29 languages including right-to-left.',
  },
  {
    icon: 'store',
    title: 'Self-service downloads',
    body: 'A theme-matched button on the order status and thank-you pages lets customers download their own invoice — no more “can you resend it?”',
  },
  {
    icon: 'admin',
    title: 'Print inside Shopify admin',
    body: 'Print actions sit right on the order and draft-order pages and in bulk actions on the orders list. No tab-switching, no copy-paste.',
  },
  {
    icon: 'pos',
    title: 'Shopify POS ready',
    body: 'At the counter, open the order in Shopify POS, tap “Print with EZ Order Printer” and hand over a branded receipt, packing slip or refund note.',
  },
  {
    icon: 'landmark',
    title: 'EU invoicing & Peppol',
    body: 'Structured e-invoicing and EU VAT compliance tooling are on our roadmap. Today, templates already carry VAT and registration fields.',
    roadmap: true,
  },
];

export interface DocumentType {
  id: string;
  icon: IconName;
  name: string;
  summary: string;
  /** Key of the screenshot in `src/assets/docs`. Omit when no capture exists. */
  image?: 'invoice' | 'packing-slip' | 'refund' | 'draft-order';
}

export const documentTypes: DocumentType[] = [
  {
    id: 'invoice',
    icon: 'receipt',
    name: 'Invoice / Receipt',
    summary: 'Tax breakdown, payment status, discounts, balance due and a scannable order barcode.',
    image: 'invoice',
  },
  {
    id: 'packing-slip',
    icon: 'package',
    name: 'Packing slip',
    summary: 'Items and quantities without prices, tracking details and notes for the packer.',
    image: 'packing-slip',
  },
  {
    id: 'refund',
    icon: 'undo',
    name: 'Refund / Credit note',
    summary: 'Refunded lines, adjustments and the net amount returned to the customer.',
    image: 'refund',
  },
  {
    id: 'draft-order',
    icon: 'draft',
    name: 'Draft order',
    summary: 'A professional quote or pro-forma invoice before the order is paid.',
    image: 'draft-order',
  },
  {
    id: 'return',
    icon: 'bag',
    name: 'Return slip',
    summary: 'Returned items, reasons and instructions to include in the parcel.',
  },
];

export const howItWorks = [
  {
    title: 'Install from the Shopify App Store',
    body: 'One click, no code. Your store name, address and currency are picked up automatically.',
  },
  {
    title: 'Pick a template and brand it',
    body: 'Choose a design, upload your logo, set colours and the company details your customers need.',
  },
  {
    title: 'Print, email or automate',
    body: 'Print from any order, send the PDF by email, or let automations deliver documents on Shopify events.',
  },
];

export const platformSurfaces: { icon: IconName; label: string }[] = [
  { icon: 'admin', label: 'Shopify admin' },
  { icon: 'pos', label: 'Shopify POS' },
  { icon: 'store', label: 'Online store' },
  { icon: 'mail', label: 'Customer email' },
];
