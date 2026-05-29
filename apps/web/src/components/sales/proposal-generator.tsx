'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature, Loader2 } from 'lucide-react';
import type { LeadDTO } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/** Pick a lead + optional context, and have the AI write a full proposal. */
export function ProposalGenerator({ leads }: { leads: LeadDTO[] }) {
  const router = useRouter();
  const api = useApi();
  const [leadId, setLeadId] = useState(leads[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!leadId) return;
    setBusy(true);
    setError(null);
    try {
      await api.generateProposal({ leadId, notes: notes || undefined });
      setNotes('');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (leads.length === 0) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Add a lead first — then you can generate a proposal for them.
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileSignature className="h-4 w-4 text-primary" /> Generate a proposal
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className={`${inputClass} max-w-xs`}
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id} className="bg-card">
                {l.fullName}
                {l.company ? ` — ${l.company}` : ''}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context (e.g. focus on analytics + onboarding)"
            className={`${inputClass} min-w-[220px] flex-1`}
          />
          <Button onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {busy ? 'Writing…' : 'Generate'}
          </Button>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
