import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/components/providers/app-providers';

/**
 * Login page. The [[...sign-in]] folder name is a Clerk convention (a
 * catch-all route). In preview mode (no Clerk keys) we just send users to the
 * dashboard since there's nothing to sign into yet.
 *
 * If the visitor came from choosing a plan, carry it through so an existing
 * customer who signs in lands on /get-started to complete that subscription.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  if (!clerkEnabled) redirect('/dashboard');
  const { plan, cycle } = await searchParams;
  const afterUrl =
    plan && cycle
      ? `/get-started?plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}`
      : '/dashboard';
  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora p-6">
      <SignIn forceRedirectUrl={afterUrl} signUpUrl="/sign-up" />
    </main>
  );
}
