# Implementation Roadmap

Each phase is shippable and builds on the last. ✅ = done in the current scaffold.

## Phase 0 — Foundation ✅ (this scaffold)
- Turborepo monorepo, shared tsconfig, Docker infra (Postgres/Redis/Qdrant).
- `@aisolutiondesk/config` (env validation + crypto), `@aisolutiondesk/db` (full schema + tenant-scoped client).
- `@aisolutiondesk/ai` core (provider abstraction, agent graph engine, memory + RAG contracts).
- Architecture docs.

## Phase 1 — Platform spine
- `apps/api` (NestJS): bootstrap, health, Swagger, global zod pipe, error filter.
- Clerk integration: `ClerkAuthGuard`, `TenantGuard`, `RbacGuard`, webhook sync.
- `AuditInterceptor`, rate limiting, `RequestContext`.
- Concrete model providers (OpenAI + Anthropic), Qdrant client + collection bootstrap.
- `EventBus` (Redis streams) + BullMQ worker harness.
- DB seed (demo org, roles, SLA policies).

## Phase 2 — Web shell & design system
- `apps/web` (Next.js 15): Clerk provider, org switcher, protected layouts.
- `@aisolutiondesk/ui`: theme (dark-mode-first, glassmorphism), layout primitives, data table, charts, animated cards, AI chat component, command palette.
- App shell: sidebar (per enabled product), top bar, settings.

## Phase 3 — AI Service Desk (reference product)
- Tickets CRUD + list/board; ticket detail with AI panel.
- Agents: triage, summarizer, root-cause, KB suggester, IT support chat.
- SLA monitor worker; incident analytics dashboard; Jira + ServiceNow connectors; self-healing workflow examples.

## Phase 4 — AI Employee Assistant
- Document upload + ingestion worker; knowledge sources; permissioned RAG.
- Chat workspace with citations + voice query; department agents.
- Drive/SharePoint/Slack/Teams connectors; usage analytics.

## Phase 5 — AI Sales Automation Agent
- Leads + scoring + qualification agents; CRM sync (Salesforce/HubSpot).
- Campaigns + multi-channel outreach (email/LinkedIn/WhatsApp) workers; proposal generator; pipeline insights.

## Phase 6 — Cross-cutting & launch
- Workflow engine UI (visual DAG builder) + scheduler.
- Billing (Stripe) + plan gating + usage dashboards.
- Team management, audit log viewer, API key management.
- Observability (tracing, cost dashboards), load testing, security review, CI/CD + deploy.

## Suggested next step
Build **Phase 1** (the API spine) so there's a running, authenticated, tenant-aware backend — then Phase 2's web shell, then go deep on Service Desk as the reference implementation for the other two.
