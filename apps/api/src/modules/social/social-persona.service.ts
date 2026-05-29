import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Prisma } from '@aisolutiondesk/db';
import type {
  SocialPersona,
  UpdateSocialPersonaInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';

/**
 * Manages the AI brand voice / persona for the org. Stored as JSON inside
 * Organization.settings to avoid a dedicated table — one persona per org.
 */
@Injectable()
export class SocialPersonaService {
  async get(ctx: RequestContext): Promise<SocialPersona> {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { settings: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    const settings = (org.settings as { socialPersona?: SocialPersona }) ?? {};
    return settings.socialPersona ?? {};
  }

  async update(
    ctx: RequestContext,
    input: UpdateSocialPersonaInput,
  ): Promise<SocialPersona> {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { settings: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const current = (org.settings as Record<string, unknown>) ?? {};
    const persona: SocialPersona = {
      ...((current.socialPersona as SocialPersona) ?? {}),
      ...input,
    };
    const settings = { ...current, socialPersona: persona };

    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: { settings: settings as unknown as Prisma.InputJsonValue },
    });
    return persona;
  }
}
