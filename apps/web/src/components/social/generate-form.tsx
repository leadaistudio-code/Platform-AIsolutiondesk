'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenSquare, Shuffle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/**
 * Generates a paired LinkedIn + X post from a topic, or asks the AI to pick a
 * topic itself (the "random topic" path from the n8n flow).
 */
export function GenerateForm({ redirectTo = '/social' }: { redirectTo?: string }) {
  const router = useRouter();
  const api = useApi();
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState<'topic' | 'random' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(mode: 'topic' | 'random') {
    setBusy(mode);
    setError(null);
    try {
      await api.generateSocialPost(mode === 'topic' ? { topic } : {});
      setTopic('');
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <PenSquare className="h-4 w-4 text-primary" /> Generate a social post
        </div>
        <textarea
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What's the topic? e.g. Why small businesses should automate their social media."
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => generate('topic')}
            disabled={busy !== null || topic.trim().length < 3}
          >
            {busy === 'topic' && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate from topic
          </Button>
          <Button
            variant="outline"
            onClick={() => generate('random')}
            disabled={busy !== null}
          >
            {busy === 'random' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            Surprise me (random topic)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The AI writes both a LinkedIn version and a short X / Twitter version. Both go to
          the approvals queue before posting.
        </p>
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
