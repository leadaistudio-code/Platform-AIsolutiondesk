# Authentication, RBAC & Multi-Tenancy

Auth provider: **Clerk** — chosen because its Organizations primitive maps 1:1 to our tenant model and ships orgs, memberships, invitations, and SSO/SAML out of the box.

## 1. Identity sync

Clerk is the system of record for credentials; Postgres mirrors the minimum needed for relations and RBAC:

- A Clerk **Organization** ⇄ our `Organization` (`clerkOrgId`).
- A Clerk **User** ⇄ our `User` (`clerkUserId`).
- A Clerk **Organization Membership** ⇄ our `Membership` (carries our `Role`).

Sync is event-driven via **Clerk webhooks** (`user.created`, `organization.created`, `organizationMembership.created/updated/deleted`) verified with `CLERK_WEBHOOK_SECRET`. The webhook handler upserts the mirror rows idempotently. No user data is duplicated beyond id/email/name/avatar.

## 2. Request authentication

```
Browser ──(Clerk session JWT)──► apps/web ──(forwards JWT)──► apps/api
                                                                  │
                          ClerkAuthGuard verifies JWT  ───────────┘
                          → RequestContext { userId, orgId, role }
```

- **Web → API:** the Next.js app attaches the Clerk session token; `ClerkAuthGuard` verifies it server-side and resolves the active org.
- **Programmatic:** `ApiKey` (hashed, scoped) via `Authorization: Bearer ask_live_…`. The key resolves to an org + scope set; no user, role derived from scopes.

## 3. RBAC

Six roles (`Role` enum): `OWNER > ADMIN > MANAGER > AGENT > MEMBER > VIEWER`. Roles live on `Membership` (per-org), so the same user can be ADMIN in one org and VIEWER in another.

- Routes declare a required permission via a `@RequirePermission('tickets:write')` decorator; `RbacGuard` checks it against a role→permissions matrix.
- Optional `Membership.productAccess` narrows which of the three products a member may touch.
- Permission strings are `resource:action` (`tickets:read`, `leads:write`, `integrations:manage`, `billing:manage`). API keys carry the same strings as `scopes`, so RBAC and key-scoping share one vocabulary.

## 4. Tenant isolation (defense in depth)

1. **Guard layer** — `TenantGuard` rejects any request without a resolvable org and attaches `RequestContext`.
2. **Data layer** — services use `forTenant(ctx.orgId)`; `organizationId` is injected into every query/create automatically ([packages/db/src/index.ts](../packages/db/src/index.ts)).
3. **Vector layer** — Qdrant searches always filter on `organizationId` payload.
4. **Cache layer** — Redis keys are namespaced `org:{orgId}:…`.

A cross-tenant read is therefore impossible through the normal data path even if a `where` clause is forgotten.

## 5. Auditing

`AuditInterceptor` writes an immutable `AuditLog` for every privileged mutation: actor, action, resource, before/after metadata, IP, user-agent. Indexed by `[organizationId, createdAt]` and `[organizationId, resource, resourceId]` for fast investigation.

## 6. Security controls (summary)

- JWT verified server-side every request; short-lived tokens, refresh via Clerk.
- API keys stored as `sha256`, shown once, scoped, expirable, revocable.
- Per-tenant integration credentials encrypted at rest (AES-256-GCM).
- Rate limiting per org + per key; input validated with zod at every boundary.
- See [SECURITY.md](SECURITY.md) for the full posture.
