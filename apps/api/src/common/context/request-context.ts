import type { Role } from '@aisolutiondesk/db';

/**
 * The "who is this request" packet. As each request passes through the guards,
 * they fill this in and attach it to the request. Later code reads it to know
 * which user, which company (organization), and what role is acting — so it
 * never has to re-figure that out.
 */
export interface RequestContext {
  /** Our internal User id (null for API-key requests). */
  userId: string | null;
  clerkUserId: string | null;
  /** Our internal Organization id — the tenant everything is scoped to. */
  organizationId: string;
  clerkOrgId: string;
  /** The acting member's role in this organization. */
  role: Role;
  /** True when authenticated via an API key rather than a logged-in user. */
  isApiKey: boolean;
  /** Permission scopes (from API key) when isApiKey is true. */
  scopes: string[];
}

/** Express request augmented with our context. */
export interface AuthedRequest extends Request {
  context?: RequestContext;
}
