import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { ReactNode } from 'react';

/** True only when a Clerk publishable key is configured. */
export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

/**
 * Wraps the app in Clerk's provider — but ONLY if keys are present. This lets
 * you run and view the whole UI before signing up for Clerk ("preview mode").
 * Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY to .env and real
 * authentication turns on with no code changes.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>{children}</ClerkProvider>
  );
}
