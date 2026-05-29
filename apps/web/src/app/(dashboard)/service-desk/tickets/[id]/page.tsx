import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles, Clock, GitCommitHorizontal } from 'lucide-react';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, priorityTone, statusTone } from '@/components/ui/badge';
import { TriageButton } from '@/components/service-desk/triage-button';
import { StatusControl } from '@/components/service-desk/status-control';

/** A readable label + icon for each timeline event type. */
function eventLabel(type: string): string {
  return (
    {
      ai_triage: 'AI triage ran',
      status_change: 'Status changed',
      comment: 'Comment added',
      assignment: 'Assignment changed',
    }[type] ?? type
  );
}

/**
 * Ticket detail page. Server component that loads the ticket + its timeline.
 * The status dropdown and triage button are client components.
 */
export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let ticket;
  try {
    const api = await getServerApi();
    ticket = await api.getTicket(id);
  } catch {
    notFound();
  }

  const actions = Array.isArray(ticket.aiSuggestedActions)
    ? (ticket.aiSuggestedActions as string[])
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/service-desk/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
            <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
            {ticket.category && <Badge tone="violet">{ticket.category}</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusControl ticketId={ticket.id} current={ticket.status} />
          <TriageButton ticketId={ticket.id} />
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          {ticket.requesterEmail && (
            <p className="mt-3 text-xs text-muted-foreground">
              Requested by {ticket.requesterEmail}
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI analysis */}
      {ticket.aiSummary && (
        <Card className="border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-violet-300">
              <Sparkles className="h-4 w-4" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{ticket.aiSummary}</p>
            {ticket.aiRootCause && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Likely cause:</span>{' '}
                {ticket.aiRootCause}
              </p>
            )}
            {actions.length > 0 && (
              <div>
                <p className="font-medium">Suggested actions</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-foreground">
            <Clock className="h-4 w-4" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet. Run AI triage or change the status.
            </p>
          ) : (
            <ol className="space-y-4">
              {ticket.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-muted-foreground">
                    <GitCommitHorizontal className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{eventLabel(e.type)}</p>
                    <p className="text-xs text-muted-foreground">
                      by {e.actor} · {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
