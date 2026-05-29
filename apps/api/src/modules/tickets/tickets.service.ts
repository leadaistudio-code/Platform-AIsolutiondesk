import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { forTenant, prisma, Prisma, Product, type Ticket } from '@aisolutiondesk/db';
import {
  createTriageAgent,
  runAgent,
  Models,
} from '@aisolutiondesk/ai';
import type {
  CreateTicketInput,
  ListTicketsQuery,
  TicketDTO,
  TicketDetailDTO,
  TicketStatsDTO,
  UpdateTicketInput,
} from '@aisolutiondesk/types';
import type { Paginated } from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import { EventBus } from '../../events/event-bus';

@Injectable()
export class TicketsService {
  constructor(
    private readonly models: ModelService,
    private readonly events: EventBus,
  ) {}

  /** Convert a Prisma Ticket row into the API response shape. */
  private toDTO(t: Ticket): TicketDTO {
    return {
      id: t.id,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      aiSummary: t.aiSummary,
      aiRootCause: t.aiRootCause,
      aiSuggestedActions: t.aiSuggestedActions,
      sentiment: t.sentiment,
      requesterEmail: t.requesterEmail,
      assigneeId: t.assigneeId,
      slaDueAt: t.slaDueAt?.toISOString() ?? null,
      slaBreached: t.slaBreached,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  async list(
    ctx: RequestContext,
    query: ListTicketsQuery,
  ): Promise<Paginated<TicketDTO>> {
    const db = forTenant(ctx.organizationId);
    const where: Prisma.TicketWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      db.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.ticket.count({ where }),
    ]);

    return {
      items: items.map((t) => this.toDTO(t)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async get(ctx: RequestContext, id: string): Promise<TicketDTO> {
    const db = forTenant(ctx.organizationId);
    const ticket = await db.ticket.findFirst({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.toDTO(ticket);
  }

  /** A ticket plus its timeline of events. */
  async getDetail(ctx: RequestContext, id: string): Promise<TicketDetailDTO> {
    const db = forTenant(ctx.organizationId);
    const ticket = await db.ticket.findFirst({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // The ticket was confirmed to belong to this tenant above, so its events
    // are safe to read directly (TicketEvent has no organizationId column).
    const events = await prisma.ticketEvent.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...this.toDTO(ticket),
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        actor: e.actor,
        payload: e.payload,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  /** Aggregated counts for the analytics dashboard. */
  async stats(ctx: RequestContext): Promise<TicketStatsDTO> {
    const where = { organizationId: ctx.organizationId } as const;

    const [total, slaBreached, triaged, byStatus, byPriority, byCategory] =
      await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, slaBreached: true } }),
        prisma.ticket.count({ where: { ...where, status: { not: 'NEW' } } }),
        prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
        prisma.ticket.groupBy({ by: ['priority'], where, _count: { _all: true } }),
        prisma.ticket.groupBy({
          by: ['category'],
          where: { ...where, category: { not: null } },
          _count: { _all: true },
        }),
      ]);

    return {
      total,
      triaged,
      slaBreached,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count._all })),
      byPriority: byPriority.map((g) => ({
        priority: g.priority,
        count: g._count._all,
      })),
      byCategory: byCategory
        .filter((g) => g.category)
        .map((g) => ({ category: g.category as string, count: g._count._all })),
    };
  }

  async create(
    ctx: RequestContext,
    input: CreateTicketInput,
  ): Promise<TicketDTO> {
    const db = forTenant(ctx.organizationId);
    const ticket = await db.ticket.create({
      data: {
        organizationId: ctx.organizationId,
        subject: input.subject,
        description: input.description,
        priority: input.priority ?? 'MEDIUM',
        requesterEmail: input.requesterEmail ?? null,
      },
    });

    await this.events.publish('ticket.created', ctx.organizationId, {
      ticketId: ticket.id,
    });
    return this.toDTO(ticket);
  }

  async update(
    ctx: RequestContext,
    id: string,
    input: UpdateTicketInput,
  ): Promise<TicketDTO> {
    const db = forTenant(ctx.organizationId);
    const existing = await db.ticket.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Ticket not found');

    const ticket = await db.ticket.update({
      where: { id },
      data: {
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId,
        category: input.category,
        resolvedAt:
          input.status === 'RESOLVED' || input.status === 'CLOSED'
            ? new Date()
            : undefined,
      },
    });

    // Record a timeline event when the status changes.
    if (input.status && input.status !== existing.status) {
      await db.ticketEvent.create({
        data: {
          ticketId: id,
          type: 'status_change',
          actor: ctx.userId ?? 'system',
          payload: { from: existing.status, to: input.status },
        } as Prisma.TicketEventUncheckedCreateInput,
      });
    }

    await this.events.publish('ticket.updated', ctx.organizationId, {
      ticketId: id,
    });
    return this.toDTO(ticket);
  }

  /**
   * Run the AI triage agent on a ticket: classify, prioritize, summarize, find
   * a likely root cause, suggest actions. Persists the result on the ticket,
   * logs an AgentRun + timeline event, and meters token usage.
   */
  async triage(ctx: RequestContext, id: string): Promise<TicketDTO> {
    const db = forTenant(ctx.organizationId);
    const ticket = await db.ticket.findFirst({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const agent = createTriageAgent((req) => this.models.complete(req));

    let outcome;
    try {
      outcome = await runAgent(
        agent,
        {
          subject: ticket.subject,
          description: ticket.description,
          model: Models.fast(),
        },
        { organizationId: ctx.organizationId },
      );
    } catch (err) {
      throw new BadGatewayException(
        `AI triage failed: ${(err as Error).message}. ` +
          'Check that a real OPENAI_API_KEY / ANTHROPIC_API_KEY is set in .env.',
      );
    }

    const analysis = outcome.state.analysis!;

    const updated = await db.ticket.update({
      where: { id },
      data: {
        status: ticket.status === 'NEW' ? 'TRIAGED' : ticket.status,
        category: analysis.category,
        priority: analysis.priority,
        aiSummary: analysis.summary,
        aiRootCause: analysis.rootCause,
        aiSuggestedActions: analysis.suggestedActions,
        sentiment: analysis.sentiment,
      },
    });

    // Telemetry: the agent run + a timeline event.
    await db.agentRun.create({
      data: {
        organizationId: ctx.organizationId,
        product: Product.SERVICE_DESK,
        agentKey: agent.key,
        status: 'SUCCEEDED',
        input: { ticketId: id },
        output: analysis as unknown as Prisma.InputJsonValue,
        steps: outcome.steps as unknown as Prisma.InputJsonValue,
        tokensInput: outcome.tokensInput,
        tokensOutput: outcome.tokensOutput,
        startedAt: new Date(),
        finishedAt: new Date(),
      } as Prisma.AgentRunUncheckedCreateInput,
    });

    await db.ticketEvent.create({
      data: {
        ticketId: id,
        type: 'ai_triage',
        actor: 'ai',
        payload: analysis as unknown as Prisma.InputJsonValue,
      } as Prisma.TicketEventUncheckedCreateInput,
    });

    // Meter token usage for billing / cost control.
    await db.usageRecord.createMany({
      data: [
        {
          organizationId: ctx.organizationId,
          product: Product.SERVICE_DESK,
          metric: 'tokens.input',
          model: Models.fast(),
          quantity: outcome.tokensInput,
          periodKey: new Date().toISOString().slice(0, 7),
        },
        {
          organizationId: ctx.organizationId,
          product: Product.SERVICE_DESK,
          metric: 'tokens.output',
          model: Models.fast(),
          quantity: outcome.tokensOutput,
          periodKey: new Date().toISOString().slice(0, 7),
        },
      ] as Prisma.UsageRecordUncheckedCreateInput[],
    });

    return this.toDTO(updated);
  }
}
