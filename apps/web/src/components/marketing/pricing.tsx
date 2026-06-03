'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Pricing section with a monthly/annual billing toggle. Annual billing applies
 * the industry-standard "2 months free" discount (pay for 10 months, get 12),
 * shown as the effective per-month price.
 */

interface Plan {
  name: string;
  /** Monthly price in whole dollars, or null for custom/contact-sales. */
  monthly: number | null;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 49,
    desc: 'For small teams getting their first AI agent live.',
    features: ['1 AI product', 'Up to 3 seats', '5,000 AI actions / mo', 'Email support', 'Standard integrations'],
    cta: 'Start free',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Growth',
    monthly: 199,
    desc: 'For scaling teams running multiple AI workflows.',
    features: ['Up to 3 AI products', 'Up to 15 seats', '50,000 AI actions / mo', 'Priority support', 'CRM & Slack sync', 'Custom brand persona'],
    cta: 'Start free trial',
    href: '/sign-up',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    desc: 'For organizations deploying an AI workforce at scale.',
    features: ['All 4 AI products', 'Unlimited seats', 'Unlimited AI actions', 'Dedicated success manager', 'SSO & SCIM', 'SLA & on-prem options'],
    cta: 'Talk to sales',
    href: '/sign-up',
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-6 py-28">
      <div id="plans" className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-primary">
          Pricing
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Plans that scale with you
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free, upgrade when you see the ROI. Every plan includes the full
          platform foundation.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-all',
              !annual ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all',
              annual ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Annual
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                annual ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary',
              )}
            >
              2 months free
            </span>
          </button>
        </div>
      </div>

      <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          // Annual billing = pay for 10 months, shown as effective monthly rate.
          const effectiveMonthly =
            p.monthly === null ? null : annual ? Math.round((p.monthly * 10) / 12) : p.monthly;

          return (
            <div
              key={p.name}
              className={cn(
                'relative rounded-2xl p-8',
                p.highlighted
                  ? 'border-2 border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-2xl shadow-primary/20'
                  : 'glass',
              )}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>

              <div className="mt-4 flex items-end gap-1">
                {effectiveMonthly === null ? (
                  <span className="text-4xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">${effectiveMonthly}</span>
                    <span className="pb-1 text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              <p className="mt-1 h-5 text-xs text-muted-foreground">
                {effectiveMonthly !== null && annual
                  ? `Billed annually at $${p.monthly! * 10}/yr`
                  : effectiveMonthly !== null
                    ? 'Billed monthly'
                    : 'Tailored to your organization'}
              </p>

              <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>

              <Link href={p.href} className="mt-6 block">
                <Button
                  className="w-full"
                  variant={p.highlighted ? 'primary' : 'outline'}
                >
                  {p.cta}
                </Button>
              </Link>

              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
