# Security Posture

| Domain | Control |
| --- | --- |
| **Tenant isolation** | `organizationId` enforced at guard, data (`forTenant`), vector (Qdrant filter), and cache (key namespace) layers. |
| **AuthN** | Clerk session JWT verified server-side per request; SSO/SAML for enterprise tenants. |
| **AuthZ** | `RbacGuard` on every privileged route; `resource:action` permissions; least-privilege API keys. |
| **Secrets** | All in env / secret manager. Per-tenant integration creds encrypted at rest (AES-256-GCM, KMS key in prod). API keys stored as sha256. |
| **Input** | Zod validation at every boundary (HTTP, webhook, queue payloads, tool args). |
| **Output** | React auto-escaping; AI output rendered as sanitized markdown; no `dangerouslySetInnerHTML` on model output. |
| **Transport** | TLS everywhere; HSTS; secure/SameSite cookies. |
| **Rate limiting** | Per-org and per-API-key token buckets in Redis; WAF at the edge. |
| **Webhooks** | Signature verification (Clerk, Stripe, integrations) before processing; idempotency keys. |
| **Audit** | Immutable `AuditLog` for privileged mutations. |
| **Prompt injection** | Untrusted RAG/tool content is sandboxed in the prompt; tools require explicit scopes; destructive tools gated behind confirmation + RBAC. |
| **Data lifecycle** | Per-tenant retention + delete; cascade deletes on `Organization` removal; PII minimization. |
| **Dependencies** | Lockfile, automated audit in CI, pinned base images. |

## Threat-model highlights

- **Cross-tenant leakage** → mitigated by 4-layer isolation; the data layer makes a forgotten filter non-exploitable.
- **Stolen API key** → scoped + expirable + revocable; `lastUsedAt` anomaly detection.
- **Malicious document / indirect prompt injection** → content treated as data not instructions; tool execution requires scopes; high-impact actions need human/RBAC confirmation.
- **Billing abuse / runaway cost** → pre-dispatch token budgets per plan; `UsageRecord` metering; per-queue concurrency caps.
