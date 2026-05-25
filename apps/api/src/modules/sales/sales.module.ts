import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { OutreachController } from './outreach.controller';

/** The AI Sales Automation Agent: leads, AI scoring, outreach, campaigns. */
@Module({
  controllers: [LeadsController, CampaignsController, OutreachController],
  providers: [LeadsService, CampaignsService],
})
export class SalesModule {}
