import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { LemonSqueezyController } from './lemonsqueezy.controller';
import { LemonSqueezyWebhookController } from './lemonsqueezy-webhook.controller';
import { BillingService } from './billing.service';
import { RazorpayService } from './razorpay.service';
import { LemonSqueezyService } from './lemonsqueezy.service';

/**
 * Billing module. Supports two gateways behind one BillingService:
 *   - Razorpay (recurring subscriptions, India/local)
 *   - Lemon Squeezy (Merchant of Record, international payments + tax)
 * Each exposes its own customer endpoints + signature-verified webhook.
 */
@Module({
  controllers: [
    BillingController,
    RazorpayWebhookController,
    LemonSqueezyController,
    LemonSqueezyWebhookController,
  ],
  providers: [BillingService, RazorpayService, LemonSqueezyService],
  exports: [BillingService],
})
export class BillingModule {}
