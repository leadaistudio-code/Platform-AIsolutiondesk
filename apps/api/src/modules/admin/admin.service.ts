import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Product } from '@aisolutiondesk/db';
import type {
  AdminOrgDTO,
  ProductKey,
  UpdateOrgProductsInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';

/**
 * Platform-admin-only operations. Every method asserts ctx.isPlatformAdmin —
 * a regular org owner CANNOT toggle their own products (only you can).
 */
@Injectable()
export class AdminService {
  private assertAdmin(ctx: RequestContext): void {
    if (!ctx.isPlatformAdmin) {
      throw new ForbiddenException('Platform admin access required.');
    }
  }

  async listOrgs(ctx: RequestContext): Promise<AdminOrgDTO[]> {
    this.assertAdmin(ctx);
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { memberships: true } } },
    });
    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      clerkOrgId: o.clerkOrgId,
      products: o.products as ProductKey[],
      memberCount: o._count.memberships,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async getOrg(ctx: RequestContext, id: string): Promise<AdminOrgDTO> {
    this.assertAdmin(ctx);
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { _count: { select: { memberships: true } } },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      clerkOrgId: org.clerkOrgId,
      products: org.products as ProductKey[],
      memberCount: org._count.memberships,
      createdAt: org.createdAt.toISOString(),
    };
  }

  async updateProducts(
    ctx: RequestContext,
    id: string,
    input: UpdateOrgProductsInput,
  ): Promise<AdminOrgDTO> {
    this.assertAdmin(ctx);
    const exists = await prisma.organization.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Organization not found');
    await prisma.organization.update({
      where: { id },
      data: { products: input.products as Product[] },
    });
    return this.getOrg(ctx, id);
  }
}
