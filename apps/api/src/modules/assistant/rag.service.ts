import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { forTenant, prisma, Prisma, Product } from '@aisolutiondesk/db';
import { ModelService } from '../../ai/model.service';
import { QdrantService, COLLECTIONS } from '../../ai/qdrant.client';

export interface RetrievedPassage {
  documentId: string;
  title: string;
  content: string;
  score: number;
}

/**
 * The RAG (Retrieval-Augmented Generation) pipeline for the Employee Assistant.
 *
 *  ingest():   text -> chunks -> embeddings -> Qdrant points (+ DocumentChunk rows)
 *  retrieve(): question -> embedding -> Qdrant similarity search (tenant-filtered)
 *
 * Every Qdrant point carries `organizationId` in its payload and every search
 * filters on it, so one tenant can never retrieve another's content.
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger('RAG');

  constructor(
    private readonly models: ModelService,
    private readonly qdrant: QdrantService,
  ) {}

  /** Split text into overlapping chunks (~1000 chars, 150 overlap). */
  private chunk(text: string, size = 1000, overlap = 150): string[] {
    const clean = text.replace(/\r\n/g, '\n').trim();
    if (clean.length <= size) return [clean];
    const chunks: string[] = [];
    let start = 0;
    while (start < clean.length) {
      const end = Math.min(start + size, clean.length);
      chunks.push(clean.slice(start, end));
      if (end === clean.length) break;
      start = end - overlap;
    }
    return chunks;
  }

  /**
   * Ingest a document's text: chunk, embed, upsert to Qdrant, and record a
   * DocumentChunk row per chunk. Marks the Document INDEXED (or FAILED).
   */
  async ingest(args: {
    organizationId: string;
    documentId: string;
    title: string;
    content: string;
    accessTags: string[];
  }): Promise<{ chunks: number }> {
    const db = forTenant(args.organizationId);
    try {
      await db.document.update({
        where: { id: args.documentId },
        data: { status: 'PROCESSING' },
      });

      const pieces = this.chunk(args.content);
      const { vectors } = await this.models.embed(pieces);

      const points = pieces.map((content, i) => ({
        id: randomUUID(),
        vector: vectors[i]!,
        payload: {
          organizationId: args.organizationId,
          product: Product.EMPLOYEE_ASSISTANT,
          documentId: args.documentId,
          title: args.title,
          chunkIndex: i,
          content,
          accessTags: args.accessTags,
        },
      }));

      await this.qdrant.client.upsert(COLLECTIONS.documents, {
        wait: true,
        points,
      });

      // Record chunk metadata in Postgres (system of record).
      await db.documentChunk.createMany({
        data: points.map((p, i) => ({
          organizationId: args.organizationId,
          documentId: args.documentId,
          chunkIndex: i,
          content: pieces[i]!,
          tokenCount: Math.ceil(pieces[i]!.length / 4),
          qdrantPointId: p.id,
        })) as Prisma.DocumentChunkUncheckedCreateInput[],
      });

      await db.document.update({
        where: { id: args.documentId },
        data: { status: 'INDEXED' },
      });

      this.logger.log(`Indexed ${pieces.length} chunks for doc ${args.documentId}`);
      return { chunks: pieces.length };
    } catch (err) {
      await db.document
        .update({
          where: { id: args.documentId },
          data: { status: 'FAILED', error: (err as Error).message },
        })
        .catch(() => undefined);
      throw err;
    }
  }

  /** Embed the question and return the most relevant passages for this tenant. */
  async retrieve(args: {
    organizationId: string;
    query: string;
    topK?: number;
    accessTags?: string[];
  }): Promise<RetrievedPassage[]> {
    const { vectors } = await this.models.embed([args.query]);

    const must: Array<Record<string, unknown>> = [
      { key: 'organizationId', match: { value: args.organizationId } },
      { key: 'product', match: { value: Product.EMPLOYEE_ASSISTANT } },
    ];
    if (args.accessTags?.length) {
      must.push({ key: 'accessTags', match: { any: args.accessTags } });
    }

    const results = await this.qdrant.client.search(COLLECTIONS.documents, {
      vector: vectors[0]!,
      filter: { must },
      limit: args.topK ?? 5,
      with_payload: true,
    });

    return results.map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      return {
        documentId: String(p.documentId ?? ''),
        title: String(p.title ?? 'Untitled'),
        content: String(p.content ?? ''),
        score: r.score ?? 0,
      };
    });
  }

  /** Remove a document's vectors from Qdrant (used when deleting a document). */
  async deleteDocument(organizationId: string, documentId: string): Promise<void> {
    await this.qdrant.client.delete(COLLECTIONS.documents, {
      wait: true,
      filter: {
        must: [
          { key: 'organizationId', match: { value: organizationId } },
          { key: 'documentId', match: { value: documentId } },
        ],
      },
    });
  }
}
