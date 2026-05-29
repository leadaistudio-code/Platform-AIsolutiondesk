import { BadGatewayException, Injectable } from '@nestjs/common';
import { forTenant, Prisma, Product } from '@aisolutiondesk/db';
import { Models } from '@aisolutiondesk/ai';
import type { AssistantAnswer, AssistantQueryInput } from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import { RagService } from './rag.service';

/**
 * The Employee Assistant's question-answering brain. It retrieves the most
 * relevant document passages for the question, then asks the model to answer
 * USING ONLY those passages — and returns the sources as citations.
 */
@Injectable()
export class AssistantService {
  constructor(
    private readonly rag: RagService,
    private readonly models: ModelService,
  ) {}

  async ask(
    ctx: RequestContext,
    input: AssistantQueryInput,
  ): Promise<AssistantAnswer> {
    const passages = await this.rag.retrieve({
      organizationId: ctx.organizationId,
      query: input.question,
      topK: 5,
      accessTags: input.accessTags,
    });

    if (passages.length === 0) {
      return {
        answer:
          "I couldn't find anything about that in your documents yet. Try uploading a relevant document first.",
        citations: [],
      };
    }

    // Number the passages so the model can ground its answer in them.
    const context = passages
      .map((p, i) => `[Source ${i + 1}: ${p.title}]\n${p.content}`)
      .join('\n\n---\n\n');

    let answer: string;
    let usage = { input: 0, output: 0 };
    try {
      const res = await this.models.complete({
        model: Models.smart(),
        temperature: 0.2,
        maxTokens: 800,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful internal company assistant. Answer the employee\'s ' +
              'question using ONLY the provided sources. If the answer is not in the ' +
              'sources, say you don\'t have that information. Be concise and cite sources ' +
              'inline like [Source 1] where relevant.',
          },
          {
            role: 'user',
            content: `Sources:\n${context}\n\nQuestion: ${input.question}`,
          },
        ],
      });
      answer = res.content;
      usage = res.usage;
    } catch (err) {
      throw new BadGatewayException(
        `Assistant failed: ${(err as Error).message}. Check your AI API key in .env.`,
      );
    }

    // Meter usage (best-effort).
    const db = forTenant(ctx.organizationId);
    await db.usageRecord
      .createMany({
        data: [
          {
            organizationId: ctx.organizationId,
            product: Product.EMPLOYEE_ASSISTANT,
            metric: 'tokens.input',
            model: Models.smart(),
            quantity: usage.input,
            periodKey: new Date().toISOString().slice(0, 7),
          },
          {
            organizationId: ctx.organizationId,
            product: Product.EMPLOYEE_ASSISTANT,
            metric: 'tokens.output',
            model: Models.smart(),
            quantity: usage.output,
            periodKey: new Date().toISOString().slice(0, 7),
          },
        ] as Prisma.UsageRecordUncheckedCreateInput[],
      })
      .catch(() => undefined);

    // De-duplicate citations by document, keeping the best score.
    const byDoc = new Map<string, (typeof passages)[number]>();
    for (const p of passages) {
      const existing = byDoc.get(p.documentId);
      if (!existing || p.score > existing.score) byDoc.set(p.documentId, p);
    }

    return {
      answer,
      citations: [...byDoc.values()].map((p) => ({
        documentId: p.documentId,
        title: p.title,
        snippet: p.content.slice(0, 200) + (p.content.length > 200 ? '…' : ''),
        score: Number(p.score.toFixed(3)),
      })),
    };
  }
}
