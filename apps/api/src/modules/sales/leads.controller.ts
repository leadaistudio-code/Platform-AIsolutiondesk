import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateLeadSchema,
  GenerateOutreachSchema,
  UpdateLeadSchema,
  type CreateLeadInput,
  type GenerateOutreachInput,
  type UpdateLeadInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermission('leads:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.leads.list(ctx);
  }

  @Get(':id')
  @RequirePermission('leads:read')
  get(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.leads.getDetail(ctx, id);
  }

  @Post()
  @RequirePermission('leads:write')
  create(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateLeadSchema)) body: CreateLeadInput,
  ) {
    return this.leads.create(ctx, body);
  }

  @Patch(':id')
  @RequirePermission('leads:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateLeadSchema)) body: UpdateLeadInput,
  ) {
    return this.leads.updateStatus(ctx, id, body);
  }

  /** Run AI lead scoring. */
  @Post(':id/score')
  @RequirePermission('leads:write')
  score(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.leads.score(ctx, id);
  }

  /** Generate an AI outreach draft for this lead. */
  @Post(':id/outreach')
  @RequirePermission('campaigns:write')
  outreach(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(GenerateOutreachSchema)) body: GenerateOutreachInput,
  ) {
    return this.leads.generateOutreach(ctx, id, body);
  }
}
