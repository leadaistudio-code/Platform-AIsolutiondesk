import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Webhook } from 'svix';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { env } from '@aisolutiondesk/config';
import { Public } from '../../common/decorators/public.decorator';
import { ClerkSyncService } from './clerk-sync.service';

/**
 * Receives events from Clerk (user created, org created, membership changed…)
 * and forwards them to ClerkSyncService. This route is @Public — it isn't
 * called by a logged-in user — but it is protected differently: we verify the
 * cryptographic signature Clerk attaches, so only Clerk can trigger it.
 */
@ApiExcludeController()
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(private readonly sync: ClerkSyncService) {}

  @Public()
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTs: string,
    @Headers('svix-signature') svixSig: string,
  ) {
    const payload = req.rawBody?.toString('utf8');
    if (!payload) throw new BadRequestException('Missing body');

    // Throws if the signature is invalid — i.e. the request isn't really Clerk.
    let evt: { type: string; data: any };
    try {
      const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTs,
        'svix-signature': svixSig,
      }) as { type: string; data: any };
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.dispatch(evt);
    return { received: true };
  }

  private async dispatch(evt: { type: string; data: any }) {
    const d = evt.data;
    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await this.sync.upsertUser({
          id: d.id,
          email: d.email_addresses?.[0]?.email_address ?? '',
          name: [d.first_name, d.last_name].filter(Boolean).join(' ') || null,
          avatarUrl: d.image_url ?? null,
        });
        break;

      case 'organization.created':
      case 'organization.updated':
        await this.sync.upsertOrganization({
          id: d.id,
          name: d.name,
          slug: d.slug,
          logoUrl: d.image_url ?? null,
        });
        break;

      case 'organizationMembership.created':
      case 'organizationMembership.updated':
        await this.sync.upsertMembership({
          clerkOrgId: d.organization?.id,
          clerkUserId: d.public_user_data?.user_id,
          role: d.role,
        });
        break;

      case 'organizationMembership.deleted':
        await this.sync.removeMembership({
          clerkOrgId: d.organization?.id,
          clerkUserId: d.public_user_data?.user_id,
        });
        break;

      default:
        // Unhandled event types are acknowledged and ignored.
        break;
    }
  }
}
