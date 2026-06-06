import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ChooseProductsSchema,
  CreateSubscriptionSchema,
  VerifySubscriptionSchema,
  type ChooseProductsInput,
  type CreateSubscriptionInput,
  type VerifySubscriptionInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { BillingService } from './billing.service';

/**
 * Customer-facing billing endpoints (behind auth, OWNER-only). The marketing
 * pricing page calls these to start a Razorpay subscription, then confirms the
 * payment after Razorpay Checkout completes.
 */
@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Current org's subscription state (drives the dashboard billing panel). */
  @Get('subscription')
  @RequirePermission('billing:manage')
  getStatus(@CurrentContext() ctx: RequestContext) {
    return this.billing.getStatus(ctx);
  }

  /** Create a Razorpay subscription and return what Checkout needs. */
  @Post('subscription')
  @RequirePermission('billing:manage')
  create(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateSubscriptionSchema))
    body: CreateSubscriptionInput,
  ) {
    return this.billing.createSubscription(ctx, body);
  }

  /** Verify the signed result Razorpay Checkout returns on success. */
  @Post('verify')
  @RequirePermission('billing:manage')
  verify(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(VerifySubscriptionSchema))
    body: VerifySubscriptionInput,
  ) {
    return this.billing.verifySubscription(ctx, body);
  }

  /** Customer chooses which AI products to enable (enforced by plan limit). */
  @Put('products')
  @RequirePermission('billing:manage')
  chooseProducts(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(ChooseProductsSchema))
    body: ChooseProductsInput,
  ) {
    return this.billing.chooseProducts(ctx, body);
  }
}
