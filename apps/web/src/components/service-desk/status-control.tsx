'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TICKET_STATUSES, type TicketStatus } from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';

/**
 * A dropdown to change a ticket's status. On change it PATCHes the ticket and
 * refreshes the page so the timeline (which records the change) updates.
 */
export function StatusControl({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const router = useRouter();
  const api = useApi();
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    setSaving(true);
    setError(null);
    try {
      await api.updateTicket(ticketId, { status: next as TicketStatus });
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={current}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
      >
        {TICKET_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-card">
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
