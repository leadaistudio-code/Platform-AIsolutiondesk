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

// ── Campaigns ──
export const CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CreateCampaignSchema = z.object({
  name: z.string().trim().min(2).max(200),
  channels: z.array(z.enum(OUTREACH_CHANNELS)).min(1, 'Pick at least one channel.'),
  description: z.string().trim().max(2000).optional(),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z
  .object({ status: z.enum(CAMPAIGN_STATUSES).optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export interface CampaignDTO {
  id: string;
  name: string;
  status: CampaignStatus;
  channels: OutreachChannel[];
  outreachCount: number;
  createdAt: string;
}

// ── Outreach hub (all messages across leads) ──
export interface OutreachListItemDTO extends OutreachDTO {
  leadId: string;
  leadName: string;
  company: string | null;
}

// ── Proposals ──
export const GenerateProposalSchema = z.object({
  leadId: z.string().min(1),
  notes: z.string().trim().max(2000).optional(),
});
export type GenerateProposalInput = z.infer<typeof GenerateProposalSchema>;

export interface ProposalDTO {
  id: string;
  leadId: string | null;
  leadName: string | null;
  title: string;
  content: string;
  status: string;
  createdAt: string;
}

// ── Sales analytics ──
export interface SalesAnalyticsDTO {
  totalLeads: number;
  qualified: number;
  won: number;
  lost: number;
  outreachCount: number;
  proposalCount: number;
  avgScore: number;
  byStatus: { status: LeadStatus; count: number }[];
  scoreBuckets: { label: string; count: number }[];
}

// ── AI insights ──
export interface SalesInsight {
  title: string;
  detail: string;
  severity: 'info' | 'opportunity' | 'risk';
}
export interface SalesInsightsDTO {
  summary: string;
  insights: SalesInsight[];
}

// ── CRM sync ──
export const CRM_PROVIDERS = ['SALESFORCE', 'HUBSPOT'] as const;
export type CrmProvider = (typeof CRM_PROVIDERS)[number];

export const ConnectCrmSchema = z.object({
  provider: z.enum(CRM_PROVIDERS),
  apiKey: z.string().trim().min(1, 'API key is required.'),
});
export type ConnectCrmInput = z.infer<typeof ConnectCrmSchema>;

export interface CrmConnectionDTO {
  provider: CrmProvider;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  connectedAt: string | null;
}
