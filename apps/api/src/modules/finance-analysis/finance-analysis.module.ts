import { Module } from '@nestjs/common';
import { FinanceAnalysisController } from './finance-analysis.controller';
import { FinanceAnalysisService } from './finance-analysis.service';

/**
 * The AI Finance Analysis agent: reporting & forecasting over the org's
 * monthly financial snapshots. ModelService is provided globally by AiModule.
 */
@Module({
  controllers: [FinanceAnalysisController],
  providers: [FinanceAnalysisService],
})
export class FinanceAnalysisModule {}
