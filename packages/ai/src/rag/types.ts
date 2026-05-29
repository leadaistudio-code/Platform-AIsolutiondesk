import type { Product } from '@aisolutiondesk/db';

/**
 * RAG pipeline contracts. The concrete implementation:
 *   ingest:  load → chunk → embed → upsert(Qdrant) → mark Document INDEXED
 *   retrieve: embed(query) → Qdrant search (filtered by org + product + accessTags)
 *             → optional rerank → return passages with citations
 */

export interface IngestRequest {
  organizationId: string;
  documentId: string;
  product: Product;
  text: string;
  accessTags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RetrievedPassage {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  citation: {
    title: string;
    sourceUri?: string;
    chunkIndex: number;
  };
}

export interface RetrieveRequest {
  organizationId: string;
  product: Product;
  query: string;
  topK?: number;
  /** Only return passages whose document accessTags intersect these. */
  accessTags?: string[];
}

export interface RagPipeline {
  ingest(req: IngestRequest): Promise<{ chunks: number }>;
  retrieve(req: RetrieveRequest): Promise<RetrievedPassage[]>;
}

/** Token-aware chunking with overlap. */
export interface ChunkOptions {
  maxTokens?: number; // default ~512
  overlapTokens?: number; // default ~64
}
