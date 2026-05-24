import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/components/providers/app-providers';

/**
 * Login page. The [[...sign-in]] folder name is a Clerk convention (a
 * catch-all route). In preview mode (no Clerk keys) we just send users to the
 * dashboard since there's nothing to sign into yet.
 */
export default function SignInPage() {
  if (!clerkEnabled) redirect('/dashboard');
  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora p-6">
      <SignIn />
    </main>
  );
}
