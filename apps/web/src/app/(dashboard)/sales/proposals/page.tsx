import { FileSignature } from 'lucide-react';
import type { LeadDTO, ProposalDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProposalGenerator } from '@/components/sales/proposal-generator';

/** Proposal Generator — AI writes tailored proposals for leads. */
export default async function ProposalsPage() {
  let proposals: ProposalDTO[] = [];
  let leads: LeadDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    [proposals, leads] = await Promise.all([api.listProposals(), api.listLeads()]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proposal Generator</h1>
        <p className="text-muted-foreground">AI-written proposals tailored to each lead.</p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load: {error}</Card>
      ) : (
        <ProposalGenerator leads={leads} />
      )}

      <div className="space-y-3">
        {proposals.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <FileSignature className="h-4 w-4 text-primary" /> {p.title}
                </CardTitle>
                <Badge tone="violet">{p.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.leadName ?? 'Unknown lead'} · {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-white/5 p-3 font-sans text-sm text-muted-foreground">
                {p.content}
              </pre>
            </CardContent>
          </Card>
        ))}
        {proposals.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No proposals yet. Generate one above.
          </Card>
        )}
      </div>
    </div>
  );
}
