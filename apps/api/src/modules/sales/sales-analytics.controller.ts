import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { RequestContext } from '../../common/context/request-context';
import { SalesAnalyticsService } from './sales-analytics.service';

@ApiTags('sales-analytics')
@ApiBearerAuth()
@Controller('sales')
export class SalesAnalyticsController {
  constructor(private readonly analytics: SalesAnalyticsService) {}

  @Get('analytics')
  @RequirePermission('leads:read')
  getAnalytics(@CurrentContext() ctx: RequestContext) {
    return this.analytics.analytics(ctx);
  }

  @Get('insights')
  @RequirePermission('leads:read')
  getInsights(@CurrentContext() ctx: RequestContext) {
    return this.analytics.insights(ctx);
  }
}
