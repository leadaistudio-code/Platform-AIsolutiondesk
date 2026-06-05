import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import { env } from '@aisolutiondesk/config';
import type { BillingCycle, BillingPlan } from '@aisolutiondesk/types';

/**
 * Thin wrapper around the Razorpay SDK. Centralizes client construction (so the
 * rest of the app never touches keys), maps our plan tier + billing cycle to the
 * Razorpay plan ids configured in env, and verifies the signatures Razorpay
 * sends on checkout success and via webhooks.
 *
 * Billing is optional: if the keys aren't configured the service reports as
 * unconfigured and the controller returns a clean 503 rather than crashing.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly client: Razorpay | null;

  constructor() {
    this.client =
      env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
          })
        : null;
    if (!this.client) {
      this.logger.warn(
        'Razorpay keys not configured — billing endpoints will return 503.',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get keyId(): string {
    return env.RAZORPAY_KEY_ID ?? '';
  }

  private require(): Razorpay {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Billing is not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.',
      );
    }
    return this.client;
  }

  /** Map a plan tier + cycle to the Razorpay plan_id from env (or null). */
  planId(plan: BillingPlan, cycle: BillingCycle): string | null {
    const key =
      `RAZORPAY_PLAN_${plan}_${cycle}` as keyof typeof env;
    return (env[key] as string | undefined) ?? null;
  }

  /**
   * Create a recurring Razorpay subscription against a configured plan. Annual
   * subscriptions bill once per year (total_count 5y); monthly bills monthly.
   */
  async createSubscription(params: {
    planId: string;
    cycle: BillingCycle;
    seats: number;
    notes: Record<string, string>;
    /**
     * Unix timestamp (seconds) for the first charge. When set in the future it
     * creates a free trial: the customer authorizes the mandate now but is only
     * charged at start_at. Omit to charge immediately.
     */
    startAt?: number;
  }): Promise<{ id: string }> {
    const client = this.require();
    // total_count = number of billing cycles before the subscription completes.
    const totalCount = params.cycle === 'ANNUAL' ? 5 : 60; // ~5 years either way
    const sub = await client.subscriptions.create({
      plan_id: params.planId,
      total_count: totalCount,
      quantity: params.seats,
      customer_notify: 1,
      notes: params.notes,
      ...(params.startAt ? { start_at: params.startAt } : {}),
    });
    return { id: sub.id };
  }

  /** Cancel a subscription (at cycle end by default). */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.require().subscriptions.cancel(subscriptionId, false);
  }

  /**
   * Verify the signature Razorpay Checkout returns after a successful payment.
   * For subscriptions the signed message is `payment_id|subscription_id`.
   */
  verifyCheckoutSignature(input: {
    paymentId: string;
    subscriptionId: string;
    signature: string;
  }): boolean {
    const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET ?? '')
      .update(`${input.paymentId}|${input.subscriptionId}`)
      .digest('hex');
    return this.safeEqual(expected, input.signature);
  }

  /** Verify the X-Razorpay-Signature on an incoming webhook against raw body. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return this.safeEqual(expected, signature);
  }

  /** Constant-time string comparison that won't throw on length mismatch. */
  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }
}
