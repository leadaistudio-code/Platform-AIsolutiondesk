# AISOLUTIONDESK

> The AI Workforce Platform — three flagship AI products in one unified, multi-tenant, enterprise-grade web application.

| Product | What it does |
| --- | --- |
| **AI Service Desk** | AI ticket triage, incident summarization, SLA monitoring, root-cause analysis, ServiceNow/Jira integration, self-healing automation. |
| **AI Employee Assistant** | Internal company assistant over HR policies, SOPs, and documents (RAG) with SharePoint/Drive/Slack/Teams connectors and department agents. |
| **AI Sales Automation Agent** | Lead qualification & scoring, multi-channel outreach (email/LinkedIn/WhatsApp), proposal generation, CRM sync, pipeline insights. |

## Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Node.js + NestJS, PostgreSQL, Redis, Prisma ORM, BullMQ
- **Auth & tenancy:** Clerk (organizations, RBAC, SSO/SAML)
- **AI:** OpenAI + Anthropic Claude, LangGraph-style orchestration, Qdrant vector DB, layered memory
- **Infra:** Docker Compose (local), Vercel (web), Railway/Render/AWS (api)

## Monorepo layout

```
aisolutiondesk/
├── apps/
│   ├── web/                 # Next.js 15 frontend (Vercel)
│   └── api/                 # NestJS backend + orchestration + workers (Railway/Render/AWS)
├── packages/
│   ├── db/                  # Prisma schema + client + tenant helpers
│   ├── ai/                  # Agent orchestration, memory, RAG, model providers
│   ├── integrations/        # Jira, ServiceNow, Slack, Teams, CRM, Drive connectors
│   ├── config/              # Zod-validated env + shared runtime config
│   ├── types/               # Shared zod schemas + TS types (API contracts)
│   └── ui/                  # Shared shadcn/ui components & design system
├── docs/                    # Architecture, DB, AI, auth, security, roadmap
├── docker-compose.yml       # Postgres + Redis + Qdrant for local dev
└── turbo.json
```

## Quick start (local)

```bash
# 1. Prereqs: Node 20+, pnpm 9+, Docker Desktop
corepack enable && corepack prepare pnpm@9 --activate

# 2. Install deps
pnpm install

# 3. Boot infra (Postgres, Redis, Qdrant)
docker compose up -d

# 4. Configure env
cp .env.example .env   # then fill in Clerk + AI keys

# 5. Migrate the database
pnpm db:migrate
pnpm db:seed

# 6. Run everything (web + api + workers)
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (Swagger at `/docs`)
- Qdrant dashboard: http://localhost:6333/dashboard

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, layers, request lifecycle, event-driven design |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema design, multi-tenancy model, indexing strategy |
| [docs/AI_ORCHESTRATION.md](docs/AI_ORCHESTRATION.md) | Agent graph, memory layers, RAG pipeline, tool calling |
| [docs/AUTH_AND_TENANCY.md](docs/AUTH_AND_TENANCY.md) | Clerk integration, RBAC, tenant isolation, API security |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased implementation plan |

## License

Proprietary — © AISOLUTIONDESK.
