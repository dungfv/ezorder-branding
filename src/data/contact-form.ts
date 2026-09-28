/**
 * Contact form delivery settings.
 *
 * - `mailto` (current): the form opens the visitor's email client with the
 *   message pre-filled, addressed to `site.supportEmail`. No backend needed.
 * - `formspree`: set `endpoint` to your form URL, e.g. https://formspree.io/f/abcd1234
 * - `web3forms`: set `web3formsAccessKey`; the endpoint is fixed.
 * - `endpoint`: any HTTPS endpoint that accepts a form POST, e.g. an AWS Lambda
 *   function URL that sends the message with SES. Add its origin to the CSP `form-action`.
 *
 * See README → "Contact form" for step-by-step instructions.
 */
export type ContactProvider = 'mailto' | 'formspree' | 'web3forms' | 'endpoint';

export const contactForm: {
  provider: ContactProvider;
  endpoint: string;
  web3formsAccessKey: string;
} = {
  provider: 'mailto',
  endpoint: '',
  web3formsAccessKey: '',
};
