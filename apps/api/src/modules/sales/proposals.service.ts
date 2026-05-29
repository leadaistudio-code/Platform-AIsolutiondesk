import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { forTenant, Prisma, Product } from '@aisolutiondesk/db';
import { createProposalWriterAgent, runAgent, Models } from '@aisolutiondesk/ai';
import type {
  GenerateProposalInput,
  ProposalDTO,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';

@Injectable()
export class ProposalsService {
  constructor(private readonly models: ModelService) {}

  async list(ctx: RequestContext): Promise<ProposalDTO[]> {
    const db = forTenant(ctx.organizationId);
    const proposals = await db.proposal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { fullName: true } } },
    });
    return proposals.map((p) => ({
      id: p.id,
      leadId: p.leadId,
      leadName: p.lead?.fullName ?? null,
      title: p.title,
      content: p.content,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /** Generate an AI proposal for a lead and save it. */
  async generate(
    ctx: RequestContext,
    input: GenerateProposalInput,
  ): Promise<ProposalDTO> {
    const db = forTenant(ctx.organizationId);
    const lead = await db.lead.findFirst({ where: { id: input.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const agent = createProposalWriterAgent((req) => this.models.complete(req));
    let outcome;
    try {
      outcome = await runAgent(
        agent,
        {
          fullName: lead.fullName,
          company: lead.company,
          title: lead.title,
          notes: input.notes,
          model: Models.smart(),
        },
        { organizationId: ctx.organizationId },
      );
    } catch (err) {
      throw new BadGatewayException(
        `AI proposal failed: ${(err as Error).message}. Check your AI API key.`,
      );
    }

    const draft = outcome.state.draft!;
    const proposal = await db.proposal.create({
      data: {
        organizationId: ctx.organizationId,
        leadId: lead.id,
        title: draft.title,
        content: draft.content,
        status: 'DRAFT',
      } as Prisma.ProposalUncheckedCreateInput,
    });

    // Nudge the lead into the PROPOSAL stage.
    if (lead.status !== 'WON' && lead.status !== 'LOST') {
      await db.lead.update({ where: { id: lead.id }, data: { status: 'PROPOSAL' } });
    }

    await db.usageRecord
      .createMany({
        data: [
          {
            organizationId: ctx.organizationId,
            product: Product.SALES_AGENT,
            metric: 'tokens.input',
            model: Models.smart(),
            quantity: outcome.tokensInput,
            periodKey: new Date().toISOString().slice(0, 7),
          },
          {
            organizationId: ctx.organizationId,
            product: Product.SALES_AGENT,
            metric: 'tokens.output',
            model: Models.smart(),
            quantity: outcome.tokensOutput,
            periodKey: new Date().toISOString().slice(0, 7),
          },
        ] as Prisma.UsageRecordUncheckedCreateInput[],
      })
      .catch(() => undefined);

    return {
      id: proposal.id,
      leadId: proposal.leadId,
      leadName: lead.fullName,
      title: proposal.title,
      content: proposal.content,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
    };
  }
}
