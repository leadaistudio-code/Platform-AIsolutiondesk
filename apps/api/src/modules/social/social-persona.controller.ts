import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  UpdateSocialPersonaSchema,
  type UpdateSocialPersonaInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { SocialPersonaService } from './social-persona.service';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social/persona')
export class SocialPersonaController {
  constructor(private readonly persona: SocialPersonaService) {}

  @Get()
  @RequirePermission('social:read')
  get(@CurrentContext() ctx: RequestContext) {
    return this.persona.get(ctx);
  }

  @Put()
  @RequirePermission('social:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(UpdateSocialPersonaSchema)) body: UpdateSocialPersonaInput,
  ) {
    return this.persona.update(ctx, body);
  }
}
