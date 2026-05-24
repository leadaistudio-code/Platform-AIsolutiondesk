'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Loader2, Copy, Check } from 'lucide-react';
import { OUTREACH_CHANNELS, type OutreachDTO } from '@aisolutiondesk/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

/**
 * Generates AI outreach drafts for a lead and lists existing ones. Pick a
 * channel, optionally add a hint, and let the AI write a personalized message.
 */
export function OutreachGenerator({
  leadId,
  existing,
}: {
  leadId: string;
  existing: OutreachDTO[];
}) {
  const router = useRouter();
  const api = useApi();
  const [channel, setChannel] = useState('EMAIL');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await api.generateOutreach(leadId, {
        channel: channel as (typeof OUTREACH_CHANNELS)[number],
        notes: notes || undefined,
      });
      setNotes('');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copy(o: OutreachDTO) {
    const text = o.subject ? `Subject: ${o.subject}\n\n${o.body}` : o.body;
    navigator.clipboard.writeText(text);
    setCopiedId(o.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-foreground">
          <Wand2 className="h-4 w-4 text-primary" /> AI Outreach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/50"
          >
            {OUTREACH_CHANNELS.map((c) => (
              <option key={c} value={c} className="bg-card">
                {c}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional hint, e.g. mention our analytics feature"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          <Button size="sm" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {busy ? 'Writing…' : 'Generate'}
          </Button>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="space-y-3">
          {existing.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-primary">{o.channel}</span>
                <button
                  onClick={() => copy(o)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedId === o.id ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              {o.subject && <p className="mb-1 text-sm font-medium">{o.subject}</p>}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{o.body}</p>
            </div>
          ))}
          {existing.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No outreach yet. Pick a channel and generate one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
