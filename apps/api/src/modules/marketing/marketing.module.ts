import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingSeoController } from './marketing-seo.controller';
import { MarketingService } from './marketing.service';
import { MarketingSeoService } from './marketing-seo.service';

/**
 * The AI Marketing & SEO agent: AI content generation, repurposing, content
 * ideas, SEO keyword research and analysis, a content library, and a brand
 * voice profile. ModelService is provided globally by AiModule.
 */
@Module({
  controllers: [MarketingController, MarketingSeoController],
  providers: [MarketingService, MarketingSeoService],
})
export class MarketingModule {}
