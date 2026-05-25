'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, CheckCircle2, Loader2 } from 'lucide-react';
import type { CampaignStatus } from '@aisolutiondesk/types';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

/** Activate / pause / complete buttons for a campaign. */
export function CampaignActions({
  id,
  status,
}: {
  id: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const api = useApi();
  const [busy, setBusy] = useState(false);

  async function set(next: CampaignStatus) {
    setBusy(true);
    try {
      await api.updateCampaign(id, { status: next });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === 'COMPLETED') {
    return <span className="text-xs text-muted-foreground">Completed</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'ACTIVE' ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => set('PAUSED')}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
          Pause
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => set('ACTIVE')}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Activate
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => set('COMPLETED')}
        title="Mark complete"
      >
        <CheckCircle2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
