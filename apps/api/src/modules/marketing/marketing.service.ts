import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, type MarketingContent } from '@aisolutiondesk/db';
import { Models } from '@aisolutiondesk/ai';
import {
  MARKETING_CONTENT_TYPES,
  MARKETING_CONTENT_TYPE_LABELS,
  type BrandProfileDTO,
  type ContentIdeasDTO,
  type ContentIdeasInput,
  type GeneratedContentDTO,
  type GenerateContentInput,
  type MarketingContentDTO,
  type MarketingContentType,
  type MarketingMetricsDTO,
  type RepurposeInput,
  type RepurposeResultDTO,
  type UpdateBrandProfileInput,
  type UpdateMarketingContentInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import {
  asString,
  asStringArray,
  buildBrandBlock,
  parseJsonObject,
} from './marketing.shared';

@Injectable()
export class MarketingService {
  constructor(private readonly models: ModelService) {}

  private toDTO(c: MarketingContent): MarketingContentDTO {
    return {
      id: c.id,
      type: c.type as MarketingContentType,
      title: c.title,
      brief: c.brief,
      body: c.body,
      metaDescription: c.metaDescription,
      keywords: c.keywords,
      seoScore: c.seoScore,
      channel: c.channel,
      status: c.status as MarketingContentDTO['status'],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  /** Shared JSON completion helper grounded on the org's brand voice. */
  private async completeJson(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<Record<string, unknown>> {
    try {
      const res = await this.models.complete({
        model: Models.smart(),
        temperature: 0.5,
        maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return parseJsonObject(res.content);
    } catch (err) {
      throw new BadGatewayException(
        `AI request failed: ${(err as Error).message}. Check your AI API key/model.`,
      );
    }
  }

  // ── Content library ──

  async list(ctx: RequestContext): Promise<MarketingContentDTO[]> {
    const rows = await prisma.marketingContent.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDTO(r));
  }

  async get(ctx: RequestContext, id: string): Promise<MarketingContentDTO> {
    const row = await prisma.marketingContent.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!row) throw new NotFoundException('Content not found');
    return this.toDTO(row);
  }

  async update(
    ctx: RequestContext,
    id: string,
    input: UpdateMarketingContentInput,
  ): Promise<MarketingContentDTO> {
    await this.get(ctx, id); // ensures it belongs to the org
    const row = await prisma.marketingContent.update({
      where: { id },
      data: {
        title: input.title,
        body: input.body,
        metaDescription: input.metaDescription,
        channel: input.channel,
        status: input.status,
        keywords: input.keywords,
      },
    });
    return this.toDTO(row);
  }

  async remove(ctx: RequestContext, id: string): Promise<void> {
    await this.get(ctx, id);
    await prisma.marketingContent.delete({ where: { id } });
  }

  async metrics(ctx: RequestContext): Promise<MarketingMetricsDTO> {
    const where = { organizationId: ctx.organizationId } as const;
    const [total, published, drafts, byType, recent] = await Promise.all([
      prisma.marketingContent.count({ where }),
      prisma.marketingContent.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.marketingContent.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.marketingContent.groupBy({
        by: ['type'],
        where,
        _count: { _all: true },
      }),
      prisma.marketingContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    return {
      total,
      published,
      drafts,
      byType: byType.map((g) => ({
        type: g.type as MarketingContentType,
        count: g._count._all,
      })),
      recent: recent.map((r) => this.toDTO(r)),
    };
  }

  // ── AI: generate ──

  async generate(
    ctx: RequestContext,
    input: GenerateContentInput,
  ): Promise<GeneratedContentDTO> {
    const brand = await buildBrandBlock(ctx.organizationId);
    const label = MARKETING_CONTENT_TYPE_LABELS[input.type];
    const user = [
      `Write ${label} content.`,
      `Brief: ${input.brief}`,
      input.tone ? `Tone: ${input.tone}` : '',
      input.channel ? `Channel: ${input.channel}` : '',
      input.keywords?.length
        ? `Target keywords (use naturally): ${input.keywords.join(', ')}`
        : '',
      brand,
      '',
      'Return STRICT JSON (no code fences) with this shape:',
      '{"title": string, "body": string, "metaDescription": string, "suggestedKeywords": string[]}',
      'The "body" is the full content in Markdown. "metaDescription" must be <=160 characters. Provide 5-10 suggestedKeywords.',
    ].join('\n');

    const obj = await this.completeJson(
      'You are an expert marketing copywriter and SEO strategist. You output only valid JSON when asked.',
      user,
      1800,
    );

    const result: GeneratedContentDTO = {
      id: null,
      title: asString(obj.title, input.brief.slice(0, 80)),
      body: asString(obj.body),
      metaDescription: asString(obj.metaDescription).slice(0, 320),
      suggestedKeywords: asStringArray(obj.suggestedKeywords, 12),
    };

    if (input.save) {
      const row = await prisma.marketingContent.create({
        data: {
          organizationId: ctx.organizationId,
          type: input.type,
          title: result.title,
          brief: input.brief,
          body: result.body,
          metaDescription: result.metaDescription || null,
          keywords: result.suggestedKeywords,
          channel: input.channel ?? null,
        },
      });
      result.id = row.id;
    }

    return result;
  }

  // ── AI: repurpose ──

  async repurpose(
    ctx: RequestContext,
    input: RepurposeInput,
  ): Promise<RepurposeResultDTO> {
    const brand = await buildBrandBlock(ctx.organizationId);
    const user = [
      'Repurpose the SOURCE content for each target channel, keeping the core',
      "message but adapting length, format, and tone to each channel's norms.",
      `Targets: ${input.targets.join(', ')}`,
      brand,
      '',
      'SOURCE:',
      input.sourceText,
      '',
      'Return STRICT JSON: {"variants": [{"channel": string, "text": string}]} with one entry per target channel.',
    ].join('\n');

    const obj = await this.completeJson(
      'You are a multi-channel marketing copywriter. You output only valid JSON when asked.',
      user,
      1600,
    );
    const variants = Array.isArray(obj.variants) ? obj.variants : [];
    return {
      variants: variants
        .map((v) => {
          const o = v as Record<string, unknown>;
          return { channel: asString(o.channel), text: asString(o.text) };
        })
        .filter((v) => v.channel && v.text)
        .slice(0, 8),
    };
  }

  // ── AI: content ideas ──

  async ideas(
    ctx: RequestContext,
    input: ContentIdeasInput,
  ): Promise<ContentIdeasDTO> {
    const brand = await buildBrandBlock(ctx.organizationId);
    const count = input.count ?? 6;
    const user = [
      `Generate ${count} marketing content ideas to achieve this goal: ${input.goal}.`,
      input.audience ? `Audience: ${input.audience}` : '',
      brand,
      '',
      `Each idea has: a compelling title, a content "type" (one of: ${MARKETING_CONTENT_TYPES.join(', ')}), a short "angle", and a "targetKeyword".`,
      'Return STRICT JSON: {"ideas": [{"title": string, "type": string, "angle": string, "targetKeyword": string}]}',
    ].join('\n');

    const obj = await this.completeJson(
      'You are a marketing strategist. You output only valid JSON when asked.',
      user,
      1200,
    );
    const ideas = Array.isArray(obj.ideas) ? obj.ideas : [];
    return {
      ideas: ideas
        .map((it) => {
          const o = it as Record<string, unknown>;
          const t = asString(o.type).toUpperCase();
          const type = (MARKETING_CONTENT_TYPES as readonly string[]).includes(t)
            ? (t as MarketingContentType)
            : 'BLOG_POST';
          return {
            title: asString(o.title),
            type,
            angle: asString(o.angle),
            targetKeyword: asString(o.targetKeyword),
          };
        })
        .filter((i) => i.title)
        .slice(0, 12),
    };
  }

  // ── Brand profile ──

  async getBrand(ctx: RequestContext): Promise<BrandProfileDTO> {
    const p = await prisma.marketingBrandProfile.findUnique({
      where: { organizationId: ctx.organizationId },
    });
    return {
      brandName: p?.brandName ?? null,
      description: p?.description ?? null,
      tone: p?.tone ?? null,
      audience: p?.audience ?? null,
      valueProps: p?.valueProps ?? null,
      keywords: p?.keywords ?? [],
      doNotMention: p?.doNotMention ?? null,
    };
  }

  async updateBrand(
    ctx: RequestContext,
    input: UpdateBrandProfileInput,
  ): Promise<BrandProfileDTO> {
    await prisma.marketingBrandProfile.upsert({
      where: { organizationId: ctx.organizationId },
      create: { organizationId: ctx.organizationId, ...input },
      update: { ...input },
    });
    return this.getBrand(ctx);
  }
}
