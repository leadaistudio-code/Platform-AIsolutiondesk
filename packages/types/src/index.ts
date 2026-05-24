import { z } from 'zod';

export * from './tickets';
export * from './assistant';
export * from './sales';

/**
 * Shared API contracts. These Zod schemas are validated at runtime on the
 * server (via ZodValidationPipe) and their inferred TS types are imported by
 * the frontend — so request/response shapes can never silently drift apart.
 *
 * Feature-specific schemas (CreateTicket, CreateLead, …) are added here as we
 * build each product module.
 */

/** Standard pagination query for list endpoints. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Standard shape every list endpoint returns. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
