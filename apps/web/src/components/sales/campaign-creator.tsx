'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { OUTREACH_CHANNELS, type OutreachChannel } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/** Inline form to create a new outreach campaign. */
export function CampaignCreator() {
  const router = useRouter();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channels, setChannels] = useState<OutreachChannel[]>(['EMAIL']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(ch: OutreachChannel) {
    setChannels((cur) =>
      cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createCampaign({ name, channels, description: description || undefined });
      setName('');
      setDescription('');
      setChannels(['EMAIL']);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New campaign
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign name (e.g. Q3 Enterprise Outbound)"
            className={inputClass}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            {OUTREACH_CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggle(ch)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  channels.includes(ch)
                    ? 'border-primary/50 bg-primary/15 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {ch}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || !name || channels.length === 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating…' : 'Create campaign'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
