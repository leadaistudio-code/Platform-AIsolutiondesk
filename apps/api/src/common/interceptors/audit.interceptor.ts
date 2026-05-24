import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { prisma } from '@aisolutiondesk/db';
import type { RequestContext } from '../context/request-context';

/**
 * The security camera. After any state-changing request (POST/PATCH/PUT/DELETE)
 * succeeds, it writes an immutable AuditLog row: who, what action, on which
 * resource, from which IP. Read requests (GET) are not recorded.
 *
 * Logging never blocks or breaks the actual request — if writing the log
 * fails, we swallow the error.
 */
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap(() => {
        if (!MUTATING.has(req.method)) return;
        const ctx = (req as any).context as RequestContext | undefined;
        if (!ctx) return;

        // Derive a coarse action label from method + path, e.g. "POST /tickets".
        const action = `${req.method} ${req.route?.path ?? req.path}`;
        const resourceId =
          (req.params?.id as string | undefined) ?? undefined;

        void prisma.auditLog
          .create({
            data: {
              organizationId: ctx.organizationId,
              userId: ctx.userId,
              action,
              resource: this.resourceFromPath(req.path),
              resourceId,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] ?? null,
            },
          })
          .catch(() => undefined);
      }),
    );
  }

  private resourceFromPath(path: string): string {
    // "/api/tickets/123" -> "tickets"
    const parts = path.split('/').filter(Boolean);
    return parts[1] ?? parts[0] ?? 'unknown';
  }
}
