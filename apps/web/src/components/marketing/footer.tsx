import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Shared marketing footer used across every public page (Home, Solutions,
 * Pricing, Plans). Links point at real routes so navigation stays consistent
 * with the top navbar.
 */
export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AISOLUTIONDESK
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 AISOLUTIONDESK. The AI Workforce Platform.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/solutions" className="hover:text-foreground">Solutions</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/plans" className="hover:text-foreground">Plans</Link>
          <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
