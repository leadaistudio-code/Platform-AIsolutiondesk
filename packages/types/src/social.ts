import { z } from 'zod';

/**
 * Shared contracts for the AI Social Media Auto-Post product.
 * Mirrors the n8n flow: generate -> review -> approve/reject -> post.
 */

export const SOCIAL_POST_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'REJECTED',
  'POSTED',
] as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

export const SOCIAL_PLATFORMS = ['LINKEDIN', 'X'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/**
 * Body for POST /social/generate. If `topic` is omitted, the AI picks a topic
 * automatically (the "random topic" path from the n8n flow).
 */
export const GenerateSocialPostSchema = z.object({
  topic: z.string().trim().min(3).max(500).optional(),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostSchema>;

export const ReviewSocialPostSchema = z
  .object({
    approve: z.boolean(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.approve || (v.reason && v.reason.length > 0), {
    message: 'A reason is required when rejecting.',
    path: ['reason'],
  });
export type ReviewSocialPostInput = z.infer<typeof ReviewSocialPostSchema>;

export const MarkSocialPostedSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
});
export type MarkSocialPostedInput = z.infer<typeof MarkSocialPostedSchema>;

/** Edit the AI-generated drafts before approving. */
export const UpdateSocialPostSchema = z
  .object({
    topic: z.string().trim().min(3).max(500).optional(),
    linkedinText: z.string().trim().min(1).max(3000).optional(),
    xText: z.string().trim().min(1).max(280).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
export type UpdateSocialPostInput = z.infer<typeof UpdateSocialPostSchema>;

/** Attach an image (sent as base64 to avoid multipart parsing). */
export const AttachImageSchema = z.object({
  mimeType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|gif|webp)$/i, 'Unsupported image type.'),
  base64: z.string().min(1).max(8_000_000, 'Image is too large (max ~5 MB).'),
});
export type AttachImageInput = z.infer<typeof AttachImageSchema>;

/** Schedule a future publish. */
export const ScheduleSocialPostSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ message: 'Must be an ISO datetime.' })
    .refine((s) => new Date(s).getTime() > Date.now() + 30_000, {
      message: 'Scheduled time must be at least 30 seconds in the future.',
    }),
  platforms: z.array(z.enum(SOCIAL_PLATFORMS)).min(1),
});
export type ScheduleSocialPostInput = z.infer<typeof ScheduleSocialPostSchema>;

export interface PlatformMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface SocialMetrics {
  linkedin?: PlatformMetrics;
  x?: PlatformMetrics;
}

export interface SocialPostDTO {
  id: string;
  topic: string;
  linkedinText: string;
  xText: string;
  status: SocialPostStatus;
  approvedAt: string | null;
  rejectedReason: string | null;
  linkedinPostedAt: string | null;
  xPostedAt: string | null;
  autoPosted: boolean;
  linkedinPostUrn: string | null;
  xTweetId: string | null;
  metrics: SocialMetrics;
  metricsLastSyncedAt: string | null;
  scheduledFor: string | null;
  scheduledPlatforms: SocialPlatform[];
  hasImage: boolean;
  imageMimeType: string | null;
  createdAt: string;
}

// ── Social platform connections (LinkedIn / X) ──
export const SOCIAL_PROVIDERS = ['LINKEDIN', 'X'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const ConnectLinkedInSchema = z.object({
  accessToken: z.string().trim().min(20, 'Paste your LinkedIn access token.'),
  /** Your LinkedIn person URN, e.g. "urn:li:person:abc123". */
  personUrn: z
    .string()
    .trim()
    .regex(/^urn:li:person:/, 'Must start with "urn:li:person:"'),
});
export type ConnectLinkedInInput = z.infer<typeof ConnectLinkedInSchema>;

export const ConnectXSchema = z.object({
  accessToken: z.string().trim().min(20),
});
export type ConnectXInput = z.infer<typeof ConnectXSchema>;

export interface SocialConnectionDTO {
  provider: SocialProvider;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  /** Public handle/name shown in the UI, e.g. LinkedIn person URN. */
  displayName: string | null;
  connectedAt: string | null;
}
