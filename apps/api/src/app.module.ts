import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ClerkService } from './common/clerk/clerk.service';
import { HealthModule } from './modules/health/health.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { SalesModule } from './modules/sales/sales.module';
import { AiModule } from './ai/ai.module';
import { EventsModule } from './events/events.module';

/**
 * The root module — NestJS's master list of everything in the app.
 *
 * The three guards are registered globally (APP_GUARD) and run on EVERY
 * request, in this order:
 *   1. ClerkAuthGuard — "Who are you?" (verifies the login token)
 *   2. TenantGuard    — "Which company are you acting for?" (sets org context)
 *   3. RbacGuard      — "Are you allowed to do this?" (checks permissions)
 *
 * The AuditInterceptor records privileged actions to the audit log.
 * Routes can opt out of auth with the @Public() decorator.
 */
@Module({
  imports: [
    EventsModule,
    AiModule,
    HealthModule,
    WebhooksModule,
    TicketsModule,
    AssistantModule,
    SalesModule,
  ],
  providers: [
    ClerkService,
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
