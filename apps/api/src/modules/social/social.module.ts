import { Module } from '@nestjs/common';
import { SocialPostsController } from './social-posts.controller';
import { SocialPostsService } from './social-posts.service';
import { SocialConnectionsController } from './social-connections.controller';
import { SocialConnectionsService } from './social-connections.service';
import { SocialPersonaController } from './social-persona.controller';
import { SocialPersonaService } from './social-persona.service';
import { LinkedInClient } from './linkedin.client';

/**
 * AI Social Media Auto-Post: generate (with brand persona) → review →
 * approve → publish (real LinkedIn API + metrics) → monitor.
 */
@Module({
  controllers: [
    SocialPostsController,
    SocialConnectionsController,
    SocialPersonaController,
  ],
  providers: [
    SocialPostsService,
    SocialConnectionsService,
    SocialPersonaService,
    LinkedInClient,
  ],
})
export class SocialModule {}
