'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { OrganizationSwitcher } from '@clerk/nextjs';
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
import { cn } from '@/lib/utils';

/** Friendly plan name for the DB tier returned by the billing API. */
const TIER_NAME: Record<SubscriptionStatusDTO['tier'], string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Growth',
  ENTERPRISE: 'Enterprise',
};

/**
 * Post-payment onboarding. Razorpay Checkout sends the customer here after a
 * successful subscription. We confirm the trial, let them create/select their
 * organization, then choose the AI agents their plan allows — enforced by the
 * server's productLimit. Finally they head into the dashboard.
 */
export default function WelcomePage() {
  const api = useApi();
  const [sub, setSub] = useState<SubscriptionStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getSubscription()
      .then((s) => {
        if (!active) return;
        setSub(s);
        setSelected(s.products);
      })
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [api]);

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

  return (
    <main className="relative min-h-screen overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-60" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        {/* Confirmation */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <PartyPopper className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            You&apos;re all set! 🎉
          </h1>
          {loading ? (
            <p className="mt-3 text-muted-foreground">Loading your plan…</p>
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
              We couldn&apos;t find an active plan.{' '}
              <Link href="/pricing" className="text-primary underline">
                Choose a plan
              </Link>{' '}
              to get started.
            </p>
          )}
        </div>

        {/* Step 1 — Organization */}
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Step 1 — Your organization
            </div>
            <p className="text-sm text-muted-foreground">
              Your agents and data live inside an organization. Create a new one
              or switch between organizations here.
            </p>
            {clerkEnabled ? (
              <OrganizationSwitcher
                hidePersonal
                appearance={{ baseTheme: dark }}
                afterCreateOrganizationUrl="/welcome"
                afterSelectOrganizationUrl="/welcome"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                (Preview mode — organizations are managed by Clerk once auth keys
                are configured.)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Pick agents */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Step 2 — Choose your AI agents
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
                    disabled={disabled || loading}
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
              <Button onClick={save} disabled={saving || loading || limit === 0}>
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

        {/* Continue */}
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="primary" className="gap-2">
              Go to my dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
