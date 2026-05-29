import { Injectable, NotFoundException } from '@nestjs/common';
import { forTenant, type Campaign } from '@aisolutiondesk/db';
import type {
  CampaignDTO,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { EventBus } from '../../events/event-bus';

@Injectable()
export class CampaignsService {
  constructor(private readonly events: EventBus) {}

  private toDTO(c: Campaign & { _count?: { outreaches: number } }): CampaignDTO {
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      channels: c.channels,
      outreachCount: c._count?.outreaches ?? 0,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async list(ctx: RequestContext): Promise<CampaignDTO[]> {
    const db = forTenant(ctx.organizationId);
    const campaigns = await db.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { outreaches: true } } },
    });
    return campaigns.map((c) => this.toDTO(c));
  }

  async create(
    ctx: RequestContext,
    input: CreateCampaignInput,
  ): Promise<CampaignDTO> {
    const db = forTenant(ctx.organizationId);
    const campaign = await db.campaign.create({
      data: {
        organizationId: ctx.organizationId,
        name: input.name,
        channels: input.channels,
        audience: input.description ? { description: input.description } : {},
      },
    });
    return this.toDTO(campaign);
  }

  async updateStatus(
    ctx: RequestContext,
    id: string,
    input: UpdateCampaignInput,
  ): Promise<CampaignDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.campaign.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        status: input.status,
        startedAt:
          input.status === 'ACTIVE' && !existing.startedAt ? new Date() : undefined,
      },
      include: { _count: { select: { outreaches: true } } },
    });

    if (input.status === 'ACTIVE') {
      await this.events.publish('campaign.started', ctx.organizationId, {
        campaignId: id,
      });
    }
    return this.toDTO(campaign);
  }
}
