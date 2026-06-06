import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { env } from '@aisolutiondesk/config';
import { prisma, PlanTier, SubscriptionStatus, BillingCycle as DbCycle, Product } from '@aisolutiondesk/db';
import type {
  ChooseProductsInput,
  ClaimSubscriptionInput,
  CreateCheckoutDTO,
  CreateCheckoutInput,
  CreateSubscriptionDTO,
  CreateSubscriptionInput,
  ProductKey,
  PublicCheckoutInput,
  SubscriptionStatusDTO,
  VerifySubscriptionInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { RazorpayService } from './razorpay.service';
import { LemonSqueezyService } from './lemonsqueezy.service';

/** Default seat counts per plan, mirroring the marketing pricing page. */
const PLAN_SEATS: Record<'STARTER' | 'GROWTH', number> = {
  STARTER: 3,
  GROWTH: 15,
};

/** Length of the free trial before the first charge, in days. */
const TRIAL_DAYS = 3;

/** Map our public BillingPlan to the DB PlanTier enum. */
const PLAN_TO_TIER: Record<'STARTER' | 'GROWTH', PlanTier> = {
  STARTER: PlanTier.STARTER,
  GROWTH: PlanTier.PRO,
};

/**
 * How many AI products a customer on each tier may enable. This is what turns
 * "Starter = 1 product / Growth = up to 3" from the pricing page into an
 * enforceable rule when the customer picks their agents.
 */
const PRODUCT_LIMIT: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.STARTER]: 1,
  [PlanTier.PRO]: 3,
  [PlanTier.ENTERPRISE]: 8,
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly razorpay: RazorpayService,
    private readonly lemon: LemonSqueezyService,
  ) {}

  /**
   * Create a Lemon Squeezy hosted checkout for the current org's chosen plan +
   * cycle and return its URL. LS owns the subscription + trial lifecycle; the
   * webhook is what writes the subscription back to our DB once it's created.
   */
  async createCheckout(
    ctx: RequestContext,
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutDTO> {
    const variantId = this.lemon.variantId(input.plan, input.cycle);
    if (!variantId) {
      throw new BadRequestException(
        `No Lemon Squeezy variant configured for ${input.plan} ${input.cycle}. ` +
          `Set LEMONSQUEEZY_VARIANT_${input.plan}_${input.cycle}.`,
      );
    }

    const user = ctx.userId
      ? await prisma.user.findUnique({
          where: { id: ctx.userId },
          select: { email: true },
        })
      : null;

    const { url } = await this.lemon.createCheckout({
      variantId,
      organizationId: ctx.organizationId,
      email: user?.email ?? null,
      redirectUrl: `${env.WEB_URL}/dashboard?subscribed=1`,
    });

    return { url, plan: input.plan, cycle: input.cycle };
  }

  /**
   * Apply a Lemon Squeezy subscription webhook. Keyed by the org id we passed
   * as custom data at checkout. Idempotent — safe on duplicate deliveries.
   */
  async applyLemonWebhook(params: {
    organizationId: string;
    lemonSubscriptionId: string;
    lemonCustomerId: string | null;
    lemonVariantId: string | null;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  }): Promise<void> {
    const data = {
      status: params.status,
      lemonSubscriptionId: params.lemonSubscriptionId,
      lemonCustomerId: params.lemonCustomerId,
      lemonVariantId: params.lemonVariantId,
      currentPeriodEnd: params.currentPeriodEnd,
    };
    await prisma.subscription.upsert({
      where: { organizationId: params.organizationId },
      create: { organizationId: params.organizationId, ...data },
      update: data,
    });
    this.logger.log(
      `Lemon Squeezy webhook applied ${params.status} to org ${params.organizationId}`,
    );
  }

  /**
   * Create a Razorpay subscription for the current org's chosen plan + cycle,
   * persist it (status TRIALING until payment is confirmed), and return the
   * details the browser needs to open Razorpay Checkout.
   */
  async createSubscription(
    ctx: RequestContext,
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionDTO> {
    const planId = this.razorpay.planId(input.plan, input.cycle);
    if (!planId) {
      throw new BadRequestException(
        `No Razorpay plan configured for ${input.plan} ${input.cycle}. ` +
          `Set RAZORPAY_PLAN_${input.plan}_${input.cycle}.`,
      );
    }

    const seats = PLAN_SEATS[input.plan];

    // Grant the free trial only to orgs that have never subscribed before — a
    // prior Razorpay subscription means they've already had their trial.
    const existing = await prisma.subscription.findUnique({
      where: { organizationId: ctx.organizationId },
    });
    const eligibleForTrial = !existing?.razorpaySubscriptionId;
    // start_at = first charge time. With a trial, push it TRIAL_DAYS into the
    // future; otherwise charge at the next cycle immediately.
    const trialEnd = eligibleForTrial
      ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
      : null;
    const startAt = trialEnd
      ? Math.floor(trialEnd.getTime() / 1000)
      : undefined;

    const sub = await this.razorpay.createSubscription({
      planId,
      cycle: input.cycle,
      seats,
      startAt,
      notes: { organizationId: ctx.organizationId, plan: input.plan },
    });

    // Persist (upsert) the org's subscription as trialing until payment confirms.
    const data = {
      tier: PLAN_TO_TIER[input.plan],
      status: SubscriptionStatus.TRIALING,
      razorpaySubscriptionId: sub.id,
      razorpayPlanId: planId,
      billingCycle: input.cycle as DbCycle,
      seats,
      // During a trial, the period "ends" (first charge) at trialEnd.
      currentPeriodEnd: trialEnd,
    };
    await prisma.subscription.upsert({
      where: { organizationId: ctx.organizationId },
      create: { organizationId: ctx.organizationId, ...data },
      update: data,
    });

    return {
      subscriptionId: sub.id,
      keyId: this.razorpay.keyId,
      plan: input.plan,
      cycle: input.cycle,
      trialDays: eligibleForTrial ? TRIAL_DAYS : 0,
      trialEndsAt: trialEnd?.toISOString() ?? null,
    };
  }

  /**
   * Payment-first onboarding: create a Razorpay subscription for a visitor who
   * has NO account yet. We persist it as a PendingSubscription (keyed by the
   * Razorpay subscription id) and return what Checkout needs. After they sign
   * up, claimSubscription() links it to their new organization.
   */
  async createPublicSubscription(
    input: PublicCheckoutInput,
  ): Promise<CreateSubscriptionDTO> {
    const planId = this.razorpay.planId(input.plan, input.cycle);
    if (!planId) {
      throw new BadRequestException(
        `No Razorpay plan configured for ${input.plan} ${input.cycle}. ` +
          `Set RAZORPAY_PLAN_${input.plan}_${input.cycle}.`,
      );
    }
    const seats = PLAN_SEATS[input.plan];
    // Every public checkout is a brand-new customer, so always grant the trial.
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const startAt = Math.floor(trialEnd.getTime() / 1000);

    const sub = await this.razorpay.createSubscription({
      planId,
      cycle: input.cycle,
      seats,
      startAt,
      notes: { plan: input.plan, flow: 'public' },
    });

    await prisma.pendingSubscription.create({
      data: {
        razorpaySubscriptionId: sub.id,
        razorpayPlanId: planId,
        plan: input.plan,
        billingCycle: input.cycle as DbCycle,
        status: 'CREATED',
        email: input.email ?? null,
        trialEndsAt: trialEnd,
      },
    });

    return {
      subscriptionId: sub.id,
      keyId: this.razorpay.keyId,
      plan: input.plan,
      cycle: input.cycle,
      trialDays: TRIAL_DAYS,
      trialEndsAt: trialEnd.toISOString(),
    };
  }

  /**
   * Verify the signature for a public (pre-account) checkout and mark the
   * PendingSubscription PAID. No org context — the link to an org happens later
   * in claimSubscription().
   */
  async verifyPublicSubscription(
    input: VerifySubscriptionInput,
  ): Promise<{ ok: true }> {
    const ok = this.razorpay.verifyCheckoutSignature({
      paymentId: input.razorpay_payment_id,
      subscriptionId: input.razorpay_subscription_id,
      signature: input.razorpay_signature,
    });
    if (!ok) throw new BadRequestException('Invalid payment signature');

    const pending = await prisma.pendingSubscription.findUnique({
      where: { razorpaySubscriptionId: input.razorpay_subscription_id },
    });
    if (!pending) throw new BadRequestException('Unknown subscription');
    if (pending.status === 'CREATED') {
      await prisma.pendingSubscription.update({
        where: { id: pending.id },
        data: { status: 'PAID' },
      });
    }
    return { ok: true };
  }

  /**
   * Link a previously-paid public subscription to the signed-in user's org.
   * Idempotent for the same org; rejects if already claimed by someone else.
   */
  async claimSubscription(
    ctx: RequestContext,
    input: ClaimSubscriptionInput,
  ): Promise<SubscriptionStatusDTO> {
    const pending = await prisma.pendingSubscription.findUnique({
      where: { razorpaySubscriptionId: input.razorpay_subscription_id },
    });
    if (!pending) throw new BadRequestException('Subscription not found');

    if (pending.status === 'CLAIMED') {
      if (pending.claimedByOrgId === ctx.organizationId) {
        // Already linked to this org — just return current state.
        return this.getStatus(ctx);
      }
      throw new BadRequestException('This subscription has already been claimed.');
    }
    if (pending.status !== 'PAID') {
      throw new BadRequestException('Payment not completed for this subscription.');
    }

    const plan = pending.plan as 'STARTER' | 'GROWTH';
    const tier = PLAN_TO_TIER[plan] ?? PlanTier.FREE;
    const seats = PLAN_SEATS[plan] ?? 1;
    const data = {
      tier,
      status: SubscriptionStatus.ACTIVE,
      razorpaySubscriptionId: pending.razorpaySubscriptionId,
      razorpayPlanId: pending.razorpayPlanId,
      billingCycle: pending.billingCycle,
      seats,
      currentPeriodEnd: pending.trialEndsAt,
    };
    await prisma.subscription.upsert({
      where: { organizationId: ctx.organizationId },
      create: { organizationId: ctx.organizationId, ...data },
      update: data,
    });
    await prisma.pendingSubscription.update({
      where: { id: pending.id },
      data: { status: 'CLAIMED', claimedByOrgId: ctx.organizationId },
    });
    this.logger.log(
      `Org ${ctx.organizationId} claimed subscription ${pending.razorpaySubscriptionId} (${plan})`,
    );
    return this.getStatus(ctx);
  }

  /**
   * Verify the signed payload Razorpay Checkout returns. On success, mark the
   * org's subscription ACTIVE. (The webhook is the authoritative source for
   * lifecycle changes; this gives the user instant feedback.)
   */
  async verifySubscription(
    ctx: RequestContext,
    input: VerifySubscriptionInput,
  ): Promise<SubscriptionStatusDTO> {
    const ok = this.razorpay.verifyCheckoutSignature({
      paymentId: input.razorpay_payment_id,
      subscriptionId: input.razorpay_subscription_id,
      signature: input.razorpay_signature,
    });
    if (!ok) throw new BadRequestException('Invalid payment signature');

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: ctx.organizationId },
    });
    if (!subscription || subscription.razorpaySubscriptionId !== input.razorpay_subscription_id) {
      throw new BadRequestException('Subscription does not match this organization');
    }

    const updated = await prisma.subscription.update({
      where: { organizationId: ctx.organizationId },
      data: { status: SubscriptionStatus.ACTIVE },
    });
    this.logger.log(
      `Subscription ACTIVE for org ${ctx.organizationId} (${updated.razorpaySubscriptionId})`,
    );
    return this.toDTO(updated, await this.orgProducts(ctx.organizationId));
  }

  /**
   * Let the customer choose which AI products to enable for their own org,
   * enforcing the plan's product limit. This is the self-serve version of the
   * admin product toggles — a Starter customer can enable 1, Growth up to 3.
   */
  async chooseProducts(
    ctx: RequestContext,
    input: ChooseProductsInput,
  ): Promise<SubscriptionStatusDTO> {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: ctx.organizationId },
    });
    const tier = sub?.tier ?? PlanTier.FREE;
    const limit = PRODUCT_LIMIT[tier];

    // De-duplicate, then enforce the plan's allowance.
    const unique = [...new Set(input.products)];
    if (unique.length > limit) {
      throw new BadRequestException(
        `Your ${tier} plan allows ${limit} AI product${limit === 1 ? '' : 's'}. ` +
          `You selected ${unique.length}.`,
      );
    }

    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { products: unique as Product[] },
    });
    this.logger.log(
      `Org ${ctx.organizationId} enabled products: ${unique.join(', ') || '(none)'}`,
    );

    return this.toDTO(
      sub,
      unique as ProductKey[],
      tier,
    );
  }

  /** Current subscription status for the org (defaults to FREE if none). */
  async getStatus(ctx: RequestContext): Promise<SubscriptionStatusDTO> {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: ctx.organizationId },
    });
    const products = await this.orgProducts(ctx.organizationId);
    if (!sub) {
      return {
        tier: 'FREE',
        status: 'TRIALING',
        cycle: 'MONTHLY',
        seats: 0,
        currentPeriodEnd: null,
        active: false,
        productLimit: PRODUCT_LIMIT[PlanTier.FREE],
        products,
      };
    }
    return this.toDTO(sub, products);
  }

  /** Fetch the products an org currently has enabled. */
  private async orgProducts(organizationId: string): Promise<ProductKey[]> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { products: true },
    });
    return (org?.products as ProductKey[]) ?? [];
  }

  /**
   * Apply a lifecycle change from a verified Razorpay webhook, keyed by the
   * Razorpay subscription id. Idempotent — safe to receive duplicate events.
   */
  async applyWebhookStatus(
    razorpaySubscriptionId: string,
    status: SubscriptionStatus,
    currentPeriodEnd?: Date | null,
  ): Promise<void> {
    const sub = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId },
    });
    if (!sub) {
      this.logger.warn(
        `Webhook for unknown subscription ${razorpaySubscriptionId} — ignoring`,
      );
      return;
    }
    await prisma.subscription.update({
      where: { razorpaySubscriptionId },
      data: {
        status,
        ...(currentPeriodEnd !== undefined ? { currentPeriodEnd } : {}),
      },
    });
    this.logger.log(
      `Webhook applied ${status} to subscription ${razorpaySubscriptionId}`,
    );
  }

  private toDTO(
    sub: {
      tier: PlanTier;
      status: SubscriptionStatus;
      billingCycle: DbCycle;
      seats: number;
      currentPeriodEnd: Date | null;
      razorpaySubscriptionId: string | null;
      lemonSubscriptionId: string | null;
    } | null,
    products: ProductKey[],
    tierOverride?: PlanTier,
  ): SubscriptionStatusDTO {
    const tier = tierOverride ?? sub?.tier ?? PlanTier.FREE;
    const hasProvider = Boolean(
      sub?.razorpaySubscriptionId || sub?.lemonSubscriptionId,
    );
    return {
      tier,
      status: sub?.status ?? 'TRIALING',
      cycle: sub?.billingCycle ?? 'MONTHLY',
      seats: sub?.seats ?? 0,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      active: hasProvider && sub?.status === 'ACTIVE',
      productLimit: PRODUCT_LIMIT[tier],
      products,
    };
  }
}
