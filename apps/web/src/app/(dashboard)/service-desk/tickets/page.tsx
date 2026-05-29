import Link from 'next/link';
import { AlertCircle, Sparkles, Plus } from 'lucide-react';
import type { TicketDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, priorityTone, statusTone } from '@/components/ui/badge';
import { TriageButton } from '@/components/service-desk/triage-button';

/**
 * The Tickets page. A server component: it fetches real tickets from the
 * backend API on each request and renders them. Each ticket shows its AI
 * analysis once triaged, and a button to run triage if not.
 */
export default async function TicketsPage() {
  let tickets: TicketDTO[] | undefined = undefined;
  let error: string | null = null;
  try {
    const api = await getServerApi();
    const res = await api.listTickets();
    tickets = res.items;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Live data from your API. Run AI triage to auto-categorize and summarize.
          </p>
        </div>
        <Link href="/service-desk/tickets/new">
          <Button>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="flex items-center gap-3 border-rose-500/30 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Couldn&apos;t load tickets.</p>
            <p className="text-rose-400/80">{error}</p>
            <p className="mt-1 text-muted-foreground">
              Is the API running? Start it with{' '}
              <code className="rounded bg-white/10 px-1">pnpm dev</code>.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {tickets?.map((t) => (
          <Card key={t.id} hover className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/service-desk/tickets/${t.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {t.subject}
                  </Link>
                  <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  {t.category && <Badge tone="violet">{t.category}</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {t.description}
                </p>
                {t.requesterEmail && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested by {t.requesterEmail}
                  </p>
                )}
              </div>
              <TriageButton ticketId={t.id} />
            </div>

            {t.aiSummary && (
              <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" /> AI Analysis
                </div>
                <p className="text-sm">{t.aiSummary}</p>
                {t.aiRootCause && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Likely cause:</span>{' '}
                    {t.aiRootCause}
                  </p>
                )}
                {Array.isArray(t.aiSuggestedActions) &&
                  t.aiSuggestedActions.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      {(t.aiSuggestedActions as string[]).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </Card>
        ))}

        {tickets?.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No tickets yet.
          </Card>
        )}
      </div>
    </div>
  );
}
