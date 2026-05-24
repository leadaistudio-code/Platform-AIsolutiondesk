import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The public landing page (the "/" route). A minimal, premium hero that routes
 * visitors into the product dashboard.
 */
export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
        <Sparkles className="h-4 w-4 text-primary" />
        The AI Workforce Platform
      </div>

      <h1 className="max-w-3xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
        Automate support, knowledge, and sales with AI agents
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        AISOLUTIONDESK unifies an AI Service Desk, an Employee Assistant, and a
        Sales Automation Agent into one enterprise platform.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link href="/dashboard">
          <Button size="lg">
            Open the platform <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" variant="outline">
            Live demo
          </Button>
        </Link>
      </div>
    </main>
  );
}
