import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  forTenant,
  IntegrationProvider,
  Prisma,
  prisma,
  Product,
  type SocialPost,
} from '@aisolutiondesk/db';
import { createSocialPostWriterAgent, runAgent, Models } from '@aisolutiondesk/ai';
import type {
  GenerateSocialPostInput,
  MarkSocialPostedInput,
  ReviewSocialPostInput,
  ScheduleSocialPostInput,
  SocialMetrics,
  SocialPersona,
  SocialPlatform,
  SocialPostDTO,
  UpdateSocialPostInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import { LinkedInClient } from './linkedin.client';
import { SocialPersonaService } from './social-persona.service';

/**
 * Lightweight "topic suggester" used when the user clicks "Surprise me" —
 * mirrors the flexible front-end of the n8n flow.
 */
const TOPIC_SUGGESTER_SYSTEM = `Suggest ONE specific, engaging social media post topic for a
B2B SaaS audience. Reply with the topic only, 6-16 words, no quotes, no preamble.`;

@Injectable()
export class SocialPostsService {
  constructor(
    private readonly models: ModelService,
    private readonly linkedin: LinkedInClient,
    private readonly personas: SocialPersonaService,
  ) {}

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
      linkedinPostUrn: p.linkedinPostUrn,
      xTweetId: p.xTweetId,
      metrics: (p.metrics as SocialMetrics) ?? {},
      metricsLastSyncedAt: p.metricsLastSyncedAt?.toISOString() ?? null,
      scheduledFor: p.scheduledFor?.toISOString() ?? null,
      scheduledPlatforms: (p.scheduledPlatforms ?? []) as SocialPlatform[],
      hasImage: !!p.imageData,
      imageMimeType: p.imageMimeType,
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

    // 2. Generate the two posts (using the brand persona if one is configured).
    const persona: SocialPersona = await this.personas
      .get(ctx)
      .catch(() => ({}));
    const agent = createSocialPostWriterAgent((req) => this.models.complete(req));
    let outcome;
    try {
      outcome = await runAgent(
        agent,
        { topic, persona, model: Models.fast() },
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
   * "Post" the message on a platform. If the user has connected that platform
   * (LinkedIn now; X coming when paid API supported), we call the real API and
   * store the post URN + autoPosted=true. Otherwise we just record a manual
   * "I posted this" timestamp.
   */
  async markPosted(
    ctx: RequestContext,
    id: string,
    input: MarkSocialPostedInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (
      existing.status !== 'APPROVED' &&
      existing.status !== 'SCHEDULED' &&
      existing.status !== 'POSTED'
    ) {
      throw new ForbiddenException('Approve the post before marking it posted.');
    }

    const now = new Date();
    const updates: Prisma.SocialPostUncheckedUpdateInput = { status: 'POSTED' };

    if (input.platform === 'LINKEDIN' && !existing.linkedinPostedAt) {
      const integ = await prisma.integration.findUnique({
        where: {
          organizationId_provider: {
            organizationId: ctx.organizationId,
            provider: IntegrationProvider.LINKEDIN,
          },
        },
      });

      if (integ) {
        try {
          const creds = this.linkedin.decryptCreds(integ.credentials);
          // Upload image first if present, then post with it attached.
          let imageUrn: string | undefined;
          if (existing.imageData && existing.imageMimeType) {
            const up = await this.linkedin.uploadImage(
              creds,
              Buffer.from(existing.imageData),
              existing.imageMimeType,
            );
            imageUrn = up.urn;
          }
          const { urn } = await this.linkedin.createPost(
            creds,
            existing.linkedinText,
            imageUrn,
          );
          updates.linkedinPostedAt = now;
          updates.linkedinPostUrn = urn;
          updates.autoPosted = true;
        } catch (err) {
          throw new BadGatewayException(
            `LinkedIn auto-post failed: ${(err as Error).message}. ` +
              'Reconnect LinkedIn in Settings or check the access token.',
          );
        }
      } else {
        updates.linkedinPostedAt = now;
      }
    }

    if (input.platform === 'X' && !existing.xPostedAt) {
      updates.xPostedAt = now;
    }

    const post = await db.socialPost.update({ where: { id }, data: updates });
    return this.toDTO(post);
  }

  /** Edit an AI-generated post before approval (text or topic). */
  async update(
    ctx: RequestContext,
    id: string,
    input: UpdateSocialPostInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.status === 'POSTED') {
      throw new ForbiddenException('A published post cannot be edited here.');
    }
    const post = await db.socialPost.update({
      where: { id },
      data: {
        topic: input.topic ?? undefined,
        linkedinText: input.linkedinText ?? undefined,
        xText: input.xText ?? undefined,
      },
    });
    return this.toDTO(post);
  }

  /** Schedule a future publish — a worker picks it up at scheduledFor. */
  async schedule(
    ctx: RequestContext,
    id: string,
    input: ScheduleSocialPostInput,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (
      existing.status !== 'APPROVED' &&
      existing.status !== 'SCHEDULED'
    ) {
      throw new ForbiddenException('Only an approved post can be scheduled.');
    }
    const post = await db.socialPost.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledFor: new Date(input.scheduledAt),
        scheduledPlatforms: input.platforms,
      },
    });
    return this.toDTO(post);
  }

  async cancelSchedule(ctx: RequestContext, id: string): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.status !== 'SCHEDULED') {
      throw new ForbiddenException('Only a scheduled post can be unscheduled.');
    }
    const post = await db.socialPost.update({
      where: { id },
      data: {
        status: 'APPROVED',
        scheduledFor: null,
        scheduledPlatforms: [],
      },
    });
    return this.toDTO(post);
  }

  /** Store an uploaded image inline on the post (used by /:id/image POST). */
  async attachImage(
    ctx: RequestContext,
    id: string,
    bytes: Buffer,
    mimeType: string,
  ): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.socialPost.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.status === 'POSTED') {
      throw new ForbiddenException('Cannot change a posted message.');
    }
    if (bytes.length > 5 * 1024 * 1024) {
      throw new ForbiddenException('Image must be 5 MB or smaller.');
    }
    const post = await db.socialPost.update({
      where: { id },
      data: { imageData: bytes, imageMimeType: mimeType },
    });
    return this.toDTO(post);
  }

  async removeImage(ctx: RequestContext, id: string): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const post = await db.socialPost.update({
      where: { id },
      data: { imageData: null, imageMimeType: null },
    });
    return this.toDTO(post);
  }

  /** Return raw image bytes for serving via the GET /image endpoint. */
  async getImageBytes(
    ctx: RequestContext,
    id: string,
  ): Promise<{ bytes: Buffer; mimeType: string } | null> {
    const db = forTenant(ctx.organizationId);
    const post = await db.socialPost.findFirst({ where: { id } });
    if (!post || !post.imageData || !post.imageMimeType) return null;
    return { bytes: Buffer.from(post.imageData), mimeType: post.imageMimeType };
  }

  /**
   * Worker entry-point: find SCHEDULED posts whose time has come and publish
   * them across their configured platforms. Called periodically (every minute)
   * by the background worker.
   */
  async publishDueScheduled(): Promise<void> {
    const due = await prisma.socialPost.findMany({
      where: { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
      take: 25,
    });
    for (const post of due) {
      const ctx: RequestContext = {
        userId: null,
        clerkUserId: null,
        organizationId: post.organizationId,
        clerkOrgId: '',
        role: 'OWNER' as RequestContext['role'],
        isApiKey: false,
        scopes: [],
        isPlatformAdmin: true,
      };
      for (const platform of post.scheduledPlatforms) {
        try {
          await this.markPosted(ctx, post.id, {
            platform: platform as SocialPlatform,
          });
        } catch {
          // Leave SCHEDULED so it retries on next tick; admin can inspect.
        }
      }
    }
  }

  /** Pull current likes/comments from LinkedIn for a posted post. */
  async refreshMetrics(ctx: RequestContext, id: string): Promise<SocialPostDTO> {
    const db = forTenant(ctx.organizationId);
    const post = await db.socialPost.findFirst({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.linkedinPostUrn) {
      throw new ForbiddenException(
        'No LinkedIn post URN — metrics are only available for posts that were auto-posted via LinkedIn.',
      );
    }

    const integ = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId: ctx.organizationId,
          provider: IntegrationProvider.LINKEDIN,
        },
      },
    });
    if (!integ) {
      throw new ForbiddenException('LinkedIn is not connected.');
    }

    let metrics: { likes: number; comments: number };
    try {
      const creds = this.linkedin.decryptCreds(integ.credentials);
      metrics = await this.linkedin.getMetrics(creds, post.linkedinPostUrn);
    } catch (err) {
      throw new BadGatewayException(
        `LinkedIn metrics refresh failed: ${(err as Error).message}`,
      );
    }

    const current = (post.metrics as SocialMetrics) ?? {};
    const merged: SocialMetrics = {
      ...current,
      linkedin: { likes: metrics.likes, comments: metrics.comments },
    };
    const updated = await db.socialPost.update({
      where: { id },
      data: {
        metrics: merged as unknown as Prisma.InputJsonValue,
        metricsLastSyncedAt: new Date(),
      },
    });
    return this.toDTO(updated);
  }
}
