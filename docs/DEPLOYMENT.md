# Deploying AISOLUTIONDESK

This guide takes you from local to a live, public URL. Recommended stack
(all have free tiers):

| Piece | Host |
| --- | --- |
| Website (Next.js) | **Vercel** |
| API (NestJS) | **Railway** |
| PostgreSQL | **Railway** plugin |
| Redis | **Railway** plugin |
| Vector DB | **Qdrant Cloud** |
| Auth | **Clerk** (same account) |

Order matters: databases → API → website. The website needs the API's URL,
and the API needs the database URLs.

---

## 0. Put the code on GitHub (one time)

Railway and Vercel deploy from a GitHub repo.

```powershell
# From the project root (already a git repo after setup):
git add -A
git commit -m "Deploy AISOLUTIONDESK"
```

Then create an empty repo on https://github.com/new (e.g. `aisolutiondesk`,
private), and push:

```powershell
git remote add origin https://github.com/<your-username>/aisolutiondesk.git
git branch -M main
git push -u origin main
```

---

## 1. Qdrant Cloud (vector DB)

1. Sign up at https://cloud.qdrant.io
2. Create a **free cluster**. Wait for it to start.
3. Copy the **Cluster URL** (e.g. `https://xxxx.qdrant.io:6333`) and create an
   **API key**. Save both — you'll paste them into Railway.

---

## 2. Railway (API + Postgres + Redis)

1. Sign up at https://railway.app and **New Project → Deploy from GitHub repo**,
   pick your repo.
2. **Add databases:** in the project, click **+ New → Database → PostgreSQL**,
   then again for **Redis**. Railway provisions both and exposes connection
   variables.
3. **Configure the API service** (the one built from your repo):
   - **Settings → Build:** set the **Dockerfile path** to `apps/api/Dockerfile`
     and the **build context / root** to the repo root.
   - **Settings → Networking:** click **Generate Domain** to get a public URL
     (e.g. `https://aisolutiondesk-api.up.railway.app`). Save it.
   - **Variables** — add these (use Railway's references for DB/Redis):
     ```
     DATABASE_URL = ${{Postgres.DATABASE_URL}}
     REDIS_URL    = ${{Redis.REDIS_URL}}
     QDRANT_URL   = <your Qdrant cluster URL>
     QDRANT_API_KEY = <your Qdrant API key>
     CLERK_SECRET_KEY = sk_test_…           (from Clerk → API Keys)
     CLERK_WEBHOOK_SECRET = whsec_placeholder
     OPENAI_API_KEY = sk-…
     ANTHROPIC_API_KEY = sk-ant-placeholder
     OPENAI_EMBEDDING_MODEL = text-embedding-3-large
     DEFAULT_FAST_MODEL = gpt-4o-mini
     DEFAULT_SMART_MODEL = gpt-4o
     ENCRYPTION_KEY = <run: openssl rand -hex 32, or reuse your local one>
     DEV_AUTH_BYPASS = false
     WEB_URL = https://<your-vercel-domain>   (fill after step 3; placeholder ok for now)
     ```
   - Deploy. The container runs `prisma migrate deploy` (creating all tables on
     the fresh database) and then starts the API. Check **Logs** for
     "API ready on port…".
   - Visit `https://<your-api-domain>/health` — should return `{"status":"ok"}`.

> The vector collections are created automatically on first boot.

---

## 3. Vercel (website)

1. Sign up at https://vercel.com and **Add New → Project**, import your repo.
2. **Configure:**
   - **Root Directory:** leave as the repo root.
   - **Build Command:** `pnpm --filter @aisolutiondesk/web... build`
   - **Output Directory:** `apps/web/.next`
   - **Install Command:** `pnpm install`
3. **Environment Variables:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_…
   CLERK_SECRET_KEY = sk_test_…
   NEXT_PUBLIC_API_URL = https://<your-api-domain>   (from Railway, step 2)
   ```
4. Deploy. Vercel gives you a URL like `https://aisolutiondesk.vercel.app`.

---

## 4. Connect the two (CORS)

1. Back in **Railway → API → Variables**, set `WEB_URL` to your Vercel URL and
   redeploy. (This lets the browser call the API — CORS.)

---

## 5. Clerk for production (when ready)

Test keys (`pk_test_`/`sk_test_`) work on the deployed URL for trying it out
(with a small Clerk dev banner). For a real custom domain and no banner, create
a **Production instance** in Clerk, add your domain, and swap in the
`pk_live_`/`sk_live_` keys on both Vercel and Railway.

---

## Done

Open your Vercel URL → sign up → create an organization → use your live AI
platform. 🎉

### Updating later
Push to `main` → Railway and Vercel auto-redeploy. Database schema changes are
applied automatically by `prisma migrate deploy` on each API deploy.
