'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Plug } from 'lucide-react';
import type { CrmConnectionDTO, CrmProvider } from '@aisolutiondesk/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api-client';

const LABELS: Record<CrmProvider, string> = {
  SALESFORCE: 'Salesforce',
  HUBSPOT: 'HubSpot',
};

function ProviderCard({ conn }: { conn: CrmConnectionDTO }) {
  const router = useRouter();
  const api = useApi();
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = conn.status === 'CONNECTED';

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await api.connectCrm({ provider: conn.provider, apiKey });
      setApiKey('');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await api.disconnectCrm(conn.provider);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{LABELS[conn.provider]}</p>
            <p className="text-xs text-muted-foreground">
              {connected
                ? `Connected ${conn.connectedAt ? new Date(conn.connectedAt).toLocaleDateString() : ''}`
                : 'Not connected'}
            </p>
          </div>
        </div>
        {connected ? (
          <Badge tone="green">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
          </Badge>
        ) : (
          <Badge tone="gray">Disconnected</Badge>
        )}
      </div>

      {connected ? (
        <div className="mt-4">
          <Button size="sm" variant="outline" disabled={busy} onClick={disconnect}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${LABELS[conn.provider]} API key`}
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          <Button size="sm" disabled={busy || !apiKey} onClick={connect}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
    </Card>
  );
}

export function CrmManager({ connections }: { connections: CrmConnectionDTO[] }) {
  return (
    <div className="space-y-3">
      {connections.map((c) => (
        <ProviderCard key={c.provider} conn={c} />
      ))}
    </div>
  );
}
