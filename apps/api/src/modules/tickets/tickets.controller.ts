import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateTicketSchema,
  ListTicketsQuerySchema,
  UpdateTicketSchema,
  type CreateTicketInput,
  type ListTicketsQuery,
  type UpdateTicketInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { TicketsService } from './tickets.service';

/**
 * REST endpoints for the AI Service Desk's tickets. Every route is protected
 * by the global guards and declares the exact permission it needs.
 */
@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @RequirePermission('tickets:read')
  list(
    @CurrentContext() ctx: RequestContext,
    @Query(new ZodValidationPipe(ListTicketsQuerySchema)) query: ListTicketsQuery,
  ) {
    return this.tickets.list(ctx, query);
  }

  // Declared before ':id' so "/tickets/stats" isn't matched as an id.
  @Get('stats')
  @RequirePermission('tickets:read')
  stats(@CurrentContext() ctx: RequestContext) {
    return this.tickets.stats(ctx);
  }

  @Get(':id')
  @RequirePermission('tickets:read')
  get(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.tickets.getDetail(ctx, id);
  }

  @Post()
  @RequirePermission('tickets:write')
  create(
    @CurrentContext() ctx: RequestContext,
    @Body(new ZodValidationPipe(CreateTicketSchema)) body: CreateTicketInput,
  ) {
    return this.tickets.create(ctx, body);
  }

  @Patch(':id')
  @RequirePermission('tickets:write')
  update(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTicketSchema)) body: UpdateTicketInput,
  ) {
    return this.tickets.update(ctx, id, body);
  }

  /** Run the AI triage agent on this ticket. */
  @Post(':id/triage')
  @RequirePermission('tickets:write')
  triage(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.tickets.triage(ctx, id);
  }
}
