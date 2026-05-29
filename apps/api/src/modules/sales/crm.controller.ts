import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ConnectCrmSchema,
  type ConnectCrmInput,
  type CrmProvider,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { CrmService } from './crm.service';

@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get()
  @RequirePermission('integrations:manage')
  list(@CurrentContext() ctx: RequestContext) {
    return this.crm.list(ctx);
  }

  @Post('connect')
  @RequirePermission('integrations:manage')
  connect(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(ConnectCrmSchema)) body: ConnectCrmInput,
  ) {
    return this.crm.connect(ctx, body);
  }

  @Delete(':provider')
  @RequirePermission('integrations:manage')
  disconnect(
    @CurrentContext() ctx: RequestContext,
    @Param('provider') provider: CrmProvider,
  ) {
    return this.crm.disconnect(ctx, provider);
  }
}
