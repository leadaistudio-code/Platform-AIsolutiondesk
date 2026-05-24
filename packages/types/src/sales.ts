import { z } from 'zod';

/**
 * Shared contracts for the AI Sales Automation Agent (leads + outreach).
 */

export const LEAD_STATUSES = [
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'ENGAGED',
  'PROPOSAL',
  'WON',
  'LOST',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const OUTREACH_CHANNELS = ['EMAIL', 'LINKEDIN', 'WHATSAPP', 'SMS'] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export const CreateLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().trim().max(200).optional(),
  title: z.string().trim().max(200).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z
  .object({ status: z.enum(LEAD_STATUSES).optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export const GenerateOutreachSchema = z.object({
  channel: z.enum(OUTREACH_CHANNELS).default('EMAIL'),
  /** Optional extra context, e.g. "mention our new analytics feature". */
  notes: z.string().trim().max(2000).optional(),
});
export type GenerateOutreachInput = z.infer<typeof GenerateOutreachSchema>;

export interface LeadDTO {
  id: string;
  fullName: string;
  email: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  status: LeadStatus;
  score: number;
  scoreReason: string | null;
  aiQualification: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachDTO {
  id: string;
  channel: OutreachChannel;
  status: string;
  subject: string | null;
  body: string;
  createdAt: string;
}

export interface LeadDetailDTO extends LeadDTO {
  outreaches: OutreachDTO[];
}
