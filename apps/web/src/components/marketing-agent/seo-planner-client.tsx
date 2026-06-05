'use client';

import { useState } from 'react';
import { Search, Loader2, Gauge, Sparkles, AlertTriangle, Wrench } from 'lucide-react';
import type {
  KeywordResearchDTO,
  SeoAnalysisDTO,
} from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const intentColor: Record<string, string> = {
  informational: 'bg-sky-500/15 text-sky-300',
  commercial: 'bg-amber-500/15 text-amber-300',
  transactional: 'bg-emerald-500/15 text-emerald-300',
  navigational: 'bg-violet-500/15 text-violet-300',
};
const diffColor: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-rose-400',
};

export function SeoPlannerClient() {
  const api = useApi();

  // Keyword research
  const [topic, setTopic] = useState('');
  const [kwLoading, setKwLoading] = useState(false);
  const [research, setResearch] = useState<KeywordResearchDTO | null>(null);

  // SEO analysis
  const [text, setText] = useState('');
  const [target, setTarget] = useState('');
  const [anLoading, setAnLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SeoAnalysisDTO | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function runKeywords() {
    if (!topic.trim()) return;
    setKwLoading(true);
    setError(null);
    setResearch(null);
    try {
      setResearch(await api.seoKeywords({ topic: topic.trim() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keyword research failed');
    } finally {
      setKwLoading(false);
    }
  }

  async function runAnalyze() {
    if (!text.trim()) return;
    setAnLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      setAnalysis(await api.seoAnalyze({ text: text.trim(), targetKeyword: target || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Search className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SEO Planner</h1>
          <p className="text-muted-foreground">
            AI keyword research and content SEO analysis.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Keyword research */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Keyword research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runKeywords()}
              placeholder="Topic, e.g. 'AI customer support software'"
              className="h-10 flex-1 rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <Button onClick={runKeywords} disabled={kwLoading || !topic.trim()}>
              {kwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Research
            </Button>
          </div>

          {research && (
            <div className="grid gap-4 md:grid-cols-2">
              {research.clusters.map((cl) => (
                <div key={cl.cluster} className="rounded-lg border border-border p-3">
                  <h4 className="mb-2 font-medium">{cl.cluster}</h4>
                  <div className="space-y-2">
                    {cl.keywords.map((k) => (
                      <div key={k.keyword} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-muted-foreground">{k.keyword}</span>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${intentColor[k.intent] ?? 'bg-foreground/10 text-muted-foreground'}`}>
                            {k.intent}
                          </span>
                          <span className={`text-xs font-medium ${diffColor[k.difficulty] ?? 'text-muted-foreground'}`}>
                            {k.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Content SEO analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target keyword (optional)"
            className="h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the content (or a draft) you want analyzed for SEO…"
            rows={5}
            className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end">
            <Button onClick={runAnalyze} disabled={anLoading || !text.trim()}>
              {anLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
              Analyze
            </Button>
          </div>

          {analysis && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${scoreColor(analysis.score)}`}>
                  {analysis.score}
                </div>
                <div className="text-sm text-muted-foreground">
                  SEO score / 100
                  {analysis.metaDescription && (
                    <p className="mt-1 max-w-xl text-xs">
                      <span className="font-medium text-foreground">Suggested meta:</span>{' '}
                      {analysis.metaDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Issues
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {analysis.issues.map((i, idx) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                    <Wrench className="h-4 w-4 text-primary" /> Improvements
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {analysis.improvements.map((i, idx) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {analysis.titleSuggestions.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-sm font-medium">Title suggestions</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {analysis.titleSuggestions.map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
