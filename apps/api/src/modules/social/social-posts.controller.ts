import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  GenerateSocialPostSchema,
  MarkSocialPostedSchema,
  ReviewSocialPostSchema,
  type GenerateSocialPostInput,
  type MarkSocialPostedInput,
  type ReviewSocialPostInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { SocialPostsService } from './social-posts.service';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social/posts')
export class SocialPostsController {
  constructor(private readonly posts: SocialPostsService) {}

  @Get()
  @RequirePermission('social:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.posts.list(ctx);
  }

  /** Generate AI posts for a topic (or a random one if no topic given). */
  @Post('generate')
  @RequirePermission('social:write')
  generate(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(GenerateSocialPostSchema)) body: GenerateSocialPostInput,
  ) {
    return this.posts.generate(ctx, body);
  }

  /** Approve or reject a pending post. */
  @Post(':id/review')
  @RequirePermission('social:approve')
  review(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewSocialPostSchema)) body: ReviewSocialPostInput,
  ) {
    return this.posts.review(ctx, id, body);
  }

  /** Publish on a platform (auto-posts via LinkedIn API if connected). */
  @Post(':id/posted')
  @RequirePermission('social:write')
  markPosted(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MarkSocialPostedSchema)) body: MarkSocialPostedInput,
  ) {
    return this.posts.markPosted(ctx, id, body);
  }

  /** Pull current likes / comments from LinkedIn for a posted post. */
  @Post(':id/metrics/refresh')
  @RequirePermission('social:read')
  refreshMetrics(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    return this.posts.refreshMetrics(ctx, id);
  }
}
