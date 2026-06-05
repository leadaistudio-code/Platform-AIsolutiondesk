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
import { RazorpayService } from './razorpay.service';
import { BillingService } from './billing.service';

/**
 * Receives Razorpay subscription lifecycle events. Like the Clerk webhook, it's
 * @Public but protected by verifying the X-Razorpay-Signature HMAC against the
 * raw request body — so only Razorpay can trigger state changes here.
 *
 * Configure this URL in the Razorpay dashboard (Settings → Webhooks) for the
 * subscription.* events, using RAZORPAY_WEBHOOK_SECRET as the secret.
 */
@ApiExcludeController()
@Controller('webhooks/razorpay')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly razorpay: RazorpayService,
    private readonly billing: BillingService,
  ) {}

  @Public()
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString('utf8');
    if (!payload) throw new BadRequestException('Missing body');

    if (!signature || !this.razorpay.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const evt = JSON.parse(payload) as {
      event: string;
      payload?: { subscription?: { entity?: RazorpaySubscriptionEntity } };
    };
    await this.dispatch(evt);
    return { received: true };
  }

  private async dispatch(evt: {
    event: string;
    payload?: { subscription?: { entity?: RazorpaySubscriptionEntity } };
  }) {
    const entity = evt.payload?.subscription?.entity;
    if (!entity?.id) {
      this.logger.debug(`Ignoring event without subscription entity: ${evt.event}`);
      return;
    }

    // Razorpay's `current_end` is a unix timestamp (seconds) for the period end.
    const periodEnd = entity.current_end
      ? new Date(entity.current_end * 1000)
      : null;

    const map: Record<string, SubscriptionStatus> = {
      'subscription.activated': SubscriptionStatus.ACTIVE,
      'subscription.charged': SubscriptionStatus.ACTIVE,
      'subscription.resumed': SubscriptionStatus.ACTIVE,
      'subscription.authenticated': SubscriptionStatus.TRIALING,
      'subscription.pending': SubscriptionStatus.PAST_DUE,
      'subscription.halted': SubscriptionStatus.PAST_DUE,
      'subscription.cancelled': SubscriptionStatus.CANCELED,
      'subscription.completed': SubscriptionStatus.CANCELED,
    };

    const status = map[evt.event];
    if (!status) {
      this.logger.debug(`Unhandled Razorpay event: ${evt.event}`);
      return;
    }
    await this.billing.applyWebhookStatus(entity.id, status, periodEnd);
  }
}

interface RazorpaySubscriptionEntity {
  id: string;
  current_end?: number;
}
