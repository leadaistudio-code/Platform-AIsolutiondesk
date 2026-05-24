import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Gauge, Mail, Building2, Linkedin, Phone } from 'lucide-react';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreButton } from '@/components/sales/score-button';
import { OutreachGenerator } from '@/components/sales/outreach-generator';

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  if (score > 0) return 'text-rose-400';
  return 'text-muted-foreground';
}

/** Lead detail: profile, AI score + reasoning, and the AI outreach generator. */
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let lead;
  try {
    const api = await getServerApi();
    lead = await api.getLead(id);
  } catch {
    notFound();
  }

  const qual = lead.aiQualification as { fit?: string; intent?: string } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/sales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.fullName}</h1>
          <p className="text-muted-foreground">
            {lead.title ?? '—'}{lead.company ? ` · ${lead.company}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {lead.email && (
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {lead.email}</span>
            )}
            {lead.company && (
              <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {lead.company}</span>
            )}
            {lead.linkedinUrl && (
              <span className="inline-flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</span>
            )}
            {lead.phone && (
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {lead.phone}</span>
            )}
          </div>
        </div>
        <Badge tone="violet">{lead.status}</Badge>
      </div>

      {/* AI score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-foreground">
            <Gauge className="h-4 w-4 text-primary" /> AI Lead Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className={`text-4xl font-semibold ${scoreColor(lead.score)}`}>
                {lead.score > 0 ? lead.score : '–'}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              {qual && (
                <span className="text-xs text-muted-foreground">
                  fit: {qual.fit} · intent: {qual.intent}
                </span>
              )}
            </div>
            <ScoreButton leadId={lead.id} label={lead.score > 0 ? 'Re-score' : 'Score with AI'} />
          </div>
          {lead.scoreReason ? (
            <p className="mt-3 text-sm text-muted-foreground">{lead.scoreReason}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Not scored yet. Click “Score with AI”.
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI outreach */}
      <OutreachGenerator leadId={lead.id} existing={lead.outreaches} />
    </div>
  );
}
