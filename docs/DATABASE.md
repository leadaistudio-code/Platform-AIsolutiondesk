# Database Design

PostgreSQL via Prisma. Schema: [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma).

## Multi-tenancy model

We use a **shared database, shared schema, discriminator column** model: every tenant-scoped table carries `organizationId`. This is the right trade-off for a SaaS at this stage — far simpler operto run than schema-per-tenant or db-per-tenant, while isolation is enforced rigorously in code.

**Three layers of isolation:**

1. **Auth** — Clerk issues a JWT with the active `orgId`. No org claim → no tenant context → request rejected.
2. **Application** — services use `forTenant(orgId)` ([packages/db/src/index.ts](../packages/db/src/index.ts)), a Prisma client extension that injects `organizationId` into every where-clause and create payload. A developer *cannot* forget the filter.
3. **Data** — every tenant query path has a composite index leading with `organizationId`; unique constraints are scoped to the org (e.g. `@@unique([organizationId, provider])`).

When scale demands it, the same `organizationId` discriminator makes it straightforward to graduate the largest tenants to a dedicated database without schema changes.

## Entity groups

| Group | Models |
| --- | --- |
| **Tenancy & identity** | `Organization`, `User`, `Membership` |
| **Access & billing** | `ApiKey`, `Subscription`, `UsageRecord` |
| **Governance** | `Integration`, `AuditLog` |
| **AI core** | `KnowledgeSource`, `Document`, `DocumentChunk`, `Conversation`, `Message`, `AgentRun`, `MemoryRecord` |
| **Automation** | `Workflow`, `WorkflowRun` |
| **Service Desk** | `Ticket`, `TicketEvent`, `SlaPolicy`, `KnowledgeArticle` |
| **Employee Assistant** | `Department` (+ shared Document/Conversation) |
| **Sales Agent** | `Lead`, `Campaign`, `Outreach`, `Proposal` |

## Key design decisions

- **Vectors live in Qdrant, not Postgres.** `DocumentChunk.qdrantPointId` and `MemoryRecord.qdrantPointId` are the join keys. Postgres stays the system of record for *metadata, access control, and relations*; Qdrant owns similarity search. This keeps each store doing what it's best at.
- **`AgentRun.steps` and `WorkflowRun.steps` are JSON.** Execution traces are append-only, read whole, and schemaless across node types — JSON columns are the pragmatic fit. They power tracing/replay without a rigid step table.
- **`Integration.credentials` is `Bytes`.** Encrypted at rest (AES-256-GCM, see [packages/config/src/crypto.ts](../packages/config/src/crypto.ts)); never selected into API responses.
- **`UsageRecord.periodKey`** (`"2026-05"`) enables fast monthly aggregation for billing and budget enforcement without date-range scans.
- **Soft references across products.** `agentKey`, `accessTags`, and `Product[]` arrays keep the three products in one schema while letting each evolve its own agents and visibility rules.

## Indexing strategy

Every high-cardinality read path is indexed leading with `organizationId`:
- `Ticket`: `[organizationId, status, priority]`, `[organizationId, assigneeId]`, `[organizationId, slaDueAt]` (SLA sweeper).
- `Lead`: `[organizationId, status, score]` (pipeline + scoring views).
- `Message` / `AuditLog`: `[organizationId, createdAt]` — candidates for **monthly partitioning** as volume grows.
- `Conversation`: `[organizationId, product, updatedAt]` for recent-thread lists.

## Migrations & seeding

- `pnpm db:migrate` — create/apply a dev migration.
- `pnpm db:deploy` — apply migrations in CI/prod (no prompts).
- `pnpm db:seed` — seed a demo org, roles, SLA policies, and sample data per product.
