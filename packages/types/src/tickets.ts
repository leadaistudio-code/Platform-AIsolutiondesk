import { z } from 'zod';

/**
 * Shared ticket contracts for the AI Service Desk. The backend validates
 * incoming data against these Zod schemas; the frontend imports the inferred
 * types so both sides always agree on the shape of a ticket.
 *
 * The string values here intentionally match the Prisma enums in the db schema
 * (so a validated string drops straight into a Prisma query), but we redeclare
 * them here so the frontend never has to import the database package.
 */
export const TICKET_STATUSES = [
  'NEW',
  'TRIAGED',
  'IN_PROGRESS',
  'WAITING',
  'RESOLVED',
  'CLOSED',
] as const;

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const TicketStatusSchema = z.enum(TICKET_STATUSES);
export const TicketPrioritySchema = z.enum(TICKET_PRIORITIES);

export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

/** Body for POST /tickets */
export const CreateTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(10000),
  priority: TicketPrioritySchema.optional(),
  requesterEmail: z.string().email().optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

/** Body for PATCH /tickets/:id */
export const UpdateTicketSchema = z
  .object({
    status: TicketStatusSchema.optional(),
    priority: TicketPrioritySchema.optional(),
    assigneeId: z.string().nullable().optional(),
    category: z.string().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

/** Query for GET /tickets */
export const ListTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  search: z.string().trim().optional(),
});
export type ListTicketsQuery = z.infer<typeof ListTicketsQuerySchema>;

/** One entry in a ticket's timeline. */
export interface TicketEventDTO {
  id: string;
  type: string; // "status_change" | "ai_triage" | "comment" | ...
  actor: string; // userId | "system" | "ai"
  payload: unknown;
  createdAt: string;
}

/** Aggregated numbers for the Service Desk analytics dashboard. */
export interface TicketStatsDTO {
  total: number;
  triaged: number;
  slaBreached: number;
  byStatus: { status: TicketStatus; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
  byCategory: { category: string; count: number }[];
}

/** Shape returned to clients for a single ticket. */
export interface TicketDTO {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  aiSummary: string | null;
  aiRootCause: string | null;
  aiSuggestedActions: unknown;
  sentiment: number | null;
  requesterEmail: string | null;
  assigneeId: string | null;
  slaDueAt: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A ticket plus its timeline, for the detail page. */
export interface TicketDetailDTO extends TicketDTO {
  events: TicketEventDTO[];
}
