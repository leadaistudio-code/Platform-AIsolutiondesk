import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ConnectLinkedInSchema,
  type ConnectLinkedInInput,
  type SocialProvider,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { SocialConnectionsService } from './social-connections.service';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social/connections')
export class SocialConnectionsController {
  constructor(private readonly conns: SocialConnectionsService) {}

  @Get()
  @RequirePermission('social:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.conns.list(ctx);
  }

  @Post('linkedin')
  @RequirePermission('integrations:manage')
  connectLinkedIn(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(ConnectLinkedInSchema)) body: ConnectLinkedInInput,
  ) {
    return this.conns.connectLinkedIn(ctx, body);
  }

  @Delete(':provider')
  @RequirePermission('integrations:manage')
  disconnect(
    @CurrentContext() ctx: RequestContext,
    @Param('provider') provider: SocialProvider,
  ) {
    return this.conns.disconnect(ctx, provider);
  }
}
