import { Injectable } from '@nestjs/common';
import { prisma, IntegrationProvider } from '@aisolutiondesk/db';
import { encryptJson } from '@aisolutiondesk/config';
import type {
  ConnectCrmInput,
  CrmConnectionDTO,
  CrmProvider,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';

const CRM_PROVIDERS: CrmProvider[] = ['SALESFORCE', 'HUBSPOT'];

@Injectable()
export class CrmService {
  /** Connection status for each supported CRM (connected or not). */
  async list(ctx: RequestContext): Promise<CrmConnectionDTO[]> {
    const integrations = await prisma.integration.findMany({
      where: {
        organizationId: ctx.organizationId,
        provider: { in: CRM_PROVIDERS as IntegrationProvider[] },
      },
    });
    const byProvider = new Map(integrations.map((i) => [i.provider, i]));
    return CRM_PROVIDERS.map((provider) => {
      const i = byProvider.get(provider);
      return {
        provider,
        status: (i?.status as CrmConnectionDTO['status']) ?? 'DISCONNECTED',
        connectedAt: i ? i.updatedAt.toISOString() : null,
      };
    });
  }

  /** Store an encrypted CRM credential and mark it connected. */
  async connect(
    ctx: RequestContext,
    input: ConnectCrmInput,
  ): Promise<CrmConnectionDTO> {
    const credentials = encryptJson({ apiKey: input.apiKey });
    const integration = await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId: ctx.organizationId,
          provider: input.provider,
        },
      },
      create: {
        organizationId: ctx.organizationId,
        provider: input.provider,
        status: 'CONNECTED',
        credentials,
        displayName: input.provider,
      },
      update: { status: 'CONNECTED', credentials },
    });

    return {
      provider: input.provider,
      status: 'CONNECTED',
      connectedAt: integration.updatedAt.toISOString(),
    };
  }

  async disconnect(ctx: RequestContext, provider: CrmProvider): Promise<void> {
    await prisma.integration
      .delete({
        where: {
          organizationId_provider: {
            organizationId: ctx.organizationId,
            provider,
          },
        },
      })
      .catch(() => undefined);
  }
}
