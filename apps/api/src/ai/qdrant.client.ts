import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '@aisolutiondesk/config';

/**
 * Wraps the Qdrant vector database — the "long-term memory" store where we keep
 * the numeric fingerprints (embeddings) of documents and memories for
 * similarity search.
 *
 * Two collections:
 *   - "documents": chunks of uploaded knowledge (RAG)
 *   - "memories":  durable facts/preferences/summaries the agents learn
 *
 * Every point carries `organizationId` in its payload, and every search filters
 * on it — so one tenant can never retrieve another tenant's vectors.
 */
export const COLLECTIONS = {
  documents: 'documents',
  memories: 'memories',
} as const;

// text-embedding-3-large = 3072 dims. Adjust if you change the embedding model.
const VECTOR_SIZE = 3072;

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger('Qdrant');
  readonly client = new QdrantClient({
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
  });

  /** On startup, make sure both collections exist (create them if not). */
  async onModuleInit() {
    for (const name of Object.values(COLLECTIONS)) {
      await this.ensureCollection(name);
    }
  }

  private async ensureCollection(name: string) {
    try {
      const { collections } = await this.client.getCollections();
      if (collections.some((c) => c.name === name)) return;

      await this.client.createCollection(name, {
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      });
      // Index the tenant id so payload-filtered searches stay fast.
      await this.client.createPayloadIndex(name, {
        field_name: 'organizationId',
        field_schema: 'keyword',
      });
      this.logger.log(`Created Qdrant collection "${name}"`);
    } catch (err) {
      this.logger.error(`Failed ensuring collection "${name}"`, err as Error);
    }
  }

  /** Build a tenant-scoped filter (optionally narrowed by product/access tags). */
  tenantFilter(organizationId: string, extra?: Record<string, unknown>) {
    const must: Array<Record<string, unknown>> = [
      { key: 'organizationId', match: { value: organizationId } },
    ];
    if (extra?.product) {
      must.push({ key: 'product', match: { value: extra.product } });
    }
    return { must };
  }
}
