import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public — the auth/tenant/RBAC guards will skip it.
 * Use sparingly: health checks, webhooks, sign-up callbacks.
 *
 *   @Public()
 *   @Get('health')
 *   health() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
