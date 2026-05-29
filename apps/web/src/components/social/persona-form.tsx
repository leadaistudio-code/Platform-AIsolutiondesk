'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Palette, Save } from 'lucide-react';
import type { SocialPersona } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/** Editor for the brand voice / persona used by the AI when generating posts. */
export function PersonaForm({ initial }: { initial: SocialPersona }) {
  const router = useRouter();
  const api = useApi();
  const [form, setForm] = useState<SocialPersona>({
    name: initial.name ?? '',
    description: initial.description ?? '',
    tone: initial.tone ?? '',
    audience: initial.audience ?? '',
    doNotMention: initial.doNotMention ?? '',
    sampleVoice: initial.sampleVoice ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SocialPersona>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateSocialPersona(form);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-primary" /> Brand voice
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Brand / author name
              </label>
              <input
                value={form.name ?? ''}
                onChange={set('name')}
                placeholder="e.g. AISOLUTIONDESK"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Tone
              </label>
              <input
                value={form.tone ?? ''}
                onChange={set('tone')}
                placeholder="e.g. professional, witty, encouraging"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              About the brand
            </label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={set('description')}
              placeholder="e.g. We help small businesses automate operations with AI agents…"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Target audience
            </label>
            <input
              value={form.audience ?? ''}
              onChange={set('audience')}
              placeholder="e.g. B2B founders, IT decision makers"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Avoid mentioning
            </label>
            <input
              value={form.doNotMention ?? ''}
              onChange={set('doNotMention')}
              placeholder="e.g. competitor names, specific prices"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Voice samples (the AI will mimic this style)
            </label>
            <textarea
              rows={5}
              value={form.sampleVoice ?? ''}
              onChange={set('sampleVoice')}
              placeholder="Paste 1–3 example posts you love. The AI uses them as voice references."
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save persona
            </Button>
            {saved && (
              <span className="text-sm text-emerald-400">Saved ✓</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
