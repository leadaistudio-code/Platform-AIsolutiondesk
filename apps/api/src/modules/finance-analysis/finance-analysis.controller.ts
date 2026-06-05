import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { RequestContext } from '../../common/context/request-context';
import { FinanceAnalysisService } from './finance-analysis.service';

/**
 * The AI Finance Analysis agent: KPIs from the org's monthly snapshots, plus
 * AI-generated reports and forecasts.
 */
@ApiTags('finance-analysis')
@ApiBearerAuth()
@Controller('finance-analysis')
export class FinanceAnalysisController {
  constructor(private readonly finance: FinanceAnalysisService) {}

  @Get('metrics')
  @RequirePermission('finance:read')
  getMetrics(@CurrentContext() ctx: RequestContext) {
    return this.finance.metrics(ctx);
  }

  @Post('report')
  @RequirePermission('finance:read')
  generateReport(@CurrentContext() ctx: RequestContext) {
    return this.finance.report(ctx);
  }

  @Post('forecast')
  @RequirePermission('finance:read')
  generateForecast(@CurrentContext() ctx: RequestContext) {
    return this.finance.forecast(ctx);
  }
}
