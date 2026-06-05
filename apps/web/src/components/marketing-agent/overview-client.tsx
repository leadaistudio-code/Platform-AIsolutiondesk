'use client';

import { useEffect, useState } from 'react';
import {
  Megaphone,
  FileText,
  Send,
  PenSquare,
  Loader2,
  Sparkles,
  Lightbulb,
  Check,
} from 'lucide-react';
import {
  MARKETING_CONTENT_TYPE_LABELS,
  type BrandProfileDTO,
  type ContentIdeaDTO,
  type MarketingMetricsDTO,
} from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MarketingOverviewClient() {
  const api = useApi();
  const [metrics, setMetrics] = useState<MarketingMetricsDTO | null>(null);

  // Brand voice
  const [brand, setBrand] = useState<BrandProfileDTO | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savedBrand, setSavedBrand] = useState(false);

  // Ideas
  const [goal, setGoal] = useState('');
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdeaDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMarketingMetrics().then(setMetrics).catch(() => {});
    api.getBrandProfile().then(setBrand).catch(() => {});
  }, [api]);

  async function saveBrand() {
    if (!brand) return;
    setSavingBrand(true);
    try {
      const saved = await api.updateBrandProfile({
        brandName: brand.brandName ?? undefined,
        description: brand.description ?? undefined,
        tone: brand.tone ?? undefined,
        audience: brand.audience ?? undefined,
        valueProps: brand.valueProps ?? undefined,
        doNotMention: brand.doNotMention ?? undefined,
        keywords: brand.keywords,
      });
      setBrand(saved);
      setSavedBrand(true);
      setTimeout(() => setSavedBrand(false), 1800);
    } finally {
      setSavingBrand(false);
    }
  }

  async function getIdeas() {
    if (!goal.trim()) return;
    setIdeasLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const r = await api.marketingIdeas({ goal: goal.trim(), count: 6 });
      setIdeas(r.ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get ideas');
    } finally {
      setIdeasLoading(false);
    }
  }

  const kpis = metrics
    ? [
        { label: 'Total content', value: metrics.total, icon: FileText },
        { label: 'Published', value: metrics.published, icon: Send },
        { label: 'Drafts', value: metrics.drafts, icon: PenSquare },
        { label: 'Content types', value: metrics.byType.length, icon: Megaphone },
      ]
    : [];

  const field = (k: keyof BrandProfileDTO, v: string) =>
    setBrand((b) => (b ? { ...b, [k]: v } : b));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Megaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Marketing &amp; SEO</h1>
          <p className="text-muted-foreground">
            Your content engine — generate, optimize, and repurpose on-brand.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{k.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Brand voice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Brand voice
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Woven into every AI generation so output stays on-brand.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {!brand ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={brand.brandName ?? ''}
                    onChange={(e) => field('brandName', e.target.value)}
                    placeholder="Brand name"
                    className="h-10 rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={brand.tone ?? ''}
                    onChange={(e) => field('tone', e.target.value)}
                    placeholder="Tone (e.g. confident, friendly)"
                    className="h-10 rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>
                <input
                  value={brand.audience ?? ''}
                  onChange={(e) => field('audience', e.target.value)}
                  placeholder="Target audience"
                  className="h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={brand.description ?? ''}
                  onChange={(e) => field('description', e.target.value)}
                  placeholder="What does the brand do?"
                  rows={2}
                  className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={brand.valueProps ?? ''}
                  onChange={(e) => field('valueProps', e.target.value)}
                  placeholder="Key value propositions"
                  rows={2}
                  className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveBrand} disabled={savingBrand}>
                    {savingBrand ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : savedBrand ? (
                      <>
                        <Check className="h-4 w-4" /> Saved
                      </>
                    ) : (
                      'Save brand voice'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content ideas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-primary" /> AI content ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getIdeas()}
                placeholder="Goal, e.g. 'drive demo signups from IT managers'"
                className="h-10 flex-1 rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <Button onClick={getIdeas} disabled={ideasLoading || !goal.trim()}>
                {ideasLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              {ideas.map((it, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{it.title}</span>
                    <span className="flex-shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {MARKETING_CONTENT_TYPE_LABELS[it.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{it.angle}</p>
                  {it.targetKeyword && (
                    <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      🎯 {it.targetKeyword}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent content */}
      {metrics && metrics.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Recent content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {metrics.recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate">{c.title}</span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {MARKETING_CONTENT_TYPE_LABELS[c.type]} · {c.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
