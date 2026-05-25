import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  GenerateProposalSchema,
  type GenerateProposalInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { ProposalsService } from './proposals.service';

@ApiTags('proposals')
@ApiBearerAuth()
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Get()
  @RequirePermission('leads:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.proposals.list(ctx);
  }

  @Post('generate')
  @RequirePermission('proposals:write')
  generate(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(GenerateProposalSchema)) body: GenerateProposalInput,
  ) {
    return this.proposals.generate(ctx, body);
  }
}
