import { Injectable, Logger } from '@nestjs/common';
import { prisma, Role, MembershipStatus } from '@aisolutiondesk/db';

/**
 * Keeps our database in sync with Clerk. Clerk owns logins, organizations, and
 * memberships; we mirror just enough (ids, names, roles) to attach our own data
 * and enforce permissions. Every handler is "upsert" (create-or-update) and
 * idempotent, so receiving the same event twice is harmless.
 */
@Injectable()
export class ClerkSyncService {
  private readonly logger = new Logger('ClerkSync');

  /** Translate a Clerk org role string into our Role enum. */
  private mapRole(clerkRole?: string): Role {
    switch (clerkRole) {
      case 'org:admin':
        return Role.ADMIN;
      default:
        return Role.MEMBER;
    }
  }

  async upsertUser(data: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    await prisma.user.upsert({
      where: { clerkUserId: data.id },
      create: {
        clerkUserId: data.id,
        email: data.email,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
      update: {
        email: data.email,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
    });
    this.logger.log(`Synced user ${data.id}`);
  }

  async upsertOrganization(data: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  }) {
    await prisma.organization.upsert({
      where: { clerkOrgId: data.id },
      create: {
        clerkOrgId: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl ?? null,
      },
      update: { name: data.name, slug: data.slug, logoUrl: data.logoUrl ?? null },
    });
    this.logger.log(`Synced organization ${data.id}`);
  }

  async upsertMembership(data: {
    clerkOrgId: string;
    clerkUserId: string;
    role?: string;
  }) {
    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: data.clerkOrgId },
    });
    const user = await prisma.user.findUnique({
      where: { clerkUserId: data.clerkUserId },
    });
    if (!org || !user) {
      // The user/org event may arrive slightly after; safe to skip — Clerk retries.
      this.logger.warn('Membership event before user/org synced; skipping');
      return;
    }

    await prisma.membership.upsert({
      where: {
        organizationId_userId: { organizationId: org.id, userId: user.id },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: this.mapRole(data.role),
        status: MembershipStatus.ACTIVE,
      },
      update: { role: this.mapRole(data.role), status: MembershipStatus.ACTIVE },
    });
    this.logger.log(`Synced membership ${data.clerkUserId}@${data.clerkOrgId}`);
  }

  async removeMembership(data: { clerkOrgId: string; clerkUserId: string }) {
    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: data.clerkOrgId },
    });
    const user = await prisma.user.findUnique({
      where: { clerkUserId: data.clerkUserId },
    });
    if (!org || !user) return;

    await prisma.membership
      .delete({
        where: {
          organizationId_userId: { organizationId: org.id, userId: user.id },
        },
      })
      .catch(() => undefined);
    this.logger.log(`Removed membership ${data.clerkUserId}@${data.clerkOrgId}`);
  }
}
