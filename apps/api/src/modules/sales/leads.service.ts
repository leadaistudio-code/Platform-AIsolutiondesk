import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { forTenant, prisma, Prisma, Product, type Lead } from '@aisolutiondesk/db';
import {
  createLeadScorerAgent,
  createOutreachWriterAgent,
  runAgent,
  Models,
} from '@aisolutiondesk/ai';
import type {
  CreateLeadInput,
  GenerateOutreachInput,
  LeadDTO,
  LeadDetailDTO,
  OutreachDTO,
  OutreachListItemDTO,
  UpdateLeadInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import { EventBus } from '../../events/event-bus';

@Injectable()
export class LeadsService {
  constructor(
    private readonly models: ModelService,
    private readonly events: EventBus,
  ) {}

  private toDTO(l: Lead): LeadDTO {
    return {
      id: l.id,
      fullName: l.fullName,
      email: l.email,
      company: l.company,
      title: l.title,
      linkedinUrl: l.linkedinUrl,
      phone: l.phone,
      status: l.status,
      score: l.score,
      scoreReason: l.scoreReason,
      aiQualification: l.aiQualification,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    };
  }

  async list(ctx: RequestContext): Promise<LeadDTO[]> {
    const db = forTenant(ctx.organizationId);
    const leads = await db.lead.findMany({
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    });
    return leads.map((l) => this.toDTO(l));
  }

  async getDetail(ctx: RequestContext, id: string): Promise<LeadDetailDTO> {
    const db = forTenant(ctx.organizationId);
    const lead = await db.lead.findFirst({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const outreaches = await db.outreach.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...this.toDTO(lead),
      outreaches: outreaches.map((o) => ({
        id: o.id,
        channel: o.channel,
        status: o.status,
        subject: o.subject,
        body: o.body,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  /** All outreach messages across every lead, for the AI Outreach hub. */
  async listAllOutreach(ctx: RequestContext): Promise<OutreachListItemDTO[]> {
    const db = forTenant(ctx.organizationId);
    const items = await db.outreach.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { id: true, fullName: true, company: true } } },
      take: 200,
    });
    return items.map((o) => ({
      id: o.id,
      channel: o.channel,
      status: o.status,
      subject: o.subject,
      body: o.body,
      createdAt: o.createdAt.toISOString(),
      leadId: o.lead.id,
      leadName: o.lead.fullName,
      company: o.lead.company,
    }));
  }

  async create(ctx: RequestContext, input: CreateLeadInput): Promise<LeadDTO> {
    const db = forTenant(ctx.organizationId);
    const lead = await db.lead.create({
      data: {
        organizationId: ctx.organizationId,
        fullName: input.fullName,
        email: input.email || null,
        company: input.company || null,
        title: input.title || null,
        linkedinUrl: input.linkedinUrl || null,
        phone: input.phone || null,
      },
    });
    await this.events.publish('lead.created', ctx.organizationId, { leadId: lead.id });
    return this.toDTO(lead);
  }

  async updateStatus(
    ctx: RequestContext,
    id: string,
    input: UpdateLeadInput,
  ): Promise<LeadDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.lead.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Lead not found');
    const lead = await db.lead.update({
      where: { id },
      data: { status: input.status },
    });
    return this.toDTO(lead);
  }

  /** Run the AI lead-scoring agent and persist the score + reasoning. */
  async score(ctx: RequestContext, id: string): Promise<LeadDTO> {
    const db = forTenant(ctx.organizationId);
    const lead = await db.lead.findFirst({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const agent = createLeadScorerAgent((req) => this.models.complete(req));
    let outcome;
    try {
      outcome = await runAgent(
        agent,
        {
          fullName: lead.fullName,
          company: lead.company,
          title: lead.title,
          email: lead.email,
          model: Models.fast(),
        },
        { organizationId: ctx.organizationId },
      );
    } catch (err) {
      throw new BadGatewayException(
        `AI scoring failed: ${(err as Error).message}. Check your AI API key in .env.`,
      );
    }

    const s = outcome.state.score!;
    const updated = await db.lead.update({
      where: { id },
      data: {
        score: s.score,
        scoreReason: s.reason,
        aiQualification: { fit: s.fit, intent: s.intent } as Prisma.InputJsonValue,
        status: lead.status === 'NEW' && s.score >= 60 ? 'QUALIFIED' : lead.status,
      },
    });

    await this.recordUsage(ctx, agent.key, outcome.tokensInput, outcome.tokensOutput);
    await this.events.publish('lead.scored', ctx.organizationId, { leadId: id });
    return this.toDTO(updated);
  }

  /** Generate a personalized outreach message and save it as a draft. */
  async generateOutreach(
    ctx: RequestContext,
    id: string,
    input: GenerateOutreachInput,
  ): Promise<OutreachDTO> {
    const db = forTenant(ctx.organizationId);
    const lead = await db.lead.findFirst({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const agent = createOutreachWriterAgent((req) => this.models.complete(req));
    let outcome;
    try {
      outcome = await runAgent(
        agent,
        {
          fullName: lead.fullName,
          company: lead.company,
          title: lead.title,
          channel: input.channel,
          notes: input.notes,
          model: Models.smart(),
        },
        { organizationId: ctx.organizationId },
      );
    } catch (err) {
      throw new BadGatewayException(
        `AI outreach failed: ${(err as Error).message}. Check your AI API key in .env.`,
      );
    }

    const draft = outcome.state.draft!;
    const outreach = await db.outreach.create({
      data: {
        organizationId: ctx.organizationId,
        leadId: id,
        channel: input.channel,
        status: 'DRAFT',
        subject: draft.subject || null,
        body: draft.body,
        aiGenerated: true,
      },
    });

    await this.recordUsage(ctx, agent.key, outcome.tokensInput, outcome.tokensOutput);

    return {
      id: outreach.id,
      channel: outreach.channel,
      status: outreach.status,
      subject: outreach.subject,
      body: outreach.body,
      createdAt: outreach.createdAt.toISOString(),
    };
  }

  private async recordUsage(
    ctx: RequestContext,
    agentKey: string,
    input: number,
    output: number,
  ) {
    const db = forTenant(ctx.organizationId);
    await db.agentRun
      .create({
        data: {
          organizationId: ctx.organizationId,
          product: Product.SALES_AGENT,
          agentKey,
          status: 'SUCCEEDED',
          input: {},
          tokensInput: input,
          tokensOutput: output,
          startedAt: new Date(),
          finishedAt: new Date(),
        } as Prisma.AgentRunUncheckedCreateInput,
      })
      .catch(() => undefined);
  }
}
