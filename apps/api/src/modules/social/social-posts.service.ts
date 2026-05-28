import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  forTenant,
  Prisma,
  Product,
  type SocialPost,
} from '@aisolutiondesk/db';
import { createSocialPostWriterAgent, runAgent, Models } from '@aisolutiondesk/ai';
import type {
  GenerateSocialPostInput,
  MarkSocialPostedInput,
  ReviewSocialPostInput,
  SocialPostDTO,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';

/**
 * Lightweight "topic suggester" used when the user clicks "Generate random
 * topic" — mirrors the flexible front-end of the n8n flow.
 */
const TOPIC_SUGGESTER_SYSTEM = `Suggest ONE specific, engaging social media post topic for a
B2B SaaS audience. Reply with the topic only, 6-16 words, no quotes, no preamble.`;

@Injectable()
export class SocialPostsService {
  constructor(private readonly models: ModelService) {}

  private toDTO(p: SocialPost): SocialPostDTO {
    return {
      id: p.id,
      topic: p.topic,
      linkedinText: p.linkedinText,
      xText: p.xText,
      status: p.status,
      approvedAt: p.approvedAt?.toISOString() ?? null,
      rejectedReason: p.rejectedReason,
      linkedinPostedAt: p.linkedinPostedAt?.toISOString() ?? null,
      xPostedAt: p.xPostedAt?.toISOString() ?? null,
      autoPosted: p.autoPosted,
      createdAt: p.createdAt.toISOString(),
    };
  }

  async list(ctx: RequestContext): Promise<SocialPostDTO[]> {
    const db = forTenant(ctx.organizationId);
    const posts = await db.socialPost.findMany({ orderBy: { createdAt: 'desc' } });
    return posts.map((p) => this.toDTO(p));
  }

  /** Generate a paired LinkedIn + X post for a topic, save as pending approval. */
  async generate(
    ctx: RequestContext,
    input: GenerateSocialPostInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);

    // 1. Resolve the topic (use provided, or ask the model to pick one).
    let topic = input.topic?.trim();
    if (!topic) {
      try {
        const res = await this.models.complete({
          model: Models.fast(),
          temperature: 0.9,
          maxTokens: 60,
          messages: [
            { role: 'system', content: TOPIC_SUGGESTER_SYSTEM },
            { role: 'user', content: 'Give me a topic.' },
          ],
        });
        topic = res.content.trim().replace(/^["']|["']$/g, '');
      } catch (err) {
        throw new BadGatewayException(
          `Couldn't suggest a topic: ${(err as Error).message}. Check your AI API key.`,
        );
      }
    }
    if (!topic) topic = 'A productivity tip for busy founders';

    // 2. Generate the two posts.
    const agent = createSocialPostWriterAgent((req) => this.models.complete(req));
    let outcome;
    try {
      outcome = await runAgent(
        agent,
        { topic, model: Models.fast() },
        { organizationId: ctx.organizationId },
      );
    } catch (err) {
      throw new BadGatewayException(
        `AI post generation failed: ${(err as Error).message}. Check your AI API key.`,
      );
    }

    const draft = outcome.state.draft!;
    const post = await db.socialPost.create({
      data: {
        organizationId: ctx.organizationId,
        topic,
        linkedinText: draft.linkedin,
        xText: draft.x,
        status: 'PENDING_APPROVAL',
      },
    });

    // 3. Meter usage so it shows in billing alongside other AI features.
    await db.usageRecord
      .createMany({
        data: [
          {
            organizationId: ctx.organizationId,
            product: Product.SOCIAL_MEDIA,
            metric: 'tokens.input',
            model: Models.fast(),
            quantity: outcome.tokensInput,
            periodKey: new Date().toISOString().slice(0, 7),
          },
          {
            organizationId: ctx.organizationId,
            product: Product.SOCIAL_MEDIA,
            metric: 'tokens.output',
            model: Models.fast(),
            quantity: outcome.tokensOutput,
            periodKey: new Date().toISOString().slice(0, 7),
          },
        ] as Prisma.UsageRecordUncheckedCreateInput[],
      })
      .catch(() => undefined);

    return this.toDTO(post);
  }

  /** Approve or reject a pending post. */
  async review(
    ctx: RequestContext,
    id: string,
    input: ReviewSocialPostInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.status === 'POSTED') {
      throw new ForbiddenException('A posted message cannot be re-reviewed.');
    }
    const post = await db.socialPost.update({
      where: { id },
      data: input.approve
        ? {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: ctx.userId,
            rejectedReason: null,
          }
        : {
            status: 'REJECTED',
            rejectedReason: input.reason ?? null,
          },
    });
    return this.toDTO(post);
  }

  /**
   * Record that the post went out on a given platform.
   * (Actual LinkedIn / X API posting requires OAuth + per-platform app approval;
   *  for now this is a manual "I posted it" confirmation that locks the audit
   *  trail. Wire-up to real platform APIs is a follow-up.)
   */
  async markPosted(
    ctx: RequestContext,
    id: string,
    input: MarkSocialPostedInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.status !== 'APPROVED' && existing.status !== 'POSTED') {
      throw new ForbiddenException('Approve the post before marking it posted.');
    }

    const now = new Date();
    const post = await db.socialPost.update({
      where: { id },
      data: {
        status: 'POSTED',
        linkedinPostedAt:
          input.platform === 'LINKEDIN' && !existing.linkedinPostedAt ? now : undefined,
        xPostedAt:
          input.platform === 'X' && !existing.xPostedAt ? now : undefined,
      },
    });
    return this.toDTO(post);
  }
}
