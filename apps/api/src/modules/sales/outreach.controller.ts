import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { RequestContext } from '../../common/context/request-context';
import { LeadsService } from './leads.service';

/** The AI Outreach hub — all generated messages across leads. */
@ApiTags('outreach')
@ApiBearerAuth()
@Controller('outreach')
export class OutreachController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermission('campaigns:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.leads.listAllOutreach(ctx);
  }
}
