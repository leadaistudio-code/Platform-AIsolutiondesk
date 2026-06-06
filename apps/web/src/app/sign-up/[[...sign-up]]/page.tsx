import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { clerkEnabled } from '@/components/providers/app-providers';

/**
 * Sign-up page (Clerk catch-all route). Skips to dashboard in preview mode.
 *
 * `fallbackRedirectUrl` is used only when no explicit `redirect_url` is present.
 * The payment-first flow sends visitors here as `/sign-up?redirect_url=/welcome`
 * so that after signing up they land on /welcome to claim their paid plan; a
 * plain sign-up (no redirect_url) goes to the dashboard.
 */
export default function SignUpPage() {
  if (!clerkEnabled) redirect('/dashboard');
  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora p-6">
      <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </main>
  );
}
