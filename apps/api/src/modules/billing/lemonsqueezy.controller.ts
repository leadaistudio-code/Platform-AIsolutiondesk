import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateCheckoutSchema,
  type CreateCheckoutInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { BillingService } from './billing.service';

/**
 * Lemon Squeezy checkout (Merchant of Record). The pricing page calls this to
 * get a hosted checkout URL, then redirects/overlays the customer to it. LS
 * handles payment, the free trial, and global tax — we just react to webhooks.
 */
@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing/lemonsqueezy')
export class LemonSqueezyController {
  constructor(private readonly billing: BillingService) {}

  /** Create a hosted checkout for the chosen plan + cycle. */
  @Post('checkout')
  @RequirePermission('billing:manage')
  checkout(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateCheckoutSchema))
    body: CreateCheckoutInput,
  ) {
    return this.billing.createCheckout(ctx, body);
  }
}
