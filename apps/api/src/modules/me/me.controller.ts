import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { prisma } from '@aisolutiondesk/db';
import type { MeDTO, ProductKey } from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import type { RequestContext } from '../../common/context/request-context';

/**
 * Returns the current authenticated user, their active org, and which products
 * the org is entitled to use. The web app's layout calls this on every page
 * load to drive the sidebar (hides products the org hasn't bought).
 */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  @Get()
  async me(@CurrentContext() ctx: RequestContext): Promise<MeDTO> {
    const [org, user] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { id: true, name: true, slug: true, products: true },
      }),
      ctx.userId
        ? prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true, email: true, name: true },
          })
        : null,
    ]);
    if (!org) throw new NotFoundException('Organization not found');

    return {
      isPlatformAdmin: ctx.isPlatformAdmin,
      user: {
        id: user?.id ?? null,
        email: user?.email ?? null,
        name: user?.name ?? null,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: ctx.role,
        products: org.products as ProductKey[],
      },
    };
  }
}
