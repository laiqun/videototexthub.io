/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 *
 * AI Image Describer: the tool itself is quota-based (daily free quota tracked
 * in KV), NOT credit-based — so `credits` stays 0 on every product. Pro access
 * duration is carried by `creditsValidDays` (valid_days in the old Next.js
 * pricing config). Creem product ids are mapped at runtime via the admin
 * settings (`creem_product_ids`), not hardcoded here.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

/**
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  free: {
    productId: 'free',
    productName: 'AI Image Describer Free',
    planName: 'Free',
    description: 'For personal and light use.',
    type: PaymentType.ONE_TIME,
    priceInCents: 0,
    currency: 'usd',
    credits: 0,
    creditsValidDays: 0,
  },
  'pro-monthly': {
    productId: 'pro-monthly',
    productName: 'AI Image Describer Pro Monthly',
    planName: 'Pro',
    description: 'Monthly subscription for Pro access.',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 490,
    currency: 'usd',
    credits: 0,
    creditsValidDays: 30,
    plan: {
      name: 'Pro Monthly',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  'pro-yearly': {
    productId: 'pro-yearly',
    productName: 'AI Image Describer Pro Yearly',
    planName: 'Pro',
    description: 'Yearly subscription for Pro access.',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 2990,
    currency: 'usd',
    credits: 0,
    creditsValidDays: 365,
    plan: {
      name: 'Pro Yearly',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  'pro-one-month': {
    productId: 'pro-one-month',
    productName: 'AI Image Describer Pro 1 Month One Time',
    planName: 'Pro',
    description: 'One-time payment for 1 month of Pro access.',
    type: PaymentType.ONE_TIME,
    priceInCents: 490,
    currency: 'usd',
    credits: 0,
    creditsValidDays: 30,
  },
  'pro-one-year': {
    productId: 'pro-one-year',
    productName: 'AI Image Describer Pro 1 Year One Time',
    planName: 'Pro',
    description: 'One-time payment for 1 year of Pro access.',
    type: PaymentType.ONE_TIME,
    priceInCents: 2990,
    currency: 'usd',
    credits: 0,
    creditsValidDays: 365,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
