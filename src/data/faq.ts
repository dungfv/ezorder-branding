/**
 * Home page FAQ. Rendered as <details> and as FAQPage JSON-LD,
 * so answers are plain text (no HTML).
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const homeFaq: FaqItem[] = [
  {
    question: 'What documents can I create with EZ Order Printer?',
    answer:
      'Invoices and receipts, packing slips, return slips, refunds and credit notes, and draft-order quotes. Each document type has its own template, and all of them share your branding.',
  },
  {
    question: 'Can I customize my Shopify invoice template?',
    answer:
      'Yes. Pick one of 14 ready-made templates, add your logo, colours and fonts, and toggle blocks such as tax number, registration number, bank details, order notes and tracking. The preview updates as you edit.',
  },
  {
    question: 'Does it work with Shopify POS?',
    answer:
      'Yes. EZ Order Printer adds a print action to Shopify POS, so staff can print a receipt or packing slip, or download the PDF, right at the counter.',
  },
  {
    question: 'Can invoices be emailed automatically?',
    answer:
      'Yes. Create an automation, choose the Shopify event (for example order paid, order fulfilled or refund created), optionally filter by order or customer tags, and the document is emailed with the PDF attached.',
  },
  {
    question: 'Which languages and currencies are supported?',
    answer:
      'Documents can be printed in more than 30 languages, including right-to-left languages such as Arabic and Hebrew, and in the currency the customer paid in, with the right symbol and number format.',
  },
  {
    question: 'Can customers download invoices themselves?',
    answer:
      'Yes. Enable the download button and customers get a theme-matched button on their order status and thank-you pages to download the latest version of their invoice.',
  },
  {
    question: 'Do you support EU e-invoicing and Peppol?',
    answer:
      'Not yet. Structured e-invoicing and Peppol delivery are on our roadmap. Today you can already add the VAT and company registration details that EU invoices require to your templates.',
  },
  {
    question: 'How much does EZ Order Printer cost?',
    answer:
      'EZ Order Printer is free during early access, with every feature included. Any future plan will be billed through Shopify and announced in advance.',
  },
];
