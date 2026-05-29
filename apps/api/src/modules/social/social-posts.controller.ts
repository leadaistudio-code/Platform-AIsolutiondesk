import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AttachImageSchema,
  GenerateSocialPostSchema,
  MarkSocialPostedSchema,
  ReviewSocialPostSchema,
  ScheduleSocialPostSchema,
  UpdateSocialPostSchema,
  type AttachImageInput,
  type GenerateSocialPostInput,
  type MarkSocialPostedInput,
  type ReviewSocialPostInput,
  type ScheduleSocialPostInput,
  type UpdateSocialPostInput,
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

  /** Edit the AI-generated drafts (text/topic) before approval. */
  @Patch(':id')
  @RequirePermission('social:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSocialPostSchema)) body: UpdateSocialPostInput,
  ) {
    return this.posts.update(ctx, id, body);
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

  /** Schedule a future publish — the worker fires at scheduledAt. */
  @Post(':id/schedule')
  @RequirePermission('social:approve')
  schedule(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ScheduleSocialPostSchema)) body: ScheduleSocialPostInput,
  ) {
    return this.posts.schedule(ctx, id, body);
  }

  @Post(':id/cancel-schedule')
  @RequirePermission('social:approve')
  cancelSchedule(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.posts.cancelSchedule(ctx, id);
  }

  /** Attach (or replace) an image, sent as base64 to keep things simple. */
  @Post(':id/image')
  @RequirePermission('social:write')
  attachImage(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AttachImageSchema)) body: AttachImageInput,
  ) {
    const bytes = Buffer.from(body.base64, 'base64');
    return this.posts.attachImage(ctx, id, bytes, body.mimeType);
  }

  @Delete(':id/image')
  @RequirePermission('social:write')
  removeImage(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.posts.removeImage(ctx, id);
  }

  /** Serve the attached image bytes so the UI can preview it. */
  @Get(':id/image')
  @RequirePermission('social:read')
  async getImage(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const img = await this.posts.getImageBytes(ctx, id);
    if (!img) throw new NotFoundException('No image attached');
    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(img.bytes);
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
