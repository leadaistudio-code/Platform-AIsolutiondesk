import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ContentIdeasSchema,
  GenerateContentSchema,
  RepurposeSchema,
  UpdateBrandProfileSchema,
  UpdateMarketingContentSchema,
  type ContentIdeasInput,
  type GenerateContentInput,
  type RepurposeInput,
  type UpdateBrandProfileInput,
  type UpdateMarketingContentInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { MarketingService } from './marketing.service';

/**
 * AI Marketing & SEO agent: content library, AI generation, repurposing,
 * content ideas, metrics, and the brand-voice profile.
 */
@ApiTags('marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Get('metrics')
  @RequirePermission('marketing:read')
  metrics(@CurrentContext() ctx: RequestContext) {
    return this.marketing.metrics(ctx);
  }

  // ── Content library ──
  @Get('content')
  @RequirePermission('marketing:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.marketing.list(ctx);
  }

  @Get('content/:id')
  @RequirePermission('marketing:read')
  get(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.marketing.get(ctx, id);
  }

  @Patch('content/:id')
  @RequirePermission('marketing:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMarketingContentSchema))
    body: UpdateMarketingContentInput,
  ) {
    return this.marketing.update(ctx, id, body);
  }

  @Delete('content/:id')
  @RequirePermission('marketing:write')
  remove(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.marketing.remove(ctx, id);
  }

  // ── AI actions ──
  @Post('generate')
  @RequirePermission('marketing:write')
  generate(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(GenerateContentSchema)) body: GenerateContentInput,
  ) {
    return this.marketing.generate(ctx, body);
  }

  @Post('repurpose')
  @RequirePermission('marketing:write')
  repurpose(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(RepurposeSchema)) body: RepurposeInput,
  ) {
    return this.marketing.repurpose(ctx, body);
  }

  @Post('ideas')
  @RequirePermission('marketing:read')
  ideas(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(ContentIdeasSchema)) body: ContentIdeasInput,
  ) {
    return this.marketing.ideas(ctx, body);
  }

  // ── Brand profile ──
  @Get('brand')
  @RequirePermission('marketing:read')
  getBrand(@CurrentContext() ctx: RequestContext) {
    return this.marketing.getBrand(ctx);
  }

  @Put('brand')
  @RequirePermission('marketing:write')
  updateBrand(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(UpdateBrandProfileSchema))
    body: UpdateBrandProfileInput,
  ) {
    return this.marketing.updateBrand(ctx, body);
  }
}
