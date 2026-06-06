import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { clerkEnabled } from '@/components/providers/app-providers';

/**
 * Sign-up page (Clerk catch-all route). Skips to dashboard in preview mode.
 *
 * When the visitor arrived by choosing a plan on the pricing page, we carry the
 * chosen plan + cycle through sign-up and send them to /get-started afterwards
 * so they can create their organization and complete payment — the "account
 * first, then pay" onboarding flow.
 */
export default async function SignUpPage({
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
      <SignUp forceRedirectUrl={afterUrl} signInUrl="/sign-in" />
    </main>
  );
}
