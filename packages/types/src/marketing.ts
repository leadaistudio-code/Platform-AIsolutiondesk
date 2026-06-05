import { z } from 'zod';

/**
 * Contracts for the AI Marketing & SEO agent: AI content generation,
 * repurposing, SEO keyword research, SEO analysis/scoring, content ideas, a
 * persisted brand-voice profile, and a content library.
 */

export const MARKETING_CONTENT_TYPES = [
  'BLOG_POST',
  'EMAIL',
  'AD_COPY',
  'SOCIAL_POST',
  'LANDING_PAGE',
  'NEWSLETTER',
  'PRODUCT_DESCRIPTION',
] as const;
export type MarketingContentType = (typeof MARKETING_CONTENT_TYPES)[number];

export const MARKETING_CONTENT_TYPE_LABELS: Record<MarketingContentType, string> = {
  BLOG_POST: 'Blog post',
  EMAIL: 'Email',
  AD_COPY: 'Ad copy',
  SOCIAL_POST: 'Social post',
  LANDING_PAGE: 'Landing page',
  NEWSLETTER: 'Newsletter',
  PRODUCT_DESCRIPTION: 'Product description',
};

export const MARKETING_CONTENT_STATUSES = ['DRAFT', 'APPROVED', 'PUBLISHED'] as const;
export type MarketingContentStatus = (typeof MARKETING_CONTENT_STATUSES)[number];

export interface MarketingContentDTO {
  id: string;
  type: MarketingContentType;
  title: string;
  brief: string;
  body: string;
  metaDescription: string | null;
  keywords: string[];
  seoScore: number | null;
  channel: string | null;
  status: MarketingContentStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Generate ──
export const GenerateContentSchema = z.object({
  type: z.enum(MARKETING_CONTENT_TYPES),
  brief: z.string().trim().min(1).max(2000),
  keywords: z.array(z.string().trim()).max(20).optional(),
  tone: z.string().trim().max(120).optional(),
  channel: z.string().trim().max(80).optional(),
  /** Persist the result to the content library. */
  save: z.boolean().optional(),
});
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

export interface GeneratedContentDTO {
  /** Set when the result was saved to the library. */
  id: string | null;
  title: string;
  body: string;
  metaDescription: string;
  suggestedKeywords: string[];
}

// ── Repurpose ──
export const RepurposeSchema = z.object({
  sourceText: z.string().trim().min(1).max(8000),
  targets: z.array(z.string().trim().min(1)).min(1).max(8),
});
export type RepurposeInput = z.infer<typeof RepurposeSchema>;

export interface RepurposeVariantDTO {
  channel: string;
  text: string;
}
export interface RepurposeResultDTO {
  variants: RepurposeVariantDTO[];
}

// ── SEO keyword research ──
export const KeywordResearchSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  audience: z.string().trim().max(160).optional(),
});
export type KeywordResearchInput = z.infer<typeof KeywordResearchSchema>;

export interface KeywordIdeaDTO {
  keyword: string;
  /** informational | commercial | transactional | navigational */
  intent: string;
  /** Low | Medium | High */
  difficulty: string;
  /** Relative volume label, e.g. "High", "1k-10k". */
  volume: string;
}
export interface KeywordClusterDTO {
  cluster: string;
  keywords: KeywordIdeaDTO[];
}
export interface KeywordResearchDTO {
  clusters: KeywordClusterDTO[];
}

// ── SEO analyze ──
export const SeoAnalyzeSchema = z.object({
  text: z.string().trim().min(1).max(12000),
  targetKeyword: z.string().trim().max(120).optional(),
});
export type SeoAnalyzeInput = z.infer<typeof SeoAnalyzeSchema>;

export interface SeoAnalysisDTO {
  /** 0-100 overall SEO score. */
  score: number;
  metaDescription: string;
  titleSuggestions: string[];
  issues: string[];
  improvements: string[];
  keywordsFound: string[];
}

// ── Content ideas ──
export const ContentIdeasSchema = z.object({
  goal: z.string().trim().min(1).max(300),
  audience: z.string().trim().max(160).optional(),
  count: z.coerce.number().int().min(1).max(12).optional(),
});
export type ContentIdeasInput = z.infer<typeof ContentIdeasSchema>;

export interface ContentIdeaDTO {
  title: string;
  type: MarketingContentType;
  angle: string;
  targetKeyword: string;
}
export interface ContentIdeasDTO {
  ideas: ContentIdeaDTO[];
}

// ── Brand profile ──
export const UpdateBrandProfileSchema = z.object({
  brandName: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  tone: z.string().trim().max(160).optional(),
  audience: z.string().trim().max(300).optional(),
  valueProps: z.string().trim().max(1000).optional(),
  keywords: z.array(z.string().trim()).max(30).optional(),
  doNotMention: z.string().trim().max(500).optional(),
});
export type UpdateBrandProfileInput = z.infer<typeof UpdateBrandProfileSchema>;

export interface BrandProfileDTO {
  brandName: string | null;
  description: string | null;
  tone: string | null;
  audience: string | null;
  valueProps: string | null;
  keywords: string[];
  doNotMention: string | null;
}

// ── Update content ──
export const UpdateMarketingContentSchema = z.object({
  title: z.string().trim().max(300).optional(),
  body: z.string().trim().max(20000).optional(),
  metaDescription: z.string().trim().max(400).optional(),
  channel: z.string().trim().max(80).optional(),
  status: z.enum(MARKETING_CONTENT_STATUSES).optional(),
  keywords: z.array(z.string().trim()).max(30).optional(),
});
export type UpdateMarketingContentInput = z.infer<typeof UpdateMarketingContentSchema>;

// ── Metrics ──
export interface MarketingMetricsDTO {
  total: number;
  published: number;
  drafts: number;
  byType: { type: MarketingContentType; count: number }[];
  recent: MarketingContentDTO[];
}
