import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../rbac/permissions';

/**
 * Declares the permission a route needs. The RbacGuard reads this and blocks
 * the request if the user's role (or API key's scopes) doesn't include it.
 *
 *   @RequirePermission('tickets:write')
 *   @Post()
 *   createTicket() { ... }
 */
export const PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
