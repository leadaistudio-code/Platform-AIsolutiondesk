'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { BillingPlan, BillingCycle } from '@aisolutiondesk/types';
import { useApi } from './api-client';

/**
 * Razorpay Checkout for PAYMENT-FIRST onboarding. `start(plan, cycle)`:
 *   1. asks the API to create a Razorpay subscription WITHOUT requiring login,
 *   2. loads + opens Razorpay Checkout,
 *   3. verifies the signed result and remembers the subscription id locally,
 *   4. routes the visitor to sign-up (or, if already signed in, to /welcome),
 *      where the paid subscription is "claimed" onto their organization.
 */

/** localStorage key holding a paid-but-unclaimed Razorpay subscription id. */
export const PENDING_SUB_KEY = 'pendingRazorpaySub';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
// Build-time switch (mirrors api-client) so useAuth is only called when Clerk
// is mounted; in preview mode we treat the visitor as "signed in" (demo org).
const useIsSignedIn = clerkEnabled
  ? () => useAuth().isSignedIn ?? false
  : () => true;

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
  const isSignedIn = useIsSignedIn();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (plan: BillingPlan, cycle: BillingCycle) => {
      setError(null);
      setPending(`${plan}-${cycle}`);
      try {
        // 1. Create the subscription server-side — NO login required.
        const sub = await api.createPublicSubscription({ plan, cycle });

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
              // 4. Verify the payment, remember the subscription id, then send
              //    the visitor to create their account (or straight to /welcome
              //    if already signed in) where the subscription is claimed.
              await api.verifyPublicSubscription({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              });
              try {
                window.localStorage.setItem(
                  PENDING_SUB_KEY,
                  response.razorpay_subscription_id,
                );
              } catch {
                /* localStorage unavailable — /welcome will fall back to status */
              }
              if (isSignedIn) {
                router.push('/welcome');
              } else {
                router.push(
                  `/sign-up?redirect_url=${encodeURIComponent('/welcome')}`,
                );
              }
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
    [api, router, isSignedIn],
  );

  return { start, pending, error };
}
