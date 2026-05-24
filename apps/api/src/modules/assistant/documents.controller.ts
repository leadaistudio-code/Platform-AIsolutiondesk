import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateDocumentSchema,
  type CreateDocumentInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission('documents:read')
  list(@CurrentContext() ctx: RequestContext) {
    return this.documents.list(ctx);
  }

  @Post()
  @RequirePermission('documents:write')
  create(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateDocumentSchema)) body: CreateDocumentInput,
  ) {
    return this.documents.create(ctx, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('documents:write')
  remove(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.documents.remove(ctx, id);
  }
}
