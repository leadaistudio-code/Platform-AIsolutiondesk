import { PrismaClient, Prisma } from '@prisma/client';

export * from '@prisma/client';

/**
 * Singleton Prisma client. Reused across hot reloads in dev so we don't
 * exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Models that carry a top-level `organizationId` column and must therefore
 * be tenant-scoped automatically. Keep this list in sync with the schema.
 */
const TENANT_MODELS = new Set<string>([
  'Membership',
  'ApiKey',
  'UsageRecord',
  'Integration',
  'AuditLog',
  'KnowledgeSource',
  'Document',
  'DocumentChunk',
  'Conversation',
  'Message',
  'AgentRun',
  'MemoryRecord',
  'Workflow',
  'WorkflowRun',
  'Ticket',
  'SlaPolicy',
  'KnowledgeArticle',
  'Department',
  'Lead',
  'Campaign',
  'Outreach',
  'Proposal',
]);

/**
 * Returns a Prisma client view that automatically injects `organizationId`
 * into every read filter and every create payload for tenant-scoped models.
 *
 * This is the primary defense for tenant isolation: feature services should
 * ALWAYS go through `db.forTenant(orgId)` rather than the raw client, so a
 * forgotten `where` clause can never leak another tenant's rows.
 *
 *   const tdb = forTenant(ctx.orgId);
 *   await tdb.ticket.findMany();          // scoped automatically
 *   await tdb.ticket.create({ data });    // organizationId injected
 */
export function forTenant(organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          const a: any = args ?? {};

          // Inject into where-based reads/updates/deletes
          if (
            operation === 'findMany' ||
            operation === 'findFirst' ||
            operation === 'findFirstOrThrow' ||
            operation === 'count' ||
            operation === 'aggregate' ||
            operation === 'updateMany' ||
            operation === 'deleteMany'
          ) {
            a.where = { ...(a.where ?? {}), organizationId };
          }

          // Inject into create payloads
          if (operation === 'create') {
            a.data = { ...(a.data ?? {}), organizationId };
          }
          if (operation === 'createMany' && Array.isArray(a.data)) {
            a.data = a.data.map((d: Record<string, unknown>) => ({
              ...d,
              organizationId,
            }));
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof forTenant>;
export { Prisma };
