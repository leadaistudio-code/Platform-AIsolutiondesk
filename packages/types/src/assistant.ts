import { z } from 'zod';

/**
 * Shared contracts for the AI Employee Assistant (documents + RAG chat).
 */

// ── Documents ──
export const CreateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(500_000),
  /** Visibility tags (e.g. department names) for permissioned retrieval. */
  accessTags: z.array(z.string()).optional(),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

export const DOCUMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'INDEXED',
  'FAILED',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentDTO {
  id: string;
  title: string;
  status: DocumentStatus;
  chunkCount: number;
  accessTags: string[];
  createdAt: string;
}

// ── Chat ──
export const AssistantQuerySchema = z.object({
  question: z.string().trim().min(1).max(4000),
  /** Optionally scope retrieval to a department's access tags. */
  accessTags: z.array(z.string()).optional(),
});
export type AssistantQueryInput = z.infer<typeof AssistantQuerySchema>;

export interface Citation {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface AssistantAnswer {
  answer: string;
  citations: Citation[];
}
