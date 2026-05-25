import { Megaphone } from 'lucide-react';
import type { CampaignDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CampaignCreator } from '@/components/sales/campaign-creator';
import { CampaignActions } from '@/components/sales/campaign-actions';

const statusTones: Record<string, 'gray' | 'blue' | 'amber' | 'green'> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  PAUSED: 'amber',
  COMPLETED: 'blue',
};

/** Campaigns — create and manage multi-channel outreach campaigns. */
export default async function CampaignsPage() {
  let campaigns: CampaignDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    campaigns = await api.listCampaigns();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Organize multi-channel outreach sequences.
          </p>
        </div>
        <CampaignCreator />
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load campaigns: {error}</Card>
      )}

      <div className="space-y-2">
        {campaigns.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.name}</p>
                  <Badge tone={statusTones[c.status] ?? 'gray'}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.channels.join(' · ')} · {c.outreachCount} message
                  {c.outreachCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <CampaignActions id={c.id} status={c.status} />
          </Card>
        ))}

        {campaigns.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No campaigns yet. Create one to get started.
          </Card>
        )}
      </div>
    </div>
  );
}
