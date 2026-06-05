# Razorpay Payment Gateway — Setup & Architecture

AISOLUTIONDESK uses **Razorpay recurring Subscriptions** for paid plans. This
doc covers what was built, how the flow works, and the one-time dashboard +
env setup you must do before real payments work.

---

## 1. What was built

### Backend (`apps/api/src/modules/billing/`)
| File | Responsibility |
|------|----------------|
| `razorpay.service.ts` | Wraps the Razorpay SDK. Builds the client from env keys, maps plan tier × cycle → Razorpay plan id, and verifies checkout + webhook HMAC signatures (constant-time). If keys are missing it stays "unconfigured" and endpoints return a clean `503` — the app still boots. |
| `billing.service.ts` | Creates subscriptions, persists them to the `Subscription` table (status `TRIALING` until paid), confirms payment after checkout, and applies webhook lifecycle changes (idempotent). |
| `billing.controller.ts` | Authenticated, **OWNER-only** (`billing:manage`) endpoints. |
| `razorpay-webhook.controller.ts` | `POST /webhooks/razorpay` — `@Public` but verifies the `X-Razorpay-Signature` against the raw body. |
| `billing.module.ts` | Wires the module; registered in `app.module.ts`. |

### API endpoints
| Method & path | Auth | Purpose |
|---------------|------|---------|
| `GET  /billing/subscription` | OWNER | Current org's subscription status. |
| `POST /billing/subscription` | OWNER | Create a Razorpay subscription; returns `{ subscriptionId, keyId, plan, cycle }`. |
| `POST /billing/verify` | OWNER | Verify the signed result from Checkout; marks subscription `ACTIVE`. |
| `POST /webhooks/razorpay` | Public (signed) | Razorpay subscription lifecycle events. |

### Data model (`packages/db/prisma/schema.prisma`)
Added to `Subscription`: `razorpayCustomerId`, `razorpaySubscriptionId`,
`razorpayPlanId`, `billingCycle` + new `BillingCycle` enum (`MONTHLY` / `ANNUAL`).
Migration: `20260603000000_add_razorpay_billing` (already applied locally).

### Frontend
| File | Responsibility |
|------|----------------|
| `apps/web/src/lib/use-checkout.ts` | `useRazorpayCheckout()` — loads Checkout script, creates subscription, opens the modal, verifies the result, routes to `/dashboard`. Sends not-signed-in users to `/sign-up` first. |
| `apps/web/src/components/marketing/pricing.tsx` | Starter/Growth buttons trigger checkout (with loading + error states). Enterprise → sign-up. Monthly/Annual toggle picks the cycle. |
| `apps/web/src/lib/api.ts` | `getSubscription` / `createSubscription` / `verifySubscription` client methods. |

---

## 2. Payment flow

```
Visitor clicks "Get Growth" (annual)
        │
        ▼
POST /billing/subscription  { plan: GROWTH, cycle: ANNUAL }
   API → Razorpay.subscriptions.create(plan_id, quantity=seats)
   API → upsert Subscription (status TRIALING)
        │  returns { subscriptionId, keyId }
        ▼
Browser opens Razorpay Checkout (subscription_id)
        │  user pays
        ▼
Checkout handler → POST /billing/verify  { payment_id, subscription_id, signature }
   API verifies HMAC → Subscription.status = ACTIVE
        │
        ▼
Redirect to /dashboard?subscribed=1

Meanwhile, asynchronously:
Razorpay → POST /webhooks/razorpay (subscription.activated / .charged / .cancelled …)
   API verifies signature → updates Subscription.status  (authoritative source)
```

---

## 3. One-time setup (DO THIS to enable payments)

### Step 1 — Get API keys
Razorpay Dashboard → **Settings → API Keys** → generate **Test Mode** keys.

### Step 2 — Create 4 Plans
Dashboard → **Subscriptions → Plans**. Create one plan per tier × cycle and copy
each `plan_id`:

| Plan | Billing | Amount (set what you want to charge) |
|------|---------|--------------------------------------|
| Starter | Monthly | e.g. ₹4,000 / mo |
| Starter | Yearly  | e.g. ₹40,000 / yr |
| Growth  | Monthly | e.g. ₹16,000 / mo |
| Growth  | Yearly  | e.g. ₹160,000 / yr |

> ⚠️ The price shown on the website ($49 / $199) is **display-only**. The amount
> actually charged comes from the Razorpay Plan. Make the plan amounts match
> what you advertise.

### Step 3 — Add a webhook
Dashboard → **Settings → Webhooks → Add New Webhook**:
- **URL:** `<API_URL>/webhooks/razorpay` (e.g. `https://api.aisolutiondesk.com/webhooks/razorpay`)
- **Secret:** any strong string — put the same value in `RAZORPAY_WEBHOOK_SECRET`.
- **Active events:** `subscription.activated`, `subscription.charged`,
  `subscription.pending`, `subscription.halted`, `subscription.cancelled`,
  `subscription.completed`, `subscription.resumed`, `subscription.authenticated`.

### Step 4 — Set env vars (root `.env`, NOT committed)
```env
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
RAZORPAY_PLAN_STARTER_MONTHLY=plan_xxx
RAZORPAY_PLAN_STARTER_ANNUAL=plan_xxx
RAZORPAY_PLAN_GROWTH_MONTHLY=plan_xxx
RAZORPAY_PLAN_GROWTH_ANNUAL=plan_xxx
```
(Placeholders are listed in `.env.example`.)

### Step 5 — Restart the API
```powershell
# from the repo root
pnpm --filter @aisolutiondesk/api dev
```
On boot, if keys are missing you'll see:
`Razorpay keys not configured — billing endpoints will return 503.`

### Step 6 — Test with a test card
Test Mode card: `4111 1111 1111 1111`, any future expiry, any CVV.
(For subscriptions Razorpay may use its emandate test flow — follow the modal.)

---

## 4. Production checklist
- [ ] Switch to **Live Mode** keys + live Plan ids.
- [ ] Point the webhook URL at the production API and set the live webhook secret.
- [ ] Set all `RAZORPAY_*` env vars in the API host (Railway).
- [ ] Confirm `WEB_URL` / CORS allows the production site.
- [ ] Verify a real subscription end-to-end, then check the DB row + webhook logs.

## 5. Free trial (3 days)

Every paid plan starts with a **3-day free trial**, implemented with Razorpay's
subscription `start_at`:

- On the **first** subscription for an org, the API sets `start_at = now + 3 days`.
  The customer authorizes the mandate immediately but the **first charge happens
  after the trial ends** — no payment during the trial.
- The local `Subscription` row is saved as `TRIALING` with
  `currentPeriodEnd = trial end` (the first-charge date).
- When Razorpay charges at trial end it fires `subscription.charged`, and the
  webhook flips the row to `ACTIVE`.
- **Abuse guard:** an org that already has a `razorpaySubscriptionId` (i.e. has
  trialed before) does **not** get another trial — it's charged at the next
  cycle. Controlled by `TRIAL_DAYS` in `billing.service.ts`.

To change the trial length, edit `TRIAL_DAYS` (set to `0` to disable trials).

> Note: Razorpay still authorizes a payment method up front (mandate), so a card
> / UPI is collected at signup even though no money moves until day 3.

## 6. Notes / gotchas
- **Migration on deploy:** run `prisma migrate deploy` so the `razorpay*` columns
  exist in the production DB.
- **Raw body:** webhook signature verification relies on `rawBody: true` in
  `apps/api/src/main.ts` (already enabled). Don't remove it.
- **Currency:** Razorpay defaults to INR. The plan currency is fixed when you
  create the plan — choose it deliberately.
- **Who can pay:** endpoints require the `billing:manage` permission (OWNER role).
  In local dev-bypass mode the demo user is OWNER, so checkout works without login.
