import { Module } from '@nestjs/common';
import { SocialPostsController } from './social-posts.controller';
import { SocialPostsService } from './social-posts.service';

/** AI Social Media Auto-Post: AI generates → review → approve → mark posted. */
@Module({
  controllers: [SocialPostsController],
  providers: [SocialPostsService],
})
export class SocialModule {}
