import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  KeywordResearchSchema,
  SeoAnalyzeSchema,
  type KeywordResearchInput,
  type SeoAnalyzeInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { MarketingSeoService } from './marketing-seo.service';

/** SEO tools for the Marketing agent: keyword research + content analysis. */
@ApiTags('marketing-seo')
@ApiBearerAuth()
@Controller('marketing/seo')
export class MarketingSeoController {
  constructor(private readonly seo: MarketingSeoService) {}

  @Post('keywords')
  @RequirePermission('marketing:read')
  keywords(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(KeywordResearchSchema)) body: KeywordResearchInput,
  ) {
    return this.seo.keywords(ctx, body);
  }

  @Post('analyze')
  @RequirePermission('marketing:read')
  analyze(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(SeoAnalyzeSchema)) body: SeoAnalyzeInput,
  ) {
    return this.seo.analyze(ctx, body);
  }
}
