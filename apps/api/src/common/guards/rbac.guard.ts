import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { roleHasPermission, type Permission } from '../rbac/permissions';
import type { RequestContext } from '../context/request-context';

/**
 * Permission check. If a route is tagged with @RequirePermission('x:y'),
 * this confirms the caller is allowed:
 *   - logged-in users: their role must include the permission
 *   - API keys: their scopes must include the permission
 * Routes with no @RequirePermission are allowed for any authenticated caller.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true; // no permission required

    const req = context.switchToHttp().getRequest<Request>();
    const ctx = (req as any).context as RequestContext | undefined;
    if (!ctx) throw new ForbiddenException('No tenant context');

    const allowed = ctx.isApiKey
      ? ctx.scopes.includes(required)
      : roleHasPermission(ctx.role, required);

    if (!allowed) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
