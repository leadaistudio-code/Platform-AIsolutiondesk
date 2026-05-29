import { BadGatewayException, Injectable } from '@nestjs/common';
import { prisma } from '@aisolutiondesk/db';
import {
  createPipelineInsightsAgent,
  runAgent,
  Models,
} from '@aisolutiondesk/ai';
import type {
  SalesAnalyticsDTO,
  SalesInsightsDTO,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';

@Injectable()
export class SalesAnalyticsService {
  constructor(private readonly models: ModelService) {}

  async analytics(ctx: RequestContext): Promise<SalesAnalyticsDTO> {
    const where = { organizationId: ctx.organizationId } as const;

    const [
      totalLeads,
      qualified,
      won,
      lost,
      outreachCount,
      proposalCount,
      agg,
      byStatus,
      low,
      mid,
      high,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { ...where, status: 'WON' } }),
      prisma.lead.count({ where: { ...where, status: 'LOST' } }),
      prisma.outreach.count({ where }),
      prisma.proposal.count({ where }),
      prisma.lead.aggregate({ where, _avg: { score: true } }),
      prisma.lead.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.lead.count({ where: { ...where, score: { gte: 1, lt: 40 } } }),
      prisma.lead.count({ where: { ...where, score: { gte: 40, lt: 70 } } }),
      prisma.lead.count({ where: { ...where, score: { gte: 70 } } }),
    ]);

    return {
      totalLeads,
      qualified,
      won,
      lost,
      outreachCount,
      proposalCount,
      avgScore: Math.round(agg._avg.score ?? 0),
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count._all })),
      scoreBuckets: [
        { label: 'Low (1-39)', count: low },
        { label: 'Medium (40-69)', count: mid },
        { label: 'High (70+)', count: high },
      ],
    };
  }

  /** Build a pipeline snapshot and have the AI surface insights. */
  async insights(ctx: RequestContext): Promise<SalesInsightsDTO> {
    const where = { organizationId: ctx.organizationId } as const;

    const [byStatus, topLeads, outreachCount, proposalCount, total] =
      await Promise.all([
        prisma.lead.groupBy({ by: ['status'], where, _count: { _all: true } }),
        prisma.lead.findMany({
          where,
          orderBy: { score: 'desc' },
          take: 15,
          select: { fullName: true, company: true, title: true, status: true, score: true },
        }),
        prisma.outreach.count({ where }),
        prisma.proposal.count({ where }),
        prisma.lead.count({ where }),
      ]);

    if (total === 0) {
      return {
        summary: 'No leads yet — add leads to get AI insights on your pipeline.',
        insights: [],
      };
    }

    const snapshot = [
      `Total leads: ${total}`,
      `By status: ${byStatus.map((s) => `${s.status}=${s._count._all}`).join(', ')}`,
      `Outreach sent: ${outreachCount}, Proposals: ${proposalCount}`,
      'Top leads by score:',
      ...topLeads.map(
        (l) =>
          `- ${l.fullName} (${l.title ?? '?'} @ ${l.company ?? '?'}): score ${l.score}, ${l.status}`,
      ),
    ].join('\n');

    const agent = createPipelineInsightsAgent((req) => this.models.complete(req));
    try {
      const outcome = await runAgent(
        agent,
        { snapshot, model: Models.smart() },
        { organizationId: ctx.organizationId },
      );
      return outcome.state.result!;
    } catch (err) {
      throw new BadGatewayException(
        `AI insights failed: ${(err as Error).message}. Check your AI API key.`,
      );
    }
  }
}
