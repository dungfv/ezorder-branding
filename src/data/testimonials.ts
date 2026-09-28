/**
 * Merchant testimonials.
 *
 * TODO: replace with real Shopify App Store reviews (with permission).
 * Entries marked `placeholder: true` are rendered in `astro dev` only and are
 * stripped from production builds, so sample quotes never go live by accident.
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  placeholder?: boolean;
}

const allTestimonials: Testimonial[] = [
  {
    quote:
      'Our wholesale buyers kept asking for PO numbers and VAT details on invoices. We set it up once and never heard about it again.',
    author: 'Sample merchant',
    role: 'B2B homeware store',
    placeholder: true,
  },
  {
    quote:
      'Packing slips print from the orders list in one batch every morning. It took five minutes to make them look like our brand.',
    author: 'Sample merchant',
    role: 'Apparel brand, 40 orders a day',
    placeholder: true,
  },
  {
    quote:
      'Customers download their own invoices from the order page now. Our “please resend my invoice” emails basically stopped.',
    author: 'Sample merchant',
    role: 'Electronics retailer',
    placeholder: true,
  },
];

export const testimonials = import.meta.env.PROD
  ? allTestimonials.filter((item) => !item.placeholder)
  : allTestimonials;
