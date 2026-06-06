'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreateOrganization, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ArrowRight, Building2, CreditCard, Loader2 } from 'lucide-react';
import type { BillingCycle, BillingPlan } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRazorpayCheckout } from '@/lib/use-checkout';
import { clerkEnabled } from '@/components/providers/app-providers';

/** Friendly plan name + monthly INR price for the confirmation card. */
const PLAN_META: Record<BillingPlan, { name: string; monthly: number }> = {
  STARTER: { name: 'Starter', monthly: 3999 },
  GROWTH: { name: 'Growth', monthly: 15999 },
};

function isPlan(v: string | null): v is BillingPlan {
  return v === 'STARTER' || v === 'GROWTH';
}
function isCycle(v: string | null): v is BillingCycle {
  return v === 'MONTHLY' || v === 'ANNUAL';
}

/**
 * Onboarding bridge between sign-up and payment ("account first, then pay").
 * A new customer lands here after signing up with a chosen plan. We make sure
 * they have an organization (their data + agents live inside one), then start
 * Razorpay Checkout for the plan. On success, useRazorpayCheckout sends them to
 * /welcome to pick the agents their plan allows.
 */
/**
 * useSearchParams() requires a Suspense boundary during the production build
 * (Next.js 15). Wrap the inner component so the page prerenders cleanly.
 */
export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="text-center text-muted-foreground">Loading…</div>
        </Shell>
      }
    >
      <GetStartedInner />
    </Suspense>
  );
}

function GetStartedInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const cycle = params.get('cycle');
  const validPlan = isPlan(plan) ? plan : null;
  const validCycle = isCycle(cycle) ? cycle : null;

  const { start, pending, error } = useRazorpayCheckout();
  // In preview mode (no Clerk) there is always the demo org, so treat as ready.
  const { organization, isLoaded } = useOrganization();
  const hasOrg = clerkEnabled ? Boolean(organization) : true;

  const backToPlan = useMemo(
    () =>
      validPlan && validCycle
        ? `/get-started?plan=${validPlan}&cycle=${validCycle}`
        : '/get-started',
    [validPlan, validCycle],
  );

  if (!validPlan || !validCycle) {
    return (
      <Shell>
        <Card>
          <CardContent className="space-y-3 pt-5 text-center">
            <p className="text-muted-foreground">
              We couldn&apos;t tell which plan you chose.
            </p>
            <Link href="/pricing">
              <Button variant="primary">Choose a plan</Button>
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const meta = PLAN_META[validPlan];
  const busy = pending !== null;

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Let&apos;s get you set up</h1>
        <p className="mt-2 text-muted-foreground">
          You picked the{' '}
          <span className="font-semibold text-foreground">{meta.name}</span> plan ·{' '}
          {validCycle === 'ANNUAL' ? 'billed yearly' : 'billed monthly'}.
        </p>
      </div>

      {/* Step 1 — Organization (required before payment) */}
      {clerkEnabled && isLoaded && !hasOrg ? (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              First, create your organization
            </div>
            <p className="text-sm text-muted-foreground">
              This is your workspace — your AI agents and data live inside it.
              Just give it a name (usually your company name).
            </p>
            <CreateOrganization
              skipInvitationScreen
              afterCreateOrganizationUrl={backToPlan}
              appearance={{ baseTheme: dark }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Step 2 — Payment */
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Start your 3-day free trial
            </div>
            <p className="text-sm text-muted-foreground">
              You won&apos;t be charged today. After your 3-day trial, the{' '}
              {meta.name} plan is ₹{meta.monthly.toLocaleString('en-IN')}/mo. Cancel
              anytime.
            </p>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button
              variant="primary"
              className="gap-2"
              disabled={busy || (clerkEnabled && !isLoaded)}
              onClick={() => start(validPlan, validCycle)}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Opening secure
                  checkout…
                </>
              ) : (
                <>
                  Continue to payment <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}

/** Centered onboarding shell shared by the states above. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-60" />
      <div className="mx-auto max-w-xl space-y-6 px-6 py-16">{children}</div>
    </main>
  );
}
