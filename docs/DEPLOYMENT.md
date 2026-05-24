# Deploying AISOLUTIONDESK

Target setup (subdomains of your existing aisolutiondesk.com, DNS on Netlify):

| Domain | What | Host |
| --- | --- | --- |
| `aisolutiondesk.com` | your existing site | Netlify (unchanged) |
| `platform.aisolutiondesk.com` | this AI app (frontend) | **Netlify** (new site) |
| `api.aisolutiondesk.com` | backend API | **Railway** |
| — | PostgreSQL + Redis | **Railway** plugins |
| — | vector database | **Qdrant Cloud** |

Do it in this order: GitHub → Qdrant → Railway (API) → Netlify (web) → connect.

---

## 1. Push to GitHub (one time)

Create an empty **private** repo at https://github.com/new named `aisolutiondesk`
(no README/gitignore). Then:

```powershell
git remote add origin https://github.com/<your-username>/aisolutiondesk.git
git push -u origin main
```

---

## 2. Qdrant Cloud (vector database)

1. Sign up at https://cloud.qdrant.io → create a **free cluster**.
2. Copy the **Cluster URL** and create an **API key**. Save both.

---

## 3. Railway — API + Postgres + Redis

1. https://railway.app → **New Project → Deploy from GitHub repo** → pick your repo.
2. **+ New → Database → PostgreSQL**, then again **Redis**.
3. Open the **API service** (built from your repo) → **Settings**:
   - **Build:** Dockerfile path = `apps/api/Dockerfile` (context = repo root).
   - **Networking → Custom Domain:** enter `api.aisolutiondesk.com`. Railway shows
     a **CNAME target** (like `xxxx.up.railway.app`) — copy it for step 5.
4. **Variables** (API service):
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   REDIS_URL    = ${{Redis.REDIS_URL}}
   QDRANT_URL   = <Qdrant cluster URL>
   QDRANT_API_KEY = <Qdrant API key>
   CLERK_SECRET_KEY = sk_test_…
   CLERK_WEBHOOK_SECRET = whsec_placeholder
   OPENAI_API_KEY = sk-…
   ANTHROPIC_API_KEY = sk-ant-placeholder
   OPENAI_EMBEDDING_MODEL = text-embedding-3-large
   DEFAULT_FAST_MODEL = gpt-4o-mini
   DEFAULT_SMART_MODEL = gpt-4o
   ENCRYPTION_KEY = <32-byte hex; reuse your local one or generate a new one>
   DEV_AUTH_BYPASS = false
   WEB_URL = https://platform.aisolutiondesk.com
   ```
   Deploy. The container runs `prisma migrate deploy` then starts. Watch **Logs**
   for "API ready on port…".

---

## 4. Netlify — the web app at platform.aisolutiondesk.com

1. https://app.netlify.com → **Add new site → Import an existing project** → GitHub
   → your repo. (This is a **separate** Netlify site from your main one.)
2. Build settings (a `netlify.toml` in the repo already sets these, but confirm):
   - **Build command:** `pnpm --filter @aisolutiondesk/web... build`
   - **Publish directory:** `apps/web/.next`
   - The Next.js plugin is configured automatically.
3. **Environment variables** (Site settings → Environment):
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_…
   CLERK_SECRET_KEY = sk_test_…
   NEXT_PUBLIC_API_URL = https://api.aisolutiondesk.com
   ```
4. Deploy. It builds and gives you a `*.netlify.app` URL — verify it loads.
5. **Custom domain:** Site settings → **Domain management → Add a domain** →
   `platform.aisolutiondesk.com`. Since your DNS is on Netlify, it creates the
   record automatically and provisions HTTPS.

---

## 5. DNS for the API subdomain (Netlify DNS)

In Netlify → **Domains → aisolutiondesk.com → DNS records → Add record**:
- **Type:** CNAME · **Name:** `api` · **Value:** the Railway CNAME target from step 3.

Back in Railway, the custom domain will verify and issue an SSL certificate
(takes a few minutes). Then `https://api.aisolutiondesk.com/health` should
return `{"status":"ok"}`.

---

## 6. Clerk for production

Test keys work on the live subdomain for trying it out. For a polished launch:
1. Clerk dashboard → create a **Production instance**.
2. Add `platform.aisolutiondesk.com` as the domain (Clerk gives DNS records to add
   in Netlify).
3. Swap the `pk_live_…` / `sk_live_…` keys into Netlify (web) and Railway (API).

---

## Done

Open **https://platform.aisolutiondesk.com** → sign up → create an organization →
your live AI platform. 🎉

**Updating:** push to `main` → Railway and Netlify auto-redeploy; migrations apply
automatically on each API deploy.
