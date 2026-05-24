import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { prisma, Role, MembershipStatus } from '@aisolutiondesk/db';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestContext } from '../context/request-context';
import type { RequestAuth } from './clerk-auth.guard';
import { ClerkService } from '../clerk/clerk.service';

/**
 * Tenant resolver. Takes the `auth` packet that ClerkAuthGuard attached and
 * turns it into our internal RequestContext: the real Organization id, the
 * real User id, and the member's role.
 *
 * For logged-in users we provision the org/user/membership just-in-time on
 * first request (so Clerk works locally without webhooks).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerk: ClerkService,
  ) {}

  private mapRole(clerkRole?: string): Role {
    // The org creator is "org:admin" in Clerk; give them full (OWNER) access.
    return clerkRole === 'org:admin' ? Role.OWNER : Role.MEMBER;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const auth = (req as any).auth as RequestAuth | undefined;
    if (!auth) throw new ForbiddenException('Not authenticated');

    let ctx: RequestContext;
    if (auth.kind === 'apikey') ctx = await this.fromApiKey(auth);
    else if (auth.kind === 'dev') ctx = await this.fromDev(auth);
    else ctx = await this.fromUser(auth);

    (req as any).context = ctx;
    return true;
  }

  /** Local-dev bypass: resolve to the OWNER of the configured demo org. */
  private async fromDev(
    auth: Extract<RequestAuth, { kind: 'dev' }>,
  ): Promise<RequestContext> {
    const org = await prisma.organization.findUnique({
      where: { slug: auth.orgSlug },
    });
    if (!org) {
      throw new ForbiddenException(
        `Dev org "${auth.orgSlug}" not found — run "pnpm db:seed".`,
      );
    }
    const owner = await prisma.membership.findFirst({
      where: { organizationId: org.id, role: Role.OWNER },
      include: { user: true },
    });
    return {
      userId: owner?.userId ?? null,
      clerkUserId: owner?.user.clerkUserId ?? null,
      organizationId: org.id,
      clerkOrgId: org.clerkOrgId,
      role: Role.OWNER,
      isApiKey: false,
      scopes: [],
    };
  }

  private async fromUser(
    auth: Extract<RequestAuth, { kind: 'user' }>,
  ): Promise<RequestContext> {
    // Provision the organization on first sight (fetch details from Clerk).
    let org = await prisma.organization.findUnique({
      where: { clerkOrgId: auth.clerkOrgId },
    });
    if (!org) {
      const clerkOrg = await this.clerk.client.organizations.getOrganization({
        organizationId: auth.clerkOrgId,
      });
      org = await prisma.organization.upsert({
        where: { clerkOrgId: auth.clerkOrgId },
        create: {
          clerkOrgId: auth.clerkOrgId,
          name: clerkOrg.name,
          slug: clerkOrg.slug ?? auth.clerkOrgId,
          logoUrl: clerkOrg.imageUrl ?? null,
        },
        update: {},
      });
    }

    // Provision the user on first sight.
    let user = await prisma.user.findUnique({
      where: { clerkUserId: auth.clerkUserId },
    });
    if (!user) {
      const clerkUser = await this.clerk.client.users.getUser(auth.clerkUserId);
      user = await prisma.user.upsert({
        where: { clerkUserId: auth.clerkUserId },
        create: {
          clerkUserId: auth.clerkUserId,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? `${auth.clerkUserId}@unknown`,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
          avatarUrl: clerkUser.imageUrl ?? null,
        },
        update: {},
      });
    }

    // Provision the membership on first sight (role from the JWT's org_role).
    const membership = await prisma.membership.upsert({
      where: {
        organizationId_userId: { organizationId: org.id, userId: user.id },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: this.mapRole(auth.clerkOrgRole),
        status: MembershipStatus.ACTIVE,
      },
      update: {},
    });
    if (membership.status !== 'ACTIVE') {
      throw new ForbiddenException('Your membership is not active');
    }

    return {
      userId: user.id,
      clerkUserId: user.clerkUserId,
      organizationId: org.id,
      clerkOrgId: org.clerkOrgId,
      role: membership.role,
      isApiKey: false,
      scopes: [],
    };
  }

  private async fromApiKey(
    auth: Extract<RequestAuth, { kind: 'apikey' }>,
  ): Promise<RequestContext> {
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
    });
    if (!org) throw new ForbiddenException('Organization not found');

    return {
      userId: null,
      clerkUserId: null,
      organizationId: org.id,
      clerkOrgId: org.clerkOrgId,
      // Role is unused for API keys; RbacGuard checks scopes instead.
      role: Role.AGENT,
      isApiKey: true,
      scopes: auth.scopes,
    };
  }
}
