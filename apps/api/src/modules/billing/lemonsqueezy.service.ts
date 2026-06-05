import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { env } from '@aisolutiondesk/config';
import type { BillingCycle, BillingPlan } from '@aisolutiondesk/types';

const API_BASE = 'https://api.lemonsqueezy.com/v1';

/**
 * Lemon Squeezy integration (Merchant of Record). LS hosts the checkout and
 * owns the subscription lifecycle + global tax/VAT; we just create checkouts
 * and react to webhooks. Uses the REST API directly (no SDK dependency).
 *
 * Billing is optional: without an API key the service reports unconfigured and
 * the controller returns a clean 503 instead of crashing.
 */
@Injectable()
export class LemonSqueezyService {
  private readonly logger = new Logger(LemonSqueezyService.name);

  get isConfigured(): boolean {
    return Boolean(env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_STORE_ID);
  }

  private require(): { apiKey: string; storeId: string } {
    if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID) {
      throw new ServiceUnavailableException(
        'Billing is not configured. Set LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID.',
      );
    }
    return {
      apiKey: env.LEMONSQUEEZY_API_KEY,
      storeId: env.LEMONSQUEEZY_STORE_ID,
    };
  }

  /** Map a plan tier + cycle to the configured Lemon Squeezy variant id. */
  variantId(plan: BillingPlan, cycle: BillingCycle): string | null {
    const key = `LEMONSQUEEZY_VARIANT_${plan}_${cycle}` as keyof typeof env;
    return (env[key] as string | undefined) ?? null;
  }

  /**
   * Create a hosted checkout for a variant and return its URL. We embed the
   * org id in custom data so the webhook can map the subscription back to the
   * tenant, and pre-fill the buyer email when we have it.
   */
  async createCheckout(params: {
    variantId: string;
    organizationId: string;
    email: string | null;
    redirectUrl: string;
  }): Promise<{ url: string }> {
    const { apiKey, storeId } = this.require();

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            ...(params.email ? { email: params.email } : {}),
            // Custom values MUST be strings; surfaced back on the webhook.
            custom: { organization_id: params.organizationId },
          },
          product_options: {
            redirect_url: params.redirectUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(params.variantId) } },
        },
      },
    };

    const res = await fetch(`${API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Lemon Squeezy checkout failed (${res.status}): ${detail}`);
      throw new InternalServerErrorException('Could not start checkout.');
    }

    const json = (await res.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const url = json.data?.attributes?.url;
    if (!url) {
      throw new InternalServerErrorException('Checkout URL missing from response.');
    }
    return { url };
  }

  /**
   * Verify the X-Signature header on an incoming webhook: an HMAC-SHA256 hex
   * digest of the raw request body, keyed by the webhook signing secret.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
