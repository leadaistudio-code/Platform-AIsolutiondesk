import { Injectable } from '@nestjs/common';
import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { env } from '@aisolutiondesk/config';

/**
 * Thin wrapper around the Clerk backend SDK. Used by TenantGuard to fetch
 * user/organization details when provisioning them into our database on first
 * sight (just-in-time provisioning).
 */
@Injectable()
export class ClerkService {
  readonly client: ClerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
  });
}
