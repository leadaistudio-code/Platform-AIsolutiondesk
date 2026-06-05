import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionStatus } from '@aisolutiondesk/db';
import { Public } from '../../common/decorators/public.decorator';
import { LemonSqueezyService } from './lemonsqueezy.service';
import { BillingService } from './billing.service';

/**
 * Receives Lemon Squeezy subscription webhooks. @Public but protected by
 * verifying the X-Signature HMAC against the raw body — only LS can trigger it.
 *
 * Configure in the LS dashboard (Settings → Webhooks) for the subscription_*
 * events, pointing at <API_URL>/webhooks/lemonsqueezy with
 * LEMONSQUEEZY_WEBHOOK_SECRET as the signing secret.
 */
@ApiExcludeController()
@Controller('webhooks/lemonsqueezy')
export class LemonSqueezyWebhookController {
  private readonly logger = new Logger(LemonSqueezyWebhookController.name);

  constructor(
    private readonly lemon: LemonSqueezyService,
    private readonly billing: BillingService,
  ) {}

  @Public()
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString('utf8');
    if (!payload) throw new BadRequestException('Missing body');

    if (!this.lemon.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const evt = JSON.parse(payload) as LemonWebhook;
    await this.dispatch(evt);
    return { received: true };
  }

  private async dispatch(evt: LemonWebhook) {
    const eventName = evt.meta?.event_name ?? '';
    if (!eventName.startsWith('subscription_')) {
      this.logger.debug(`Ignoring non-subscription event: ${eventName}`);
      return;
    }

    const organizationId = evt.meta?.custom_data?.organization_id;
    const sub = evt.data;
    if (!organizationId || !sub?.id) {
      this.logger.warn(
        `Webhook ${eventName} missing organization_id or subscription id — ignoring`,
      );
      return;
    }

    const attrs = sub.attributes ?? {};
    // LS status strings → our SubscriptionStatus.
    const statusMap: Record<string, SubscriptionStatus> = {
      on_trial: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      paused: SubscriptionStatus.PAST_DUE,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.PAST_DUE,
      cancelled: SubscriptionStatus.CANCELED,
      expired: SubscriptionStatus.CANCELED,
    };
    const status = statusMap[attrs.status ?? ''] ?? SubscriptionStatus.ACTIVE;

    // renews_at (active) or ends_at (cancelled) is the next boundary date.
    const boundary = attrs.renews_at ?? attrs.ends_at ?? null;

    await this.billing.applyLemonWebhook({
      organizationId,
      lemonSubscriptionId: String(sub.id),
      lemonCustomerId: attrs.customer_id != null ? String(attrs.customer_id) : null,
      lemonVariantId: attrs.variant_id != null ? String(attrs.variant_id) : null,
      status,
      currentPeriodEnd: boundary ? new Date(boundary) : null,
    });
  }
}

interface LemonWebhook {
  meta?: {
    event_name?: string;
    custom_data?: { organization_id?: string };
  };
  data?: {
    id?: string | number;
    attributes?: {
      status?: string;
      customer_id?: string | number;
      variant_id?: string | number;
      renews_at?: string | null;
      ends_at?: string | null;
    };
  };
}
