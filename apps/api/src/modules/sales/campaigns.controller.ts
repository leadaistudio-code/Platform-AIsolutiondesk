import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @RequirePermission('campaigns:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.campaigns.list(ctx);
  }

  @Post()
  @RequirePermission('campaigns:write')
  create(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateCampaignSchema)) body: CreateCampaignInput,
  ) {
    return this.campaigns.create(ctx, body);
  }

  @Patch(':id')
  @RequirePermission('campaigns:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCampaignSchema)) body: UpdateCampaignInput,
  ) {
    return this.campaigns.updateStatus(ctx, id, body);
  }
}
