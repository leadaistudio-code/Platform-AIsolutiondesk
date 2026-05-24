import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { buildApi, type ApiClient } from './api';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Returns an API client for use in SERVER components. It attaches the logged-in
 * user's Clerk token so the backend knows who they are. In dev-bypass mode
 * (no Clerk keys) it sends no token and the backend uses the demo org.
 */
export async function getServerApi(): Promise<ApiClient> {
  if (!clerkEnabled) return buildApi(async () => null);
  const { getToken } = await auth();
  return buildApi(() => getToken());
}
