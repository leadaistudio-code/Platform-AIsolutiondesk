'use client';

import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { buildApi, type ApiClient } from './api';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** When Clerk is on: bind the API to the signed-in user's token. */
function useApiWithClerk(): ApiClient {
  const { getToken } = useAuth();
  return useMemo(() => buildApi(() => getToken()), [getToken]);
}

/** When Clerk is off (dev-bypass): no token; backend uses the demo org. */
function useApiNoClerk(): ApiClient {
  return useMemo(() => buildApi(async () => null), []);
}

/**
 * Hook returning the API client for CLIENT components. Which implementation is
 * used is fixed at build time by whether Clerk keys are configured, so the
 * rules of hooks are always satisfied.
 */
export const useApi: () => ApiClient = clerkEnabled
  ? useApiWithClerk
  : useApiNoClerk;
