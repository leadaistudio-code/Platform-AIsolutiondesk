import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { env } from '@aisolutiondesk/config';
import { prisma } from '@aisolutiondesk/db';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Identity check. Looks at the `Authorization: Bearer ...` header and figures
 * out who is calling, in one of two ways:
 *
 *  1. A Clerk login token (from a logged-in user in the browser) — verified
 *     cryptographically with Clerk, giving us the user + active organization.
 *  2. An API key (starts with "ask_") — hashed and looked up in our database,
 *     giving us the organization + permission scopes for machine-to-machine use.
 *
 * On success it attaches a small `auth` object to the request; TenantGuard
 * turns that into the full RequestContext. On failure it throws 401.
 */
export type RequestAuth =
  | {
      kind: 'user';
      clerkUserId: string;
      clerkOrgId: string;
      clerkOrgRole: string;
    }
  | {
      kind: 'apikey';
      apiKeyId: string;
      organizationId: string;
      scopes: string[];
    }
  | {
      kind: 'dev';
      orgSlug: string;
    };

/** Dev bypass is only ever active outside production AND when opted in. */
const devBypassEnabled =
  env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS && !!env.DEV_ORG_SLUG;

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip routes explicitly marked @Public().
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(req);

    // Local dev: no token + bypass enabled => act as the demo org owner.
    if (!token && devBypassEnabled) {
      // devBypassEnabled guarantees DEV_ORG_SLUG is set.
      (req as any).auth = {
        kind: 'dev',
        orgSlug: env.DEV_ORG_SLUG as string,
      } satisfies RequestAuth;
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const auth = token.startsWith('ask_')
      ? await this.verifyApiKey(token)
      : await this.verifyClerkToken(token);

    (req as any).auth = auth;
    return true;
  }

  private extractBearer(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length).trim();
  }

  private async verifyClerkToken(token: string): Promise<RequestAuth> {
    try {
      const claims = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      if (!claims.org_id) {
        throw new UnauthorizedException(
          'No active organization selected for this session',
        );
      }
      return {
        kind: 'user',
        clerkUserId: claims.sub,
        clerkOrgId: claims.org_id as string,
        clerkOrgRole: (claims.org_role as string) ?? 'org:member',
      };
    } catch (err) {
      // Surface Clerk's actual reason (e.g. token-invalid-signature => key
      // mismatch; token-expired => clock skew) to make debugging possible.
      const reason =
        (err as { reason?: string })?.reason ??
        (err as Error)?.message ??
        'unknown';
      throw new UnauthorizedException(`Invalid session token: ${reason}`);
    }
  }

  private async verifyApiKey(token: string): Promise<RequestAuth> {
    const hashedKey = createHash('sha256').update(token).digest('hex');
    const key = await prisma.apiKey.findUnique({ where: { hashedKey } });

    if (!key || key.revokedAt) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new UnauthorizedException('Expired API key');
    }

    // Best-effort "last used" tracking (don't block the request on it).
    void prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);

    return {
      kind: 'apikey',
      apiKeyId: key.id,
      organizationId: key.organizationId,
      scopes: key.scopes,
    };
  }
}
