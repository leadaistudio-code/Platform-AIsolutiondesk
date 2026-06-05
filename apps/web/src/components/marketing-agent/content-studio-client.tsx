'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Trash2,
  Copy,
  Check,
  Shuffle,
  PenTool,
} from 'lucide-react';
import {
  MARKETING_CONTENT_TYPES,
  MARKETING_CONTENT_TYPE_LABELS,
  type GeneratedContentDTO,
  type MarketingContentDTO,
  type MarketingContentType,
  type RepurposeResultDTO,
} from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const REPURPOSE_CHANNELS = [
  'LinkedIn post',
  'X / Twitter thread',
  'Instagram caption',
  'Email subject + preview',
  'Short ad copy',
  'Newsletter blurb',
];

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function ContentStudioClient() {
  const api = useApi();

  // Generate state
  const [type, setType] = useState<MarketingContentType>('BLOG_POST');
  const [brief, setBrief] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('');
  const [save, setSave] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContentDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Library state
  const [library, setLibrary] = useState<MarketingContentDTO[]>([]);

  // Repurpose state
  const [targets, setTargets] = useState<string[]>(['LinkedIn post', 'X / Twitter thread']);
  const [repurposing, setRepurposing] = useState(false);
  const [variants, setVariants] = useState<RepurposeResultDTO['variants']>([]);

  async function loadLibrary() {
    try {
      setLibrary(await api.listMarketingContent());
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    if (!brief.trim()) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.generateMarketingContent({
        type,
        brief: brief.trim(),
        keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
        tone: tone || undefined,
        save,
      });
      setResult(r);
      if (save) loadLibrary();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function repurpose() {
    if (!result?.body || targets.length === 0) return;
    setRepurposing(true);
    setVariants([]);
    try {
      const r = await api.repurposeMarketingContent({ sourceText: result.body, targets });
      setVariants(r.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Repurpose failed');
    } finally {
      setRepurposing(false);
    }
  }

  async function remove(id: string) {
    await api.deleteMarketingContent(id);
    loadLibrary();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <PenTool className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Studio</h1>
          <p className="text-muted-foreground">
            Generate on-brand content, then repurpose it across channels.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Generate content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MarketingContentType)}
                className="h-10 rounded-lg border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {MARKETING_CONTENT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-background">
                    {MARKETING_CONTENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Tone (optional)"
                className="h-10 rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Brief — what should this be about? e.g. 'A blog post on how AI service desks cut ticket volume'"
              rows={4}
              className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Target keywords, comma-separated (optional)"
              className="h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
                Save to library
              </label>
              <Button onClick={generate} disabled={generating || !brief.trim()}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && (
              <p className="text-sm text-muted-foreground">
                Your generated content appears here.
              </p>
            )}
            {result && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{result.title}</h3>
                    <CopyBtn text={result.body} />
                  </div>
                  {result.id && (
                    <span className="text-xs text-emerald-400">Saved to library</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-foreground/[0.03] p-3 text-sm text-muted-foreground">
                  {result.body}
                </div>
                {result.metaDescription && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Meta:</span>{' '}
                    {result.metaDescription}
                  </p>
                )}
                {result.suggestedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedKeywords.map((k) => (
                      <span key={k} className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repurpose */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Shuffle className="h-4 w-4 text-primary" /> Repurpose across channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REPURPOSE_CHANNELS.map((c) => {
                const on = targets.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setTargets((t) => (on ? t.filter((x) => x !== c) : [...t, c]))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      on
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
              <Button size="sm" onClick={repurpose} disabled={repurposing || targets.length === 0}>
                {repurposing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Repurpose'}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {variants.map((v) => (
                <div key={v.channel} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{v.channel}</span>
                    <CopyBtn text={v.text} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{v.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Content library ({library.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {library.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved content yet. Generate something with “Save to library” checked.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {library.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="flex-shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {MARKETING_CONTENT_TYPE_LABELS[c.type]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.brief}</p>
                  </div>
                  <button
                    onClick={() => remove(c.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-rose-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
