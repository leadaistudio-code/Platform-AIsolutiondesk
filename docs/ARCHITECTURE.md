# AISOLUTIONDESK — System Architecture

This document is the source of truth for how the platform is structured and why. Every module decision should be traceable back to a principle here.

## 1. Design principles

1. **Multi-tenant by default.** Every business object is scoped to an `organizationId`. There is no "global" data path that an application query can accidentally cross. Tenant isolation is enforced at three layers: auth (Clerk org), application (a tenant-scoped Prisma client), and data (composite indexes + checks).
2. **Modular monolith for the API, not premature microservices.** The API is one deployable NestJS app composed of independent feature modules. Background work runs as separate worker processes sharing the same codebase. We split into services only when a module proves it needs independent scaling.
3. **AI is a layer, not a feature.** Orchestration, memory, and RAG live in a dedicated `@aisolutiondesk/ai` package consumed by all three products. Products differ in their *agents and tools*, not in their plumbing.
4. **Event-driven core.** State changes emit domain events (ticket.created, lead.scored, document.ingested). Workflows, analytics, and notifications subscribe — they are never hard-wired into request handlers.
5. **Typed contracts end-to-end.** Zod schemas in `@aisolutiondesk/types` are the single definition of every API request/response, validated at runtime and inferred as TS types on both client and server.
6. **Secure & auditable.** Every privileged mutation passes an RBAC guard and writes an immutable `AuditLog` row.

## 2. High-level topology

```
                         ┌─────────────────────────────────────────┐
                         │              Clerk (Auth)                 │
                         │  Orgs · Memberships · RBAC · SSO/SAML      │
                         └───────────────┬───────────────────────────┘
                                         │ JWT (org + role claims)
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                 │                                 │
┌───────▼────────┐               ┌────────▼─────────┐              ┌────────▼─────────┐
│  apps/web      │  HTTPS/WSS    │   apps/api       │   events     │  Workers (BullMQ)│
│  Next.js 15    │◄─────────────►│   NestJS         │─────────────►│  ingest · agent  │
│  (Vercel)      │   REST + WS   │  REST · WS · RPC │   (Redis)    │  run · workflow  │
└────────────────┘               └───┬───────┬──────┘              └───────┬──────────┘
                                     │       │                              │
                          ┌──────────▼──┐ ┌──▼──────────┐         ┌─────────▼─────────┐
                          │ PostgreSQL  │ │   Redis      │        │      Qdrant       │
                          │  (Prisma)   │ │ cache·queue  │        │  vector memory     │
                          └─────────────┘ └──────────────┘        └───────────────────┘
                                     │
                          ┌──────────▼──────────────────────────────────────┐
                          │  External: OpenAI · Anthropic · Jira · ServiceNow │
                          │  Slack · Teams · SharePoint · Drive · CRM · WA     │
                          └───────────────────────────────────────────────────┘
```

## 3. Layered architecture (the API)

```
┌──────────────────────────────────────────────────────────────┐
│  Transport      Controllers (REST) · WS Gateways · Webhooks    │
├──────────────────────────────────────────────────────────────┤
│  Guards/Pipes   ClerkAuthGuard · TenantGuard · RbacGuard ·     │
│                 ZodValidationPipe · RateLimit · AuditInterceptor│
├──────────────────────────────────────────────────────────────┤
│  Application    Feature services (Tickets, Leads, Chat, ...)   │
│                 — orchestrate domain + AI + persistence         │
├──────────────────────────────────────────────────────────────┤
│  Domain/AI      @aisolutiondesk/ai  (agents · memory · RAG)    │
│                 Workflow engine · Event bus                     │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure @aisolutiondesk/db (Prisma) · Qdrant client ·  │
│                 Redis · @aisolutiondesk/integrations            │
└──────────────────────────────────────────────────────────────┘
```

**Request lifecycle (privileged mutation):**
1. `ClerkAuthGuard` verifies the session JWT, extracts `userId`, `orgId`, `orgRole`.
2. `TenantGuard` resolves the `Organization`, attaches a **tenant-scoped** context (`RequestContext { orgId, userId, role }`).
3. `RbacGuard` checks the route's required permission against the member's role.
4. `ZodValidationPipe` parses the body against the shared zod schema.
5. The feature service executes business logic using `db.forTenant(orgId)` — a Prisma client extension that injects `organizationId` filters automatically.
6. On success, the service emits a domain event; `AuditInterceptor` persists an `AuditLog`.
7. Domain events fan out to workers (workflow triggers, analytics rollups, notifications).

## 4. Package responsibilities

| Package | Owns | Never does |
| --- | --- | --- |
| `@aisolutiondesk/db` | Prisma schema, client singleton, tenant-scoping extension, repositories | Business rules, HTTP |
| `@aisolutiondesk/ai` | Agent graph, model providers (OpenAI/Claude), memory layers, RAG, tool registry | Persistence of product data, HTTP routing |
| `@aisolutiondesk/integrations` | External connectors (Jira, ServiceNow, Slack, CRM…) behind a uniform `Connector` interface | AI logic, tenancy decisions |
| `@aisolutiondesk/config` | Zod-validated env, runtime feature flags | Anything stateful |
| `@aisolutiondesk/types` | Zod schemas + inferred types for every API contract & event | Runtime side effects |
| `@aisolutiondesk/ui` | Design system, shadcn components, charts, layout primitives | Data fetching, business logic |

## 5. Event-driven & real-time design

- **Domain events** are typed (`@aisolutiondesk/types/events`) and published to a Redis stream via the `EventBus`. Producers don't know consumers.
- **Workers** (BullMQ) own long/expensive work: document ingestion + embedding, agent runs, workflow execution, outbound campaigns, SLA timers.
- **Real-time** uses a WebSocket gateway (Socket.IO) namespaced per organization (`/org/:orgId`). Agent token streaming, ticket updates, and campaign progress are pushed to subscribed clients. Redis adapter enables horizontal scaling of WS nodes.

## 6. Scaling strategy

| Concern | Approach |
| --- | --- |
| API throughput | Stateless NestJS pods behind a load balancer; scale horizontally. Sessions are JWT, no sticky state. |
| Heavy AI work | Offloaded to workers; the API never blocks on an LLM call for batch jobs. Concurrency tuned per queue. |
| Database | Connection pooling (PgBouncer); read replicas for analytics; partition high-volume tables (`AuditLog`, `Message`) by month. |
| Vector search | Qdrant with per-tenant payload filtering; shard collections by product as volume grows. |
| Caching | Redis for hot reads (org config, RBAC, knowledge lookups) with explicit invalidation on writes. |
| Cost control | `Usage` metering per org + model; token budgets enforced before dispatch; cheaper models for triage, premium for generation. |

## 7. Security posture

See [AUTH_AND_TENANCY.md](AUTH_AND_TENANCY.md) and [SECURITY.md](SECURITY.md). Headlines:
- Tenant isolation enforced in the data-access layer, not just controllers.
- All secrets in env / secret manager; never in the repo. Per-tenant integration credentials encrypted at rest (AES-256-GCM) with a KMS-managed key.
- RBAC on every privileged route; least-privilege API keys with scopes.
- Immutable audit log; PII handling and data-retention policies per tenant.
- Input validation (zod) at every boundary; output encoding in the UI; rate limiting + WAF at the edge.

## 8. Deployment

| Component | Target | Notes |
| --- | --- | --- |
| `apps/web` | Vercel | Edge/SSR, ISR for marketing pages, env from Vercel project. |
| `apps/api` | Railway/Render/AWS ECS | Dockerized; min 2 replicas; health checks on `/health`. |
| Workers | Same image, different entrypoint | `node dist/worker.js`; autoscale on queue depth. |
| Postgres/Redis/Qdrant | Managed (Neon/Upstash/Qdrant Cloud) or AWS | Managed in prod; Docker Compose locally. |

CI/CD: lint → typecheck → test → build (Turborepo remote cache) → migrate → deploy. Blue/green for the API.
