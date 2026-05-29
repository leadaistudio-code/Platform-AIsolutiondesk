import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  AssistantQuerySchema,
  type AssistantQueryInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { AssistantService } from './assistant.service';

@ApiTags('assistant')
@ApiBearerAuth()
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  /** Ask the assistant a question; it answers from your documents with citations. */
  @Post('chat')
  @RequirePermission('chat:use')
  ask(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(AssistantQuerySchema)) body: AssistantQueryInput,
  ) {
    return this.assistant.ask(ctx, body);
  }
}
