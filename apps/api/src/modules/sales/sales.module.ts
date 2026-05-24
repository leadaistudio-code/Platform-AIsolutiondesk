import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

/** The AI Sales Automation Agent: leads, AI scoring, and AI outreach. */
@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class SalesModule {}
