'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Linkedin, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import type { SocialConnectionDTO } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/**
 * Connect / disconnect LinkedIn by pasting an access token + person URN from
 * a LinkedIn Developer App. Once connected, the platform can auto-post and
 * fetch engagement metrics directly.
 */
export function LinkedInConnector({ conn }: { conn: SocialConnectionDTO }) {
  const router = useRouter();
  const api = useApi();
  const [accessToken, setAccessToken] = useState('');
  const [personUrn, setPersonUrn] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = conn.status === 'CONNECTED';

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await api.connectLinkedIn({ accessToken, personUrn });
      setAccessToken('');
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
      await api.disconnectSocial('LINKEDIN');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Linkedin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">LinkedIn</p>
              <p className="text-xs text-muted-foreground">
                {connected
                  ? `Connected as ${conn.displayName}` +
                    (conn.connectedAt
                      ? ` · ${new Date(conn.connectedAt).toLocaleDateString()}`
                      : '')
                  : 'Auto-post and fetch engagement metrics once connected.'}
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
          <div>
            <Button size="sm" variant="outline" disabled={busy} onClick={disconnect}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-white/5 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Access token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="From LinkedIn Developer App → OAuth Token Tools"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Person URN
              </label>
              <input
                value={personUrn}
                onChange={(e) => setPersonUrn(e.target.value)}
                placeholder="urn:li:person:abc123…"
                className={inputClass}
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open LinkedIn Developer Portal <ExternalLink className="h-3 w-3" />
              </a>
              <Button
                size="sm"
                disabled={busy || !accessToken || !personUrn.startsWith('urn:li:person:')}
                onClick={connect}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
