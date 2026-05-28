import { Module } from '@nestjs/common';
import { SocialPostsController } from './social-posts.controller';
import { SocialPostsService } from './social-posts.service';
import { SocialConnectionsController } from './social-connections.controller';
import { SocialConnectionsService } from './social-connections.service';
import { LinkedInClient } from './linkedin.client';

/**
 * AI Social Media Auto-Post: generate → review → approve → publish
 * (real LinkedIn API posting + metrics) → monitor.
 */
@Module({
  controllers: [SocialPostsController, SocialConnectionsController],
  providers: [SocialPostsService, SocialConnectionsService, LinkedInClient],
})
export class SocialModule {}
