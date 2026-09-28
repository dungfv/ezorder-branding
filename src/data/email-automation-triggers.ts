/**
 * Shopify events that can trigger an automatic document email.
 * Mirrors the trigger enums in the app (`email-automation.schema.ts`).
 */
export const emailTriggerGroups: { document: string; triggers: string[] }[] = [
  {
    document: 'Invoice / Receipt',
    triggers: [
      'Order created',
      'Order paid',
      'Order fulfilled',
      'Order partially fulfilled',
      'Order refunded',
      'Order cancelled',
      'Order updated',
    ],
  },
  {
    document: 'Packing slip',
    triggers: ['Fulfillment created', 'Fulfillment updated'],
  },
  {
    document: 'Refund / Credit note',
    triggers: ['Refund created'],
  },
  {
    document: 'Return slip',
    triggers: ['Return requested', 'Return approved', 'Return processed', 'Return closed'],
  },
  {
    document: 'Draft order',
    triggers: ['Draft order created', 'Draft order updated'],
  },
];
