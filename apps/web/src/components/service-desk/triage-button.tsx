'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

/**
 * Client-side button that asks the backend to run the AI triage agent on a
 * ticket, then refreshes the page so the new AI fields appear. Shows a spinner
 * while the model is thinking and surfaces any error inline.
 */
export function TriageButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const api = useApi();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      await api.triageTicket(ticketId);
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || pending;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? 'Analyzing…' : 'Run AI triage'}
      </Button>
      {error && <span className="max-w-xs text-right text-xs text-rose-400">{error}</span>}
    </div>
  );
}
