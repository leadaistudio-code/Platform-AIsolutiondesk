# AI Orchestration Architecture

All AI capability lives in [`@aisolutiondesk/ai`](../packages/ai). Products differ only in their **agents and tools**, never their plumbing.

## 1. Provider abstraction

Agents talk to a vendor-neutral `ModelProvider` ([providers/types.ts](../packages/ai/src/providers/types.ts)). OpenAI and Anthropic adapters implement the same `complete()` / `stream()` contract. `providerForModel()` ([providers/router.ts](../packages/ai/src/providers/router.ts)) routes a model name to its vendor, and `Models.fast()/.smart()/.embedding()` let callers pick by **intent** rather than hardcoding model strings.

> Cost discipline: triage/classification/scoring use `Models.fast()` (e.g. `gpt-4o-mini`); generation/reasoning use `Models.smart()` (e.g. `claude-sonnet-4-6`). Token budgets are checked against the tenant's plan before dispatch and metered into `UsageRecord`.

## 2. Agent graph engine

An agent is a typed directed graph of nodes sharing a mutable state object ([graph/types.ts](../packages/ai/src/graph/types.ts), [graph/engine.ts](../packages/ai/src/graph/engine.ts)). Each node returns a state patch and the next node (or `END`). `runAgent()` executes until `END`/`maxSteps`, recording every node as an `AgentStep` for tracing, replay, and cost attribution — persisted to `AgentRun.steps`.

We deliberately built a small explicit engine rather than pulling in a heavyweight framework: orchestration stays readable, testable, and fully typed, with no hidden control flow.

**Example — Service Desk triage agent (`service_desk.triage`):**

```
              ┌──────────┐     ┌───────────────┐     ┌──────────────┐
  ticket ───► │ classify │ ──► │ retrieve KB    │ ──► │ summarize +  │ ──► END
              │ (fast)   │     │ (RAG)          │     │ root-cause   │
              └──────────┘     └───────────────┘     │ (smart)      │
                                                       └──────┬───────┘
                                                              │ if confident fix
                                                              ▼
                                                       ┌──────────────┐
                                                       │ trigger      │
                                                       │ self-heal WF │
                                                       └──────────────┘
```

The agents we'll implement per product:
- **Service Desk:** `triage`, `summarizer`, `root_cause`, `kb_suggester`, `it_support_chat`.
- **Employee Assistant:** `dept_router`, `rag_qa`, `onboarding`, `doc_intelligence` (+ voice front-end).
- **Sales:** `lead_qualifier`, `lead_scorer`, `outreach_writer`, `followup`, `proposal_generator`, `pipeline_insights`.

## 3. Memory layers

See [memory/types.ts](../packages/ai/src/memory/types.ts). Four tiers, all tenant-scoped via Qdrant payload filters:

1. **Working memory** — recent conversation window under a token budget; oldest turns summarized.
2. **Episodic memory** — per-conversation summaries (`MemoryRecord` scope `CONVERSATION`) for cheap thread resume.
3. **Semantic memory** — durable facts/preferences/entities (scope `USER`/`ORGANIZATION`), embedded and recalled by relevance, with importance + recency decay.
4. **Knowledge (RAG)** — authored organizational documents, retrieved per query (distinct from learned memory).

## 4. RAG pipeline

See [rag/types.ts](../packages/ai/src/rag/types.ts).

- **Ingest:** load → token-aware chunk (≈512 tokens, ≈64 overlap) → embed → upsert to Qdrant with payload `{ organizationId, product, documentId, accessTags }` → mark `Document.INDEXED`. Runs in a worker.
- **Retrieve:** embed query → Qdrant search filtered by `organizationId` + `product` + intersecting `accessTags` → optional rerank → return passages with citations.
- **Permissioned RAG:** `Document.accessTags` + `Department.accessTags` enforce that, e.g., the HR agent can't surface Finance documents — applied as a Qdrant filter, not post-hoc.

## 5. Tool calling

Tools are typed (`ToolDefinition`, zod-derived JSON schema) and registered per agent. Tools are the bridge to `@aisolutiondesk/integrations` (create a Jira ticket, fetch a CRM contact, send an email) and to internal services. Every tool call is traced and audited.

## 6. Execution & streaming

- Interactive chat runs `runAgent` inline, streaming tokens over the org-namespaced WebSocket (`emit`).
- Batch/long work (ingestion, campaign sends, scheduled triage) runs in **BullMQ workers**; the API never blocks on a model call for batch jobs.
- Every run writes an `AgentRun` (status, steps, token usage, cost) for observability and replay.
