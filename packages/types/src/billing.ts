import { z } from 'zod';
import { PRODUCT_KEYS, type ProductKey } from './platform';

/**
 * Billing contracts (Razorpay recurring subscriptions). The frontend asks the
 * API to create a Razorpay subscription for a chosen plan tier + cycle, opens
 * Razorpay Checkout with the returned subscription id, then posts the signed
 * result back for verification.
 */

/** The paid plan tiers a customer can subscribe to (FREE/ENTERPRISE excluded). */
export const BillingPlanSchema = z.enum(['STARTER', 'GROWTH']);
export type BillingPlan = z.infer<typeof BillingPlanSchema>;

export const BillingCycleSchema = z.enum(['MONTHLY', 'ANNUAL']);
export type BillingCycle = z.infer<typeof BillingCycleSchema>;

/** Request: create (or switch to) a subscription for the current org. */
export const CreateSubscriptionSchema = z.object({
  plan: BillingPlanSchema,
  cycle: BillingCycleSchema,
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

/** Response: everything Razorpay Checkout needs to open on the client. */
export interface CreateSubscriptionDTO {
  /** Razorpay subscription id (sub_...). */
  subscriptionId: string;
  /** Public Razorpay key id (rzp_...) used to init Checkout in the browser. */
  keyId: string;
  plan: BillingPlan;
  cycle: BillingCycle;
  /** Free-trial length granted on this subscription (0 if not eligible). */
  trialDays: number;
  /** ISO timestamp of the first charge (trial end), or null if charged now. */
  trialEndsAt: string | null;
}

/** Request: open a Lemon Squeezy hosted checkout for a plan + cycle. */
export const CreateCheckoutSchema = z.object({
  plan: BillingPlanSchema,
  cycle: BillingCycleSchema,
});
export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>;

/** Response: the hosted Lemon Squeezy checkout URL to redirect/overlay to. */
export interface CreateCheckoutDTO {
  url: string;
  plan: BillingPlan;
  cycle: BillingCycle;
}

/** Request: verify the signed payload Razorpay Checkout returns on success. */
export const VerifySubscriptionSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifySubscriptionInput = z.infer<typeof VerifySubscriptionSchema>;

/** The current org's subscription state, returned by GET /billing/subscription. */
export interface SubscriptionStatusDTO {
  tier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  cycle: BillingCycle;
  seats: number;
  currentPeriodEnd: string | null;
  /** True once a Razorpay subscription is attached. */
  active: boolean;
  /** How many AI products this plan allows the customer to enable. */
  productLimit: number;
  /** Products the org currently has enabled. */
  products: ProductKey[];
}

/**
 * Request: a customer choosing which AI products to enable for their own org.
 * The server enforces that the count does not exceed the plan's productLimit.
 */
export const ChooseProductsSchema = z.object({
  products: z.array(z.enum(PRODUCT_KEYS)),
});
export type ChooseProductsInput = z.infer<typeof ChooseProductsSchema>;
