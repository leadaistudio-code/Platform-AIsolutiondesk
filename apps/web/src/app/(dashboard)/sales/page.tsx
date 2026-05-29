import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import type { LeadDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  if (score > 0) return 'text-rose-400';
  return 'text-muted-foreground';
}

const statusTones: Record<string, 'gray' | 'blue' | 'violet' | 'green' | 'amber' | 'red'> = {
  NEW: 'blue',
  QUALIFIED: 'violet',
  CONTACTED: 'amber',
  ENGAGED: 'amber',
  PROPOSAL: 'violet',
  WON: 'green',
  LOST: 'red',
};

/** Leads dashboard. Server component listing leads, sorted by AI score. */
export default async function LeadsPage() {
  let leads: LeadDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    leads = await api.listLeads();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Sorted by AI score. Open a lead to score it and generate outreach.
          </p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="h-4 w-4" /> New lead
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load leads: {error}</Card>
      )}

      <div className="space-y-2">
        {leads.map((l) => (
          <Link key={l.id} href={`/sales/${l.id}`}>
            <Card hover className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{l.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.title ?? '—'}{l.company ? ` · ${l.company}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge tone={statusTones[l.status] ?? 'gray'}>{l.status}</Badge>
                <div className="text-right">
                  <p className={`text-xl font-semibold ${scoreColor(l.score)}`}>
                    {l.score > 0 ? l.score : '–'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    AI score
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {leads.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No leads yet. Add one to get started.
          </Card>
        )}
      </div>
    </div>
  );
}
