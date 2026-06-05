# Lemon Squeezy Payment Gateway — Setup & Architecture

AISOLUTIONDESK uses **Lemon Squeezy** as the international payment gateway.
Lemon Squeezy is a **Merchant of Record (MoR)**: it hosts the checkout, owns the
subscription + free-trial lifecycle, and **handles global sales tax / VAT / GST
for you**. We just create checkouts and react to webhooks.

> Razorpay is also wired up (see `PAYMENTS_RAZORPAY.md`) for India/local payments.
> The pricing page currently uses **Lemon Squeezy**.

---

## 1. What was built

### Backend (`apps/api/src/modules/billing/`)
| File | Responsibility |
|------|----------------|
| `lemonsqueezy.service.ts` | Talks to the LS REST API (via `fetch`). Maps plan × cycle → variant id, creates hosted checkouts, verifies webhook signatures. 503s cleanly if unconfigured. |
| `lemonsqueezy.controller.ts` | `POST /billing/lemonsqueezy/checkout` — authenticated, OWNER-only. Returns a hosted checkout URL. |
| `lemonsqueezy-webhook.controller.ts` | `POST /webhooks/lemonsqueezy` — `@Public`, verifies `X-Signature` against the raw body, updates the org's subscription. |
| `billing.service.ts` | `createCheckout()` + `applyLemonWebhook()` shared logic over the `Subscription` table. |

### Data model
Added to `Subscription`: `lemonCustomerId`, `lemonSubscriptionId`, `lemonVariantId`.
Migration: `20260603010000_add_lemonsqueezy_billing` (already applied locally).

### Frontend
| File | Responsibility |
|------|----------------|
| `apps/web/src/lib/use-lemon-checkout.ts` | `useLemonCheckout()` — asks the API for a checkout URL, opens the Lemon.js overlay (redirect fallback). Sends not-signed-in users to `/sign-up`. |
| `apps/web/src/components/marketing/pricing.tsx` | Starter/Growth buttons call the LS checkout. |
| `apps/web/src/lib/api.ts` | `createCheckout()` client method. |

---

## 2. Checkout flow

```
Visitor clicks "Start 3-day free trial"
        │
        ▼
POST /billing/lemonsqueezy/checkout  { plan, cycle }
   API → LS POST /v1/checkouts (variant, custom.organization_id, redirect_url)
        │  returns { url }
        ▼
Lemon.js overlay opens the hosted checkout (or full-page redirect)
   → Customer pays. LS handles trial + tax.
        │
        ▼
Redirect to /dashboard?subscribed=1

Asynchronously:
LS → POST /webhooks/lemonsqueezy (subscription_created / _updated / _cancelled …)
   API verifies X-Signature → upsert Subscription (status from LS: on_trial→TRIALING,
   active→ACTIVE, past_due→PAST_DUE, cancelled/expired→CANCELED)
```

The org is matched on the webhook via `meta.custom_data.organization_id`, which
we pass when creating the checkout.

---

## 3. Step-by-step setup

### Step 1 — Create a store
Sign up at **https://app.lemonsqueezy.com**. Create a **Store** (Settings →
Stores). You can build everything in **Test Mode** first (toggle in the header).

### Step 2 — Get your API key + store id
- **API key:** Settings → **API** → **+ Create API key**. Copy it (shown once).
- **Store id:** Settings → **Stores** → the numeric id of your store.

### Step 3 — Create Products + pricing variants
Create your products under **Products → + New Product**. For a subscription:
- Set the product as a **Subscription**.
- Add a **variant** for each tier × cycle and set its price + interval:

| Variant | Interval | Price |
|---------|----------|-------|
| Starter Monthly | every 1 month | e.g. $49 |
| Starter Annual | every 1 year | e.g. $490 |
| Growth Monthly | every 1 month | e.g. $199 |
| Growth Annual | every 1 year | e.g. $1990 |

- **Free trial:** in each variant's subscription settings, set a **3-day free
  trial**. (With LS the trial is configured here, not in code — that's what the
  "3 days free" copy on the pricing page refers to.)
- Copy each **variant id** (Products → click variant → the id in the URL / share).

### Step 4 — Create the webhook
Settings → **Webhooks → + Add webhook**:
- **Callback URL:**
  - Local: tunnel with `npx ngrok http 4000` → `https://<id>.ngrok.app/webhooks/lemonsqueezy`
  - Production: `https://api.aisolutiondesk.com/webhooks/lemonsqueezy`
- **Signing secret:** type a strong random string → also put it in `LEMONSQUEEZY_WEBHOOK_SECRET`.
- **Events:** `subscription_created`, `subscription_updated`, `subscription_cancelled`,
  `subscription_resumed`, `subscription_expired`, `subscription_paused`,
  `subscription_payment_success`, `subscription_payment_failed`.

### Step 5 — Set env vars (root `.env`, not committed)
```env
LEMONSQUEEZY_API_KEY=eyJ0eXAiOi...        # the API key from Step 2
LEMONSQUEEZY_STORE_ID=12345               # numeric store id
LEMONSQUEEZY_WEBHOOK_SECRET=your_secret   # from Step 4
LEMONSQUEEZY_VARIANT_STARTER_MONTHLY=111111
LEMONSQUEEZY_VARIANT_STARTER_ANNUAL=111112
LEMONSQUEEZY_VARIANT_GROWTH_MONTHLY=111113
LEMONSQUEEZY_VARIANT_GROWTH_ANNUAL=111114
```

### Step 6 — Restart the API
```powershell
pnpm --filter @aisolutiondesk/api dev
```

### Step 7 — Test
1. Open http://localhost:3000 → Pricing → click a plan.
2. The LS overlay opens. Use a **test card**: `4242 4242 4242 4242`, any future
   expiry, any CVV.
3. Complete it → redirected to `/dashboard?subscribed=1`; the webhook upserts the
   `Subscription` row (status `on_trial` → `TRIALING`).

---

## 4. Going live
- Complete LS onboarding/payout details, switch the store out of Test Mode.
- Recreate (or reuse) products + variants, copy **live** variant ids.
- Create a **live** webhook → production API URL + live signing secret.
- Set all `LEMONSQUEEZY_*` env vars on the API host (Railway).
- Run `prisma migrate deploy` on the prod DB so the `lemon*` columns exist.

## 5. Notes / gotchas
- **Currency:** LS bills in the variant's currency (USD by default) — great for
  international, and tax is handled for you.
- **Trial** is a **variant setting** in the LS dashboard, not code. Set it to 3
  days on every variant so the on-page "3 days free" copy is accurate.
- **Raw body:** webhook verification relies on `rawBody: true` in `main.ts`
  (already enabled).
- **Overlay:** the frontend uses Lemon.js (`assets.lemonsqueezy.com/lemon.js`)
  for the overlay and falls back to a full-page redirect if it can't load.
- The pricing page is wired to LS via `useLemonCheckout`. To use Razorpay
  instead, swap the hook back to `useRazorpayCheckout` in `pricing.tsx`.
