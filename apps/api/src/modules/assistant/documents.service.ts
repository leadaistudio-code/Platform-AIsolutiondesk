import { Injectable, NotFoundException } from '@nestjs/common';
import { forTenant, Product } from '@aisolutiondesk/db';
import type { CreateDocumentInput, DocumentDTO } from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { EventBus } from '../../events/event-bus';
import { RagService } from './rag.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly rag: RagService,
    private readonly events: EventBus,
  ) {}

  /** Create a document and index it for retrieval (synchronously for the MVP). */
  async create(
    ctx: RequestContext,
    input: CreateDocumentInput,
  ): Promise<DocumentDTO> {
    const db = forTenant(ctx.organizationId);
    const accessTags = input.accessTags ?? [];

    const doc = await db.document.create({
      data: {
        organizationId: ctx.organizationId,
        product: Product.EMPLOYEE_ASSISTANT,
        title: input.title,
        status: 'PENDING',
        accessTags,
        mimeType: 'text/plain',
      },
    });

    const { chunks } = await this.rag.ingest({
      organizationId: ctx.organizationId,
      documentId: doc.id,
      title: input.title,
      content: input.content,
      accessTags,
    });

    await this.events.publish('document.uploaded', ctx.organizationId, {
      documentId: doc.id,
    });

    return {
      id: doc.id,
      title: doc.title,
      status: 'INDEXED',
      chunkCount: chunks,
      accessTags,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  async list(ctx: RequestContext): Promise<DocumentDTO[]> {
    const db = forTenant(ctx.organizationId);
    const docs = await db.document.findMany({
      where: { product: Product.EMPLOYEE_ASSISTANT },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });

    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      chunkCount: d._count.chunks,
      accessTags: d.accessTags,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async remove(ctx: RequestContext, id: string): Promise<void> {
    const db = forTenant(ctx.organizationId);
    const doc = await db.document.findFirst({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.rag.deleteDocument(ctx.organizationId, id);
    await db.document.delete({ where: { id } });
  }
}
