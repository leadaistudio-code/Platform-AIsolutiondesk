'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CreateOrganization, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import {
  PRODUCT_KEYS,
  PRODUCT_LABELS,
  type ProductKey,
  type SubscriptionStatusDTO,
} from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';
import { clerkEnabled } from '@/components/providers/app-providers';
import { PENDING_SUB_KEY } from '@/lib/use-checkout';
import { cn } from '@/lib/utils';

/** Friendly plan name for the DB tier returned by the billing API. */
const TIER_NAME: Record<SubscriptionStatusDTO['tier'], string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Growth',
  ENTERPRISE: 'Enterprise',
};

// Build-time switch so Clerk's useOrganization is only called when mounted.
const useActiveOrg = clerkEnabled
  ? () => {
      const { organization, isLoaded } = useOrganization();
      return { hasOrg: Boolean(organization), isLoaded };
    }
  : () => ({ hasOrg: true, isLoaded: true });

/**
 * Post-payment onboarding (payment-first). The visitor has already paid via
 * Razorpay before signing up. Here we:
 *   1. make sure they have an organization (create one if not),
 *   2. "claim" the paid subscription onto that org (using the id we stored at
 *      checkout), then
 *   3. let them pick the AI agents their plan allows.
 */
export default function WelcomePage() {
  const api = useApi();
  const { hasOrg, isLoaded } = useActiveOrg();

  const [sub, setSub] = useState<SubscriptionStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimedRef = useRef(false);

  // Once an organization exists, claim the paid subscription (if any) and load
  // the current status. Runs once.
  useEffect(() => {
    if (!hasOrg || claimedRef.current) return;
    claimedRef.current = true;
    let active = true;

    (async () => {
      const pendingId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(PENDING_SUB_KEY)
          : null;

      let status: SubscriptionStatusDTO | null = null;
      if (pendingId) {
        try {
          status = await api.claimSubscription({
            razorpay_subscription_id: pendingId,
          });
          window.localStorage.removeItem(PENDING_SUB_KEY);
        } catch {
          // Already claimed or not found — fall back to whatever the org has.
        }
      }
      if (!status) {
        status = await api.getSubscription().catch(() => null);
      }

      if (!active) return;
      if (status) {
        setSub(status);
        setSelected(status.products);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [api, hasOrg]);

  const limit = sub?.productLimit ?? 0;
  const atLimit = selected.length >= limit;
  const trialEnds = useMemo(
    () =>
      sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null,
    [sub?.currentPeriodEnd],
  );

  function toggle(p: ProductKey) {
    setSaved(false);
    setError(null);
    setSelected((cur) => {
      if (cur.includes(p)) return cur.filter((x) => x !== p);
      if (cur.length >= limit) return cur; // enforce the plan limit in the UI
      return [...cur, p];
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.chooseProducts({ products: selected });
      setSub(updated);
      setSelected(updated.products);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Step 1 — no organization yet: ask them to create one.
  if (clerkEnabled && isLoaded && !hasOrg) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <PartyPopper className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Payment received! 🎉</h1>
          <p className="mt-2 text-muted-foreground">
            One quick step: create your organization so we can set up your
            workspace.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Create your organization
            </div>
            <p className="text-sm text-muted-foreground">
              This is your workspace — your AI agents and data live inside it.
              Just give it a name (usually your company name).
            </p>
            <CreateOrganization
              skipInvitationScreen
              afterCreateOrganizationUrl="/welcome"
              appearance={{ baseTheme: dark }}
            />
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Confirmation */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <PartyPopper className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          You&apos;re all set! 🎉
        </h1>
        {loading ? (
          <p className="mt-3 text-muted-foreground">Setting up your plan…</p>
        ) : sub && sub.tier !== 'FREE' ? (
          <p className="mt-3 text-lg text-muted-foreground">
            Your <span className="font-semibold text-foreground">{TIER_NAME[sub.tier]}</span>{' '}
            {sub.status === 'TRIALING' ? '3-day free trial is active' : 'subscription is active'}.
            {trialEnds && sub.status === 'TRIALING' && (
              <>
                {' '}You won&apos;t be charged until{' '}
                <span className="font-semibold text-foreground">{trialEnds}</span>.
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-lg text-muted-foreground">
            We couldn&apos;t find an active plan for this organization.{' '}
            <Link href="/pricing" className="text-primary underline">
              Choose a plan
            </Link>
            .
          </p>
        )}
      </div>

      {/* Pick agents */}
      {!loading && sub && sub.tier !== 'FREE' && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Choose your AI agents
              </div>
              <span className="text-xs text-muted-foreground">
                {selected.length} / {limit} selected
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your plan includes{' '}
              <span className="font-semibold text-foreground">
                {limit} AI {limit === 1 ? 'agent' : 'agents'}
              </span>
              . Pick the ones you want to use — you can change these later.
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {PRODUCT_KEYS.map((p) => {
                const on = selected.includes(p);
                const disabled = !on && atLimit;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={disabled}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors',
                      on
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : disabled
                          ? 'cursor-not-allowed border-border bg-white/5 text-muted-foreground/40'
                          : 'border-border bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground',
                    )}
                  >
                    <span className="font-medium">{PRODUCT_LABELS[p]}</span>
                    {on && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving || limit === 0}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save my agents
              </Button>
              {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue */}
      <div className="flex justify-center">
        <Link href="/dashboard">
          <Button variant="primary" className="gap-2">
            Go to my dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Shell>
  );
}

/** Centered onboarding shell. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-60" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">{children}</div>
    </main>
  );
}
