# Running AISOLUTIONDESK locally

A simple, copy-paste guide. Run all commands from the project root in a terminal
where `pnpm` works (if `pnpm` isn't recognized, close and reopen your terminal).

## First-time setup (do once)

```powershell
# 1. Start the databases (Postgres, Redis, Qdrant) in Docker.
#    Make sure Docker Desktop is running first (whale icon steady).
docker compose up -d

# 2. Install dependencies.
pnpm install

# 3. Create the database tables and load demo data.
pnpm db:migrate      # creates all tables from the schema
pnpm db:seed         # adds the "Acme Corp" demo org, tickets, leads…
```

## Every day: start everything

```powershell
# Make sure the databases are up (safe to run anytime):
docker compose up -d

# Start the frontend AND backend together (auto-builds shared packages first):
pnpm dev
```

Then open:
- **Web app** → http://localhost:3000
- **API docs (Swagger)** → http://localhost:4000/docs
- **API health check** → http://localhost:4000/health
- **Qdrant dashboard** → http://localhost:6333/dashboard

To run the **background worker** (for slow jobs), open a second terminal:

```powershell
pnpm --filter @aisolutiondesk/api worker:dev
```

## Stopping

- Stop the app: press **Ctrl + C** in the terminal running `pnpm dev`.
- Stop the databases: `docker compose down` (data is kept). Add `-v` to also erase data.

## Run just one part

```powershell
pnpm --filter @aisolutiondesk/web dev     # frontend only
pnpm build                                 # build everything once
pnpm --filter @aisolutiondesk/api start    # run the built API
```

## Useful database commands

```powershell
pnpm db:studio       # open Prisma Studio — a visual editor for your data
pnpm db:migrate      # after changing the schema, create+apply a new migration
```

## Notes

- The app reads settings from `.env` in the project root. A real `ENCRYPTION_KEY`
  is already generated. To enable **real login** and **real AI**, replace the
  PLACEHOLDER values for Clerk and OpenAI/Anthropic with your own keys.
- Without those keys: the web app runs in "preview mode" (no login wall) and the
  API runs fine, but live AI calls and authenticated requests won't work yet.
