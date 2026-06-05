import { z } from 'zod';

/**
 * Cross-cutting platform contracts:
 *  - /me — the current user + their org + which products they're entitled to.
 *  - /admin/* — endpoints the platform admin uses to toggle each customer
 *    org's product entitlements after payment.
 */

/** Mirrors the Prisma Product enum (kept here so the web app doesn't import db). */
export const PRODUCT_KEYS = [
  'SERVICE_DESK',
  'EMPLOYEE_ASSISTANT',
  'SOCIAL_MEDIA',
  'SALES_AGENT',
  'CUSTOMER_SUPPORT',
  'FINANCE',
  'FINANCE_ANALYSIS',
  'MARKETING_SEO',
] as const;
export type ProductKey = (typeof PRODUCT_KEYS)[number];

/** Friendly label for sidebar/admin UI. */
export const PRODUCT_LABELS: Record<ProductKey, string> = {
  SERVICE_DESK: 'AI Service Desk',
  EMPLOYEE_ASSISTANT: 'AI Employee Assistant',
  SOCIAL_MEDIA: 'AI Social Media',
  SALES_AGENT: 'AI Sales Agent',
  CUSTOMER_SUPPORT: 'AI Customer Support',
  FINANCE: 'AI Finance Agent',
  FINANCE_ANALYSIS: 'AI Finance Analysis',
  MARKETING_SEO: 'AI Marketing & SEO',
};

export interface MeDTO {
  isPlatformAdmin: boolean;
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    role: string;
    /** Products this org has bought / is entitled to use. */
    products: ProductKey[];
  };
}

/** One customer organization in the admin's list. */
export interface AdminOrgDTO {
  id: string;
  name: string;
  slug: string;
  clerkOrgId: string;
  products: ProductKey[];
  memberCount: number;
  createdAt: string;
}

export const UpdateOrgProductsSchema = z.object({
  products: z.array(z.enum(PRODUCT_KEYS)),
});
export type UpdateOrgProductsInput = z.infer<typeof UpdateOrgProductsSchema>;
