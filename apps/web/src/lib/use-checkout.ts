'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BillingPlan, BillingCycle } from '@aisolutiondesk/types';
import { useApi } from './api-client';

/**
 * Razorpay Checkout, wired to our billing API. `start(plan, cycle)`:
 *   1. asks the API to create a Razorpay subscription,
 *   2. loads + opens Razorpay Checkout with it,
 *   3. verifies the signed result, then sends the user to the dashboard.
 *
 * If the visitor isn't signed in (API returns 401/403), they're routed to
 * sign-up first — they can complete checkout once they have an account.
 */

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  image?: string;
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (e: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Inject the Razorpay Checkout script once; resolve when it's ready. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpayCheckout() {
  const api = useApi();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (plan: BillingPlan, cycle: BillingCycle) => {
      setError(null);
      setPending(`${plan}-${cycle}`);
      try {
        // 1. Create the subscription server-side.
        const sub = await api.createSubscription({ plan, cycle }).catch((e: Error) => {
          // Not signed in (or not allowed) → send to sign-up to create an account.
          if (/401|403/.test(e.message)) {
            router.push('/sign-up');
            return null;
          }
          throw e;
        });
        if (!sub) return;

        // 2. Make sure the Checkout script is available.
        const ready = await loadRazorpayScript();
        if (!ready || !window.Razorpay) {
          throw new Error('Could not load Razorpay Checkout. Check your connection.');
        }

        // 3. Open Checkout against the subscription.
        const rzp = new window.Razorpay({
          key: sub.keyId,
          subscription_id: sub.subscriptionId,
          name: 'AISOLUTIONDESK',
          description: `${plan} plan — billed ${cycle.toLowerCase()}`,
          theme: { color: '#7c5cff' },
          modal: { ondismiss: () => setPending(null) },
          handler: async (response) => {
            try {
              await api.verifySubscription({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              });
              router.push('/welcome');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setPending(null);
            }
          },
        });
        rzp.on('payment.failed', () => {
          setError('Payment failed. Please try again.');
          setPending(null);
        });
        rzp.open();
      } catch (e) {
        setError((e as Error).message);
        setPending(null);
      }
    },
    [api, router],
  );

  return { start, pending, error };
}
