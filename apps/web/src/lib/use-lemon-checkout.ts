'use client';

import { useCallback, useState } from 'react';
import type { BillingPlan, BillingCycle } from '@aisolutiondesk/types';
import { useApi } from './api-client';

/**
 * Lemon Squeezy Checkout, wired to our billing API. `start(plan, cycle)`:
 *   1. asks the API for a hosted checkout URL,
 *   2. opens it in the Lemon.js overlay (falls back to a full redirect),
 * Lemon Squeezy then handles payment, the trial, and global tax, and confirms
 * the subscription back to us via webhook.
 *
 * If the visitor isn't signed in (API returns 401/403) they're sent to sign-up.
 */

interface LemonSqueezyGlobal {
  Setup?: (opts: { eventHandler?: (e: { event: string }) => void }) => void;
  Url?: { Open?: (url: string) => void };
}

declare global {
  interface Window {
    LemonSqueezy?: LemonSqueezyGlobal;
    createLemonSqueezy?: () => void;
  }
}

const LEMON_JS = 'https://assets.lemonsqueezy.com/lemon.js';

/** Inject Lemon.js once; resolve true when the overlay API is available. */
function loadLemonScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.LemonSqueezy?.Url?.Open) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LEMON_JS}"]`,
    );
    const onReady = () => {
      // lemon.js exposes createLemonSqueezy() to initialise window.LemonSqueezy.
      window.createLemonSqueezy?.();
      resolve(Boolean(window.LemonSqueezy?.Url?.Open));
    };
    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', () => resolve(false));
      if (window.LemonSqueezy) onReady();
      return;
    }
    const script = document.createElement('script');
    script.src = LEMON_JS;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useLemonCheckout() {
  const api = useApi();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (plan: BillingPlan, cycle: BillingCycle) => {
      setError(null);
      setPending(`${plan}-${cycle}`);
      try {
        // 1. Ask the API for a hosted checkout URL.
        const checkout = await api
          .createCheckout({ plan, cycle })
          .catch((e: Error) => {
            if (/401|403/.test(e.message)) {
              window.location.href = '/sign-up';
              return null;
            }
            throw e;
          });
        if (!checkout) return;

        // 2. Prefer the Lemon.js overlay; fall back to a full-page redirect.
        const ready = await loadLemonScript();
        if (ready && window.LemonSqueezy?.Url?.Open) {
          const overlayUrl = checkout.url.includes('embed=')
            ? checkout.url
            : `${checkout.url}${checkout.url.includes('?') ? '&' : '?'}embed=1`;
          window.LemonSqueezy.Url.Open(overlayUrl);
          setPending(null);
        } else {
          window.location.href = checkout.url;
        }
      } catch (e) {
        setError((e as Error).message);
        setPending(null);
      }
    },
    [api],
  );

  return { start, pending, error };
}
