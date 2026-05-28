import { Injectable } from '@nestjs/common';
import { prisma, IntegrationProvider } from '@aisolutiondesk/db';
import { encryptJson } from '@aisolutiondesk/config';
import type {
  ConnectLinkedInInput,
  SocialConnectionDTO,
  SocialProvider,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';

@Injectable()
export class SocialConnectionsService {
  /** Connection status for each supported platform. */
  async list(ctx: RequestContext): Promise<SocialConnectionDTO[]> {
    const linkedin = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId: ctx.organizationId,
          provider: IntegrationProvider.LINKEDIN,
        },
      },
    });

    return [
      {
        provider: 'LINKEDIN',
        status: linkedin ? 'CONNECTED' : 'DISCONNECTED',
        displayName: linkedin?.displayName ?? null,
        connectedAt: linkedin ? linkedin.updatedAt.toISOString() : null,
      },
      {
        // X auto-posting requires a paid X API tier — UI surfaces this state.
        provider: 'X',
        status: 'DISCONNECTED',
        displayName: null,
        connectedAt: null,
      },
    ];
  }

  /** Store the user's LinkedIn access token + person URN, encrypted. */
  async connectLinkedIn(
    ctx: RequestContext,
    input: ConnectLinkedInInput,
  ): Promise<SocialConnectionDTO> {
    const credentials = encryptJson({
      accessToken: input.accessToken,
      personUrn: input.personUrn,
    });

    const integ = await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId: ctx.organizationId,
          provider: IntegrationProvider.LINKEDIN,
        },
      },
      create: {
        organizationId: ctx.organizationId,
        provider: IntegrationProvider.LINKEDIN,
        status: 'CONNECTED',
        credentials,
        displayName: input.personUrn,
      },
      update: {
        status: 'CONNECTED',
        credentials,
        displayName: input.personUrn,
      },
    });

    return {
      provider: 'LINKEDIN',
      status: 'CONNECTED',
      displayName: integ.displayName,
      connectedAt: integ.updatedAt.toISOString(),
    };
  }

  async disconnect(ctx: RequestContext, provider: SocialProvider): Promise<void> {
    if (provider !== 'LINKEDIN') return; // X not yet connectable
    await prisma.integration
      .delete({
        where: {
          organizationId_provider: {
            organizationId: ctx.organizationId,
            provider: IntegrationProvider.LINKEDIN,
          },
        },
      })
      .catch(() => undefined);
  }
}
