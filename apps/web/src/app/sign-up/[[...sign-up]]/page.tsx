import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { clerkEnabled } from '@/components/providers/app-providers';

/** Sign-up page (Clerk catch-all route). Skips to dashboard in preview mode. */
export default function SignUpPage() {
  if (!clerkEnabled) redirect('/dashboard');
  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora p-6">
      <SignUp />
    </main>
  );
}
