'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Gauge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

/** Runs AI lead scoring and refreshes to show the new score + reasoning. */
export function ScoreButton({ leadId, label = 'Score with AI' }: { leadId: string; label?: string }) {
  const router = useRouter();
  const api = useApi();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await api.scoreLead(leadId);
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
        {busy ? 'Scoring…' : label}
      </Button>
      {error && <span className="max-w-xs text-right text-xs text-rose-400">{error}</span>}
    </div>
  );
}
