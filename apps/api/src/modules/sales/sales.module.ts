import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { OutreachController } from './outreach.controller';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { SalesAnalyticsController } from './sales-analytics.controller';
import { SalesAnalyticsService } from './sales-analytics.service';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

/**
 * The AI Sales Automation Agent: leads, AI scoring, outreach, campaigns,
 * AI proposals, analytics, AI insights, and CRM connections.
 */
@Module({
  controllers: [
    LeadsController,
    CampaignsController,
    OutreachController,
    ProposalsController,
    SalesAnalyticsController,
    CrmController,
  ],
  providers: [
    LeadsService,
    CampaignsService,
    ProposalsService,
    SalesAnalyticsService,
    CrmService,
  ],
})
export class SalesModule {}
