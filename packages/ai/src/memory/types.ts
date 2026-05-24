import type { MemoryScope, Product } from '@aisolutiondesk/db';

/**
 * Layered memory model used by every agent:
 *
 *  1. Working memory   — the current conversation window (recent messages).
 *                        Bounded by a token budget; oldest turns summarized.
 *  2. Episodic memory  — per-conversation summaries persisted as MemoryRecords
 *                        (scope = CONVERSATION) so a thread can be resumed cheaply.
 *  3. Semantic memory  — durable facts/preferences/entities (scope = USER or
 *                        ORGANIZATION), embedded in Qdrant and recalled by
 *                        relevance to the current turn.
 *  4. Knowledge (RAG)  — organizational documents, retrieved per query. Distinct
 *                        from memory: it is authored content, not learned facts.
 *
 * All recall is tenant-scoped via Qdrant payload filters on `organizationId`.
 */

export interface MemoryQuery {
  organizationId: string;
  scope: MemoryScope;
  scopeRefId?: string;
  product?: Product;
  query: string;
  limit?: number;
  minImportance?: number;
}

export interface RecalledMemory {
  id: string;
  content: string;
  kind: string;
  importance: number;
  score: number; // similarity 0..1
}

export interface MemoryWrite {
  organizationId: string;
  scope: MemoryScope;
  scopeRefId?: string;
  product?: Product;
  kind: 'fact' | 'preference' | 'summary' | 'entity';
  content: string;
  importance?: number;
  expiresAt?: Date;
}

export interface MemoryStore {
  remember(write: MemoryWrite): Promise<{ id: string }>;
  recall(query: MemoryQuery): Promise<RecalledMemory[]>;
  forget(organizationId: string, id: string): Promise<void>;
}
